"""
services/scanner.py
-------------------
Roshan Indicator scanner across a stock universe.

The Roshan rule (per Bryan's spec, revised 30 Apr 2026):

For a BUY signal on a call, ALL three conditions must hold:
  1. On BOTH timeframes in the call's pair:
       RSI(14) > SMA(20) of RSI(14)            (Roshan BUY signal)
  2. On BOTH timeframes in the call's pair:
       latest candle is GREEN (close >= open)  (price confirms)
  3. On the next LOWER timeframe (the "pullback" TF):
       latest candle is RED (close < open)     (small dip = healthy entry)

Mirror image for SHORT:
  1. RSI(14) < SMA(20) of RSI(14) on both pair TFs
  2. Both pair candles RED
  3. Pullback TF candle GREEN (small bounce before continuation)

Otherwise -> stock appears in neither column.

The 4 calls and their (pair, pullback) timeframes:
  - Long-term  pair=(Monthly, Weekly), pullback=Daily
  - Positional pair=(Weekly,  Daily),  pullback=4H
  - Swing      pair=(Daily,   4H),     pullback=1H
  - Intraday   pair=(4H,      1H),     pullback=15min

Caching:
  - Each scan result cached per (universe, call) for 5 minutes.
  - Frontend calls /api/scan/roshan -> instant if cache fresh, else recomputes.
"""
from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from threading import Lock
from zoneinfo import ZoneInfo

import pandas as pd

from services import technical, universes, angel_client

log = logging.getLogger("scanner")
IST = ZoneInfo("Asia/Kolkata")


# Pair + pullback TF for each call
CALL_DEFS = {
    "Long-term":  {"pair": ("Monthly", "Weekly"), "pullback": "Daily"},
    "Positional": {"pair": ("Weekly",  "Daily"),  "pullback": "4H"},
    "Swing":      {"pair": ("Daily",   "4H"),     "pullback": "1H"},
    "Intraday":   {"pair": ("4H",      "1H"),     "pullback": "15min"},
}


# Cache
_cache: dict[tuple[str, str], tuple[float, dict]] = {}
_cache_lock = Lock()
_CACHE_TTL_SEC = 5 * 60


def _fetch_candles_for_tf(symbol: str, timeframe: str) -> pd.DataFrame:
    """
    Returns OHLC DataFrame. Handles 15min specially since technical.fetch_candles
    only knows the 5 standard TFs we use elsewhere.
    """
    if timeframe == "15min":
        return angel_client.get_candles(symbol, interval="FIFTEEN_MINUTE",
                                        days_back=7)
    return technical.fetch_candles(symbol, timeframe)


def _candle_color(df: pd.DataFrame) -> str:
    """Return 'green' / 'red' / 'flat' for the LAST CLOSED candle (iloc[-2])."""
    # Spec: always use iloc[-2]; iloc[-1] is the in-progress (unclosed) candle.
    if df is None or df.empty or len(df) < 2:
        return "flat"
    last = df.iloc[-2]
    if last["close"] > last["open"]:
        return "green"
    if last["close"] < last["open"]:
        return "red"
    return "flat"


def _roshan_signal(df: pd.DataFrame) -> tuple[str, float | None, float | None]:
    """
    Returns (signal, rsi, rsi_sma) for a candle DataFrame.
    Signal: 'BUY' / 'SHORT' / 'WAIT'.
    """
    # Need at least 36 rows to read iloc[-2] after RSI(14) + SMA(20) warm-up.
    if df is None or df.empty or len(df) < 36:
        return "WAIT", None, None
    close = df["close"]
    rsi = technical._rsi(close, 14)
    rsi_sma = technical._sma(rsi, 20)
    v_rsi = rsi.iloc[-2]
    v_sma = rsi_sma.iloc[-2]
    if pd.isna(v_rsi) or pd.isna(v_sma):
        return "WAIT", None, None
    if v_rsi > v_sma:
        return "BUY", float(v_rsi), float(v_sma)
    if v_rsi < v_sma:
        return "SHORT", float(v_rsi), float(v_sma)
    return "WAIT", float(v_rsi), float(v_sma)


def _evaluate_symbol(symbol: str, tf_a: str, tf_b: str, tf_pullback: str) -> dict | None:
    """
    Returns a dict if the symbol qualifies as BUY or SHORT for this call, else None.
    """
    try:
        df_a = _fetch_candles_for_tf(symbol, tf_a)
        df_b = _fetch_candles_for_tf(symbol, tf_b)
        df_pull = _fetch_candles_for_tf(symbol, tf_pullback)
    except Exception as e:  # noqa: BLE001
        log.warning("[scanner] %s fetch failed: %s", symbol, e)
        return None

    sig_a, rsi_a, sma_a = _roshan_signal(df_a)
    sig_b, rsi_b, sma_b = _roshan_signal(df_b)
    color_a = _candle_color(df_a)
    color_b = _candle_color(df_b)
    color_pull = _candle_color(df_pull)

    base = {
        "symbol": symbol,
        tf_a: {"roshan": sig_a, "candle": color_a, "rsi": rsi_a, "rsi_sma": sma_a},
        tf_b: {"roshan": sig_b, "candle": color_b, "rsi": rsi_b, "rsi_sma": sma_b},
        f"{tf_pullback}_pullback": {"candle": color_pull},
    }

    # BUY: Roshan BUY on both pair TFs + both pair candles green + pullback red
    if (sig_a == "BUY" and sig_b == "BUY"
            and color_a == "green" and color_b == "green"
            and color_pull == "red"):
        return {**base, "side": "BUY"}

    # SHORT: Roshan SHORT on both + both pair candles red + pullback green
    if (sig_a == "SHORT" and sig_b == "SHORT"
            and color_a == "red" and color_b == "red"
            and color_pull == "green"):
        return {**base, "side": "SHORT"}

    return None


def scan_roshan(call: str, universe_name: str = "nifty50",
                max_stocks: int | None = None,
                force_refresh: bool = False) -> dict:
    """
    Public entrypoint.
    call: 'Long-term' | 'Positional' | 'Swing' | 'Intraday'
    universe_name: 'nifty50' | 'largecap' | 'midcap' | 'smallcap' | 'microcap'
    """
    if call not in CALL_DEFS:
        raise ValueError(f"Unknown call: {call}. Must be one of {list(CALL_DEFS)}")
    universe_name = universe_name.lower().strip()

    cache_key = (universe_name, call)
    if not force_refresh:
        with _cache_lock:
            cached = _cache.get(cache_key)
        if cached and (time.time() - cached[0]) < _CACHE_TTL_SEC:
            payload = dict(cached[1])
            payload["from_cache"] = True
            payload["cache_age_sec"] = int(time.time() - cached[0])
            return payload

    symbols = universes.get_universe(universe_name)
    if not symbols:
        return {"error": f"empty universe: {universe_name}"}

    if max_stocks is None:
        # Scan the FULL universe (was capped at 60). Concurrency below keeps
        # full largecap/midcap/smallcap scans inside Render's request window.
        max_stocks = len(symbols)

    # Custom call type — user picks their own timeframes
    if call == "Custom" and custom_tf1 and custom_tf2:
        tf_a = custom_tf1
        tf_b = custom_tf2
        tf_pull = custom_pullback or None
        log.info("[scanner] custom call: tf1=%s tf2=%s pullback=%s", tf_a, tf_b, tf_pull)
    elif call in CALL_DEFS:
        cfg = CALL_DEFS[call]
        tf_a, tf_b = cfg["pair"]
        tf_pull = cfg.get("pullback")
    else:
        # Fallback to Positional
        tf_a, tf_b = "Weekly", "Daily"
        tf_pull = "4H"
    tf_pull = cfg["pullback"]

    log.info("[scanner] start: call=%s universe=%s tf=(%s,%s,pull=%s) cap=%d",
             call, universe_name, tf_a, tf_b, tf_pull, max_stocks)
    t0 = time.time()

    buys: list[dict] = []
    shorts: list[dict] = []
    scanned = symbols[:max_stocks]

    # Parallelise across symbols. angel_client is thread-safe (uses Lock for
    # its token-map cache) so concurrent get_candles is fine. 6 workers keeps
    # us well under Angel's per-second limits while finishing largecap (~107)
    # in <15s on the Render free dyno.
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(_evaluate_symbol, s, tf_a, tf_b, tf_pull): s
                   for s in scanned}
        for fut in as_completed(futures):
            try:
                ev = fut.result()
            except Exception as e:  # noqa: BLE001
                log.warning("[scanner] %s eval crashed: %s", futures[fut], e)
                continue
            if ev is None:
                continue
            if ev["side"] == "BUY":
                buys.append(ev)
            else:
                shorts.append(ev)

    elapsed = time.time() - t0
    log.info("[scanner] done in %.1fs: %d buys, %d shorts (scanned %d)",
             elapsed, len(buys), len(shorts), len(scanned))

    payload = {
        "indicator": "Roshan",
        "call": call,
        "universe": universe_name,
        "timeframes": [tf_a, tf_b],
        "pullback_timeframe": tf_pull,
        "rules": {
            "BUY": f"Roshan BUY on both {tf_a}+{tf_b}, both candles GREEN, {tf_pull} candle RED",
            "SHORT": f"Roshan SHORT on both {tf_a}+{tf_b}, both candles RED, {tf_pull} candle GREEN",
        },
        "scanned_at": datetime.now(IST).isoformat(),
        "scanned_count": len(scanned),
        "scan_duration_sec": round(elapsed, 1),
        "from_cache": False,
        "cache_age_sec": 0,
        "buys": buys,
        "shorts": shorts,
    }

    with _cache_lock:
        _cache[cache_key] = (time.time(), payload)

    return payload


def cache_status() -> dict:
    """Diagnostic — what's currently cached."""
    with _cache_lock:
        return {
            f"{u}/{c}": {
                "age_sec": int(time.time() - ts),
                "buys": len(p.get("buys", [])),
                "shorts": len(p.get("shorts", [])),
            }
            for (u, c), (ts, p) in _cache.items()
        }


def clear_cache():
    with _cache_lock:
        _cache.clear()


def scan_indicator(indicator: str, call: str = "Positional",
                   universe_name: str = "nifty50",
                   max_stocks: int | None = None,
                   force_refresh: bool = False,
                   custom_tf1: str | None = None,
                   custom_tf2: str | None = None,
                   custom_pullback: str | None = None) -> dict:
    """
    Generic scanner — works for ANY indicator in technical.ALL_INDICATORS.
    BUY  = indicator signal is BUY  on both timeframes in the call pair.
    SHORT = indicator signal is SELL on both timeframes in the call pair.
    """
    # Roshan has its own optimised scanner
    if indicator.lower() in ("roshan", "roshan indicator"):
        return scan_roshan(call=call, universe_name=universe_name,
                           max_stocks=max_stocks, force_refresh=force_refresh)

    if call not in CALL_DEFS:
        raise ValueError(f"Unknown call: {call}")

    universe_name = universe_name.lower().strip()
    cache_key = (universe_name, call, indicator, custom_tf1 or "", custom_tf2 or "")

    if not force_refresh:
        with _cache_lock:
            cached = _cache.get(cache_key)
        if cached and (time.time() - cached[0]) < _CACHE_TTL_SEC:
            payload = dict(cached[1])
            payload["from_cache"] = True
            payload["cache_age_sec"] = int(time.time() - cached[0])
            return payload

    symbols = universes.get_universe(universe_name)
    if not symbols:
        return {"error": f"empty universe: {universe_name}"}

    if max_stocks is None:
        # Scan the full universe (was capped at 60).
        max_stocks = len(symbols)

    # Custom call type — user picks their own timeframes
    if call == "Custom" and custom_tf1 and custom_tf2:
        tf_a = custom_tf1
        tf_b = custom_tf2
        tf_pull = custom_pullback or None
        log.info("[scanner] custom call: tf1=%s tf2=%s pullback=%s", tf_a, tf_b, tf_pull)
    elif call in CALL_DEFS:
        cfg = CALL_DEFS[call]
        tf_a, tf_b = cfg["pair"]
        tf_pull = cfg.get("pullback")
    else:
        # Fallback to Positional
        tf_a, tf_b = "Weekly", "Daily"
        tf_pull = "4H"

    log.info("[scanner] indicator=%s call=%s universe=%s cap=%d",
             indicator, call, universe_name, max_stocks)
    t0 = time.time()

    buys: list[dict] = []
    shorts: list[dict] = []

    for sym in symbols[:max_stocks]:
        try:
            df_a = technical.fetch_candles(sym, tf_a)
            df_b = technical.fetch_candles(sym, tf_b)
            sigs_a = technical._signals_for_df(df_a, [indicator])
            sigs_b = technical._signals_for_df(df_b, [indicator])
            sig_a = sigs_a.get(indicator, {}).get("signal", "WAIT")
            sig_b = sigs_b.get(indicator, {}).get("signal", "WAIT")
            val_a = sigs_a.get(indicator, {}).get("value")
            val_b = sigs_b.get(indicator, {}).get("value")

            entry = {
                "symbol": sym,
                tf_a: {"signal": sig_a, "value": val_a},
                tf_b: {"signal": sig_b, "value": val_b},
            }

            if sig_a == "BUY" and sig_b == "BUY":
                buys.append({**entry, "side": "BUY"})
            elif sig_a == "SELL" and sig_b == "SELL":
                shorts.append({**entry, "side": "SHORT"})

        except Exception as e:
            log.warning("[scanner] %s %s failed: %s", indicator, sym, e)
            continue

    # Also add quote data (last price, pchange) for display in frontend
    try:
        all_syms = [s.get("symbol") for s in buys + shorts if s.get("symbol")]
        if all_syms:
            quotes = angel_client.get_quote(all_syms)
            for entry in buys + shorts:
                q = quotes.get(entry.get("symbol"), {})
                entry["last_price"] = q.get("last_price")
                entry["pchange"]    = q.get("pchange")
    except Exception as e:
        log.warning("[scanner] quote enrichment failed: %s", e)

    elapsed = time.time() - t0
    log.info("[scanner] done %.1fs: %d buys %d shorts", elapsed, len(buys), len(shorts))

    payload = {
        "indicator": indicator,
        "call": call,
        "universe": universe_name,
        "timeframes": [tf_a, tf_b],
        "pullback_timeframe": tf_pull,
        "scanned_at": datetime.now(IST).isoformat(),
        "scanned_count": min(len(symbols), max_stocks),
        "scan_duration_sec": round(elapsed, 1),
        "from_cache": False,
        "cache_age_sec": 0,
        "buys": buys,
        "shorts": shorts,
    }

    with _cache_lock:
        _cache[cache_key] = (time.time(), payload)

    return payload

