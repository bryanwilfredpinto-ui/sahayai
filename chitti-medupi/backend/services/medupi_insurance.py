"""
services/medupi_insurance.py
----------------------------
Lookup whether a given medicine is covered by Ayushman Bharat / CGHS / ESI
based on its therapeutic class + the seed coverage tables. Coverage data
comes from data/insurance_coverage_seed.json — replace with the official
empanelled list when the public API is available.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy.orm import Session

from services import medupi_database

log = logging.getLogger("medupi_insurance")

SEED_PATH = Path(__file__).resolve().parent.parent / "data" / "insurance_coverage_seed.json"
_CACHE: dict | None = None


def _load() -> dict:
    global _CACHE
    if _CACHE is not None:
        return _CACHE
    if not SEED_PATH.exists():
        log.warning("insurance_coverage_seed.json missing — empty coverage")
        _CACHE = {"schemes": {}, "covered_therapeutic_classes": {}}
    else:
        with SEED_PATH.open("r", encoding="utf-8") as f:
            _CACHE = json.load(f)
    return _CACHE


def schemes() -> list[dict]:
    """Return a list of all schemes for the Insurance tab cards."""
    data = _load()
    out = []
    for slug, info in (data.get("schemes") or {}).items():
        out.append({
            "slug": slug,
            "name_en": info.get("name_en"),
            "name_hi": info.get("name_hi"),
            "coverage_en": info.get("coverage_en"),
            "coverage_hi": info.get("coverage_hi"),
        })
    return out


def coverage_for(db: Session, molecule: str, scheme: str = "ayushman") -> dict:
    """
    Returns:
      {
        scheme, molecule, therapeutic_class,
        covered (bool), reason_en, reason_hi,
        speak_en, speak_hi
      }
    """
    data = _load()
    scheme = (scheme or "ayushman").strip().lower()
    s = (data.get("schemes") or {}).get(scheme)
    if not s:
        return {
            "ok": False,
            "scheme": scheme,
            "covered": False,
            "reason_en": f"Unknown scheme '{scheme}'.",
            "reason_hi": f"अज्ञात योजना '{scheme}'।",
        }

    # Find any matching medicine row to extract therapeutic class
    matches = medupi_database.search_by_composition(db, molecule)
    if not matches:
        # Fall back to brand-name search
        matches = medupi_database.search_by_brand(db, molecule, limit=1)
    therapeutic_class = matches[0].get("therapeutic_class") if matches else None

    covered_classes = (data.get("covered_therapeutic_classes") or {}).get(scheme) or []
    covered = bool(therapeutic_class and therapeutic_class in covered_classes)

    if covered:
        reason_en = (
            f"{molecule} ({therapeutic_class}) is typically covered by {s['name_en']}. "
            "Confirm at the empanelled hospital / pharmacy."
        )
        reason_hi = (
            f"{molecule} ({therapeutic_class}) आमतौर पर {s['name_hi']} में कवर है। "
            "सूचीबद्ध अस्पताल / दुकान पर पुष्टि करें।"
        )
    elif therapeutic_class:
        reason_en = (
            f"{molecule} ({therapeutic_class}) is NOT in our seeded {s['name_en']} list. "
            "Verify with the scheme helpline."
        )
        reason_hi = (
            f"{molecule} ({therapeutic_class}) हमारी {s['name_hi']} सूची में नहीं है। "
            "योजना हेल्पलाइन से पुष्टि करें।"
        )
    else:
        reason_en = (
            f"{molecule} not found in our drug DB yet — coverage unknown. "
            "Verify with the scheme helpline."
        )
        reason_hi = (
            f"{molecule} हमारे डेटाबेस में नहीं — कवरेज अज्ञात। "
            "योजना हेल्पलाइन से पुष्टि करें।"
        )

    return {
        "ok": True,
        "scheme": scheme,
        "scheme_name_en": s.get("name_en"),
        "scheme_name_hi": s.get("name_hi"),
        "molecule": molecule,
        "therapeutic_class": therapeutic_class,
        "covered": covered,
        "reason_en": reason_en,
        "reason_hi": reason_hi,
        "speak_en": reason_en,
        "speak_hi": reason_hi,
    }
