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
#
# Phase B-1 (2026-05-24) — extractors landed for:
#   discharge_summary · insurance_health · insurance_life · mri · ct_scan ·
#   xray · ultrasound · ecg · echo · vaccination · eye · dental
#
# Only "other" stays an honest stub — we don't know what to extract from
# "other" by definition.
SUPPORTED_DOC_TYPES_V1 = {
    "prescription", "blood_report", "discharge_summary",
    "insurance_health", "insurance_life",
    "mri", "ct_scan", "xray", "ultrasound", "ecg", "echo",
    "vaccination", "eye", "dental",
}
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


_PROMPT_DISCHARGE_SUMMARY = """You are Chitti, a careful medical-record assistant for Indian families.
Look at this Indian hospital discharge summary. Extract every actionable field — discharge medicines, follow-up dates, restrictions, and final diagnoses.
Return STRICT JSON only — no prose, no markdown.

Shape:
{
  "doc_type": "discharge_summary",
  "patient_name": "string or null",
  "hospital_name": "string or null",
  "treating_doctor": "string or null",
  "admission_date": "YYYY-MM-DD or null",
  "discharge_date": "YYYY-MM-DD or null",
  "final_diagnoses": ["string"],
  "procedures_done": ["string"],
  "discharge_medicines": [
    {
      "name": "Brand name",
      "composition": "molecule + strength when visible",
      "dose": "e.g. 1 tablet",
      "frequency": "e.g. morning + evening / SOS",
      "duration": "e.g. 30 days / lifelong"
    }
  ],
  "followup_date": "YYYY-MM-DD or null",
  "followup_notes": "string or null",
  "diet_restrictions": "string or null",
  "activity_restrictions": "string or null",
  "red_flags": "any warning signs the family should watch for (chest pain, fever > 39, etc.)"
}

If the image is NOT a discharge summary, return {"doc_type": "other", "_reason": "<why>"}.
If unreadable: {"doc_type": "discharge_summary", "_unreadable": true}.
Never invent. Strict JSON.
"""


_PROMPT_INSURANCE = """You are Chitti, a careful insurance-records assistant for Indian families.
Look at this Indian insurance policy schedule / certificate (health, life, or term).
Extract the structured fields a family needs at premium-due time or claim-time.
Return STRICT JSON only — no prose, no markdown.

Shape:
{
  "doc_type": "insurance_health" or "insurance_life",
  "insurer_name": "string or null",
  "policy_number": "string or null",
  "policyholder_name": "string or null",
  "policy_kind": "health or life or term",
  "sum_assured_inr": number or null,
  "coverage_inr": number or null,
  "premium_inr": number or null,
  "premium_mode": "annual / half-yearly / quarterly / monthly or null",
  "start_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "renewal_date": "YYYY-MM-DD or null",
  "maturity_date": "YYYY-MM-DD or null",
  "nominee": "string or null",
  "network_hospitals": ["string"],
  "exclusions": ["string"],
  "sub_limits": {"room_rent_cap_inr": number or null, "icu_cap_inr": number or null, "pre_existing_wait_months": number or null, "maternity_cover_inr": number or null, "ayush_cover_inr": number or null},
  "no_claim_bonus_pct": number or null,
  "raw_summary": "1-2 sentence plain-Hindi summary of what this policy covers"
}

Be conservative on dates — only fill `due_date` if a phrase like "next premium due", "next due", "renewal date" is unambiguously printed.
If the image is NOT an insurance policy, return {"doc_type": "other", "_reason": "<why>"}.
If unreadable: {"doc_type": "insurance_health", "_unreadable": true}.
Never invent. Strict JSON.
"""


_PROMPT_IMAGING = """You are Chitti, a careful medical-record assistant for Indian families.
Look at this Indian radiology / imaging report (MRI, CT, X-ray, ultrasound). Extract the IMPRESSION and the actionable findings — never invent diagnoses, never elaborate the radiologist's language.
Return STRICT JSON only — no prose, no markdown.

Shape:
{
  "doc_type": "mri" or "ct_scan" or "xray" or "ultrasound",
  "patient_name": "string or null",
  "study_name": "exact name as printed (e.g. 'MRI Lumbar Spine')",
  "doc_date": "YYYY-MM-DD or null",
  "radiologist": "string or null",
  "ordering_doctor": "string or null",
  "facility_name": "lab / hospital that ran the study or null",
  "indication": "the clinical question the test was ordered for, e.g. 'low back pain', or null",
  "findings": ["string — verbatim from report"],
  "impression": "the final 'IMPRESSION' line(s), verbatim or null",
  "recommendations": ["string — any follow-up tests / consults recommended"],
  "red_flags": "string — any critical finding flagged in caps or highlighted, or null"
}

If the image is NOT an imaging report, return {"doc_type": "other", "_reason": "<why>"}.
If unreadable: {"_unreadable": true}.
Never invent diagnoses. Strict JSON.
"""


_PROMPT_ECG_ECHO = """You are Chitti, a careful medical-record assistant for Indian families.
Look at this Indian cardiac report (ECG / 12-lead ECG / 2D Echo / TMT / stress test).
Extract the cardiac measurements + impression. Return STRICT JSON only.

Shape:
{
  "doc_type": "ecg" or "echo",
  "patient_name": "string or null",
  "doc_date": "YYYY-MM-DD or null",
  "facility_name": "string or null",
  "ordering_doctor": "string or null",
  "measurements": [
    {"name": "Heart Rate", "value": "78", "unit": "bpm", "normal_low": 60, "normal_high": 100, "out_of_range": false},
    {"name": "PR Interval", "value": "160", "unit": "ms", "normal_low": 120, "normal_high": 200, "out_of_range": false},
    {"name": "Ejection Fraction", "value": "58", "unit": "%", "normal_low": 55, "normal_high": 70, "out_of_range": false}
  ],
  "rhythm": "e.g. 'Normal sinus rhythm' or 'Atrial fibrillation' — verbatim",
  "impression": "the final IMPRESSION or CONCLUSION line(s) — verbatim",
  "recommendations": ["string"],
  "red_flags": "any critical word like 'ischemia', 'infarct', 'EF < 40' — or null"
}

If not an ECG/echo report, return {"doc_type": "other", "_reason": "<why>"}.
If unreadable: {"_unreadable": true}.
Strict JSON.
"""


_PROMPT_VACCINATION = """You are Chitti, a careful medical-record assistant for Indian families.
Look at this Indian vaccination card / immunization record (paper card, CoWIN certificate, hospital sticker booklet).
Extract every shot given + any next-due dates.
Return STRICT JSON only.

Shape:
{
  "doc_type": "vaccination",
  "patient_name": "string or null",
  "dob": "YYYY-MM-DD or null",
  "shots": [
    {
      "vaccine": "BCG / OPV-0 / Penta-1 / Rotavirus / DPT / MMR / Hepatitis B / COVID Covaxin / Tdap / Influenza / HPV ...",
      "dose": "1 / 2 / 3 / booster",
      "given_date": "YYYY-MM-DD or null",
      "batch_no": "string or null",
      "site": "deltoid / thigh / oral / nasal or null"
    }
  ],
  "next_due": [
    {"vaccine": "MMR Booster", "due_date": "YYYY-MM-DD"}
  ],
  "issuer": "hospital / clinic / govt centre / null"
}

If the image is NOT a vaccination record, return {"doc_type": "other", "_reason": "<why>"}.
If unreadable: {"doc_type": "vaccination", "_unreadable": true}.
Strict JSON.
"""


_PROMPT_EYE = """You are Chitti, a careful eye-records assistant for Indian families.
Look at this Indian ophthalmology prescription (spectacle Rx / contact-lens Rx) or eye check-up report.
Return STRICT JSON only.

Shape:
{
  "doc_type": "eye",
  "patient_name": "string or null",
  "doc_date": "YYYY-MM-DD or null",
  "optometrist_or_doctor": "string or null",
  "facility_name": "string or null",
  "rx": {
    "right": {"sph": number or null, "cyl": number or null, "axis": number or null, "add": number or null, "pd": number or null, "va": "e.g. 6/6 or 20/20 or null"},
    "left":  {"sph": number or null, "cyl": number or null, "axis": number or null, "add": number or null, "pd": number or null, "va": "string or null"}
  },
  "iop_right_mmhg": number or null,
  "iop_left_mmhg": number or null,
  "diagnoses": ["string — e.g. myopia, presbyopia, dry eye, cataract"],
  "recommendations": ["string"],
  "followup_date": "YYYY-MM-DD or null"
}

If not an eye report, return {"doc_type": "other", "_reason": "<why>"}.
If unreadable: {"_unreadable": true}.
Strict JSON.
"""


_PROMPT_DENTAL = """You are Chitti, a careful dental-records assistant for Indian families.
Look at this Indian dental treatment plan / dental check-up note / dental x-ray report.
Return STRICT JSON only.

Shape:
{
  "doc_type": "dental",
  "patient_name": "string or null",
  "doc_date": "YYYY-MM-DD or null",
  "dentist": "string or null",
  "facility_name": "string or null",
  "complaints": ["string"],
  "findings": ["string — verbatim, including tooth numbers like '36 deep caries'"],
  "treatment_plan": [
    {"tooth": "string e.g. '36' or 'upper right' or null", "procedure": "string e.g. 'RCT + crown'", "cost_inr": number or null}
  ],
  "procedures_done_today": ["string"],
  "next_appointment": "YYYY-MM-DD or null",
  "oral_hygiene_advice": "string or null"
}

If not a dental record, return {"doc_type": "other", "_reason": "<why>"}.
If unreadable: {"_unreadable": true}.
Strict JSON.
"""


_PROMPTS = {
    "prescription": _PROMPT_PRESCRIPTION,
    "blood_report": _PROMPT_BLOOD_REPORT,
    "discharge_summary": _PROMPT_DISCHARGE_SUMMARY,
    "insurance_health": _PROMPT_INSURANCE,
    "insurance_life": _PROMPT_INSURANCE,
    "mri": _PROMPT_IMAGING,
    "ct_scan": _PROMPT_IMAGING,
    "xray": _PROMPT_IMAGING,
    "ultrasound": _PROMPT_IMAGING,
    "ecg": _PROMPT_ECG_ECHO,
    "echo": _PROMPT_ECG_ECHO,
    "vaccination": _PROMPT_VACCINATION,
    "eye": _PROMPT_EYE,
    "dental": _PROMPT_DENTAL,
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

    elif doc_type == "discharge_summary":
        for dx in (extracted.get("final_diagnoses") or []):
            if not dx: continue
            facts.append({"kind": "diagnosis", "label": str(dx)[:200], "fact_date": doc_date})
        for m in (extracted.get("discharge_medicines") or []):
            facts.append({
                "kind":  "medicine",
                "label": (m.get("name") or m.get("composition") or "").strip()[:200] or "(unnamed)",
                "value": (m.get("composition") or "").strip()[:200] or None,
                "fact_date": doc_date,
                "notes": _pack_prescription_notes(m),
            })
        if extracted.get("followup_date"):
            facts.append({
                "kind": "followup", "label": "Post-discharge follow-up",
                "value": (extracted.get("followup_notes") or "")[:200] or None,
                "fact_date": extracted["followup_date"],
            })
        if extracted.get("red_flags"):
            facts.append({"kind": "recommendation", "label": "Watch for",
                          "value": (extracted["red_flags"] or "")[:200], "fact_date": doc_date})

    elif doc_type in ("insurance_health", "insurance_life"):
        facts.append({
            "kind": "insurance_policy",
            "label": f"{extracted.get('insurer_name') or 'Insurance'} ({extracted.get('policy_kind') or doc_type})",
            "value": (extracted.get("policy_number") or "")[:200] or None,
            "fact_date": extracted.get("start_date") or doc_date,
            "notes": (extracted.get("raw_summary") or "")[:500] or None,
        })
        if extracted.get("due_date") and extracted.get("premium_inr") is not None:
            facts.append({
                "kind": "insurance_premium",
                "label": f"Premium due — {extracted.get('insurer_name') or doc_type}",
                "value": f"₹{extracted['premium_inr']}",
                "fact_date": extracted["due_date"],
            })

    elif doc_type in ("mri", "ct_scan", "xray", "ultrasound"):
        if extracted.get("impression"):
            facts.append({
                "kind": "imaging_finding",
                "label": (extracted.get("study_name") or doc_type.upper())[:200],
                "value": (extracted["impression"] or "")[:200],
                "fact_date": doc_date,
                "notes": " · ".join((extracted.get("findings") or [])[:5])[:500] or None,
            })
        for rec in (extracted.get("recommendations") or []):
            facts.append({"kind": "recommendation", "label": str(rec)[:200], "fact_date": doc_date})
        if extracted.get("red_flags"):
            facts.append({"kind": "recommendation", "label": "Red flag",
                          "value": (extracted["red_flags"] or "")[:200], "fact_date": doc_date})

    elif doc_type in ("ecg", "echo"):
        for m in (extracted.get("measurements") or []):
            name = (m.get("name") or "").strip()
            value = m.get("value")
            if not name or value in (None, ""):
                continue
            facts.append({
                "kind": "lab_value",
                "label": name[:200],
                "value": str(value)[:200],
                "unit": (m.get("unit") or "")[:40] or None,
                "normal_low":  None if m.get("normal_low") in (None, "") else float(m["normal_low"]),
                "normal_high": None if m.get("normal_high") in (None, "") else float(m["normal_high"]),
                "out_of_range": 1 if bool(m.get("out_of_range")) else 0,
                "fact_date": doc_date,
            })
        if extracted.get("impression"):
            facts.append({
                "kind": "imaging_finding",
                "label": f"{doc_type.upper()} impression",
                "value": (extracted["impression"] or "")[:200],
                "fact_date": doc_date,
                "notes": (extracted.get("rhythm") or "")[:200] or None,
            })

    elif doc_type == "vaccination":
        for shot in (extracted.get("shots") or []):
            name = (shot.get("vaccine") or "").strip()
            if not name: continue
            facts.append({
                "kind": "vaccine",
                "label": name[:200],
                "value": (shot.get("dose") or "")[:200] or None,
                "fact_date": shot.get("given_date") or doc_date,
                "notes": (shot.get("batch_no") or "")[:200] or None,
            })
        for nd in (extracted.get("next_due") or []):
            facts.append({
                "kind": "followup",
                "label": f"Next vaccine: {nd.get('vaccine') or 'unspecified'}"[:200],
                "fact_date": nd.get("due_date") or None,
            })

    elif doc_type == "eye":
        rx = extracted.get("rx") or {}
        for side in ("right", "left"):
            eye = rx.get(side) or {}
            sph = eye.get("sph")
            if sph is None: continue
            facts.append({
                "kind": "lab_value",
                "label": f"{side.title()} eye SPH",
                "value": str(sph)[:40],
                "unit": "D",
                "fact_date": doc_date,
                "notes": f"cyl={eye.get('cyl')} axis={eye.get('axis')} add={eye.get('add')} va={eye.get('va')}",
            })
        for dx in (extracted.get("diagnoses") or []):
            facts.append({"kind": "diagnosis", "label": str(dx)[:200], "fact_date": doc_date})
        if extracted.get("followup_date"):
            facts.append({"kind": "followup", "label": "Eye check-up follow-up",
                          "fact_date": extracted["followup_date"]})

    elif doc_type == "dental":
        for fn in (extracted.get("findings") or []):
            facts.append({"kind": "diagnosis", "label": str(fn)[:200], "fact_date": doc_date})
        for p in (extracted.get("treatment_plan") or []):
            facts.append({
                "kind": "recommendation",
                "label": f"Dental — {p.get('procedure') or 'procedure'}"[:200],
                "value": (p.get("tooth") or "")[:200] or None,
                "fact_date": doc_date,
                "notes": (f"~₹{p.get('cost_inr')}" if p.get("cost_inr") else None),
            })
        if extracted.get("next_appointment"):
            facts.append({"kind": "followup", "label": "Next dental appointment",
                          "fact_date": extracted["next_appointment"]})

    return facts


def _pack_prescription_notes(med: dict) -> str:
    pieces = []
    for k in ("dose", "frequency", "duration", "notes"):
        v = (med.get(k) or "").strip()
        if v:
            pieces.append(f"{k}: {v}")
    return " · ".join(pieces)[:500] or None
