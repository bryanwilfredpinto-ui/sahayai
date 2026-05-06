"""
services/medupi_alternatives.py
-------------------------------
STRICT same-composition matcher — never therapeutic alternatives.

Rule (non-negotiable, repeated 3 times in master spec):
  Show alternatives ONLY when:
    same molecule  AND  same strength  AND  same dosage form
  No therapeutic substitutions. No different molecules. EVER.

NEXT SESSION:
  - Wire to medupi_database.search_by_composition()
  - Plug medupi_risk classifier so HIGH risk meds get a stronger warning
  - Sort: Jan Aushadhi first (cheapest), then ascending by MRP
  - Compute savings_pct for each line item vs the input medicine
"""
from __future__ import annotations

import logging

from services import medupi_database, medupi_risk

log = logging.getLogger("medupi_alternatives")


def find(molecule: str, strength: str, dosage_form: str, current_brand: str = "") -> dict:
    """
    Returns a structured response:
      {
        ok, query, risk_class, risk_warning,
        alternatives: [{brand_name, mrp, jan_aushadhi_price, savings_pct, source}],
        disclaimer
      }
    """
    matches = medupi_database.search_by_composition(molecule, strength, dosage_form)
    risk = medupi_risk.classify(molecule)

    # Sort: Jan Aushadhi (lowest price) first, then by MRP ascending
    def _key(m):
        return (m.get("jan_aushadhi_price") or m.get("mrp") or 99999)
    matches_sorted = sorted(matches, key=_key)

    # Compute savings vs the most expensive in the list (proxy for "current branded")
    if matches_sorted:
        max_price = max((m.get("mrp") or 0) for m in matches_sorted) or 1
        for m in matches_sorted:
            cheapest = m.get("jan_aushadhi_price") or m.get("mrp") or max_price
            m["savings_pct"] = round(max((max_price - cheapest) / max_price * 100, 0), 1)

    return {
        "ok": bool(matches_sorted),
        "query": {"molecule": molecule, "strength": strength, "dosage_form": dosage_form, "current_brand": current_brand},
        "risk_class": risk["class"],
        "risk_warning": risk["warning"],
        "alternatives": matches_sorted,
        "disclaimer": (
            "Same composition, strength, and dosage form. Differences in brand, manufacturer, "
            "or inactive ingredients may exist. Consult your doctor or pharmacist before any change. "
            "Prices indicative — vary by pharmacy + location."
        ),
    }
