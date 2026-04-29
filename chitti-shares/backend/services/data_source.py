"""
services/data_source.py
-----------------------
Abstraction over the underlying market-data provider.

Phase 3 onwards we use Yahoo Finance (free, no daily token expiry,
no ₹2000/month).
Kite Connect remains as a provision: any Kite call goes through this
module, so swapping back to Kite later is a one-line config change.

Why bother with the abstraction now?
  - Lets the rest of the app (indices, fundamentals, history) stay
    source-agnostic.
  - Keeps Phase 2's Kite OAuth code working - we just don't route
    market calls through it for now.
  - Phase 4's technical indicators need OHLC; phase 3's scorecard
    needs fundamentals; both use this module.

Active source is decided by the env var DATA_SOURCE, default "yahoo".
Set DATA_SOURCE=kite to flip back later (after re-confirming Kite OAuth).
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from config import settings

log = logging.getLogger("data_source")

IST = ZoneInfo("Asia/Kolkata")


# --------- Public exceptions ---------

class DataSourceError(Exception):
    """Generic upstream failure."""


class DataSourceAuthError(DataSourceError):
    """Source needs re-auth (relevant only to Kite)."""


# --------- Symbol normalisation ---------

# Yahoo uses .NS / .BO suffixes; Kite uses NSE: / BSE: prefixes.
# Internal canonical form: ("NSE", "RELIANCE") or ("BSE", "SENSEX").
def parse_symbol(canonical: str) -> tuple[str, str]:
    """
    Accepts 'NSE:RELIANCE', 'BSE:SENSEX', 'NSE:NIFTY 50' etc.
    Returns (exchange, ticker).
    """
    if ":" not in canonical:
        return "NSE", canonical.strip()
    exch, sym = canonical.split(":", 1)
    return exch.strip().upper(), sym.strip()


def to_yahoo(canonical: str) -> str:
    """
    Convert canonical symbol to Yahoo Finance ticker.
        NSE:RELIANCE -> RELIANCE.NS
        BSE:SENSEX   -> ^BSESN          (special case)
        NSE:NIFTY 50 -> ^NSEI           (special case)
    """
    exch, sym = parse_symbol(canonical)
    sym_upper = sym.upper().replace(" ", "")
    # Index special cases (Yahoo uses ^ prefixes)
    if sym_upper in {"NIFTY50", "NIFTY"}:
        return "^NSEI"
    if sym_upper == "SENSEX":
        return "^BSESN"
    if sym_upper == "BANKNIFTY":
        return "^NSEBANK"
    # Stocks
    if exch == "BSE":
        return f"{sym_upper}.BO"
    return f"{sym_upper}.NS"


# --------- Market hours (NSE/BSE) ---------

def now_ist() -> datetime:
    return datetime.now(IST)


def is_market_open(when: datetime | None = None) -> bool:
    """Mon-Fri 09:15-15:30 IST. Holidays not handled here."""
    n = (when or now_ist()).astimezone(IST)
    if n.weekday() >= 5:
        return False
    return time(9, 15) <= n.time() <= time(15, 30)


# --------- Active source dispatch ---------

def _active() -> str:
    return (settings.DATA_SOURCE or "yahoo").lower()


def get_quote(canonical_symbols: list[str], db: Session | None = None) -> dict:
    """
    Returns {canonical_symbol: {last_price, prev_close, day_high, day_low,
                                 day_open, volume, currency}}.
    """
    src = _active()
    if src == "yahoo":
        from services import yahoo_client
        return yahoo_client.quote(canonical_symbols)
    if src == "kite":
        if db is None:
            raise DataSourceError("Kite source requires a DB session")
        from services import kite_client
        try:
            kite_syms = canonical_symbols  # Kite already uses NSE:/BSE:
            raw = kite_client.quote(db, kite_syms)
        except kite_client.KiteAuthRequired as e:
            raise DataSourceAuthError(str(e))
        return _normalise_kite_quote(raw)
    raise DataSourceError(f"Unknown DATA_SOURCE: {src}")


def get_history(canonical_symbol: str, days: int = 90,
                interval: str = "day", db: Session | None = None) -> list[dict]:
    """
    Returns list of {date, open, high, low, close, volume} for the last N days.
    interval: 'day' | 'week' | 'month' (yfinance + kite both support these
    directly or via aggregation).
    """
    src = _active()
    if src == "yahoo":
        from services import yahoo_client
        return yahoo_client.history(canonical_symbol, days=days, interval=interval)
    if src == "kite":
        if db is None:
            raise DataSourceError("Kite source requires a DB session")
        from services import kite_client
        # Kite needs an instrument_token, not a symbol. Caller (Phase 2 routes)
        # already passes tokens; for stocks we'd need a symbol-token map.
        raise DataSourceError(
            "Kite history by symbol not implemented in this build - "
            "use yahoo for stock history or switch DATA_SOURCE=yahoo"
        )
    raise DataSourceError(f"Unknown DATA_SOURCE: {src}")


def _normalise_kite_quote(raw: dict) -> dict:
    """Map Kite's /quote response to our common schema."""
    out = {}
    for sym, q in raw.items():
        ohlc = q.get("ohlc") or {}
        out[sym] = {
            "last_price": q.get("last_price"),
            "prev_close": ohlc.get("close"),
            "day_open":   ohlc.get("open"),
            "day_high":   ohlc.get("high"),
            "day_low":    ohlc.get("low"),
            "volume":     q.get("volume"),
            "currency":   "INR",
        }
    return out
