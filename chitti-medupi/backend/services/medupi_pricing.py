"""
services/medupi_pricing.py
--------------------------
Price helpers — savings %, NPPA-ceiling violation flagging, monthly /
annual cost projection for chronic-care medicines.
"""
from __future__ import annotations

from typing import Iterable


def cheapest_price(med: dict) -> float | None:
    """Lowest available price across Jan Aushadhi → MRP."""
    ja = med.get("jan_aushadhi_price")
    mrp = med.get("mrp")
    if ja is not None:
        return float(ja)
    if mrp is not None:
        return float(mrp)
    return None


def savings_vs_max(price: float | None, max_price: float | None) -> float:
    """Percentage saving of `price` vs `max_price`. Capped at 0%."""
    if not (price and max_price) or max_price <= 0:
        return 0.0
    if price >= max_price:
        return 0.0
    return round((max_price - price) / max_price * 100, 1)


def annotate_savings(alternatives: list[dict]) -> list[dict]:
    """
    Attaches a `savings_pct` field to every alternative, based on the
    most-expensive entry in the list (proxy for the original branded
    medicine). Also flags `above_nppa_ceiling`.
    """
    if not alternatives:
        return alternatives
    max_price = max(((a.get("mrp") or 0) for a in alternatives), default=0)
    for a in alternatives:
        cheapest = cheapest_price(a) or max_price or 0
        a["savings_pct"] = savings_vs_max(cheapest, max_price)
        # NPPA enforcement helper — true if MRP exceeds the listed ceiling
        ceiling = a.get("nppa_ceiling_price")
        mrp = a.get("mrp")
        a["above_nppa_ceiling"] = bool(ceiling and mrp and mrp > ceiling)
    return alternatives


def chronic_projection(monthly_cost: float, years: int = 5) -> dict:
    """
    Plain rupee projection — no compounding, no inflation. Used by the
    Family Wallet's "Chronic Care projection" card.
    """
    monthly = max(0.0, float(monthly_cost or 0))
    return {
        "monthly_cost": round(monthly, 2),
        "annual_cost": round(monthly * 12, 2),
        "years": years,
        "total_cost": round(monthly * 12 * years, 2),
    }


def total_savings(entries: Iterable[dict]) -> float:
    """Sum `savings_realized` across wallet entries."""
    return round(sum((e.get("savings_realized") or 0) for e in entries), 2)
