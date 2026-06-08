"""
services/technical.py
---------------------
Layer 1 of Box 3 (Technical Analysis).

What this module does:
  - Fetches OHLC candles from Angel One for any stock/index symbol
  - Resamples daily candles into Weekly and Monthly
  - Resamples 1H candles into 4H
  - Computes ~30 technical indicators using only numpy + pandas
    (no pandas_ta dependency, so deploys cleanly on Render free tier)
  - Returns BUY / SELL / WAIT signal per (indicator, timeframe)
  - Combines pair-of-timeframes for Long-term, Positional, Intraday calls

NO external paid library. NO pandas_ta. Pure pandas + numpy.

Public entrypoint:
    technical_report(symbol, indicators=[...]) -> dict
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

log = logging.getLogger("technical")
IST = ZoneInfo("Asia/Kolkata")


# ============================================================
# 1. CANDLE FETCH (delegates to angel_client)
# ============================================================

# Angel native intervals we use
_ANGEL_INTERVAL = {
    "1H":      ("ONE_HOUR",   60),    # native
    "Daily":   ("ONE_DAY",    365),   # native
}
# Resampled timeframes (built from native ones above)
_RESAMPLE_FROM = {
    "4H":      "1H",      # 4 x 1H candles
    "Weekly":  "Daily",   # 5 x Daily candles
    "Monthly": "Daily",   # ~21 x Daily candles
}


def fetch_candles(symbol: str, timeframe: str) -> pd.DataFrame:
    """
    Returns DataFrame indexed by datetime with columns: open, high, low, close, volume.
    Caller passes one of: '1H', '4H', 'Daily', 'Weekly', 'Monthly'.
    """
    from services import angel_client  # lazy import — avoids circular

    if timeframe in _ANGEL_INTERVAL:
        angel_interval, days_back = _ANGEL_INTERVAL[timeframe]
        df = angel_client.get_candles(symbol, interval=angel_interval, days_back=days_back)
        return df

    # Resampled timeframes
    base_tf = _RESAMPLE_FROM[timeframe]
    base_df = fetch_candles(symbol, base_tf)
    if base_df.empty:
        return base_df

    if timeframe == "4H":
        # Group every 4 hourly candles
        return _resample_ohlc(base_df, rule="4h")
    if timeframe == "Weekly":
        return _resample_ohlc(base_df, rule="W-FRI")  # week ends Friday
    if timeframe == "Monthly":
        return _resample_ohlc(base_df, rule="ME")     # month-end
    raise ValueError(f"Unknown timeframe: {timeframe}")


def _resample_ohlc(df: pd.DataFrame, rule: str) -> pd.DataFrame:
    """Standard OHLC resampling. Resilient across pandas versions (the 'ME'/'4h'
    frequency aliases changed in 2.2) and keeps partial bins so Monthly never comes
    back empty (the prior dropna(how='any') + a single alias could wipe it out)."""
    if df.empty:
        return df
    agg = {"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"}
    candidates = [rule]
    legacy = {"ME": "M", "M": "ME", "4h": "4H", "4H": "4h"}.get(rule)
    if legacy and legacy != rule:
        candidates.append(legacy)
    for r in candidates:
        try:
            out = df.resample(r).agg(agg).dropna(how="all")
            if not out.empty:
                return out
        except (ValueError, KeyError):
            continue
    return pd.DataFrame()


# ============================================================
# 2. INDICATORS — pure pandas / numpy
# ============================================================

def _ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False).mean()


def _sma(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(window=n).mean()


def _rsi(close: pd.Series, n: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(window=n).mean()
    loss = (-delta.clip(upper=0)).rolling(window=n).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _macd(close: pd.Series) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Returns (macd, signal, histogram)."""
    ema12 = _ema(close, 12)
    ema26 = _ema(close, 26)
    macd = ema12 - ema26
    signal = _ema(macd, 9)
    return macd, signal, macd - signal


def _stochastic(high, low, close, k=14, d=3) -> tuple[pd.Series, pd.Series]:
    ll = low.rolling(k).min()
    hh = high.rolling(k).max()
    k_line = 100 * (close - ll) / (hh - ll).replace(0, np.nan)
    d_line = k_line.rolling(d).mean()
    return k_line, d_line


def _stoch_rsi(close: pd.Series, n: int = 14) -> pd.Series:
    rsi = _rsi(close, n)
    ll = rsi.rolling(n).min()
    hh = rsi.rolling(n).max()
    return 100 * (rsi - ll) / (hh - ll).replace(0, np.nan)


def _williams_r(high, low, close, n: int = 14) -> pd.Series:
    hh = high.rolling(n).max()
    ll = low.rolling(n).min()
    return -100 * (hh - close) / (hh - ll).replace(0, np.nan)


def _cci(high, low, close, n: int = 20) -> pd.Series:
    tp = (high + low + close) / 3
    sma = tp.rolling(n).mean()
    mad = tp.rolling(n).apply(lambda x: np.fabs(x - x.mean()).mean(), raw=True)
    return (tp - sma) / (0.015 * mad.replace(0, np.nan))


def _roc(close: pd.Series, n: int = 12) -> pd.Series:
    return 100 * (close - close.shift(n)) / close.shift(n)


def _momentum(close: pd.Series, n: int = 10) -> pd.Series:
    return close - close.shift(n)


def _trix(close: pd.Series, n: int = 15) -> pd.Series:
    e1 = _ema(close, n)
    e2 = _ema(e1, n)
    e3 = _ema(e2, n)
    return 100 * e3.pct_change()


def _ultimate_osc(high, low, close, s=7, m=14, l=28) -> pd.Series:
    bp = close - pd.concat([low, close.shift(1)], axis=1).min(axis=1)
    tr = pd.concat([high - low,
                    (high - close.shift(1)).abs(),
                    (low - close.shift(1)).abs()], axis=1).max(axis=1)
    avg_s = bp.rolling(s).sum() / tr.rolling(s).sum().replace(0, np.nan)
    avg_m = bp.rolling(m).sum() / tr.rolling(m).sum().replace(0, np.nan)
    avg_l = bp.rolling(l).sum() / tr.rolling(l).sum().replace(0, np.nan)
    return 100 * (4 * avg_s + 2 * avg_m + avg_l) / 7


def _adx(high, low, close, n: int = 14) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Returns (adx, plus_di, minus_di)."""
    up = high.diff()
    down = -low.diff()
    plus_dm = np.where((up > down) & (up > 0), up, 0.0)
    minus_dm = np.where((down > up) & (down > 0), down, 0.0)
    tr = pd.concat([high - low,
                    (high - close.shift(1)).abs(),
                    (low - close.shift(1)).abs()], axis=1).max(axis=1)
    atr = tr.rolling(n).mean()
    plus_di = 100 * pd.Series(plus_dm, index=high.index).rolling(n).mean() / atr.replace(0, np.nan)
    minus_di = 100 * pd.Series(minus_dm, index=high.index).rolling(n).mean() / atr.replace(0, np.nan)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    adx = dx.rolling(n).mean()
    return adx, plus_di, minus_di


def _aroon(high, low, n: int = 25) -> tuple[pd.Series, pd.Series]:
    aroon_up = high.rolling(n + 1).apply(lambda x: x.argmax(), raw=True) / n * 100
    aroon_down = low.rolling(n + 1).apply(lambda x: x.argmin(), raw=True) / n * 100
    return aroon_up, aroon_down


def _supertrend(high, low, close, period: int = 10, mult: float = 3.0) -> pd.Series:
    """Returns +1 (uptrend) / -1 (downtrend) series."""
    hl2 = (high + low) / 2
    tr = pd.concat([high - low,
                    (high - close.shift(1)).abs(),
                    (low - close.shift(1)).abs()], axis=1).max(axis=1)
    atr = tr.rolling(period).mean()
    upper = hl2 + mult * atr
    lower = hl2 - mult * atr
    trend = pd.Series(index=close.index, dtype=float)
    trend.iloc[0] = 1
    for i in range(1, len(close)):
        if close.iloc[i] > upper.iloc[i - 1]:
            trend.iloc[i] = 1
        elif close.iloc[i] < lower.iloc[i - 1]:
            trend.iloc[i] = -1
        else:
            trend.iloc[i] = trend.iloc[i - 1]
    return trend


def _psar(high, low, af_step: float = 0.02, af_max: float = 0.2) -> pd.Series:
    """Parabolic SAR — returns the SAR value series."""
    sar = pd.Series(index=high.index, dtype=float)
    if len(high) < 2:
        return sar
    bull = True
    af = af_step
    ep = high.iloc[0]
    sar.iloc[0] = low.iloc[0]
    for i in range(1, len(high)):
        prev = sar.iloc[i - 1]
        if bull:
            sar.iloc[i] = prev + af * (ep - prev)
            if low.iloc[i] < sar.iloc[i]:
                bull = False
                sar.iloc[i] = ep
                ep = low.iloc[i]
                af = af_step
            else:
                if high.iloc[i] > ep:
                    ep = high.iloc[i]
                    af = min(af + af_step, af_max)
        else:
            sar.iloc[i] = prev + af * (ep - prev)
            if high.iloc[i] > sar.iloc[i]:
                bull = True
                sar.iloc[i] = ep
                ep = high.iloc[i]
                af = af_step
            else:
                if low.iloc[i] < ep:
                    ep = low.iloc[i]
                    af = min(af + af_step, af_max)
    return sar


def _ichimoku(high, low, close):
    """Returns (tenkan, kijun, senkou_a, senkou_b) — minus chikou for simplicity."""
    tenkan = (high.rolling(9).max() + low.rolling(9).min()) / 2
    kijun = (high.rolling(26).max() + low.rolling(26).min()) / 2
    senkou_a = ((tenkan + kijun) / 2).shift(26)
    senkou_b = ((high.rolling(52).max() + low.rolling(52).min()) / 2).shift(26)
    return tenkan, kijun, senkou_a, senkou_b


def _bollinger(close: pd.Series, n: int = 20, k: float = 2.0):
    mid = _sma(close, n)
    std = close.rolling(n).std()
    return mid + k * std, mid, mid - k * std  # upper, mid, lower


def _atr(high, low, close, n: int = 14) -> pd.Series:
    tr = pd.concat([high - low,
                    (high - close.shift(1)).abs(),
                    (low - close.shift(1)).abs()], axis=1).max(axis=1)
    return tr.rolling(n).mean()


def _keltner(high, low, close, n: int = 20, mult: float = 2.0):
    mid = _ema(close, n)
    atr = _atr(high, low, close, n)
    return mid + mult * atr, mid, mid - mult * atr


def _donchian(high, low, n: int = 20):
    upper = high.rolling(n).max()
    lower = low.rolling(n).min()
    return upper, (upper + lower) / 2, lower


def _obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    direction = np.sign(close.diff().fillna(0))
    return (direction * volume).cumsum()


def _force_index(close: pd.Series, volume: pd.Series, n: int = 13) -> pd.Series:
    raw = close.diff() * volume
    return _ema(raw, n)


def _accum_dist(high, low, close, volume) -> pd.Series:
    clv = ((close - low) - (high - close)) / (high - low).replace(0, np.nan)
    return (clv * volume).cumsum()


def _cmf(high, low, close, volume, n: int = 20) -> pd.Series:
    """Chaikin Money Flow."""
    mfm = ((close - low) - (high - close)) / (high - low).replace(0, np.nan)
    mfv = mfm * volume
    return mfv.rolling(n).sum() / volume.rolling(n).sum().replace(0, np.nan)


def _mfi(high, low, close, volume, n: int = 14) -> pd.Series:
    """Money Flow Index — RSI but with volume."""
    tp = (high + low + close) / 3
    raw_mf = tp * volume
    pos_mf = raw_mf.where(tp > tp.shift(1), 0).rolling(n).sum()
    neg_mf = raw_mf.where(tp < tp.shift(1), 0).rolling(n).sum()
    mr = pos_mf / neg_mf.replace(0, np.nan)
    return 100 - (100 / (1 + mr))


def _vwap(high, low, close, volume) -> pd.Series:
    tp = (high + low + close) / 3
    return (tp * volume).cumsum() / volume.cumsum().replace(0, np.nan)


def _elder_ray(high, low, close, n: int = 13):
    ema = _ema(close, n)
    bull_power = high - ema
    bear_power = low - ema
    return bull_power, bear_power


def _elder_impulse(close, high, low) -> pd.Series:
    """+1 BUY, -1 SELL, 0 NEUTRAL."""
    ema13 = _ema(close, 13)
    macd_line, signal, hist = _macd(close)
    out = pd.Series(0, index=close.index)
    out[(ema13.diff() > 0) & (hist.diff() > 0)] = 1
    out[(ema13.diff() < 0) & (hist.diff() < 0)] = -1
    return out


def _roshan(close: pd.Series) -> tuple[pd.Series, pd.Series]:
    """Roshan Indicator: RSI(14) vs SMA(20) of RSI(14)."""
    rsi = _rsi(close, 14)
    rsi_sma = _sma(rsi, 20)
    return rsi, rsi_sma




# ============================================================
# NEW INDICATORS (2010-2026) — pure numpy/pandas, no paid libs
# ============================================================

def _hma(close: pd.Series, n: int = 20) -> pd.Series:
    """Hull Moving Average (2012+) — faster, smoother, less lag than EMA."""
    half = _wma(close, n // 2)
    full = _wma(close, n)
    raw  = 2 * half - full
    return _wma(raw, int(np.sqrt(n)))

def _wma(s: pd.Series, n: int) -> pd.Series:
    """Weighted Moving Average — helper for HMA."""
    weights = np.arange(1, n + 1, dtype=float)
    return s.rolling(n).apply(lambda x: np.dot(x, weights) / weights.sum(), raw=True)

def _awesome_oscillator(high: pd.Series, low: pd.Series) -> pd.Series:
    """Awesome Oscillator (Bill Williams, widely adopted 2010+).
    Midpoint SMA(5) minus midpoint SMA(34). Above zero = bullish momentum."""
    mid = (high + low) / 2
    return _sma(mid, 5) - _sma(mid, 34)

def _vortex(high: pd.Series, low: pd.Series, close: pd.Series, n: int = 14):
    """Vortex Indicator (2010) — two lines showing trend direction.
    Returns (VI+, VI-). VI+ > VI- = bullish."""
    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low  - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    vm_plus  = (high - low.shift(1)).abs()
    vm_minus = (low  - high.shift(1)).abs()
    vi_plus  = vm_plus.rolling(n).sum()  / tr.rolling(n).sum().replace(0, np.nan)
    vi_minus = vm_minus.rolling(n).sum() / tr.rolling(n).sum().replace(0, np.nan)
    return vi_plus, vi_minus

def _chandelier_exit(high: pd.Series, low: pd.Series, close: pd.Series,
                     n: int = 22, mult: float = 3.0):
    """Chandelier Exit (2010+) — ATR-based trailing stop.
    Returns (long_stop, short_stop). Price above long_stop = BUY."""
    atr = _atr(high, low, close, n)
    long_stop  = high.rolling(n).max() - mult * atr
    short_stop = low.rolling(n).min()  + mult * atr
    return long_stop, short_stop

def _ttm_squeeze(high: pd.Series, low: pd.Series, close: pd.Series,
                 bb_n: int = 20, bb_mult: float = 2.0,
                 kc_n: int = 20, kc_mult: float = 1.5):
    """TTM Squeeze (popularised 2010+) — Bollinger Bands inside Keltner = squeeze.
    Returns (momentum, squeeze_on).
    momentum > 0 = BUY, squeeze_on = coiled spring about to fire."""
    # Bollinger Bands
    bb_mid  = _sma(close, bb_n)
    bb_std  = close.rolling(bb_n).std()
    bb_upper = bb_mid + bb_mult * bb_std
    bb_lower = bb_mid - bb_mult * bb_std
    # Keltner Channels
    kc_mid   = _ema(close, kc_n)
    kc_range = _atr(high, low, close, kc_n)
    kc_upper = kc_mid + kc_mult * kc_range
    kc_lower = kc_mid - kc_mult * kc_range
    # Squeeze = BB inside KC
    squeeze_on = (bb_upper < kc_upper) & (bb_lower > kc_lower)
    # Momentum = delta of midpoint linear regression
    delta = close - (high.rolling(kc_n).max() + low.rolling(kc_n).min()) / 2
    delta = (delta + _sma(delta, kc_n)) / 2
    momentum = _ema(delta, kc_n)
    return momentum, squeeze_on.astype(float)

def _balance_of_power(open_: pd.Series, high: pd.Series,
                       low: pd.Series, close: pd.Series, n: int = 14) -> pd.Series:
    """Balance of Power (2010+) — who is winning each candle.
    (Close - Open) / (High - Low). Smoothed. Above zero = buyers."""
    raw = (close - open_) / (high - low).replace(0, np.nan)
    return _sma(raw, n)

def _laguerre_rsi(close: pd.Series, gamma: float = 0.5) -> pd.Series:
    """Laguerre RSI (adopted 2012+) — faster RSI, less whipsaw.
    Range 0-1. Above 0.5 = BUY."""
    L0 = pd.Series(0.0, index=close.index)
    L1 = pd.Series(0.0, index=close.index)
    L2 = pd.Series(0.0, index=close.index)
    L3 = pd.Series(0.0, index=close.index)
    for i in range(1, len(close)):
        L0.iloc[i] = (1 - gamma) * close.iloc[i] + gamma * L0.iloc[i-1]
        L1.iloc[i] = -gamma * L0.iloc[i] + L0.iloc[i-1] + gamma * L1.iloc[i-1]
        L2.iloc[i] = -gamma * L1.iloc[i] + L1.iloc[i-1] + gamma * L2.iloc[i-1]
        L3.iloc[i] = -gamma * L2.iloc[i] + L2.iloc[i-1] + gamma * L3.iloc[i-1]
    cu = ((L0 - L1).clip(lower=0) + (L1 - L2).clip(lower=0) + (L2 - L3).clip(lower=0))
    cd = ((-L0 + L1).clip(lower=0) + (-L1 + L2).clip(lower=0) + (-L2 + L3).clip(lower=0))
    denom = cu + cd
    return cu / denom.replace(0, np.nan)

def _heikin_ashi_trend(open_: pd.Series, high: pd.Series,
                        low: pd.Series, close: pd.Series, n: int = 3) -> pd.Series:
    """Heikin Ashi Trend (popularised 2010+).
    Returns +1 (uptrend) / -1 (downtrend) based on n consecutive HA candles."""
    ha_close = (open_ + high + low + close) / 4
    ha_open  = ha_close.copy()
    for i in range(1, len(ha_open)):
        ha_open.iloc[i] = (ha_open.iloc[i-1] + ha_close.iloc[i-1]) / 2
    ha_green = (ha_close > ha_open).astype(int)
    # n consecutive green = +1, n consecutive red = -1
    trend = pd.Series(0, index=close.index)
    for i in range(n - 1, len(close)):
        window = ha_green.iloc[i - n + 1 : i + 1]
        if window.sum() == n:
            trend.iloc[i] = 1
        elif window.sum() == 0:
            trend.iloc[i] = -1
    return trend

def _chande_kroll_stop(high: pd.Series, low: pd.Series, close: pd.Series,
                        atr_n: int = 10, atr_mult: float = 1.5, stop_n: int = 9):
    """Chande Kroll Stop (2021) — stop-and-reverse trend indicator.
    Returns (stop_short, stop_long). Price above stop_long = BUY."""
    atr = _atr(high, low, close, atr_n)
    first_high = high.rolling(atr_n).max() - atr_mult * atr
    first_low  = low.rolling(atr_n).min()  + atr_mult * atr
    stop_short = first_high.rolling(stop_n).max()
    stop_long  = first_low.rolling(stop_n).min()
    return stop_short, stop_long


# ============================================================
# 3. SIGNAL LOGIC — turn each indicator into BUY / SELL / WAIT
# ============================================================

def _signal(reading: float, kind: str, **kw) -> str:
    """
    Tiny utility to convert an indicator reading into BUY/SELL/WAIT.
    Logic is per indicator; defaults are conservative.
    """
    if pd.isna(reading):
        return "WAIT"
    if kind == "rsi":
        if reading < 30: return "BUY"      # oversold
        if reading > 70: return "SELL"     # overbought
        return "WAIT"
    if kind == "stoch":
        if reading < 20: return "BUY"
        if reading > 80: return "SELL"
        return "WAIT"
    if kind == "williams":
        if reading < -80: return "BUY"
        if reading > -20: return "SELL"
        return "WAIT"
    if kind == "cci":
        if reading < -100: return "BUY"
        if reading > 100:  return "SELL"
        return "WAIT"
    if kind == "mfi":
        if reading < 20: return "BUY"
        if reading > 80: return "SELL"
        return "WAIT"
    return "WAIT"


def _signals_for_df(df: pd.DataFrame, indicators: list[str]) -> dict[str, dict]:
    """
    Compute every requested indicator for one DataFrame (one timeframe)
    and return {indicator_name: {value, signal, note}}.
    """
    out: dict[str, dict] = {}
    if df.empty or len(df) < 30:  # not enough history
        for ind in indicators:
            out[ind] = {"value": None, "signal": "WAIT", "note": "Insufficient history"}
        return out

    close, high, low, vol = df["close"], df["high"], df["low"], df["volume"]
    last = -1  # last row index

    # --- Momentum ---
    if "RSI" in indicators:
        v = _rsi(close).iloc[last]
        out["RSI"] = {"value": float(v) if pd.notna(v) else None,
                      "signal": _signal(v, "rsi"),
                      "note": "RSI(14): <30 oversold (BUY), >70 overbought (SELL)"}
    if "Stochastic" in indicators:
        k, d = _stochastic(high, low, close)
        v = k.iloc[last]
        out["Stochastic"] = {"value": float(v) if pd.notna(v) else None,
                             "signal": _signal(v, "stoch"),
                             "note": "Stoch %K: <20 BUY, >80 SELL"}
    if "Stochastic RSI" in indicators:
        v = _stoch_rsi(close).iloc[last]
        out["Stochastic RSI"] = {"value": float(v) if pd.notna(v) else None,
                                 "signal": _signal(v, "stoch"),
                                 "note": "StochRSI: <20 BUY, >80 SELL"}
    if "Williams %R" in indicators:
        v = _williams_r(high, low, close).iloc[last]
        out["Williams %R"] = {"value": float(v) if pd.notna(v) else None,
                              "signal": _signal(v, "williams"),
                              "note": "Williams %R: <-80 BUY, >-20 SELL"}
    if "CCI" in indicators:
        v = _cci(high, low, close).iloc[last]
        out["CCI"] = {"value": float(v) if pd.notna(v) else None,
                      "signal": _signal(v, "cci"),
                      "note": "CCI(20): <-100 BUY, >100 SELL"}
    if "ROC" in indicators:
        v = _roc(close).iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0 else ("SELL" if pd.notna(v) and v < 0 else "WAIT")
        out["ROC"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                      "note": "ROC(12): >0 BUY, <0 SELL"}
    if "Momentum" in indicators:
        v = _momentum(close).iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0 else ("SELL" if pd.notna(v) and v < 0 else "WAIT")
        out["Momentum"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                           "note": "Momentum(10): >0 BUY, <0 SELL"}
    if "TRIX" in indicators:
        v = _trix(close).iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0 else ("SELL" if pd.notna(v) and v < 0 else "WAIT")
        out["TRIX"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                       "note": "TRIX(15): >0 BUY, <0 SELL"}
    if "Ultimate Oscillator" in indicators:
        v = _ultimate_osc(high, low, close).iloc[last]
        sig = "BUY" if pd.notna(v) and v < 30 else ("SELL" if pd.notna(v) and v > 70 else "WAIT")
        out["Ultimate Oscillator"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                      "note": "Ultimate Osc: <30 BUY, >70 SELL"}

    # --- Trend ---
    if "MACD" in indicators:
        m, s, h = _macd(close)
        v = h.iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0 and h.iloc[last - 1] <= 0 else \
              ("SELL" if pd.notna(v) and v < 0 and h.iloc[last - 1] >= 0 else \
              ("BUY" if pd.notna(v) and v > 0 else "SELL" if pd.notna(v) and v < 0 else "WAIT"))
        out["MACD"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                       "note": "MACD histogram: positive = BUY, negative = SELL"}
    if "ADX" in indicators:
        adx, p_di, m_di = _adx(high, low, close)
        v = adx.iloc[last]
        sig = "BUY" if pd.notna(v) and v > 25 and p_di.iloc[last] > m_di.iloc[last] else \
              ("SELL" if pd.notna(v) and v > 25 and m_di.iloc[last] > p_di.iloc[last] else "WAIT")
        out["ADX"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                      "note": "ADX(14): >25 strong trend; +DI > -DI = BUY"}
    if "Aroon" in indicators:
        au, ad = _aroon(high, low)
        v_up, v_dn = au.iloc[last], ad.iloc[last]
        sig = "BUY" if pd.notna(v_up) and v_up > 70 and v_dn < 30 else \
              ("SELL" if pd.notna(v_dn) and v_dn > 70 and v_up < 30 else "WAIT")
        out["Aroon"] = {"value": float(v_up) if pd.notna(v_up) else None, "signal": sig,
                        "note": "Aroon(25): Up>70 & Dn<30 = BUY (and vice versa)"}
    if "Parabolic SAR" in indicators:
        sar = _psar(high, low)
        v = sar.iloc[last]
        sig = "BUY" if pd.notna(v) and close.iloc[last] > v else \
              ("SELL" if pd.notna(v) and close.iloc[last] < v else "WAIT")
        out["Parabolic SAR"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                "note": "PSAR: price above SAR = BUY, below = SELL"}
    if "Supertrend" in indicators:
        st = _supertrend(high, low, close)
        v = st.iloc[last]
        sig = "BUY" if v == 1 else ("SELL" if v == -1 else "WAIT")
        out["Supertrend"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                             "note": "Supertrend(10,3): +1 BUY, -1 SELL"}
    if "Ichimoku" in indicators:
        ten, kij, sa, sb = _ichimoku(high, low, close)
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(sa.iloc[last]) and cl > max(sa.iloc[last], sb.iloc[last]) else \
              ("SELL" if pd.notna(sa.iloc[last]) and cl < min(sa.iloc[last], sb.iloc[last]) else "WAIT")
        out["Ichimoku"] = {"value": float(cl), "signal": sig,
                           "note": "Ichimoku: price above cloud = BUY, below = SELL"}
    if "Elder Ray" in indicators:
        bull, bear = _elder_ray(high, low, close)
        sig = "BUY" if bull.iloc[last] > 0 and bear.iloc[last] < 0 and bear.iloc[last] > bear.iloc[last - 1] else \
              ("SELL" if bull.iloc[last] < 0 and bear.iloc[last] < 0 else "WAIT")
        out["Elder Ray"] = {"value": float(bull.iloc[last]) if pd.notna(bull.iloc[last]) else None, "signal": sig,
                            "note": "Elder Ray: bull power>0 & bear power rising = BUY"}
    if "Elder Impulse" in indicators:
        v = _elder_impulse(close, high, low).iloc[last]
        sig = "BUY" if v == 1 else ("SELL" if v == -1 else "WAIT")
        out["Elder Impulse"] = {"value": float(v), "signal": sig,
                                "note": "Elder Impulse: green BUY, red SELL, blue WAIT"}

    # --- Volatility ---
    if "Bollinger Bands" in indicators:
        u, m, l = _bollinger(close)
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(l.iloc[last]) and cl < l.iloc[last] else \
              ("SELL" if pd.notna(u.iloc[last]) and cl > u.iloc[last] else "WAIT")
        out["Bollinger Bands"] = {"value": float(cl), "signal": sig,
                                  "note": "Bollinger(20,2): below lower band BUY, above upper SELL"}
    if "ATR" in indicators:
        v = _atr(high, low, close).iloc[last]
        # ATR is volatility, not directional — always WAIT but show value
        out["ATR"] = {"value": float(v) if pd.notna(v) else None, "signal": "WAIT",
                      "note": "ATR(14): volatility measure (not directional)"}
    if "Keltner Channels" in indicators:
        u, m, l = _keltner(high, low, close)
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(l.iloc[last]) and cl < l.iloc[last] else \
              ("SELL" if pd.notna(u.iloc[last]) and cl > u.iloc[last] else "WAIT")
        out["Keltner Channels"] = {"value": float(cl), "signal": sig,
                                   "note": "Keltner(20,2): outside band = mean-revert signal"}
    if "Donchian Channels" in indicators:
        u, m, l = _donchian(high, low)
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(u.iloc[last]) and cl >= u.iloc[last] else \
              ("SELL" if pd.notna(l.iloc[last]) and cl <= l.iloc[last] else "WAIT")
        out["Donchian Channels"] = {"value": float(cl), "signal": sig,
                                    "note": "Donchian(20): break upper BUY (breakout), break lower SELL"}

    # --- Volume ---
    if "OBV" in indicators:
        obv = _obv(close, vol)
        v = obv.iloc[last]
        sig = "BUY" if obv.iloc[last] > obv.iloc[last - 5] else \
              ("SELL" if obv.iloc[last] < obv.iloc[last - 5] else "WAIT")
        out["OBV"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                      "note": "OBV: rising = BUY (accumulation), falling = SELL"}
    if "Force Index" in indicators:
        v = _force_index(close, vol).iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0 else ("SELL" if pd.notna(v) and v < 0 else "WAIT")
        out["Force Index"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                              "note": "Force Index(13): >0 BUY, <0 SELL"}
    if "Accumulation/Distribution" in indicators:
        ad = _accum_dist(high, low, close, vol)
        v = ad.iloc[last]
        sig = "BUY" if ad.iloc[last] > ad.iloc[last - 5] else \
              ("SELL" if ad.iloc[last] < ad.iloc[last - 5] else "WAIT")
        out["Accumulation/Distribution"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                            "note": "A/D Line: rising = BUY, falling = SELL"}
    if "Chaikin Money Flow" in indicators:
        v = _cmf(high, low, close, vol).iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0.05 else ("SELL" if pd.notna(v) and v < -0.05 else "WAIT")
        out["Chaikin Money Flow"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                     "note": "CMF(20): >0.05 BUY, <-0.05 SELL"}
    if "MFI" in indicators:
        v = _mfi(high, low, close, vol).iloc[last]
        out["MFI"] = {"value": float(v) if pd.notna(v) else None,
                      "signal": _signal(v, "mfi"),
                      "note": "MFI(14): <20 BUY, >80 SELL"}
    if "VWAP" in indicators:
        v = _vwap(high, low, close, vol).iloc[last]
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(v) and cl > v else ("SELL" if pd.notna(v) and cl < v else "WAIT")
        out["VWAP"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                       "note": "VWAP: price above = BUY, below = SELL"}

    # --- Moving Averages ---
    for ma_name, fn, period in [
        ("SMA(20)", _sma, 20), ("SMA(50)", _sma, 50), ("SMA(200)", _sma, 200),
        ("EMA(20)", _ema, 20), ("EMA(50)", _ema, 50), ("EMA(200)", _ema, 200),
    ]:
        if ma_name in indicators:
            ma = fn(close, period)
            v = ma.iloc[last]
            cl = close.iloc[last]
            sig = "BUY" if pd.notna(v) and cl > v else ("SELL" if pd.notna(v) and cl < v else "WAIT")
            out[ma_name] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                            "note": f"{ma_name}: price above = BUY, below = SELL"}

    # --- Roshan Indicator ---
    if "Roshan Indicator" in indicators:
        rsi, rsi_sma = _roshan(close)
        v_rsi = rsi.iloc[last]
        v_sma = rsi_sma.iloc[last]
        sig = "BUY" if pd.notna(v_rsi) and pd.notna(v_sma) and v_rsi > v_sma else \
              ("SELL" if pd.notna(v_rsi) and pd.notna(v_sma) and v_rsi < v_sma else "WAIT")
        out["Roshan Indicator"] = {"value": float(v_rsi) if pd.notna(v_rsi) else None,
                                   "signal": sig,
                                   "note": "Roshan: RSI(14) > SMA20 of RSI = BUY (custom indicator)"}

    # ── NEW INDICATORS (2010-2026) ──────────────────────────────────────────
    if "TTM Squeeze" in indicators:
        mom, sqz = _ttm_squeeze(high, low, close)
        v = mom.iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0 else ("SELL" if pd.notna(v) and v < 0 else "WAIT")
        out["TTM Squeeze"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                              "note": "TTM Squeeze: momentum > 0 = BUY, < 0 = SHORT. Squeeze firing = explosive move coming."}

    if "Awesome Oscillator" in indicators:
        v = _awesome_oscillator(high, low).iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0 else ("SELL" if pd.notna(v) and v < 0 else "WAIT")
        out["Awesome Oscillator"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                     "note": "Awesome Oscillator: above zero = bullish momentum = BUY"}

    if "Vortex Indicator" in indicators:
        vi_plus, vi_minus = _vortex(high, low, close)
        vp, vm = vi_plus.iloc[last], vi_minus.iloc[last]
        sig = "BUY" if pd.notna(vp) and pd.notna(vm) and vp > vm else \
              ("SELL" if pd.notna(vp) and pd.notna(vm) and vm > vp else "WAIT")
        out["Vortex Indicator"] = {"value": float(vp) if pd.notna(vp) else None, "signal": sig,
                                   "note": "Vortex: VI+ above VI- = uptrend = BUY"}

    if "Chandelier Exit" in indicators:
        long_stop, _ = _chandelier_exit(high, low, close)
        v = long_stop.iloc[last]
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(v) and cl > v else ("SELL" if pd.notna(v) and cl < v else "WAIT")
        out["Chandelier Exit"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                  "note": "Chandelier Exit: price above stop line = BUY, below = exit/SHORT"}

    if "Hull MA" in indicators:
        hma = _hma(close)
        v = hma.iloc[last]
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(v) and cl > v else ("SELL" if pd.notna(v) and cl < v else "WAIT")
        out["Hull MA"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                          "note": "Hull MA: price above HMA = BUY. Faster than EMA, less lag."}

    if "Laguerre RSI" in indicators:
        v = _laguerre_rsi(close).iloc[last]
        sig = "BUY" if pd.notna(v) and v > 0.5 else ("SELL" if pd.notna(v) and v < 0.5 else "WAIT")
        out["Laguerre RSI"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                               "note": "Laguerre RSI: above 0.5 = BUY. Faster than standard RSI, fewer false signals."}

    if "Heikin Ashi Trend" in indicators:
        if "open" in df.columns:
            v = _heikin_ashi_trend(df["open"], high, low, close).iloc[last]
            sig = "BUY" if v == 1 else ("SELL" if v == -1 else "WAIT")
            out["Heikin Ashi Trend"] = {"value": float(v), "signal": sig,
                                        "note": "Heikin Ashi: 3 consecutive green HA candles = BUY. Smoothed, noise-filtered."}

    if "Balance of Power" in indicators:
        if "open" in df.columns:
            v = _balance_of_power(df["open"], high, low, close).iloc[last]
            sig = "BUY" if pd.notna(v) and v > 0 else ("SELL" if pd.notna(v) and v < 0 else "WAIT")
            out["Balance of Power"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                       "note": "Balance of Power: above zero = buyers winning. Below = sellers winning."}

    if "Chande Kroll Stop" in indicators:
        _, stop_long = _chande_kroll_stop(high, low, close)
        v = stop_long.iloc[last]
        cl = close.iloc[last]
        sig = "BUY" if pd.notna(v) and cl > v else ("SELL" if pd.notna(v) and cl < v else "WAIT")
        out["Chande Kroll Stop"] = {"value": float(v) if pd.notna(v) else None, "signal": sig,
                                    "note": "Chande Kroll Stop (2021): price above stop = BUY. Trend-following stop."}

    return out


# ============================================================
# 4. MULTI-TIMEFRAME COMBINER (the 3 calls)
# ============================================================

ALL_INDICATORS = [
    # Momentum
    "RSI", "Stochastic", "Stochastic RSI", "Williams %R", "CCI", "ROC",
    "Momentum", "TRIX", "Ultimate Oscillator", "Roshan Indicator",
    # Trend
    "MACD", "ADX", "Aroon", "Parabolic SAR", "Supertrend",
    "Ichimoku", "Elder Ray", "Elder Impulse",
    # Volatility
    "Bollinger Bands", "ATR", "Keltner Channels", "Donchian Channels",
    # Volume
    "OBV", "Force Index", "Accumulation/Distribution",
    "Chaikin Money Flow", "MFI", "VWAP",
    # Moving Averages
    "SMA(20)", "SMA(50)", "SMA(200)", "EMA(20)", "EMA(50)", "EMA(200)",
    # New Indicators (2010-2026)
    "TTM Squeeze", "Awesome Oscillator", "Vortex Indicator",
    "Chandelier Exit", "Hull MA", "Laguerre RSI",
    "Heikin Ashi Trend", "Balance of Power", "Chande Kroll Stop",
]

ALL_TIMEFRAMES = ["Monthly", "Weekly", "Daily", "4H", "1H"]

CALL_PAIRS = {
    "Long-term": ("Monthly", "Weekly"),
    "Positional": ("Weekly", "Daily"),
    "Intraday":  ("4H", "1H"),
}


def _pair_verdict(sig_a: str, sig_b: str) -> str:
    """Both BUY -> BUY. Both SELL -> SELL. Anything else -> HIDDEN."""
    if sig_a == "BUY" and sig_b == "BUY":
        return "BUY"
    if sig_a == "SELL" and sig_b == "SELL":
        return "SELL"
    return "HIDDEN"


def technical_report(symbol: str, indicators: list[str] | None = None) -> dict:
    """
    THE ONE PUBLIC FUNCTION.
    Returns:
    {
      "symbol": "NSE:RELIANCE",
      "timeframes": {
          "Monthly": {"RSI": {value, signal, note}, "MACD": {...}, ...},
          "Weekly":  {...},
          "Daily":   {...},
          "4H":      {...},
          "1H":      {...},
      },
      "calls": {
          "Long-term":  {indicator: verdict, ...},   # 'BUY' / 'SELL' / 'HIDDEN'
          "Positional": {...},
          "Intraday":   {...},
      }
    }
    """
    indicators = indicators or ALL_INDICATORS
    log.info("technical_report: %s, %d indicators", symbol, len(indicators))

    # 1. Fetch all timeframes
    tf_data: dict[str, dict] = {}
    for tf in ALL_TIMEFRAMES:
        try:
            df = fetch_candles(symbol, tf)
            tf_data[tf] = _signals_for_df(df, indicators)
        except Exception as e:
            log.error("fetch %s %s failed: %s", symbol, tf, e)
            tf_data[tf] = {ind: {"value": None, "signal": "WAIT",
                                 "note": f"data unavailable: {e}"} for ind in indicators}

    # 2. Build the 3 multi-timeframe calls
    calls: dict[str, dict] = {}
    for call_name, (tf_a, tf_b) in CALL_PAIRS.items():
        per_indicator = {}
        for ind in indicators:
            sig_a = tf_data.get(tf_a, {}).get(ind, {}).get("signal", "WAIT")
            sig_b = tf_data.get(tf_b, {}).get(ind, {}).get("signal", "WAIT")
            per_indicator[ind] = _pair_verdict(sig_a, sig_b)
        calls[call_name] = per_indicator

    return {
        "symbol": symbol,
        "generated_at": datetime.now(IST).isoformat(),
        "timeframes": tf_data,
        "calls": calls,
    }
