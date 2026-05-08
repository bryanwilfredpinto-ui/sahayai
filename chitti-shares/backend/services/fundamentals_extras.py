"""
services/fundamentals_extras.py
-------------------------------
Layered helpers on top of services/screener_client.py.

Public:
  - cagr(symbol)        -> 3Y / 5Y / 10Y CAGR for Sales, Net Profit, Operating
                            Profit (when enough years of data are present).

CAGR formula:  (end / start) ** (1 / years) - 1   (returns a decimal — multiply
by 100 for the percent UI display). Negative or zero start values produce None
(the math is undefined / misleading there).
"""
from __future__ import annotations

import logging

from services import screener_client

log = logging.getLogger("fundamentals_extras")


def _cagr(start: float | None, end: float | None, years: int) -> float | None:
    if start is None or end is None or start <= 0 or end <= 0 or years <= 0:
        return None
    try:
        return round(((end / start) ** (1 / years) - 1) * 100, 2)
    except (ValueError, ZeroDivisionError):
        return None


def _row(table: dict | None, label_match: str) -> list[float | None]:
    if not table:
        return []
    rows = table.get("rows") or []
    needle = label_match.lower()
    for r in rows:
        if needle in (r.get("label") or "").lower():
            return r.get("values") or []
    return []


def cagr(canonical_symbol: str) -> dict:
    """
    Returns 3Y / 5Y / 10Y CAGR for Sales, Net Profit, Operating Profit using
    screener.in's annual P&L table. Years counted from the OLDEST column to
    the NEWEST. Screener orders columns oldest -> newest.
    """
    fin = screener_client.financials(canonical_symbol)
    yearly_pl = ((fin or {}).get("yearly") or {}).get("pl")

    sales      = _row(yearly_pl, "Sales")
    op_profit  = _row(yearly_pl, "Operating Profit")
    net_profit = _row(yearly_pl, "Net Profit")
    headers    = (yearly_pl or {}).get("headers") or []

    def _bucket(values: list[float | None], years: int) -> float | None:
        if len(values) <= years:
            return None
        return _cagr(values[-(years + 1)], values[-1], years)

    return {
        "symbol": canonical_symbol,
        "headers": headers,
        "sales":      {"3y": _bucket(sales,      3), "5y": _bucket(sales,      5), "10y": _bucket(sales,      10)},
        "op_profit":  {"3y": _bucket(op_profit,  3), "5y": _bucket(op_profit,  5), "10y": _bucket(op_profit,  10)},
        "net_profit": {"3y": _bucket(net_profit, 3), "5y": _bucket(net_profit, 5), "10y": _bucket(net_profit, 10)},
    }
