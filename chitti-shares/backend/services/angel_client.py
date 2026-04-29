"""
services/angel_client.py
------------------------
Angel One SmartAPI client. NO PAYMENT. NO STATIC IP REQUIRED FOR READ-ONLY.

Why: Yahoo blocks Render from cloud IPs. NSE blocks too. Angel One's
SmartAPI works fine for fetching live prices from cloud IPs once you
have an account.

Auth flow (auto, no manual steps after env vars are set):
  1. We call SmartAPI's loginByPassword endpoint with:
       - clientcode  (your Angel One client ID, e.g. B12345)
       - password    (your 4-digit MPIN)
       - totp        (6-digit code generated from TOTP secret + current time)
  2. Response gives us a JWT token, valid 24h
  3. All subsequent quote calls use that JWT in Authorization header
  4. Token is cached in memory; refreshed when expired

Endpoints used:
  POST  /rest/auth/angelbroking/user/v1/loginByPassword
  POST  /rest/secure/angelbroking/market/v1/quote
  GET   margin-calculator script master JSON  (for symbol -> token map)

Required env vars:
  ANGEL_API_KEY        - from app you created on smartapi.angelone.in
  ANGEL_CLIENT_CODE    - your Angel One client ID
  ANGEL_PIN            - your 4-digit MPIN
  ANGEL_TOTP_SECRET    - base32 TOTP seed string
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any

import httpx
import pyotp

from config import settings

log = logging.getLogger("angel_client")


_API_BASE = "https://apiconnect.angelone.in"
_SCRIP_MASTER_URL = (
    "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
)


# Module-level state
_lock = threading.Lock()
_jwt: str | None = None
_jwt_expiry: float = 0.0
_token_map: dict[str, str] = {}  # canonical -> exchange_token
_token_map_loaded_at: float = 0.0
_TOKEN_MAP_TTL = 24 * 3600  # refresh once a day


# Index tokens are well-known constants (NOT in scrip master under stock-style key)
_INDEX_TOKENS = {
    "NSE:NIFTY 50":   ("NSE", "99926000"),
    "NSE:NIFTY":      ("NSE", "99926000"),
    "NSE:NIFTY50":    ("NSE", "99926000"),
    "BSE:SENSEX":     ("BSE", "99919000"),
    "NSE:BANKNIFTY":  ("NSE", "99926009"),
    "NSE:NIFTY BANK": ("NSE", "99926009"),
}


def is_configured() -> bool:
    """True if all 4 env vars are set (otherwise this module is inert)."""
    return bool(
        getattr(settings, "ANGEL_API_KEY", None)
        and getattr(settings, "ANGEL_CLIENT_CODE", None)
        and getattr(settings, "ANGEL_PIN", None)
        and getattr(settings, "ANGEL_TOTP_SECRET", None)
    )


def _generate_totp() -> str:
    """Generate the current 6-digit TOTP from the seed."""
    secret = settings.ANGEL_TOTP_SECRET.replace(" ", "").upper()
    return pyotp.TOTP(secret).now()


def _login() -> str:
    """Returns a fresh JWT. Caches in memory for ~22h."""
    global _jwt, _jwt_expiry
    payload = {
        "clientcode": settings.ANGEL_CLIENT_CODE,
        "password":   settings.ANGEL_PIN,
        "totp":       _generate_totp(),
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "00:00:00:00:00:00",
        "X-PrivateKey": settings.ANGEL_API_KEY,
    }
    log.info("[angel] logging in client=%s", settings.ANGEL_CLIENT_CODE)
    with httpx.Client(timeout=20.0) as c:
        r = c.post(
            f"{_API_BASE}/rest/auth/angelbroking/user/v1/loginByPassword",
            json=payload,
            headers=headers,
        )
    if r.status_code != 200:
        raise RuntimeError(f"Angel login HTTP {r.status_code}: {r.text[:300]}")
    j = r.json()
    if not j.get("status"):
        raise RuntimeError(f"Angel login failed: {j.get('message')} / {j.get('errorcode')}")
    data = j.get("data") or {}
    jwt = data.get("jwtToken")
    if not jwt:
        raise RuntimeError(f"Angel login: no jwtToken in response: {j}")
    _jwt = jwt
    # Tokens valid 24h, refresh at 22h to be safe
    _jwt_expiry = time.time() + 22 * 3600
    log.info("[angel] login OK, JWT cached")
    return jwt


def _ensure_jwt() -> str:
    if _jwt and time.time() < _jwt_expiry:
        return _jwt
    return _login()


def _load_token_map() -> dict[str, str]:
    """
    Load the symbol -> exchange_token map from Angel's public scrip master.
    Returns dict like {"NSE:RELIANCE": "2885", "NSE:TCS": "11536", ...}
    Cached for 24h.
    """
    global _token_map, _token_map_loaded_at
    now = time.time()
    if _token_map and (now - _token_map_loaded_at) < _TOKEN_MAP_TTL:
        return _token_map
    log.info("[angel] loading scrip master...")
    try:
        with httpx.Client(timeout=60.0) as c:
            r = c.get(_SCRIP_MASTER_URL)
        r.raise_for_status()
        rows = r.json()
        m: dict[str, str] = {}
        for row in rows:
            symbol = row.get("symbol") or ""
            exch = row.get("exch_seg")
            tok = row.get("token")
            name = row.get("name") or ""
            if not (symbol and exch and tok):
                continue
            # We want spot equity (SYMBOL-EQ), not F&O contracts
            if exch == "NSE" and symbol.endswith("-EQ"):
                base = symbol[:-3]
                m[f"NSE:{base}"] = tok
            elif exch == "BSE" and "EQ" in (row.get("instrumenttype") or ""):
                m[f"BSE:{name}"] = tok
        _token_map = m
        _token_map_loaded_at = now
        log.info("[angel] scrip master loaded: %d NSE/BSE equities", len(m))
        return m
    except Exception as e:  # noqa: BLE001
        log.error("[angel] scrip master load failed: %s", e)
        if _token_map:
            return _token_map  # use stale if any
        raise


def _resolve_tokens(canonical_symbols: list[str]) -> dict[str, tuple[str, str]]:
    """
    Returns {canonical: (exch, token)} for symbols we can resolve.
    """
    out: dict[str, tuple[str, str]] = {}
    # Index special-cases first
    for s in canonical_symbols:
        if s in _INDEX_TOKENS:
            out[s] = _INDEX_TOKENS[s]

    # Stock equity lookups
    needs_map = [s for s in canonical_symbols if s not in out]
    if needs_map:
        try:
            tmap = _load_token_map()
            for s in needs_map:
                if s in tmap:
                    exch = "NSE" if s.startswith("NSE:") else "BSE"
                    out[s] = (exch, tmap[s])
        except Exception as e:  # noqa: BLE001
            log.warning("[angel] token map unavailable, indices still served: %s", e)
    return out


def get_quote(canonical_symbols: list[str]) -> dict:
    """
    Returns {canonical: {last_price, prev_close, day_open, day_high,
                         day_low, volume, currency, change, pchange}}
    via Angel One's market/v1/quote endpoint.
    """
    if not is_configured():
        log.debug("[angel] not configured, skipping")
        return {}
    if not canonical_symbols:
        return {}

    with _lock:
        try:
            jwt = _ensure_jwt()
        except Exception as e:  # noqa: BLE001
            log.error("[angel] auth failed: %s", e)
            return {}
        tokens = _resolve_tokens(canonical_symbols)

    if not tokens:
        return {}

    # Group tokens by exchange
    by_exch: dict[str, list[str]] = {}
    for canonical, (exch, tok) in tokens.items():
        by_exch.setdefault(exch, []).append(tok)

    headers = {
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "00:00:00:00:00:00",
        "X-PrivateKey": settings.ANGEL_API_KEY,
    }
    payload = {"mode": "FULL", "exchangeTokens": by_exch}

    try:
        with httpx.Client(timeout=20.0) as c:
            r = c.post(
                f"{_API_BASE}/rest/secure/angelbroking/market/v1/quote",
                json=payload,
                headers=headers,
            )
    except Exception as e:  # noqa: BLE001
        log.error("[angel] quote network err: %s", e)
        return {}

    if r.status_code != 200:
        log.error("[angel] quote HTTP %s: %s", r.status_code, r.text[:200])
        return {}
    j = r.json()
    if not j.get("status"):
        log.error("[angel] quote payload err: %s", j.get("message"))
        return {}

    # Build reverse lookup: (exch, token) -> canonical
    rev: dict[tuple[str, str], str] = {(e, t): c for c, (e, t) in tokens.items()}
    out: dict = {}
    for fetched in (j.get("data") or {}).get("fetched") or []:
        exch = fetched.get("exchange")
        tok = fetched.get("symbolToken")
        canonical = rev.get((exch, tok))
        if not canonical:
            continue
        last = _f(fetched.get("ltp"))
        close = _f(fetched.get("close"))
        open_ = _f(fetched.get("open"))
        high = _f(fetched.get("high"))
        low = _f(fetched.get("low"))
        vol = _f(fetched.get("tradeVolume"))
        change = (last - close) if (last is not None and close is not None) else None
        pchange = ((change / close) * 100) if (change is not None and close) else None
        out[canonical] = {
            "last_price": last,
            "prev_close": close,
            "day_open": open_,
            "day_high": high,
            "day_low": low,
            "volume": vol,
            "currency": "INR",
            "change": change,
            "pchange": pchange,
        }
    return out


def healthcheck() -> dict:
    """Quick test for /debug/angel endpoint."""
    if not is_configured():
        return {"ok": False, "reason": "not_configured", "missing_env": [
            k for k in ("ANGEL_API_KEY", "ANGEL_CLIENT_CODE", "ANGEL_PIN", "ANGEL_TOTP_SECRET")
            if not getattr(settings, k, None)
        ]}
    try:
        sample = get_quote(["NSE:NIFTY 50", "BSE:SENSEX", "NSE:RELIANCE"])
        return {"ok": True, "fetched_count": len(sample), "sample": sample}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": str(e)}


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
