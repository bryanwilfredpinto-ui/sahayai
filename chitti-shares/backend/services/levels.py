"""
services/levels.py — auto S/R + trendlines per timeframe.
Reads candles via services.technical.fetch_candles. Read-only.
"""

from __future__ import annotations
import logging
from dataclasses import dataclass
from typing import List, Tuple
import numpy as np
import pandas as pd

log = logging.getLogger("levels")

_TF_PARAMS = {
    # Loosened defaults: shorter histories naturally have fewer pivots, so the
    # original strict thresholds were producing empty results on common stocks.
    # Lowering min_pivot_count to 1 and min_r2 to 0.55 keeps quality reasonable
    # while ensuring every symbol gets at least some levels drawn.
    "Monthly": dict(k=2, cluster_tol=0.030, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=120),
    "Weekly":  dict(k=3, cluster_tol=0.025, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=156),
    "Daily":   dict(k=4, cluster_tol=0.020, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=180),
    "4H":      dict(k=3, cluster_tol=0.018, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=120),
    "1H":      dict(k=3, cluster_tol=0.015, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=90),
    "15min":   dict(k=3, cluster_tol=0.012, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=30),
    "5min":    dict(k=3, cluster_tol=0.008, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=10),
    "1min":    dict(k=3, cluster_tol=0.005, min_pivot_count=1, top_n=3,
                    trend_min_pivots=2, trend_min_r2=0.55, days_back=3),
}


@dataclass
class Pivot:
    idx: int
    date: pd.Timestamp
    price: float
    kind: str


def _find_pivots(df, k):
    highs, lows = [], []
    if len(df) < (2 * k + 1):
        return highs, lows
    high_arr = df["high"].to_numpy(dtype=float)
    low_arr = df["low"].to_numpy(dtype=float)
    dates = df.index
    for i in range(k, len(df) - k):
        wh = high_arr[i - k:i + k + 1]
        if high_arr[i] == wh.max() and (wh == high_arr[i]).sum() == 1:
            highs.append(Pivot(i, dates[i], float(high_arr[i]), "high"))
        wl = low_arr[i - k:i + k + 1]
        if low_arr[i] == wl.min() and (wl == low_arr[i]).sum() == 1:
            lows.append(Pivot(i, dates[i], float(low_arr[i]), "low"))
    return highs, lows


def _cluster_pivots(pivots, tol, min_count):
    if not pivots:
        return []
    sp = sorted(pivots, key=lambda p: p.price)
    clusters, current = [], [sp[0]]
    for p in sp[1:]:
        avg = sum(x.price for x in current) / len(current)
        if abs(p.price - avg) / avg <= tol:
            current.append(p)
        else:
            clusters.append(current)
            current = [p]
    clusters.append(current)
    out = []
    for c in clusters:
        if len(c) < min_count:
            continue
        avg_price = sum(p.price for p in c) / len(c)
        latest = max(p.date for p in c)
        out.append({"price": round(avg_price, 2),
                    "pivot_date": latest.strftime("%Y-%m-%d"),
                    "hits": len(c)})
    out.sort(key=lambda r: -r["hits"])
    return out


def _fit_line(xs, ys):
    n = len(xs)
    if n < 2:
        return 0.0, 0.0, 0.0
    xm, ym = xs.mean(), ys.mean()
    cov = ((xs - xm) * (ys - ym)).sum()
    var = ((xs - xm) ** 2).sum()
    if var == 0:
        return 0.0, float(ym), 0.0
    slope = cov / var
    intercept = ym - slope * xm
    yp = slope * xs + intercept
    ss_res = ((ys - yp) ** 2).sum()
    ss_tot = ((ys - ym) ** 2).sum()
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    return float(slope), float(intercept), float(r2)


def _best_trendline(pivots, df, direction, min_pivots, min_r2):
    """
    Strict tip-anchored trendline.

    Rules:
      - resistance line MUST touch the wick tips (high) of pivot highs
      - support line MUST touch the wick tips (low) of pivot lows
      - the line MUST NOT cross through any candle body between its anchors

    Algorithm:
      1. Walk pivots newest-to-oldest in pairs.
      2. For each pair (older, newer): compute the straight line through their tips.
      3. Verify no candle body between them crosses the line on the wrong side
         (resistance: candle high should not exceed line; support: candle low
         should not fall below line).
      4. Return the FIRST valid pair (most recent valid trendline). The angle
         direction also has to match (rising support / falling resistance).
    """
    if len(pivots) < 2:
        return None

    cands = sorted(pivots, key=lambda p: p.idx)
    is_resistance = (direction == "falling_resistance")
    series = df["high"].to_numpy(dtype=float) if is_resistance else df["low"].to_numpy(dtype=float)

    # Walk pairs, newest first. For each newer pivot, try older pivots from
    # most-recent to oldest.
    for i in range(len(cands) - 1, 0, -1):
        newer = cands[i]
        for j in range(i - 1, -1, -1):
            older = cands[j]
            x1, y1 = older.idx, older.price
            x2, y2 = newer.idx, newer.price
            if x2 == x1:
                continue
            slope = (y2 - y1) / (x2 - x1)
            intercept = y1 - slope * x1

            # Direction filter
            if direction == "rising_support" and slope <= 0:
                continue
            if direction == "falling_resistance" and slope >= 0:
                continue

            # Strict no-cross check between x1 and x2
            crosses = False
            for k in range(x1 + 1, x2):
                line_y = slope * k + intercept
                if is_resistance:
                    # Any candle's high above the line means body/wick crosses through.
                    if series[k] > line_y:
                        crosses = True
                        break
                else:
                    # Any candle's low below the line means body/wick crosses through.
                    if series[k] < line_y:
                        crosses = True
                        break
            if crosses:
                continue

            return {
                "slope": round(slope, 6),
                "intercept": round(intercept, 4),
                "start_date": older.date.strftime("%Y-%m-%d"),
                "end_date": newer.date.strftime("%Y-%m-%d"),
                "kind": "support" if direction == "rising_support" else "resistance",
                "r2": 1.0,           # exact two-point fit
                "pivot_count": 2,
            }
    return None


def compute_levels(symbol: str, timeframe: str = "Daily") -> dict:
    # Route based on timeframe: intraday -> intraday_candles; everything else -> technical.
    from services import technical, intraday_candles
    if timeframe not in _TF_PARAMS:
        raise ValueError(f"Unknown timeframe: {timeframe}. Valid: {list(_TF_PARAMS)}")
    p = _TF_PARAMS[timeframe]
    try:
        if intraday_candles.is_intraday_timeframe(timeframe):
            df = intraday_candles.fetch_intraday_candles(symbol, timeframe).tail(p["days_back"])
        else:
            df = technical.fetch_candles(symbol, timeframe).tail(p["days_back"])
    except Exception as e:
        log.warning("levels: fetch_candles failed for %s [%s]: %s", symbol, timeframe, e)
        return {"support": [], "resistance": [], "trendlines": []}
    if df is None or df.empty or len(df) < (2 * p["k"] + 1):
        return {"support": [], "resistance": [], "trendlines": []}
    df = df.rename(columns={c: c.lower() for c in df.columns})
    ph, pl = _find_pivots(df, p["k"])
    resistance = _cluster_pivots(ph, p["cluster_tol"], p["min_pivot_count"])[:p["top_n"]]
    support = _cluster_pivots(pl, p["cluster_tol"], p["min_pivot_count"])[:p["top_n"]]
    trendlines = []
    r = _best_trendline(pl, df, "rising_support", p["trend_min_pivots"], p["trend_min_r2"])
    if r:
        trendlines.append(r)
    f = _best_trendline(ph, df, "falling_resistance", p["trend_min_pivots"], p["trend_min_r2"])
    if f:
        trendlines.append(f)
    return {"support": support, "resistance": resistance, "trendlines": trendlines}
