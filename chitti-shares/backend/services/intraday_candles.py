"""
services/intraday_candles.py
----------------------------
Direct fetch of 15min / 5min / 1min candles from Angel One.

This module exists because services/technical.py only supports timeframes
in ["Monthly", "Weekly", "Daily", "4H", "1H"] (resampling from ONE_DAY or
ONE_HOUR). Adding intraday timeframes there would require modifying a
certified file. This module instead calls angel_client.get_candles directly
with Angel's native intraday intervals.

Public entrypoints:
  fetch_intraday_candles(symbol, timeframe) -> pd.DataFrame
  is_intraday_timeframe(timeframe) -> bool

Angel One historical-data limits:
  - Intraday intervals (ONE_MINUTE, FIVE_MINUTE, FIFTEEN_MINUTE) capped at
    ~30 days lookback. We pull a sane default that fits both API quotas
    and the chart's typical visible range.
"""

from __future__ import annotations

import logging
import pandas as pd

log = logging.getLogger("intraday_candles")

# Map our timeframe strings -> Angel native intervals + sensible days_back.
# These intervals are documented in services/angel_client.get_candles.
_INTRADAY_MAP = {
    "15min": ("FIFTEEN_MINUTE", 30),  # ~30 trading days * 25 candles/day = 750 candles
    "5min":  ("FIVE_MINUTE",    10),  # 10 trading days * 75 candles/day = 750 candles
    "1min":  ("ONE_MINUTE",      3),  # 3 trading days * 375 candles/day = 1125 candles
}


def is_intraday_timeframe(timeframe: str) -> bool:
    """True if the timeframe should be fetched via this module rather than
    services.technical.fetch_candles."""
    return timeframe in _INTRADAY_MAP


def fetch_intraday_candles(symbol: str, timeframe: str) -> pd.DataFrame:
    """
    Fetch intraday OHLC candles for a symbol on the requested timeframe.
    Returns a DataFrame indexed by datetime with columns:
      open, high, low, close, volume

    Falls back to an empty DataFrame on failure (mirrors the contract of
    services.technical.fetch_candles so callers can handle uniformly).
    """
    if timeframe not in _INTRADAY_MAP:
        raise ValueError(
            f"Unknown intraday timeframe: {timeframe!r}. "
            f"Valid: {list(_INTRADAY_MAP)}"
        )

    interval, days_back = _INTRADAY_MAP[timeframe]

    # Late import: avoids importing angel_client at module-load time
    # (and matches the pattern used in services/technical.py).
    from services import angel_client

    try:
        df = angel_client.get_candles(
            symbol,
            interval=interval,
            days_back=days_back,
        )
    except Exception as e:  # noqa: BLE001
        log.warning(
            "intraday_candles: angel_client.get_candles failed for %s [%s/%s]: %s",
            symbol, timeframe, interval, e,
        )
        return pd.DataFrame()

    if df is None or df.empty:
        log.info(
            "intraday_candles: empty response from Angel for %s [%s/%s]",
            symbol, timeframe, interval,
        )
        return pd.DataFrame()

    # Normalize column names to match what /api/candles expects downstream.
    # angel_client already returns lower-case columns in the existing path;
    # we still do a defensive rename here.
    df = df.rename(columns={c: c.lower() for c in df.columns})

    # Required columns
    required = {"open", "high", "low", "close"}
    missing = required - set(df.columns)
    if missing:
        log.warning(
            "intraday_candles: missing columns %s in Angel response for %s [%s]",
            missing, symbol, timeframe,
        )
        return pd.DataFrame()

    # Ensure volume column exists (some endpoints omit it)
    if "volume" not in df.columns:
        df["volume"] = 0.0

    return df
