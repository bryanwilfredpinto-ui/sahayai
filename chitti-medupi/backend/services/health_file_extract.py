"""
services/health_file_extract.py
-------------------------------
DeepSeek-vision driven extraction for the Chitti Health File.

Per the §2 LOCKED decision (DeepSeek is the sole LLM provider), this
module talks to `api.deepseek.com` over the OpenAI-compatible
/chat/completions endpoint with an inline base64 data-URL — the exact
shape chitti-medupi/services/medupi_recognition.py already uses for
medicine-strip recognition.

Doc types we extract today
~~~~~~~~~~~~~~~~~~~~~~~~~~~
v1 ships with FULL extraction for:
  - prescription
  - blood_report

v1 ships HONEST 501 for the other doc types (mri / ct_scan / xray /
ultrasound / ecg / echo / eye / dental / discharge_summary /
insurance_health / insurance_life / vaccination). The user can still
UPLOAD them — they land encrypted in health_documents with
extract_status="coming_soon" and the manually-tagged fields (date,
doctor, hospital) work end-to-end. The LLM extraction lands in a
follow-up turn — see CHITTI_HEALTH_FILE_MASTER_SPEC.md "Phase B"
section.

Why "coming_soon" not "failed"? Per SAHAYAI_MASTER §3 rule 4
(Honest stubs over fake demos) — failed implies the model tried and
couldn't; coming_soon honestly tells the user the feature isn't built
for that doc type yet.

Privacy
~~~~~~~
The IMAGE BYTES go to DeepSeek for vision processing. The decrypted
plaintext leaves the server momentarily during this call. The user's
T&C consent (chitti_vaani.html consent gate §2.5 "AI Helper") covers
this; the extractor never persists the bytes outside the original
encrypted blob.

NO HEALTH DATA IS USED FOR ANY AI TRAINING — DeepSeek's API ToS
disable training on API inputs by default. We do not opt in.
"""
from __future__ import annotations

import base64
import json
import logging
from typing import Optional

import httpx

from config import settings

log = logging.getLogger("health_file_extract")


# ── Doc types with full v1 support ───────────────────────────────
SUPPORTED_DOC_TYPES_V1 = {"prescription", "blood_report"}
ALL_DOC_TYPES = {
    "blood_report", "mri", "ct_scan", "xray", "ultrasound", "ecg", "echo",
    "eye", "dental", "prescription", "discharge_summary",
    "insurance_health", "insurance_life", "vaccination", "other",
}


# ── Per-type extraction prompts ──────────────────────────────────

_PROMPT_PRESCRIPTION = """You are Chitti, a careful medical-record assistant for Indian families.
Look at this Indian doctor's prescription (handwritten or printed).
Extract EVERY medicine line and any follow-up instructions. Return STRICT JSON only — no prose, no markdown.

Shape:
{
  "doc_type": "prescription",
  "doctor_name": "string or null",
  "hospital_name": "string or null",
  "doc_date": "YYYY-MM-DD or null",
  "patient_name": "string or null",
  "medicines": [
    {
      "name": "Brand name as printed (e.g. Glycomet 500)",
      "composition": "molecule + strength when visible (e.g. Metformin 500mg)",
      "dose": "e.g. 1 tablet",
      "frequency": "e.g. morning + evening / 8am and 8pm / SOS",
      "duration": "e.g. 30 days / lifelong / as needed",
      "notes": "any per-medicine note (e.g. after food)"
    }
  ],
  "followup_date": "YYYY-MM-DD or null",
  "followup_notes": "e.g. 'see Dr Mehta in 2 weeks' or null",
  "diet_restrictions": "free-text or null",
  "activity_restrictions": "free-text or null",
  "raw_warnings": "anything in the prescription that looks like a warning / red flag"
}

If the image is NOT a prescription, return {"doc_type": "other", "_reason": "<why>"} and nothing else.
If the image is unreadable, return {"doc_type": "prescription", "_unreadable": true} and nothing else.
Never invent details. Leave fields null if you cannot read them. Strict JSON only.
"""

_PROMPT_BLOOD_REPORT = """You are Chitti, a careful medical-record assistant for Indian families.
Look at this Indian blood-report PDF page or scan (e.g. CBC, lipid profile, HbA1c, LFT, KFT, thyroid).
Extract EVERY lab line. Return STRICT JSON only — no prose, no markdown.

Shape:
{
  "doc_type": "blood_report",
  "doctor_name": "ordering doctor or null",
  "lab_name": "lab/hospital that ran the test or null",
  "doc_date": "YYYY-MM-DD or null",
  "patient_name": "string or null",
  "labs": [
    {
      "name": "Hemoglobin",
      "value": "13.2",
      "unit": "g/dL",
      "normal_low": 12.0,
      "normal_high": 17.0,
      "out_of_range": false,
      "remark": "e.g. 'Normal' or 'Low — investigate' if printed on report"
    }
  ],
  "overall_interpretation": "any 'impression' / 'overall' line printed at the bottom, or null"
}

For each lab:
  - `value` is a STRING (some are non-numeric like "Positive").
  - `normal_low` / `normal_high` are NUMBERS if printed, else null.
  - `out_of_range` is true ONLY when both value and a range are present AND value is outside.

If the image is NOT a blood report, return {"doc_type": "other", "_reason": "<why>"} only.
If unreadable: {"doc_type": "blood_report", "_unreadable": true}.
Never invent. Leave null. Strict JSON.
"""


_PROMPTS = {
    "prescription": _PROMPT_PRESCRIPTION,
    "blood_report": _PROMPT_BLOOD_REPORT,
}


# ── HTTP call ────────────────────────────────────────────────────

def _deepseek_vision_json(prompt: str, image_bytes: bytes, mime: str) -> str:
    """Call DeepSeek vision with a strict-JSON response_format. Returns
    the raw `content` string (always valid JSON when the model behaves)."""
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
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_tokens": 1500,
        "temperature": 0.05,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=90.0) as client:
        r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"] or "{}"


# ── Public extractor ─────────────────────────────────────────────

def extract(doc_type: str, image_bytes: bytes, mime: str) -> dict:
    """
    Extract structured fields from a health document image.

    Returns:
      On success: dict with keys per the shape in the prompt + an internal
        `_extract_status` key set to "done".
      On unsupported doc_type: {"_extract_status": "coming_soon", ...}
      On model error:           {"_extract_status": "failed", "_error": ...}
      On unreadable / wrong:    {"_extract_status": "failed", "_reason": ...}
    """
    doc_type = (doc_type or "other").lower().strip()
    if doc_type not in ALL_DOC_TYPES:
        doc_type = "other"

    prompt = _PROMPTS.get(doc_type)
    if not prompt:
        log.info("extract: %s is not yet supported (returns coming_soon)", doc_type)
        return {
            "_extract_status": "coming_soon",
            "doc_type": doc_type,
            "_note": (
                f"Auto-extraction for '{doc_type}' is honest-COMING-SOON. "
                "The document is stored encrypted and you can still tag it manually. "
                "Phase B will land per-type extractors — see CHITTI_HEALTH_FILE_MASTER_SPEC.md."
            ),
        }

    try:
        raw = _deepseek_vision_json(prompt, image_bytes, mime)
    except httpx.HTTPStatusError as e:
        body_preview = (e.response.text or "")[:300]
        log.error("DeepSeek vision HTTP %s: %s", e.response.status_code, body_preview)
        return {"_extract_status": "failed", "_error": f"deepseek_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek vision request failed: %s", e)
        return {"_extract_status": "failed", "_error": str(e)[:200]}
    except RuntimeError as e:
        return {"_extract_status": "failed", "_error": str(e)}

    try:
        parsed = json.loads(raw)
    except (ValueError, TypeError) as e:
        log.warning("DeepSeek returned non-JSON for %s: %r", doc_type, raw[:200])
        return {"_extract_status": "failed", "_error": "model_returned_non_json"}

    if parsed.get("_unreadable"):
        return {"_extract_status": "failed", "_reason": "unreadable_image", **parsed}
    if parsed.get("doc_type") == "other" and doc_type != "other":
        return {"_extract_status": "failed", "_reason": "wrong_doc_type", **parsed}

    parsed["_extract_status"] = "done"
    return parsed


def facts_from_extracted(doc_type: str, extracted: dict) -> list[dict]:
    """Project the doc-type-specific extracted dict into a flat list of
    HealthFact rows. Returns a list of dicts ready for HealthFact insert.

    This is what makes "Wife ki diabetes ka history dikhao" possible —
    the facts table is the searchable index over all documents."""
    facts: list[dict] = []
    if not isinstance(extracted, dict) or extracted.get("_extract_status") != "done":
        return facts

    doc_date = extracted.get("doc_date")

    if doc_type == "prescription":
        for m in (extracted.get("medicines") or []):
            facts.append({
                "kind":  "medicine",
                "label": (m.get("name") or m.get("composition") or "").strip()[:200] or "(unnamed)",
                "value": (m.get("composition") or "").strip()[:200] or None,
                "unit":  None,
                "fact_date": doc_date,
                "notes": _pack_prescription_notes(m),
            })
        if extracted.get("followup_date"):
            facts.append({
                "kind":  "followup",
                "label": "Doctor follow-up",
                "value": extracted.get("followup_notes") or extracted.get("doctor_name") or "Follow-up",
                "fact_date": extracted["followup_date"],
                "notes": (extracted.get("followup_notes") or "")[:500],
            })
        if extracted.get("diet_restrictions"):
            facts.append({
                "kind":  "restriction",
                "label": "Diet restriction",
                "value": (extracted["diet_restrictions"] or "")[:200],
                "fact_date": doc_date,
            })
        if extracted.get("activity_restrictions"):
            facts.append({
                "kind":  "restriction",
                "label": "Activity restriction",
                "value": (extracted["activity_restrictions"] or "")[:200],
                "fact_date": doc_date,
            })

    elif doc_type == "blood_report":
        for lab in (extracted.get("labs") or []):
            name  = (lab.get("name") or "").strip()
            value = lab.get("value")
            if not name or value in (None, ""):
                continue
            try:
                vnum = float(str(value).split()[0])
            except (ValueError, TypeError):
                vnum = None
            nl = lab.get("normal_low")
            nh = lab.get("normal_high")
            out = bool(lab.get("out_of_range"))
            # Defensive recompute if model didn't decide:
            if vnum is not None and (nl is not None or nh is not None):
                if (nl is not None and vnum < float(nl)) or (nh is not None and vnum > float(nh)):
                    out = True
            facts.append({
                "kind":  "lab_value",
                "label": name[:200],
                "value": str(value)[:200],
                "unit":  (lab.get("unit") or "")[:40] or None,
                "normal_low":  None if nl in (None, "") else float(nl),
                "normal_high": None if nh in (None, "") else float(nh),
                "out_of_range": 1 if out else 0,
                "fact_date": doc_date,
                "notes": (lab.get("remark") or "")[:500] or None,
            })

    return facts


def _pack_prescription_notes(med: dict) -> str:
    pieces = []
    for k in ("dose", "frequency", "duration", "notes"):
        v = (med.get(k) or "").strip()
        if v:
            pieces.append(f"{k}: {v}")
    return " · ".join(pieces)[:500] or None
