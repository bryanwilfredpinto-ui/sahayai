"""
services/strength.py
--------------------
Composite Signal Strength + Confluence + Multi-TF Technical Rating.

Layered on top of services/technical.py (which is on the certified-do-not-touch
list). We re-use its `technical_report()` output and aggregate.

Public entrypoints:
  - signal_strength(symbol, timeframe) -> dict
      One number 0-10, plus the per-indicator breakdown ("how many of the
      ~43 agree?"). Used by Chitti Technical's "Signal Strength + Confluence"
      panel.

  - rating_table(symbol) -> dict
      For each of the 7 timeframes (1m / 5m / 15m / 1H / 4H / Daily / Weekly /
      Monthly — capped to what Angel + technical.py actually expose, which is
      Monthly / Weekly / Daily / 4H / 1H), produce a TradingView-style verdict:
      STRONG BUY / BUY / NEUTRAL / SELL / STRONG SELL.

Scoring rule (kept simple + auditable so users can verify):
    +1 for every BUY  signal
    -1 for every SELL signal
     0 for WAIT
  score_pct = (sum + N) / (2N) * 100   # 0..100
  strength_0_10 = round(score_pct / 10, 1)

Verdict thresholds (TradingView-style, symmetric):
    >= 75   STRONG BUY
    >= 60   BUY
    > 40    NEUTRAL
    >  25   SELL
    <= 25   STRONG SELL
"""
from __future__ import annotations

import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from services import technical

log = logging.getLogger("strength")
IST = ZoneInfo("Asia/Kolkata")


def _verdict(pct: float) -> str:
    if pct >= 75: return "STRONG BUY"
    if pct >= 60: return "BUY"
    if pct >  40: return "NEUTRAL"
    if pct >  25: return "SELL"
    return "STRONG SELL"


def _aggregate_signals(signals: dict[str, dict]) -> dict:
    """
    signals: {indicator_name: {value, signal, note}}
    Returns: {buys, sells, waits, total, score_pct, strength_0_10, verdict, agreers}
    """
    buys = sells = waits = 0
    agreers: list[str] = []  # the ones contributing to the dominant side
    for ind, payload in signals.items():
        sig = (payload or {}).get("signal", "WAIT")
        if sig == "BUY":
            buys += 1
        elif sig == "SELL":
            sells += 1
        else:
            waits += 1
    total = buys + sells + waits
    if total == 0:
        return {"buys": 0, "sells": 0, "waits": 0, "total": 0,
                "score_pct": 50.0, "strength_0_10": 5.0,
                "verdict": "NEUTRAL", "agreers": []}

    net = buys - sells
    # Map [-total, +total] -> [0, 100]
    score_pct = round(((net + total) / (2 * total)) * 100, 1)
    verdict = _verdict(score_pct)

    # "agreers" = which indicators voted for the verdict side
    side = "BUY" if score_pct >= 60 else ("SELL" if score_pct <= 40 else None)
    if side:
        agreers = [ind for ind, p in signals.items()
                   if (p or {}).get("signal") == side]

    return {
        "buys": buys,
        "sells": sells,
        "waits": waits,
        "total": total,
        "score_pct": score_pct,
        "strength_0_10": round(score_pct / 10, 1),
        "verdict": verdict,
        "agreers": agreers,
    }


def signal_strength(symbol: str, timeframe: str = "Daily") -> dict:
    """
    Composite score for one symbol on one timeframe.
    """
    rep = technical.technical_report(symbol)
    tf_signals = (rep.get("timeframes") or {}).get(timeframe) or {}
    agg = _aggregate_signals(tf_signals)
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "generated_at": datetime.now(IST).isoformat(),
        **agg,
    }


def rating_table(symbol: str) -> dict:
    """
    One row per timeframe. 5 timeframes today (Monthly/Weekly/Daily/4H/1H).
    """
    rep = technical.technical_report(symbol)
    rows = []
    for tf in technical.ALL_TIMEFRAMES:
        agg = _aggregate_signals((rep.get("timeframes") or {}).get(tf) or {})
        rows.append({"timeframe": tf, **agg})
    return {
        "symbol": symbol,
        "generated_at": datetime.now(IST).isoformat(),
        "rows": rows,
    }
