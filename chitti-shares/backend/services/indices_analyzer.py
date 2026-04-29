"""
services/indices_analyzer.py
----------------------------
Pure functions that turn raw OHLC candles into the numbers we display
on the index cards: support, resistance, signal, 50-day SMA.

No I/O. No DB. Just math. Easy to unit test.

Algorithm (per spec):
  - Use last 50 daily candles
  - "Touched" levels = candle highs and lows, rounded to nearest
    50 points (Nifty) / 100 points (Sensex). The rounding is what
    makes a level "touched" multiple times - exact prices almost
    never repeat.
  - Resistance candidates = touched levels ABOVE current price
  - Support candidates    = touched levels BELOW current price
  - Pick the 3 most-frequent in each bucket; nearest to price wins.

  - Signal: compare current price vs 50-day SMA of close
       above SMA  + 0.5%   -> Bullish
       below SMA - 0.5%   -> Bearish
       within +/- 0.5%    -> Neutral
"""

from collections import Counter
from typing import Iterable


def round_to(level: float, step: int) -> int:
    return int(round(level / step) * step)


def find_support_resistance(
    candles: list[dict],
    current_price: float,
    bucket_step: int,
) -> tuple[float | None, float | None]:
    """
    candles: list of {date, open, high, low, close, ...} (Kite shape).
    Returns (nearest_support, nearest_resistance). Either may be None
    if not enough data.
    """
    if not candles:
        return None, None

    levels_above: Counter[int] = Counter()
    levels_below: Counter[int] = Counter()

    for c in candles[-50:]:
        for raw in (c["high"], c["low"]):
            bucket = round_to(raw, bucket_step)
            if bucket > current_price:
                levels_above[bucket] += 1
            elif bucket < current_price:
                levels_below[bucket] += 1

    # Take the 3 most-touched in each bucket, then pick nearest.
    top_resistance = [lv for lv, _ in levels_above.most_common(3)]
    top_support = [lv for lv, _ in levels_below.most_common(3)]

    nearest_resistance = min(top_resistance, default=None,
                             key=lambda lv: lv - current_price)
    nearest_support = max(top_support, default=None,
                          key=lambda lv: lv)  # max BELOW = nearest

    return (
        float(nearest_support) if nearest_support is not None else None,
        float(nearest_resistance) if nearest_resistance is not None else None,
    )


def sma(values: Iterable[float], period: int) -> float | None:
    arr = list(values)[-period:]
    if len(arr) < period:
        return None
    return sum(arr) / period


def compute_signal(current_price: float, sma_50: float | None) -> str:
    """Bullish / Bearish / Neutral per the +/- 0.5% rule."""
    if sma_50 is None or sma_50 == 0:
        return "Neutral"
    diff_pct = (current_price - sma_50) / sma_50 * 100
    if diff_pct > 0.5:
        return "Bullish"
    if diff_pct < -0.5:
        return "Bearish"
    return "Neutral"


def analyze_index(
    candles: list[dict],
    current_price: float,
    prev_close: float,
    bucket_step: int,
) -> dict:
    """
    Returns the dict shape the frontend expects for one index card.
    Keep keys stable - frontend depends on them.
    """
    closes = [c["close"] for c in candles]
    sma_50 = sma(closes, 50)
    support, resistance = find_support_resistance(candles, current_price, bucket_step)
    signal = compute_signal(current_price, sma_50)

    change_pts = current_price - prev_close
    change_pct = (change_pts / prev_close * 100) if prev_close else 0.0

    return {
        "value": round(current_price, 2),
        "prev_close": round(prev_close, 2),
        "change_pts": round(change_pts, 2),
        "change_pct": round(change_pct, 2),
        "support": round(support, 2) if support is not None else None,
        "resistance": round(resistance, 2) if resistance is not None else None,
        "sma_50": round(sma_50, 2) if sma_50 is not None else None,
        "signal": signal,
    }
