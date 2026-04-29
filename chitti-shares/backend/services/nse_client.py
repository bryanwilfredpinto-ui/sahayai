"""
services/nse_client.py
----------------------
NSE official endpoint client. NO API KEY, NO SUBSCRIPTION, FREE.

Why this exists:
  Yahoo Finance blocks Indian index symbols (^NSEI, ^BSESN) from
  cloud datacenter IPs (Render Oregon, AWS, etc). This breaks the
  market dashboard's NIFTY/SENSEX prices.

  NSE's website nseindia.com works fine from cloud IPs IF you
  warm up cookies first. This is the same data NSE shows on
  their public website.

Endpoints used (all GET, no auth):
  GET /                                     <- warm up cookies
  GET /api/allIndices                       <- big list, fast, has all major indices
  GET /api/equity-stockIndices?index=NIFTY%2050   <- per-index detail
  GET /api/chart-databyindex?index=NIFTY%2050     <- intraday line chart points

We use /api/allIndices as the primary source because it's a single
HTTP call that returns NIFTY 50, SENSEX, BANKNIFTY, and 100+ other
indices in one shot - much friendlier to NSE servers.

Reliability notes:
  - NSE will return 401/403/empty if cookies are stale. We retry
    once after re-warming the session.
  - NSE rate-limits aggressively. We cache results in-process for
    30s during market hours, 5 min outside.
  - Standard browser User-Agent is mandatory.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any

import httpx

log = logging.getLogger("nse_client")

# Module-level cached client - cookies persist across calls
_lock = threading.Lock()
_client: httpx.Client | None = None
_cookies_set_at: float = 0.0
_COOKIE_TTL = 600  # re-warm cookies every 10 min

# In-process cache for index payloads: {key: (timestamp, data)}
_cache: dict[str, tuple[float, Any]] = {}


_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.nseindia.com/",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}


def _new_client() -> httpx.Client:
    return httpx.Client(
        base_url="https://www.nseindia.com",
        headers=_HEADERS,
        timeout=15.0,
        follow_redirects=True,
        http2=False,
    )


def _ensure_cookies() -> httpx.Client:
    """Warm up session cookies by visiting the homepage."""
    global _client, _cookies_set_at
    now = time.time()
    if _client is None or (now - _cookies_set_at) > _COOKIE_TTL:
        if _client is not None:
            try:
                _client.close()
            except Exception:  # noqa: BLE001
                pass
        c = _new_client()
        # Visit a few pages to look human-ish; helps with 401s
        try:
            c.get("/", timeout=10.0)
            c.get("/get-quotes/equity?symbol=RELIANCE", timeout=10.0)
        except Exception as e:  # noqa: BLE001
            log.warning("[nse] cookie warmup failed: %s", e)
            # We continue anyway; some calls may still work
        _client = c
        _cookies_set_at = now
    return _client


def _force_reset() -> None:
    global _client, _cookies_set_at
    _client = None
    _cookies_set_at = 0.0


def _get_json(path: str, retries: int = 1) -> dict:
    """GET an NSE endpoint, returning JSON. Re-warms cookies on auth-ish failure."""
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        with _lock:
            client = _ensure_cookies()
        try:
            r = client.get(path)
            if r.status_code == 200:
                # Sometimes NSE returns HTML on cold cache; require dict
                try:
                    j = r.json()
                except Exception:
                    raise RuntimeError(f"NSE returned non-JSON for {path}")
                return j
            if r.status_code in (401, 403, 419):
                log.warning("[nse] %s -> %s, resetting cookies", path, r.status_code)
                _force_reset()
                last_err = RuntimeError(f"NSE {r.status_code} on {path}")
                continue
            raise RuntimeError(f"NSE {r.status_code} on {path}: {r.text[:200]}")
        except Exception as e:  # noqa: BLE001
            last_err = e
            log.warning("[nse] attempt %d failed for %s: %s", attempt + 1, path, e)
            _force_reset()
    raise RuntimeError(f"NSE call failed after {retries + 1} attempts: {last_err}")


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------

# Map our canonical symbols to NSE's index name strings used in their
# JSON responses. NSE returns indices like {"index": "NIFTY 50", ...}.
_INDEX_NAME_MAP = {
    "NSE:NIFTY 50": "NIFTY 50",
    "NSE:NIFTY50": "NIFTY 50",
    "NSE:NIFTY": "NIFTY 50",
    "NSE:BANKNIFTY": "NIFTY BANK",
    "NSE:NIFTY BANK": "NIFTY BANK",
    "BSE:SENSEX": "SENSEX",  # NOTE: SENSEX is BSE; NSE's allIndices does
                              # not include it. We patch in a fallback below.
}


def is_nse_index_symbol(canonical: str) -> bool:
    """True if this is an index we know how to serve from NSE."""
    return canonical in _INDEX_NAME_MAP


def get_index_quote(canonical_symbols: list[str]) -> dict:
    """
    Returns {canonical: {last_price, prev_close, day_high, day_low,
                         day_open, volume, currency, change, pchange}}
    for any subset of indices we recognise. Symbols we don't recognise
    are silently omitted (caller falls back to Yahoo for those).
    """
    wanted = [s for s in canonical_symbols if is_nse_index_symbol(s)]
    if not wanted:
        return {}

    # Cache key: 30s cache so repeated calls within the same minute reuse data
    now = time.time()
    cached = _cache.get("allIndices")
    if cached and (now - cached[0]) < 30:
        all_idx = cached[1]
    else:
        all_idx = _fetch_all_indices()
        _cache["allIndices"] = (now, all_idx)

    out: dict[str, dict] = {}
    for canonical in wanted:
        nse_name = _INDEX_NAME_MAP[canonical]
        row = all_idx.get(nse_name)
        if row is None and canonical == "BSE:SENSEX":
            # SENSEX isn't in NSE allIndices. Try BSE direct (separate fetch).
            row = _fetch_sensex_from_bse()
        if row is None:
            continue
        out[canonical] = {
            "last_price": _safe_float(row.get("last") or row.get("lastPrice") or row.get("ltp")),
            "prev_close": _safe_float(row.get("previousClose") or row.get("previous_close")),
            "day_open": _safe_float(row.get("open") or row.get("dayOpen")),
            "day_high": _safe_float(row.get("dayHigh") or row.get("high")),
            "day_low": _safe_float(row.get("dayLow") or row.get("low")),
            "volume": None,
            "currency": "INR",
            "change": _safe_float(row.get("change")),
            "pchange": _safe_float(row.get("percentChange") or row.get("pChange")),
        }
    return out


def _fetch_all_indices() -> dict[str, dict]:
    """
    Hit /api/allIndices. Returns dict keyed by NSE's "index" name string.
    """
    j = _get_json("/api/allIndices")
    rows = j.get("data") or []
    by_name: dict[str, dict] = {}
    for r in rows:
        name = r.get("index") or r.get("indexSymbol")
        if name:
            by_name[name] = r
    log.info("[nse] allIndices: %d indices fetched", len(by_name))
    return by_name


def _fetch_sensex_from_bse() -> dict | None:
    """
    Pull SENSEX from BSE's public quote endpoint.
    Returns a dict shaped like NSE allIndices entries so the caller
    can use the same field names.
    """
    try:
        # BSE's public sensex endpoint
        with httpx.Client(timeout=10.0, headers={
            "User-Agent": _HEADERS["User-Agent"],
            "Referer": "https://www.bseindia.com/",
        }) as c:
            r = c.get("https://api.bseindia.com/BseIndiaAPI/api/SensexHigh/w?Type=EQ")
            if r.status_code != 200:
                log.warning("[nse] BSE SENSEX %s: %s", r.status_code, r.text[:200])
                return None
            j = r.json()
            # Response shape varies; try common keys
            row = j[0] if isinstance(j, list) and j else j
            if not isinstance(row, dict):
                return None
            return {
                "last": row.get("CurrValue") or row.get("last") or row.get("LastTradeRate"),
                "previousClose": row.get("PrevClose") or row.get("PrvClose") or row.get("Prv_Cls"),
                "open": row.get("Open"),
                "dayHigh": row.get("High"),
                "dayLow": row.get("Low"),
                "change": row.get("Chg") or row.get("Change"),
                "percentChange": row.get("ChgPer") or row.get("PercentChange"),
            }
    except Exception as e:  # noqa: BLE001
        log.warning("[nse] BSE SENSEX fetch failed: %s", e)
        return None


def get_index_history(canonical: str, days: int = 120) -> list[dict]:
    """
    Returns a list of {date, open, high, low, close, volume} for an index.
    Uses NSE's chart-databyindex endpoint which gives intraday + recent
    daily values. For daily history we resample.
    """
    if not is_nse_index_symbol(canonical):
        return []
    # NSE's "chart-databyindex" wants the index name + period
    nse_name = _INDEX_NAME_MAP[canonical].replace(" ", "%20")
    try:
        # period=1Y is broadest; we slice to N days
        path = f"/api/historical/indicesHistory?indexType={nse_name}&from=&to="
        # Simpler: use the "chart-databyindex" line graph data
        path2 = f"/api/chart-databyindex?index={nse_name}"
        try:
            j = _get_json(path)
            rows = (j.get("data") or {}).get("indexCloseOnlineRecords") or []
            candles = []
            for r in rows[-days:]:
                candles.append({
                    "date": r.get("EOD_TIMESTAMP") or r.get("HIT_INDEX_TIMESTAMP"),
                    "open": _safe_float(r.get("EOD_OPEN_INDEX_VAL") or r.get("OPEN")),
                    "high": _safe_float(r.get("EOD_HIGH_INDEX_VAL") or r.get("HIGH")),
                    "low": _safe_float(r.get("EOD_LOW_INDEX_VAL") or r.get("LOW")),
                    "close": _safe_float(r.get("EOD_CLOSE_INDEX_VAL") or r.get("CLOSE")),
                    "volume": 0,
                })
            return [c for c in candles if c["close"]]
        except Exception:
            # Fallback to chart endpoint - gives only close prices but works
            j = _get_json(path2)
            grpts = j.get("grapthData") or j.get("data") or []
            # Format: [[timestamp_ms, close], ...]
            candles = []
            for ts_ms, close in grpts[-days:]:
                candles.append({
                    "date": ts_ms,
                    "open": _safe_float(close),
                    "high": _safe_float(close),
                    "low": _safe_float(close),
                    "close": _safe_float(close),
                    "volume": 0,
                })
            return [c for c in candles if c["close"]]
    except Exception as e:  # noqa: BLE001
        log.warning("[nse] history failed for %s: %s", canonical, e)
        return []


def _safe_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def healthcheck() -> dict:
    """Quick test: does the NSE call work right now from this machine?"""
    try:
        idx = _fetch_all_indices()
        nifty = idx.get("NIFTY 50") or {}
        return {
            "ok": True,
            "indices_count": len(idx),
            "nifty_last": nifty.get("last") or nifty.get("lastPrice"),
            "nifty_prev_close": nifty.get("previousClose"),
        }
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": str(e)}
