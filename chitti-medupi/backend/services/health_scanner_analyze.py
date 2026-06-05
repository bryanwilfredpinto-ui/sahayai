"""
services/health_scanner_analyze.py
----------------------------------
World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.

NON-DIAGNOSTIC visual-health analysis for Chitti Health Scanner.

Per the LOCKED constitution (chitti-health-scanner/constitution/ROLE.md +
guardrails/GUARDRAILS.md): Chitti **NEVER diagnoses**. It describes only
*visible* features (colour, texture, size, border, redness, swelling,
discharge), gives a confidence level and an urgency recommendation
(monitor / consider consult / seek care), and ALWAYS escalates concerning
patterns to a professional. "Chitti helps you notice — doctors help you heal."

Two layers of safety:
  1. A strict NON-DIAGNOSTIC system prompt (the model is told never to name a
     disease or give a diagnosis).
  2. A deterministic server-side SAFETY ENVELOPE that does NOT trust the model:
     - if the model's English observation contains any disease name / diagnostic
       certainty, the raw text is SUPPRESSED and replaced with a neutral
       "please have this looked at by a professional" message + urgency is forced
       up (red-flag terms → seek_care);
     - confidence is clamped (never 100% — Chitti is never certain);
     - urgency is constrained to the allowed set;
     - the medical disclaimer is ALWAYS appended server-side regardless of model
       output, and the darker-skin-tone limitation is appended for skin/mole.

Honest failure: if no LLM key is configured, or the provider errors, we return
status="unavailable" with a "please consult a doctor" message — we NEVER
fabricate a result. (SAHAYAI_MASTER §3 rule 4 — honest stubs over fake demos.)

LLM provider is DeepSeek (§2 lock); reuses the exact vision client shape from
services/health_file_extract.py.

Cost: one vision call per scan (~₹0.05–0.10). The frontend shows a cost-disclosure
gate before the first scan; the USER bears this cost (documented in-app + handover).
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

import httpx

from config import settings
from services.health_file_extract import _deepseek_vision_json  # reuse the vision client

log = logging.getLogger("health_scanner_analyze")

DISCLAIMER = "This is not a medical diagnosis. Chitti helps you notice — doctors help you heal."
SKIN_TONE_NOTE = ("AI is known to be less accurate on darker skin tones "
                  "(Fitzpatrick IV–VI). Please rely on a professional for anything concerning.")

URGENCIES = {"normal", "monitor", "seek_care"}

# Scan types and the VISIBLE features Chitti is allowed to describe for each.
# (Description only — never a disease name.)
_FOCUS = {
    "skin":          "colour, redness, dryness/flaking, raised vs flat, border regularity, size, any spreading or oozing",
    "eye":           "redness of the white/eyelid, swelling, watering/discharge, any yellowish tint of the white, a visible lump on the lid",
    "tooth":         "visible dark spots or holes on a tooth, chips/cracks, discolouration, gum redness or swelling, visible bleeding",
    "wound":         "size, colour of the wound bed, redness spreading around it, swelling, any pus/discharge, whether edges look closed or open",
    "hair":          "thinning areas, flaking/dandruff, redness or patches on the scalp",
    "nail":          "colour change, thickening, ridges, separation from the nail bed, surrounding redness",
    "swelling":      "size, symmetry vs the other side, redness, shininess of the skin over it",
    "mole":          "colour (one vs many), border regularity, symmetry, approximate size, any visible change",
    "post_surgery":  "redness around the incision, swelling, any discharge, whether the line looks closed",
    "burn":          "size, colour (red/white/charred), blistering, any spreading redness",
    "child_journal": "rash colour and spread, raised vs flat, location, any swelling",
    "diabetic_foot": "cracks, sores/ulcers, colour change, redness, swelling, any discharge",
    "change_detection": "differences a person could see between two photos — size, colour, spread",
}

_LANG_NAME = {
    "en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
    "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam", "pa": "Punjabi",
}

# Red-flag VISIBLE signals that should bias toward seek_care (NOT diagnoses —
# they are reasons to see a professional promptly).
# Disease names / diagnostic-certainty terms that must NEVER reach the user.
_FORBIDDEN = re.compile(
    r"\b(cancer|melanoma|carcinoma|tumou?r|malignant|benign|diagnos\w*|"
    r"eczema|psoriasis|dermatitis|cellulitis|abscess|fungal|tinea|candidiasis|"
    r"diabetes|diabetic\s+retinopathy|conjunctivitis|stye|chalazion|glaucoma|cataract|jaundice|"
    r"caries|cavity\s+confirmed|gingivitis|periodontitis|abscessed|"
    r"infection|infected|sepsis|gangrene|ulcerated|"
    r"you\s+have\b|this\s+is\s+(a\s+|an\s+)?\w+\s+(disease|condition|infection))\b",
    re.IGNORECASE,
)
# Subset whose presence means "escalate to seek_care".
_REDFLAG = re.compile(
    r"\b(cancer|melanoma|carcinoma|tumou?r|malignant|sepsis|gangrene|spreading|pus|abscess|severe)\b",
    re.IGNORECASE,
)


def _prompt(scan_type: str, lang: str) -> str:
    focus = _FOCUS.get(scan_type, _FOCUS["skin"])
    lang_name = _LANG_NAME.get(lang, "English")
    return (
        "You are Chitti, a careful VISUAL HEALTH ASSISTANT for Indian families. "
        "You are NOT a doctor. You DESCRIBE only what is VISIBLE in the photo; you NEVER "
        "name a disease, NEVER give a diagnosis, NEVER express certainty, NEVER prescribe.\n\n"
        f"Look at this photo of a {scan_type.replace('_', ' ')}. Describe ONLY these visible features: {focus}.\n"
        "Then recommend an urgency: 'normal' (looks ordinary), 'monitor' (watch and re-check), "
        "or 'seek_care' (see a doctor) — based ONLY on visible severity signals "
        "(e.g. spreading redness, irregular borders, significant swelling, open/oozing areas, rapid change).\n"
        "When in doubt, recommend a higher urgency. Acknowledge uncertainty honestly.\n\n"
        "Return STRICT JSON only — no prose, no markdown:\n"
        "{\n"
        f'  "scan_type": "{scan_type}",\n'
        '  "observation_en": "1-3 plain sentences describing ONLY visible features, in English. No disease names.",\n'
        f'  "observation": "the SAME description, written in {lang_name}. No disease names.",\n'
        '  "confidence": <integer 0-95, your confidence in the DESCRIPTION (not a diagnosis)>,\n'
        '  "urgency": "normal" | "monitor" | "seek_care",\n'
        '  "reasons_en": ["short visible-feature reason for the urgency"],\n'
        '  "unclear": <true if the image is too blurry/dark to describe>\n'
        "}\n\n"
        "If you cannot clearly see the area, set \"unclear\": true. "
        "NEVER output a disease name, a diagnosis, or the words 'you have'. STRICT JSON only."
    )


def _action_for(urgency: str) -> str:
    return {
        "normal": "Looks ordinary. Keep an eye on it and re-check if it changes.",
        "monitor": "Worth watching — take another photo in a few days and compare. See a doctor if it gets worse.",
        "seek_care": "Please have this looked at by a doctor soon.",
    }.get(urgency, "Consider a consult if you are worried.")


def analyze(scan_type: str, image_bytes: bytes, mime: str, lang: str = "en") -> dict:
    """
    Returns a SAFE, non-diagnostic result dict:
      {
        status: "ok" | "unclear" | "unavailable",
        scan_type, observation, confidence, urgency, action, reasons,
        disclaimer, skin_tone_note (skin/mole only), is_not_diagnosis: true
      }
    On no-key / provider error → status="unavailable" (never a fabricated result).
    """
    scan_type = (scan_type or "skin").lower().strip()
    if scan_type not in _FOCUS:
        scan_type = "skin"
    lang = (lang or "en").lower().strip()

    base = {
        "scan_type": scan_type,
        "is_not_diagnosis": True,
        "disclaimer": DISCLAIMER,
    }
    if scan_type in ("skin", "mole"):
        base["skin_tone_note"] = SKIN_TONE_NOTE

    if not settings.DEEPSEEK_API_KEY:
        return dict(base, status="unavailable",
                    message=("AI analysis is not available right now (the analysis service is not "
                             "configured). Your photo is saved to your health memory — please show "
                             "it to a doctor if you are worried."))

    try:
        raw = _deepseek_vision_json(_prompt(scan_type, lang), image_bytes, mime)
        parsed = json.loads(raw)
    except (httpx.HTTPError, ValueError, KeyError, RuntimeError, TypeError) as e:
        log.warning("health-scanner analyze failed: %s", str(e)[:200])
        return dict(base, status="unavailable",
                    message=("AI analysis is temporarily unavailable. Your photo is saved — please "
                             "consult a doctor if you are worried."))

    if parsed.get("unclear"):
        return dict(base, status="unclear",
                    message=("Chitti could not see this clearly. Please retake in good light, holding "
                             "steady — or show it to a doctor."),
                    urgency="monitor", action=_action_for("monitor"), confidence=0)

    # ── SAFETY ENVELOPE (do not trust the model) ─────────────────────────────
    obs_en = str(parsed.get("observation_en") or "").strip()
    obs_loc = str(parsed.get("observation") or obs_en).strip()
    urgency = str(parsed.get("urgency") or "monitor").lower().strip()
    if urgency not in URGENCIES:
        urgency = "monitor"

    forbidden_hit = bool(_FORBIDDEN.search(obs_en) or _FORBIDDEN.search(obs_loc))
    if forbidden_hit:
        # The model slipped toward a diagnosis — SUPPRESS the raw text entirely.
        log.info("safety: forbidden term suppressed for scan_type=%s", scan_type)
        if _REDFLAG.search(obs_en) or _REDFLAG.search(obs_loc):
            urgency = "seek_care"
        elif urgency == "normal":
            urgency = "monitor"
        obs_en = obs_loc = ("Chitti noticed some features in this area that a doctor should look at. "
                            "Chitti does not name conditions — please have it checked.")

    try:
        conf = int(parsed.get("confidence"))
    except (TypeError, ValueError):
        conf = 60
    conf = max(0, min(95, conf))  # never 100% — Chitti is never certain

    reasons = parsed.get("reasons_en") or []
    if not isinstance(reasons, list):
        reasons = [str(reasons)]
    reasons = [str(r)[:140] for r in reasons[:4]]

    return dict(
        base,
        status="ok",
        observation=obs_loc,
        observation_en=obs_en,
        confidence=conf,
        urgency=urgency,
        action=_action_for(urgency),
        reasons=reasons,
    )
