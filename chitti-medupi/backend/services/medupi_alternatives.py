"""
services/medupi_alternatives.py
-------------------------------
STRICT same-composition matcher.

Rule (non-negotiable, repeated 3 times in master spec §5 / §12 / §14):
  Show alternatives ONLY when:
    same molecule  AND  same strength  AND  same dosage form
  No therapeutic substitutions. No different molecules. EVER.

Output is voice-ready: every response carries `speak_en`, `speak_hi`,
`caption_en`, `caption_hi` so the frontend can pipe the result straight
to SpeechSynthesis + the on-screen caption.
"""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from models.medicine import Medicine
from services import medupi_database, medupi_pricing, medupi_price_freshness, medupi_risk

log = logging.getLogger("medupi_alternatives")


def _attach_freshness(db: Session, alts: list[dict]) -> None:
    """For each alt, look up the matching Medicine row's updated_at +
    price_source and stamp the appropriate freshness badges on it."""
    if not alts:
        return
    ids = [a["id"] for a in alts if a.get("id") is not None]
    if not ids:
        for a in alts:
            medupi_price_freshness.annotate(a)
        return
    rows = db.query(Medicine.id, Medicine.updated_at, Medicine.price_source).filter(Medicine.id.in_(ids)).all()
    by_id = {r[0]: (r[1], r[2]) for r in rows}
    for a in alts:
        ts, src = by_id.get(a.get("id"), (None, None))
        medupi_price_freshness.annotate(a, updated_at=ts, price_source=src)


def _disclaimer_en() -> str:
    return (
        "Same composition, strength, and dosage form. Differences in brand, manufacturer, "
        "or inactive ingredients may exist. Consult your doctor or pharmacist before any "
        "change. Prices indicative — vary by pharmacy and location."
    )


def _disclaimer_hi() -> str:
    return (
        "समान संरचना, ताकत और खुराक रूप। ब्रांड, निर्माता या निष्क्रिय अवयवों में अंतर हो सकते हैं। "
        "किसी भी बदलाव से पहले डॉक्टर या केमिस्ट से सलाह लें। मूल्य संकेतक हैं।"
    )


def _build_speak_en(query: dict, alts: list[dict], risk: dict) -> str:
    if not alts:
        return (
            f"No same-composition equivalents found for {query.get('molecule') or 'this medicine'}. "
            "Try a different spelling, or consult your pharmacist."
        )
    cheapest = alts[0]
    high = max(((a.get('mrp') or 0) for a in alts), default=0)
    cheap = cheapest.get('jan_aushadhi_price') or cheapest.get('mrp') or 0
    saved = round(((high - cheap) / high * 100), 0) if high else 0
    risk_phrase = ""
    if risk["class"] == "H":
        risk_phrase = (
            " WARNING: this is a high-risk category medicine. "
            "Always consult your doctor before switching."
        )
    return (
        f"Found {len(alts)} same-composition options. "
        f"The cheapest is {cheapest['brand_name']} at rupees {int(cheap)}. "
        f"You can save up to {int(saved)} percent compared to the priciest brand."
        f"{risk_phrase}"
    )


def _build_speak_hi(query: dict, alts: list[dict], risk: dict) -> str:
    if not alts:
        return f"{query.get('molecule') or 'इस दवा'} के लिए कोई समान संरचना का विकल्प नहीं मिला। केमिस्ट से सलाह लें।"
    cheapest = alts[0]
    high = max(((a.get('mrp') or 0) for a in alts), default=0)
    cheap = cheapest.get('jan_aushadhi_price') or cheapest.get('mrp') or 0
    saved = round(((high - cheap) / high * 100), 0) if high else 0
    risk_phrase = ""
    if risk["class"] == "H":
        risk_phrase = " चेतावनी: यह उच्च जोखिम श्रेणी की दवा है। बदलने से पहले डॉक्टर से अवश्य सलाह लें।"
    return (
        f"समान संरचना के {len(alts)} विकल्प मिले। "
        f"सबसे सस्ता {cheapest['brand_name']} है, {int(cheap)} रुपये में। "
        f"सबसे महँगे ब्रांड की तुलना में {int(saved)} प्रतिशत तक बचत हो सकती है।{risk_phrase}"
    )


def find(
    db: Session,
    molecule: str,
    strength: str,
    dosage_form: str,
    current_brand: str = "",
) -> dict:
    """
    Look up same-composition equivalents (strict). Returns:
      {
        ok, query, risk: {class, symbol, label_*, warning_*},
        alternatives: [{brand_name, mrp, jan_aushadhi_price, savings_pct, ...}],
        cheapest: {...} | None,
        max_savings_pct: float,
        disclaimer_en, disclaimer_hi,
        speak_en, speak_hi, caption_en, caption_hi
      }
    """
    matches = medupi_database.search_by_composition(db, molecule, strength, dosage_form)
    matches = medupi_pricing.annotate_savings(matches)
    _attach_freshness(db, matches)

    risk = medupi_risk.classify(molecule)
    cheapest = matches[0] if matches else None
    max_saving = max((a.get("savings_pct") or 0) for a in matches) if matches else 0.0

    query = {
        "molecule": molecule,
        "strength": strength,
        "dosage_form": dosage_form,
        "current_brand": current_brand,
    }
    speak_en = _build_speak_en(query, matches, risk)
    speak_hi = _build_speak_hi(query, matches, risk)

    return {
        "ok": bool(matches),
        "query": query,
        "risk": risk,
        "alternatives": matches,
        "cheapest": cheapest,
        "max_savings_pct": round(max_saving, 1),
        "disclaimer_en": _disclaimer_en(),
        "disclaimer_hi": _disclaimer_hi(),
        "speak_en": speak_en,
        "speak_hi": speak_hi,
        "caption_en": (
            f"{len(matches)} same-composition options · max savings {int(max_saving)}%"
            if matches else "No same-composition options found."
        ),
        "caption_hi": (
            f"{len(matches)} समान-संरचना विकल्प · अधिकतम बचत {int(max_saving)}%"
            if matches else "कोई समान-संरचना विकल्प नहीं मिला।"
        ),
    }
