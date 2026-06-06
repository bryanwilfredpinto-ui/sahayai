"""
services/government_readiness.py
--------------------------------
Citizen Readiness Score (CEOS Feature 8) — deterministic. Documents % +
profile completeness % + schemes-claimed % -> headline readiness %. No LLM.
Mirrors calcReadiness() in chitti_government.html.
"""
from __future__ import annotations

CORE_DOCS = ["aadhaar", "pan", "voter_id", "ration", "bank", "income_cert", "land_record", "abha"]
PROFILE_FIELDS = ["age", "gender", "income_annual_inr", "state_code", "occupation", "caste", "rural_urban"]


def compute(profile: dict, documents: dict, schemes_claimed: list, eligible_count: int | None) -> dict:
    profile = profile or {}
    documents = documents or {}
    claimed_n = len(schemes_claimed or [])

    held_core = sum(1 for k in CORE_DOCS if documents.get(k))
    doc_pct = round(100 * held_core / len(CORE_DOCS))

    filled = sum(1 for k in PROFILE_FIELDS
                 if profile.get(k) not in (None, "", []))
    prof_pct = round(100 * filled / len(PROFILE_FIELDS))

    scheme_pct = None
    benefits_missed = None
    if eligible_count is not None:
        scheme_pct = round(100 * min(claimed_n, eligible_count) / eligible_count) if eligible_count > 0 else 0
        benefits_missed = max(0, eligible_count - claimed_n)

    parts = [doc_pct, prof_pct] + ([scheme_pct] if scheme_pct is not None else [])
    readiness = round(sum(parts) / len(parts))

    missing_core = [k for k in CORE_DOCS if not documents.get(k)]

    return {
        "ok": True,
        "readiness_pct": readiness,
        "documents_pct": doc_pct,
        "profile_pct": prof_pct,
        "schemes_claimed_pct": scheme_pct,
        "eligible_count": eligible_count,
        "claimed_count": claimed_n,
        "benefits_missed": benefits_missed,
        "missing_core_documents": missing_core,
        "note": "Computed deterministically. Chitti shows what you may qualify for — the government decides.",
    }
