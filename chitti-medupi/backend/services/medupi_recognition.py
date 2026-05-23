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
       DeepSeek vision (OpenAI-compatible, model = deepseek-vl-7b-chat or
       env-override) which returns strict JSON:
         {brand_name, salt_composition, strength, dosage_form, pack_size,
          expiry_date, confidence}
       Then we look the result up in the master DB and return the same
       structured response shape as the text path.

Why DeepSeek vision?
  - LOCKED §2 decision (project_ai_provider_switch_to_deepseek): DeepSeek
    is the sole LLM provider across every Chitti backend. Anthropic was
    removed in this commit.
  - OpenAI-compatible client → same httpx + image_url data-URL pattern
    that chitti-scanner already uses for analyze_image.
  - No OS-binary install pain on Render free tier (no Tesseract).
  - Handles strip / bottle / blister / handwritten prescription uniformly.
  - Returns strict JSON via response_format=json_object.
  - Honest fallback when DEEPSEEK_API_KEY is unset → text-only mode.
"""
from __future__ import annotations

import base64
import json
import logging
import re

import httpx
from sqlalchemy.orm import Session

from config import settings
from services import medupi_alternatives, medupi_database, medupi_jan_aushadhi, medupi_risk

log = logging.getLogger("medupi_recognition")


# ───── Text path ─────

def recognise_text(
    db: Session,
    query: str,
    lang: str = "en",
    *,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 5.0,
) -> dict:
    """
    Fuzzy-matches the typed/spoken name against the brand DB. Returns the
    top match + same-composition alternatives + risk + voice-ready text +
    (optional) the nearest Jan Aushadhi store when lat/lng provided.
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

    out = {
        "ok": True,
        "query": q,
        "primary": primary,
        "matches": candidates,
        **alts,  # spreads risk + alternatives + speak_en + speak_hi + disclaimers
        "purpose_en": primary.get("purpose_en"),
        "purpose_hi": primary.get("purpose_hi"),
    }
    out["nearest_jan_aushadhi"] = _nearest_kendra(db, lat, lng, radius_km)
    out["savings_summary"] = _savings_summary(primary, alts)
    return out


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


def _raw_vision_call(image_bytes: bytes, mime: str, safe_prompt: str) -> str:
    """Pure provider call — no quadrails wrapping here. Returns the raw
    model text (the JSON-fenced string the prompt asks for).

    Uses DeepSeek's OpenAI-compatible vision endpoint with an inline
    data-URL image. Same shape as chitti-scanner/services/scanner_service.py
    `analyze_image`. Anthropic was removed per the LOCKED §2 decision —
    DeepSeek is the sole LLM provider.
    """
    if not settings.DEEPSEEK_API_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY not set on server")

    b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime or 'image/jpeg'};base64,{b64}"

    body = {
        "model": settings.DEEPSEEK_VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": safe_prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_tokens": 600,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=60.0) as client:
        r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"] or ""


# Synthetic user_text used by the quadrails so safety/relevance/truth see
# something meaningful. Image content itself does not flow through the
# text rails (they only see this string + the model's JSON output).
_VISION_USER_TEXT = "Identify this Indian medicine from the uploaded image."


def _vision_extract(image_bytes: bytes, mime: str) -> dict:
    """
    Send the image to the vision model and parse the JSON. Returns a dict
    with the fields above + a `_raw` key with the model output for
    debugging. Returns {"_error": ...} on any failure.

    JSON output — quadrails wrap with `compliance_inject=False` so the
    Compliance rail still RECORDS the inject decision in the audit log,
    but does not corrupt the JSON envelope by appending the disclaimer
    string. The caller (`recognise_image`) is responsible for surfacing
    the MedUPI disclaimer outside the JSON (via `speak_*` fields).
    """
    if not settings.DEEPSEEK_API_KEY:
        return {"_error": "DEEPSEEK_API_KEY not set on server"}

    try:
        # Pull the per-app HookRegistry. Outside a Flask request (CLI /
        # tests / FastAPI shares-side caller) current_app raises — we
        # degrade to the un-wrapped call so the prior behavior is
        # preserved.
        try:
            from flask import current_app
            hooks = current_app.config.get("CHITTI_HOOKS")
        except Exception:  # noqa: BLE001
            hooks = None

        def _call(safe_prompt: str) -> str:
            return _raw_vision_call(image_bytes, mime, safe_prompt or _VISION_PROMPT)

        if hooks is not None:
            wrapped = hooks.wrap_llm(
                # We pass the prompt as the rail-gated text since that's
                # what actually flows to the model alongside the image.
                # The synthetic user_text is what safety/relevance see.
                lambda _gated: _call(_VISION_PROMPT),
                user_text=_VISION_USER_TEXT,
                ctx={},
                compliance_inject=False,
            )
            if wrapped.get("blocked"):
                return {"_error": f"blocked:{wrapped.get('rail')}:{wrapped.get('reason')}",
                        "_blocked_message": wrapped.get("reply", "")}
            text = wrapped.get("reply") or ""
        else:
            text = _call(_VISION_PROMPT)

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


def recognise_image(
    db: Session,
    image_bytes: bytes,
    mime: str = "image/jpeg",
    *,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 5.0,
) -> dict:
    """
    Run the image through DeepSeek vision, then look the result up in the
    master DB and return the same structured response shape as the text
    path. When lat/lng are supplied, the response also carries the
    nearest Jan Aushadhi Kendra (Haversine within radius_km).
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
            "nearest_jan_aushadhi": _nearest_kendra(db, lat, lng, radius_km),
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
    out = {
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
    out["nearest_jan_aushadhi"] = _nearest_kendra(db, lat, lng, radius_km)
    out["savings_summary"] = _savings_summary(primary, alts)
    return out


# ───── Helpers for nearest Jan Aushadhi + savings summary ─────

def _nearest_kendra(db: Session, lat: float | None, lng: float | None, radius_km: float) -> dict | None:
    """Return the single closest Jan Aushadhi store within radius_km.
    None when no lat/lng OR no store in radius (honest empty)."""
    if lat is None or lng is None:
        return None
    try:
        # First try the user's chosen radius, then expand to 25 km so a
        # Tier-2/3 user with sparse coverage still gets a nearest option
        # (matches the Vaani local-business 5 → 25 km auto-expansion).
        for r_km in (radius_km, 25.0):
            stores = medupi_jan_aushadhi.find_nearby(db, lat, lng, r_km, limit=1)
            if stores:
                top = stores[0]
                top["expanded_to_km"] = r_km if r_km != radius_km else None
                return top
    except Exception:  # noqa: BLE001
        log.exception("nearest kendra lookup failed")
    return None


def _savings_summary(primary: dict, alts: dict) -> dict:
    """
    Compute a coarse savings summary from the alternatives payload.
    Honest empty when no alternatives are listed.
    """
    items = alts.get("alternatives") or []
    branded_prices = [a.get("mrp") for a in items if a.get("mrp") and a.get("type") != "jan_aushadhi"]
    ja_prices = [a.get("mrp") for a in items if a.get("mrp") and a.get("type") == "jan_aushadhi"]
    primary_price = primary.get("mrp") or (max(branded_prices) if branded_prices else None)
    cheapest = (min(ja_prices) if ja_prices else (min(branded_prices) if branded_prices else None))
    if primary_price and cheapest and primary_price > 0:
        saved_pct = round(100.0 * (primary_price - cheapest) / primary_price)
        if saved_pct < 0:
            saved_pct = 0
        return {
            "primary_price_inr": primary_price,
            "cheapest_inr": cheapest,
            "savings_percent": saved_pct,
            "speak_en": f"Save about {saved_pct} percent with same-composition alternative.",
            "speak_hi": f"Same composition wala alternative se taqreeban {saved_pct} percent bachat ho sakti hai.",
        }
    # Honest stub — when MRP/cheapest is unavailable we don't synthesize a number.
    # Per SAHAYAI_MASTER §3 #4 (honest stubs over fake demos), we surface
    # `savings_status="price_data_updating"` so the frontend can render
    # "Price data updating — savings unknown" instead of a blank "0%" or "null".
    status = "price_data_updating" if not primary_price else "no_alternatives_found"
    return {
        "primary_price_inr": primary_price,
        "cheapest_inr": cheapest,
        "savings_percent": None,
        "savings_status": status,
        "speak_en": (
            "Price data updating — savings unknown for now."
            if status == "price_data_updating"
            else "No same-composition alternative found yet."
        ),
        "speak_hi": (
            "Price data abhi update ho raha hai — bachat ka anumaan baad mein."
            if status == "price_data_updating"
            else "Same-composition alternative abhi nahi mila."
        ),
    }
