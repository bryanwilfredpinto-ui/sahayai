"""
services/medupi_cart.py
-----------------------
Optimised Cart Simulator.

Input: a list of medicines (current pharmacy choice — molecule + strength +
dosage_form + monthly quantity + current_price).
Output: cheapest equivalent cart that satisfies the STRICT same-composition
rule from medupi_alternatives.find() — never therapeutic alternatives.

The hard rule (repeated three times in the master spec, kept here for the
auditor walking through the file):
    Show alternatives ONLY when same molecule AND same strength AND same
    dosage form. NEVER substitute a different molecule.
"""
from __future__ import annotations

import logging
from typing import Iterable

from services import medupi_alternatives

log = logging.getLogger("medupi_cart")


def simulate(items: Iterable[dict]) -> dict:
    """
    items: [{molecule, strength, dosage_form, monthly_qty, current_price,
             current_brand?}]
    Returns:
      {
        ok, lines: [{...input fields, suggested_brand, suggested_unit_price,
                     suggested_source, monthly_savings}],
        totals: {current_total, suggested_total, monthly_savings,
                 annual_savings, savings_pct}
      }
    """
    lines = []
    cur_total = 0.0
    new_total = 0.0

    for raw in items or []:
        molecule    = (raw.get("molecule") or "").strip()
        strength    = (raw.get("strength") or "").strip()
        dosage_form = (raw.get("dosage_form") or "").strip()
        qty         = float(raw.get("monthly_qty") or 0)
        current_price = float(raw.get("current_price") or 0)

        cur_line = round(current_price * qty, 2)
        cur_total += cur_line

        if not (molecule and strength and dosage_form and qty > 0):
            lines.append({
                **raw,
                "current_line_total": cur_line,
                "suggested_brand": None,
                "suggested_unit_price": None,
                "suggested_source": None,
                "suggested_line_total": cur_line,
                "monthly_savings": 0.0,
                "note": "missing molecule/strength/dosage/quantity",
            })
            new_total += cur_line
            continue

        match = medupi_alternatives.find(molecule, strength, dosage_form,
                                         current_brand=raw.get("current_brand", ""))
        alts = match.get("alternatives") or []
        if not alts:
            lines.append({
                **raw,
                "current_line_total": cur_line,
                "suggested_brand": None,
                "suggested_unit_price": None,
                "suggested_source": None,
                "suggested_line_total": cur_line,
                "monthly_savings": 0.0,
                "note": "no same-composition equivalent found",
            })
            new_total += cur_line
            continue

        best = alts[0]
        unit = best.get("jan_aushadhi_price") or best.get("mrp") or current_price
        new_line = round(unit * qty, 2)
        new_total += new_line

        lines.append({
            **raw,
            "current_line_total": cur_line,
            "suggested_brand": best.get("brand_name"),
            "suggested_unit_price": unit,
            "suggested_source": best.get("source"),  # e.g. 'jan_aushadhi'
            "suggested_line_total": new_line,
            "monthly_savings": round(cur_line - new_line, 2),
            "risk_class": match.get("risk_class"),
            "risk_warning": match.get("risk_warning"),
        })

    monthly = round(cur_total - new_total, 2)
    annual  = round(monthly * 12, 2)
    pct     = round((monthly / cur_total * 100), 1) if cur_total > 0 else 0.0

    return {
        "ok": True,
        "lines": lines,
        "totals": {
            "current_total": round(cur_total, 2),
            "suggested_total": round(new_total, 2),
            "monthly_savings": monthly,
            "annual_savings": annual,
            "savings_pct": pct,
        },
        "disclaimer": (
            "Same-composition equivalents only. Differences in brand, manufacturer, "
            "or inactive ingredients may exist. Consult your doctor or pharmacist "
            "before any change. Prices indicative — vary by pharmacy + location."
        ),
    }
