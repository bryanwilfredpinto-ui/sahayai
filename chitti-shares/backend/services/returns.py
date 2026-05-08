"""
services/returns.py
-------------------
Two Priority-3 compute layers on Fundamentals:

  - performance_vs_nifty(symbol)
        1M / 6M / 1Y / 3Y / 5Y / 10Y point-to-point returns for the symbol
        AND for NIFTY 50 over the SAME windows, plus alpha (stock - index).

  - returns_lumpsum(symbol, amount_inr, years)
        What ₹amount invested N years ago is worth today, vs NIFTY 50,
        vs a 7% Bank FD.

  - returns_sip(symbol, monthly_inr, years)
        SIP = invest ₹monthly on the first trading day of each month for
        N years. Final value vs NIFTY 50 vs FD with the same SIP cadence.

Data source: services.technical.fetch_candles(sym, "Daily") — Angel SmartAPI.
Angel caps ONE_DAY at 2000 days (~5.5 years). 10y windows therefore fall back
to the longest available history with `note="partial"` so the UI can show a
caveat instead of a wrong number.

FD assumption: 7% p.a. compounded annually for lumpsum; for SIP, the same
monthly cadence with monthly compounding at 7%/12.
"""
from __future__ import annotations

import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import pandas as pd

from services import angel_client

log = logging.getLogger("returns")
IST = ZoneInfo("Asia/Kolkata")

NIFTY_SYMBOL = "NSE:NIFTY 50"
FD_RATE = 0.07  # 7% p.a. — current Indian PSU bank FD reference

# Angel ONE_DAY caps at 2000 days (~5.5 years). 10y windows therefore fall
# back to the longest available history with `partial=True`. We bypass
# services.technical.fetch_candles here because it pins days_back=365,
# which would silently flatten every 1Y+ window to "1 year ago".
_DAYS_BACK = 2000


def _daily(symbol: str) -> pd.DataFrame:
    try:
        return angel_client.get_candles(symbol, interval="ONE_DAY", days_back=_DAYS_BACK)
    except Exception as e:  # noqa: BLE001
        log.warning("returns: %s daily fetch failed: %s", symbol, e)
        return pd.DataFrame()

WINDOWS_DAYS = {
    "1M":  21,
    "6M":  126,
    "1Y":  252,
    "3Y":  252 * 3,
    "5Y":  252 * 5,
    "10Y": 252 * 10,
}


def _close_at_offset(df: pd.DataFrame, days_back: int) -> tuple[float | None, bool]:
    """
    Return (close_price, is_partial). is_partial=True when the requested
    window is longer than available history; we use the oldest available
    candle as the anchor and flag it.
    """
    if df is None or df.empty:
        return None, False
    if len(df) > days_back:
        return float(df["close"].iloc[-days_back - 1]), False
    return float(df["close"].iloc[0]), True


def _pct(start: float | None, end: float | None) -> float | None:
    if start is None or end is None or start <= 0:
        return None
    return round((end / start - 1) * 100, 2)


def performance_vs_nifty(symbol: str) -> dict:
    """
    Returns:
      {
        symbol, name, generated_at,
        windows: {
          "1M":  {symbol_pct, nifty_pct, alpha_pct, partial},
          "6M":  ...,
          ...
        }
      }
    """
    df_s = _daily(symbol)
    df_n = _daily(NIFTY_SYMBOL)

    end_s = float(df_s["close"].iloc[-1]) if (df_s is not None and not df_s.empty) else None
    end_n = float(df_n["close"].iloc[-1]) if (df_n is not None and not df_n.empty) else None

    out: dict = {}
    for label, days in WINDOWS_DAYS.items():
        s_start, s_partial = _close_at_offset(df_s, days)
        n_start, n_partial = _close_at_offset(df_n, days)
        s_pct = _pct(s_start, end_s)
        n_pct = _pct(n_start, end_n)
        alpha = round(s_pct - n_pct, 2) if (s_pct is not None and n_pct is not None) else None
        out[label] = {
            "symbol_pct": s_pct,
            "nifty_pct":  n_pct,
            "alpha_pct":  alpha,
            "partial":    bool(s_partial or n_partial),
        }

    return {
        "symbol": symbol,
        "generated_at": datetime.now(IST).isoformat(),
        "windows": out,
    }


def _fd_lumpsum(amount: float, years: float) -> float:
    return round(amount * ((1 + FD_RATE) ** years), 2)


def _fd_sip(monthly: float, months: int) -> float:
    """SIP FV with monthly compounding at FD_RATE/12."""
    r = FD_RATE / 12
    if r == 0:
        return round(monthly * months, 2)
    return round(monthly * (((1 + r) ** months - 1) / r) * (1 + r), 2)


def returns_lumpsum(symbol: str, amount_inr: float, years: float) -> dict:
    days = int(years * 252)
    df_s = _daily(symbol)
    df_n = _daily(NIFTY_SYMBOL)

    s_start, s_partial = _close_at_offset(df_s, days)
    n_start, n_partial = _close_at_offset(df_n, days)
    s_end = float(df_s["close"].iloc[-1]) if (df_s is not None and not df_s.empty) else None
    n_end = float(df_n["close"].iloc[-1]) if (df_n is not None and not df_n.empty) else None

    def _final(start: float | None, end: float | None) -> float | None:
        if start is None or end is None or start <= 0:
            return None
        return round(amount_inr * (end / start), 2)

    return {
        "mode": "lumpsum",
        "symbol": symbol,
        "amount_inr": amount_inr,
        "years": years,
        "stock_final_inr":  _final(s_start, s_end),
        "nifty_final_inr":  _final(n_start, n_end),
        "fd_final_inr":     _fd_lumpsum(amount_inr, years),
        "stock_pct":        _pct(s_start, s_end),
        "nifty_pct":        _pct(n_start, n_end),
        "fd_pct":           round((((1 + FD_RATE) ** years) - 1) * 100, 2),
        "partial":          bool(s_partial or n_partial),
        "generated_at":     datetime.now(IST).isoformat(),
    }


def returns_sip(symbol: str, monthly_inr: float, years: float) -> dict:
    """
    SIP simulation: buy fractional shares on the first available trading
    day of each month with `monthly_inr` for `years` years. Compare against
    the same monthly cadence into NIFTY 50 and a 7% FD.
    """
    months = int(round(years * 12))
    df_s = _daily(symbol)
    df_n = _daily(NIFTY_SYMBOL)

    def _sip_value(df: pd.DataFrame) -> tuple[float | None, bool]:
        if df is None or df.empty:
            return None, False
        # Resample to month-end (closing price of last trading day in month)
        m = df["close"].resample("ME").last().dropna()
        if m.empty: return None, False
        partial = len(m) < months
        m_used = m.tail(months) if not partial else m
        # Each month, buy fractional shares at that month's close.
        # Final shares = sum(monthly_inr / px). Final value = shares * latest px.
        units = (monthly_inr / m_used).sum()
        latest = float(df["close"].iloc[-1])
        return round(float(units) * latest, 2), partial

    s_final, s_partial = _sip_value(df_s)
    n_final, n_partial = _sip_value(df_n)

    invested = monthly_inr * months
    return {
        "mode": "sip",
        "symbol": symbol,
        "monthly_inr": monthly_inr,
        "years": years,
        "months": months,
        "invested_inr":      round(invested, 2),
        "stock_final_inr":   s_final,
        "nifty_final_inr":   n_final,
        "fd_final_inr":      _fd_sip(monthly_inr, months),
        "stock_pct":         round((s_final / invested - 1) * 100, 2) if s_final and invested else None,
        "nifty_pct":         round((n_final / invested - 1) * 100, 2) if n_final and invested else None,
        "fd_pct":            round((_fd_sip(monthly_inr, months) / invested - 1) * 100, 2) if invested else None,
        "partial":           bool(s_partial or n_partial),
        "generated_at":      datetime.now(IST).isoformat(),
    }
