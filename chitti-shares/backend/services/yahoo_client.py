"""
services/yahoo_client.py
------------------------
Wrapper around yfinance for the data we need:
  - quote(symbols)        : LTP + prev close + OHLC for one or many
  - history(symbol, days) : daily/weekly/monthly candles
  - fundamentals(symbol)  : ROE, ROCE, growth, D/E, PE, PB, etc.
  - quarterly(symbol)     : last 4-8 quarters of revenue, profit, debt

Why yfinance?
  - Free, no key, no rate limit token expiry
  - Hits Yahoo's public quote/chart APIs same as the website
  - Reliable for Indian stocks (.NS / .BO suffixes) and indices
    (^NSEI = Nifty 50, ^BSESN = Sensex)

What yfinance does NOT give us:
  - Real-time tick data (15 min delay during market hours)
  - Some Indian-specific ratios (ROCE in particular - we derive it)
  - Detailed quarterly breakdown (we get the financials() dataframe
    which has revenue/expenses/net income; we extract what we can)

Caching is handled at the route layer (services/cache.py), not here.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from functools import lru_cache

import yfinance as yf

from services.data_source import DataSourceError, to_yahoo
from services.usage_tracker import tracked

log = logging.getLogger("yahoo_client")


# ------------------------------------------------------------
# Quote
# ------------------------------------------------------------

@tracked(provider="yahoo", operation="quote")
def quote(canonical_symbols: list[str]) -> dict:
    """
    Returns {canonical: {last_price, prev_close, day_open, day_high,
                         day_low, volume, currency}}.
    Uses yfinance Tickers (one HTTP call for many symbols).
    """
    if not canonical_symbols:
        return {}
    yahoo_to_canonical = {to_yahoo(s): s for s in canonical_symbols}
    ystr = " ".join(yahoo_to_canonical.keys())

    try:
        tickers = yf.Tickers(ystr)
    except Exception as e:  # noqa: BLE001
        raise DataSourceError(f"Yahoo Tickers init failed: {e}")

    out: dict = {}
    for ysym, canonical in yahoo_to_canonical.items():
        try:
            t = tickers.tickers.get(ysym) or yf.Ticker(ysym)
            info = t.fast_info  # cheap dict-ish object
            last = _safe_float(info, "last_price") or _safe_float(info, "lastPrice")
            prev = _safe_float(info, "previous_close") or _safe_float(info, "previousClose")
            day_open = _safe_float(info, "open") or _safe_float(info, "regularMarketOpen")
            day_high = _safe_float(info, "day_high") or _safe_float(info, "dayHigh")
            day_low = _safe_float(info, "day_low") or _safe_float(info, "dayLow")
            volume = _safe_float(info, "last_volume") or _safe_float(info, "regularMarketVolume")
            currency = _safe_str(info, "currency") or "INR"

            # If fast_info missed something, fall back to recent history
            if last is None or prev is None:
                hist = t.history(period="5d", interval="1d", auto_adjust=False)
                if not hist.empty:
                    if last is None:
                        last = float(hist["Close"].iloc[-1])
                    if prev is None and len(hist) >= 2:
                        prev = float(hist["Close"].iloc[-2])
                    if day_open is None:
                        day_open = float(hist["Open"].iloc[-1])
                    if day_high is None:
                        day_high = float(hist["High"].iloc[-1])
                    if day_low is None:
                        day_low = float(hist["Low"].iloc[-1])

            out[canonical] = {
                "last_price": last,
                "prev_close": prev,
                "day_open":   day_open,
                "day_high":   day_high,
                "day_low":    day_low,
                "volume":     volume,
                "currency":   currency,
            }
        except Exception as e:  # noqa: BLE001
            log.warning("quote(%s): %s", canonical, e)
            out[canonical] = {
                "last_price": None, "prev_close": None,
                "day_open": None, "day_high": None, "day_low": None,
                "volume": None, "currency": "INR",
            }
    return out


# ------------------------------------------------------------
# History (daily/weekly/monthly)
# ------------------------------------------------------------

_INTERVAL_MAP = {
    "day": ("1d", lambda d: f"{max(d, 7)}d"),
    "week": ("1wk", lambda d: f"{max(d, 30)}d"),
    "month": ("1mo", lambda d: f"{max(d, 365)}d"),
    "60m": ("60m", lambda d: f"{min(max(d, 5), 60)}d"),  # yfinance limits 60m to 730d
    "30m": ("30m", lambda d: f"{min(max(d, 5), 60)}d"),
}


@tracked(provider="yahoo", operation="history")
def history(canonical_symbol: str, days: int = 90, interval: str = "day") -> list[dict]:
    """
    Returns [{date, open, high, low, close, volume}] (oldest first).
    """
    yi, period_fn = _INTERVAL_MAP.get(interval, _INTERVAL_MAP["day"])
    period = period_fn(days)
    ysym = to_yahoo(canonical_symbol)
    try:
        df = yf.Ticker(ysym).history(period=period, interval=yi, auto_adjust=False)
    except Exception as e:  # noqa: BLE001
        raise DataSourceError(f"Yahoo history failed for {canonical_symbol}: {e}")

    if df is None or df.empty:
        return []

    out = []
    for ts, row in df.iterrows():
        out.append({
            "date": ts.to_pydatetime().date().isoformat() if hasattr(ts, "to_pydatetime") else str(ts),
            "open":   _f(row.get("Open")),
            "high":   _f(row.get("High")),
            "low":    _f(row.get("Low")),
            "close":  _f(row.get("Close")),
            "volume": _f(row.get("Volume")) or 0,
        })
    return out


# ------------------------------------------------------------
# Fundamentals
# ------------------------------------------------------------

@tracked(provider="yahoo", operation="fundamentals")
def fundamentals(canonical_symbol: str) -> dict:
    """
    Returns the fundamental scorecard inputs:
      pe, pb, dividend_yield, market_cap, eps,
      roe, roce, debt_to_equity,
      revenue_growth, profit_growth, sales_growth (latest YoY)

    Some metrics (ROCE) Yahoo does not give directly; we approximate
    from operating income + total assets - current liabilities.
    """
    ysym = to_yahoo(canonical_symbol)
    try:
        t = yf.Ticker(ysym)
        info = t.info or {}
    except Exception as e:  # noqa: BLE001
        raise DataSourceError(f"Yahoo fundamentals failed for {canonical_symbol}: {e}")

    out = {
        "name": info.get("shortName") or info.get("longName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "currency": info.get("currency", "INR"),
        "market_cap": _f(info.get("marketCap")),
        "pe": _f(info.get("trailingPE")),
        "forward_pe": _f(info.get("forwardPE")),
        "pb": _f(info.get("priceToBook")),
        "eps": _f(info.get("trailingEps")),
        "dividend_yield": _safe_pct(info.get("dividendYield")),
        "roe": _safe_pct(info.get("returnOnEquity")),
        "roa": _safe_pct(info.get("returnOnAssets")),
        "debt_to_equity": _f(info.get("debtToEquity")),
        "revenue_growth": _safe_pct(info.get("revenueGrowth")),
        "earnings_growth": _safe_pct(info.get("earningsGrowth")),
        "profit_margin": _safe_pct(info.get("profitMargins")),
        "operating_margin": _safe_pct(info.get("operatingMargins")),
        "current_ratio": _f(info.get("currentRatio")),
        "quick_ratio": _f(info.get("quickRatio")),
        "book_value": _f(info.get("bookValue")),
        "price": _f(info.get("currentPrice")) or _f(info.get("regularMarketPrice")),
        "fifty_two_week_high": _f(info.get("fiftyTwoWeekHigh")),
        "fifty_two_week_low": _f(info.get("fiftyTwoWeekLow")),
    }

    # Approximate ROCE: EBIT / (Total Assets - Current Liabilities)
    try:
        bs = t.balance_sheet
        fin = t.financials
        if bs is not None and not bs.empty and fin is not None and not fin.empty:
            latest_bs = bs.columns[0]
            latest_fin = fin.columns[0]
            total_assets = _row(bs, "Total Assets", latest_bs)
            curr_liab = _row(bs, "Current Liabilities", latest_bs) or _row(
                bs, "Total Current Liabilities", latest_bs
            )
            ebit = _row(fin, "EBIT", latest_fin) or _row(fin, "Operating Income", latest_fin)
            if total_assets and curr_liab is not None and ebit:
                capital_employed = total_assets - curr_liab
                if capital_employed:
                    out["roce"] = round(ebit / capital_employed * 100, 2)
    except Exception as e:  # noqa: BLE001
        log.debug("ROCE approx failed for %s: %s", canonical_symbol, e)

    return out


# ------------------------------------------------------------
# Quarterly results
# ------------------------------------------------------------

@tracked(provider="yahoo", operation="quarterly")
def quarterly(canonical_symbol: str, num_quarters: int = 8) -> list[dict]:
    """
    Returns [{quarter, revenue, net_income, operating_income,
              free_cash_flow, total_debt}], newest first.
    """
    ysym = to_yahoo(canonical_symbol)
    try:
        t = yf.Ticker(ysym)
        qf = t.quarterly_financials   # rows = line items, cols = quarter dates
        qcf = t.quarterly_cashflow
        qbs = t.quarterly_balance_sheet
    except Exception as e:  # noqa: BLE001
        raise DataSourceError(f"Yahoo quarterly failed for {canonical_symbol}: {e}")

    if qf is None or qf.empty:
        return []

    out = []
    cols = list(qf.columns)[:num_quarters]
    for col in cols:
        revenue = _row(qf, "Total Revenue", col)
        net_income = _row(qf, "Net Income", col)
        op_income = _row(qf, "Operating Income", col) or _row(qf, "EBIT", col)
        fcf = _row(qcf, "Free Cash Flow", col) if qcf is not None else None
        op_cash = _row(qcf, "Operating Cash Flow", col) if qcf is not None else None
        total_debt = _row(qbs, "Total Debt", col) if qbs is not None else None
        if total_debt is None and qbs is not None:
            ld = _row(qbs, "Long Term Debt", col) or 0
            sd = _row(qbs, "Short Term Debt", col) or _row(qbs, "Current Debt", col) or 0
            total_debt = (ld or 0) + (sd or 0)

        out.append({
            "quarter": col.strftime("%b %Y") if hasattr(col, "strftime") else str(col),
            "quarter_iso": col.date().isoformat() if hasattr(col, "date") else str(col),
            "revenue": _f(revenue),
            "net_income": _f(net_income),
            "operating_income": _f(op_income),
            "free_cash_flow": _f(fcf),
            "operating_cash_flow": _f(op_cash),
            "total_debt": _f(total_debt),
        })
    return out


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

def _f(v) -> float | None:
    if v is None:
        return None
    try:
        x = float(v)
        # NaN check without numpy import
        if x != x:
            return None
        return x
    except (TypeError, ValueError):
        return None


def _safe_pct(v) -> float | None:
    """Yahoo returns ratios (0.18 = 18%). Convert to percentage points."""
    f = _f(v)
    return None if f is None else round(f * 100, 2)


def _safe_float(obj, key: str) -> float | None:
    try:
        return _f(obj[key])
    except Exception:
        return None


def _safe_str(obj, key: str) -> str | None:
    try:
        v = obj[key]
        return str(v) if v else None
    except Exception:
        return None


def _row(df, name: str, col):
    """Get df.loc[name, col] safely. Yahoo's row labels vary across companies."""
    if df is None or df.empty:
        return None
    try:
        # Exact match first
        if name in df.index:
            v = df.loc[name, col]
            return _f(v)
        # Fuzzy: case-insensitive contains
        target = name.lower().replace(" ", "")
        for idx in df.index:
            key = str(idx).lower().replace(" ", "")
            if key == target or target in key:
                v = df.loc[idx, col]
                return _f(v)
    except Exception:
        return None
    return None
