"""
services/symbol_resolver.py
---------------------------
Turn user input ("reliance", "TCS", "Infosys") into our canonical
form ("NSE:RELIANCE", "NSE:TCS", "NSE:INFY").

Approach:
  1. If input already has NSE:/BSE: prefix, accept it.
  2. If it ends in .NS or .BO, strip and convert.
  3. Else assume NSE and uppercase. Validate via Yahoo - if Yahoo
     doesn't know it as .NS, try .BO.

We DO NOT scrape any registry. We just delegate to yfinance which
returns empty data for invalid tickers - good enough for Phase 3.
"""

import logging
import yfinance as yf

log = logging.getLogger("symbol_resolver")


def resolve(user_input: str) -> str | None:
    """
    Returns canonical symbol like "NSE:RELIANCE" or None if not found.
    """
    s = (user_input or "").strip().upper()
    if not s:
        return None

    # Already canonical
    if s.startswith("NSE:") or s.startswith("BSE:"):
        return s

    # Strip Yahoo suffixes if user pasted them
    if s.endswith(".NS"):
        return f"NSE:{s[:-3]}"
    if s.endswith(".BO"):
        return f"BSE:{s[:-3]}"
    if s.startswith("^"):
        # Index lookup
        if s == "^NSEI": return "NSE:NIFTY 50"
        if s == "^BSESN": return "BSE:SENSEX"
        if s == "^NSEBANK": return "NSE:BANKNIFTY"

    # Validate via Yahoo - try NSE first, then BSE
    for exch, suffix in (("NSE", ".NS"), ("BSE", ".BO")):
        ysym = f"{s}{suffix}"
        try:
            t = yf.Ticker(ysym)
            info = t.fast_info
            # If we can read a price, it's a real ticker
            price = (
                info.get("last_price")
                or info.get("lastPrice")
                or info.get("previous_close")
                or info.get("previousClose")
            )
            if price:
                return f"{exch}:{s}"
        except Exception:  # noqa: BLE001
            continue

    return None
