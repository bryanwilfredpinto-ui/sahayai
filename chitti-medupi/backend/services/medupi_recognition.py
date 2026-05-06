"""
services/medupi_recognition.py
------------------------------
Recognition pipeline.

Two paths into the matcher:
  1. Text path  — `recognise_text(name)`
       Used by the search bar + voice input. Fuzzy-matches the spoken /
       typed name against the brand DB and returns the canonical row +
       same-composition alternatives.
  2. Image path — `recognise_image(image_bytes, mime)`
       Used by the camera + image-upload buttons. Sends the image to
       Anthropic Claude (vision-capable) which returns strict JSON:
         {brand_name, salt_composition, strength, dosage_form, pack_size,
          expiry_date, confidence}
       Then we look the result up in the master DB and return the same
       structured response shape as the text path.

Why Anthropic vision instead of Tesseract?
  - No OS-binary install pain on Render free tier
  - Handles strip / bottle / blister / handwritten prescription uniformly
  - Returns strict JSON, no post-OCR LLM extraction step needed
  - Falls back gracefully when ANTHROPIC_API_KEY is unset (text-only mode)
"""
from __future__ import annotations

import base64
import json
import logging
import re

from sqlalchemy.orm import Session

from config import settings
from services import medupi_alternatives, medupi_database, medupi_risk

log = logging.getLogger("medupi_recognition")


# ───── Text path ─────

def recognise_text(db: Session, query: str, lang: str = "en") -> dict:
    """
    Fuzzy-matches the typed/spoken name against the brand DB. Returns the
    top match + same-composition alternatives + risk + voice-ready text.
    """
    q = (query or "").strip()
    if not q:
        return {
            "ok": False,
            "query": q,
            "message": "Please type a medicine name.",
            "speak_en": "Please type a medicine name.",
            "speak_hi": "कृपया दवा का नाम लिखें।",
        }

    candidates = medupi_database.search_by_brand(db, q, limit=5)
    if not candidates:
        return {
            "ok": False,
            "query": q,
            "matches": [],
            "message": (
                f"No medicine found matching '{q}'. Try a more common spelling, "
                "or scan the strip with the camera."
            ),
            "speak_en": f"No medicine found matching {q}. Try a different spelling.",
            "speak_hi": f"{q} से मेल खाती कोई दवा नहीं मिली। अलग वर्तनी आज़माएँ।",
        }

    primary = candidates[0]
    alts = medupi_alternatives.find(
        db,
        molecule=primary["salt_composition"],
        strength=primary["strength"],
        dosage_form=primary["dosage_form"],
        current_brand=primary["brand_name"],
    )

    return {
        "ok": True,
        "query": q,
        "primary": primary,
        "matches": candidates,
        **alts,  # spreads risk + alternatives + speak_en + speak_hi + disclaimers
        "purpose_en": primary.get("purpose_en"),
        "purpose_hi": primary.get("purpose_hi"),
    }


# ───── Image path ─────

_VISION_PROMPT = (
    "You are extracting medicine details from a photograph of an Indian medicine "
    "strip, bottle, label, or prescription. Return ONLY a JSON object with the "
    "fields below — no prose, no markdown fences. If a field is unreadable, set "
    "it to null. Do NOT hallucinate values.\n\n"
    "{\n"
    '  "brand_name": "string|null",\n'
    '  "salt_composition": "string|null  (lower-case salt, joined with + for combinations)",\n'
    '  "strength": "string|null  (e.g. 650mg, 100mcg, 500+125mg)",\n'
    '  "dosage_form": "Tablet|Capsule|Syrup|Injection|Inhaler|Cream|Drops|Sachet|null",\n'
    '  "pack_size": "string|null",\n'
    '  "manufacturer": "string|null",\n'
    '  "expiry_date": "string|null  (MM/YYYY if visible)",\n'
    '  "confidence": "high|medium|low"\n'
    "}"
)


def _strip_json_fences(s: str) -> str:
    """Some models wrap JSON in ```json fences. Strip them."""
    s = s.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    return s.strip()


def _vision_extract(image_bytes: bytes, mime: str) -> dict:
    """
    Send the image to Anthropic Claude and parse the JSON. Returns a dict
    with the fields above + a `_raw` key with the model output for
    debugging. Returns {"_error": ...} on any failure.
    """
    if not settings.ANTHROPIC_API_KEY:
        return {"_error": "ANTHROPIC_API_KEY not set on server"}
    try:
        from anthropic import Anthropic
    except ImportError:
        return {"_error": "anthropic SDK not installed"}

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        b64 = base64.standard_b64encode(image_bytes).decode("ascii")
        msg = client.messages.create(
            model=settings.ANTHROPIC_MODEL or "claude-sonnet-4-6",
            max_tokens=600,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime or "image/jpeg",
                                "data": b64,
                            },
                        },
                        {"type": "text", "text": _VISION_PROMPT},
                    ],
                }
            ],
        )
        text = "".join(
            part.text for part in msg.content if getattr(part, "type", None) == "text"
        )
        cleaned = _strip_json_fences(text)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            return {"_error": "model did not return valid JSON", "_raw": text}
        data["_raw"] = text
        return data
    except Exception as e:  # noqa: BLE001
        log.exception("vision extraction failed")
        return {"_error": str(e)}


def recognise_image(db: Session, image_bytes: bytes, mime: str = "image/jpeg") -> dict:
    """
    Run the image through Anthropic vision, then look the result up in the
    master DB and return the same structured response shape as the text
    path.
    """
    if not image_bytes:
        return {
            "ok": False,
            "message": "No image received.",
            "speak_en": "No image received.",
            "speak_hi": "कोई इमेज नहीं मिली।",
        }

    extracted = _vision_extract(image_bytes, mime)
    if "_error" in extracted:
        return {
            "ok": False,
            "stub": True,
            "extracted": None,
            "message": (
                "Image recognition unavailable on this server "
                f"({extracted['_error']}). Please type the medicine name instead."
            ),
            "speak_en": (
                "Image recognition is not configured on this server. "
                "Please type the medicine name instead."
            ),
            "speak_hi": "इस सर्वर पर इमेज पहचान उपलब्ध नहीं है। कृपया दवा का नाम लिखें।",
        }

    brand = (extracted.get("brand_name") or "").strip()
    salt = (extracted.get("salt_composition") or "").strip()
    strength = (extracted.get("strength") or "").strip()
    form = (extracted.get("dosage_form") or "").strip()
    confidence = extracted.get("confidence") or "medium"

    # Try a brand lookup first (more accurate when brand is clearly visible)
    candidates: list[dict] = []
    if brand:
        candidates = medupi_database.search_by_brand(db, brand, limit=3)
    if not candidates and salt:
        candidates = medupi_database.search_by_composition(db, salt, strength, form)

    if not candidates:
        # No DB match — still return the vision extraction so the user can act
        risk = medupi_risk.classify(salt or brand or "")
        return {
            "ok": False,
            "stub": False,
            "extracted": {
                "brand_name": brand or None,
                "salt_composition": salt or None,
                "strength": strength or None,
                "dosage_form": form or None,
                "pack_size": extracted.get("pack_size"),
                "manufacturer": extracted.get("manufacturer"),
                "expiry_date": extracted.get("expiry_date"),
                "confidence": confidence,
            },
            "matches": [],
            "risk": risk,
            "message": (
                f"Recognised '{brand or salt or 'this medicine'}' but it isn't in our seeded "
                "drug DB yet. We'll add it on the next refresh."
            ),
            "speak_en": (
                f"Recognised {brand or salt or 'this medicine'} but no equivalents "
                "are in the database yet."
            ),
            "speak_hi": (
                f"{brand or salt or 'यह दवा'} पहचानी गई पर डेटाबेस में अभी इसके विकल्प नहीं हैं।"
            ),
        }

    primary = candidates[0]
    alts = medupi_alternatives.find(
        db,
        molecule=primary["salt_composition"],
        strength=primary["strength"],
        dosage_form=primary["dosage_form"],
        current_brand=primary["brand_name"],
    )
    return {
        "ok": True,
        "extracted": {
            "brand_name": brand or primary["brand_name"],
            "salt_composition": salt or primary["salt_composition"],
            "strength": strength or primary["strength"],
            "dosage_form": form or primary["dosage_form"],
            "pack_size": extracted.get("pack_size") or primary.get("pack_size"),
            "manufacturer": extracted.get("manufacturer") or primary.get("manufacturer"),
            "expiry_date": extracted.get("expiry_date"),
            "confidence": confidence,
        },
        "primary": primary,
        "matches": candidates,
        **alts,
        "purpose_en": primary.get("purpose_en"),
        "purpose_hi": primary.get("purpose_hi"),
    }
