"""
services/government_eligibility.py
----------------------------------
Rule-engine eligibility checker. Pure Python — no LLM call required.
The DeepSeek explainer in services/government_deepseek.py wraps this
output in a friendly voice-first reply, but the underlying verdict is
deterministic so we can defend it to a sceptical Tier-2 user.

Verdict vocabulary:
  "eligible"   — every constrained predicate matches
  "partial"    — most predicates match, ≥ 1 unknown (user hasn't shared) AND no explicit fail
  "ineligible" — at least one predicate explicitly fails OR an exclusion fires
  "unknown"    — scheme has no constraints → cannot determine

The output preserves the failed/passed/unknown predicate breakdown so
the frontend can render a readable per-rule pass/fail card.
"""
from __future__ import annotations

from typing import Any

from models.scheme import Scheme


def _check_int_range(
    value: int | None, lo: int | None, hi: int | None
) -> str:
    if lo is None and hi is None:
        return "skip"
    if value is None:
        return "unknown"
    if lo is not None and value < lo:
        return "fail"
    if hi is not None and value > hi:
        return "fail"
    return "pass"


def _check_bool(required: bool | None, observed: bool | None) -> str:
    if required is None:
        return "skip"
    if observed is None:
        return "unknown"
    return "pass" if required == observed else "fail"


def _check_set(allowed: list[str] | None, observed: str | None) -> str:
    if not allowed:
        return "skip"
    if observed is None or observed == "":
        return "unknown"
    return "pass" if observed in allowed else "fail"


def _check_gender(scheme_gender: str | None, observed: str | None) -> str:
    if scheme_gender is None or scheme_gender == "any":
        return "skip"
    if observed is None or observed == "":
        return "unknown"
    return "pass" if observed == scheme_gender else "fail"


def _check_income_max(
    cap: int | None, observed: int | None
) -> str:
    if cap is None:
        return "skip"
    if observed is None:
        return "unknown"
    return "pass" if observed <= cap else "fail"


def _check_landholding(
    min_ha: float | None, max_ha: float | None, observed: float | None
) -> str:
    if min_ha is None and max_ha is None:
        return "skip"
    if observed is None:
        return "unknown"
    if min_ha is not None and observed < min_ha:
        return "fail"
    if max_ha is not None and observed > max_ha:
        return "fail"
    return "pass"


def _check_rural_urban(
    requires: str | None, observed: str | None
) -> str:
    if requires is None or requires == "both":
        return "skip"
    if observed is None or observed == "":
        return "unknown"
    return "pass" if observed == requires else "fail"


def evaluate(scheme: Scheme, profile: dict[str, Any]) -> dict:
    """Evaluate a single scheme against the user's profile.
    Profile keys (all optional):
      age:int, gender:'f'|'m'|'other', income_annual_inr:int,
      bpl:bool, secc_deprived:bool, occupation:str, landholding_ha:float,
      caste:'SC'|'ST'|'OBC'|'GEN', disability:bool, rural_urban:'rural'|'urban',
      state_code:str
    """
    rules: list[dict] = []

    # State scope (state schemes are gated to residents of that state)
    state_state = "skip"
    if scheme.level == "state" and scheme.state_code:
        observed_state = (profile.get("state_code") or "").upper().strip()
        if not observed_state:
            state_state = "unknown"
        elif observed_state == scheme.state_code.upper():
            state_state = "pass"
        else:
            state_state = "fail"
        rules.append({
            "rule": "state",
            "label": f"Resident of {scheme.state_code}",
            "verdict": state_state,
        })

    # Age
    age_state = _check_int_range(profile.get("age"), scheme.age_min, scheme.age_max)
    if age_state != "skip":
        bits = []
        if scheme.age_min is not None:
            bits.append(f"≥ {scheme.age_min}")
        if scheme.age_max is not None:
            bits.append(f"≤ {scheme.age_max}")
        rules.append({"rule": "age", "label": "Age " + " and ".join(bits), "verdict": age_state})

    # Gender
    gender_state = _check_gender(scheme.gender, profile.get("gender"))
    if gender_state != "skip":
        rules.append({
            "rule": "gender",
            "label": f"Gender = {scheme.gender}",
            "verdict": gender_state,
        })

    # Income cap
    income_state = _check_income_max(
        scheme.income_max_annual_inr, profile.get("income_annual_inr")
    )
    if income_state != "skip":
        rules.append({
            "rule": "income_max",
            "label": f"Annual family income ≤ ₹{scheme.income_max_annual_inr:,}",
            "verdict": income_state,
        })

    # BPL
    bpl_state = _check_bool(scheme.bpl_required, profile.get("bpl"))
    if bpl_state != "skip":
        rules.append({"rule": "bpl", "label": "Below Poverty Line household", "verdict": bpl_state})

    # SECC-2011 deprivation
    secc_state = _check_bool(scheme.secc_deprivation_required, profile.get("secc_deprived"))
    if secc_state != "skip":
        rules.append({"rule": "secc", "label": "SECC-2011 deprivation list", "verdict": secc_state})

    # Occupation
    occ_state = _check_set(scheme.occupation, profile.get("occupation"))
    if occ_state != "skip":
        rules.append({
            "rule": "occupation",
            "label": "Occupation: " + " / ".join(scheme.occupation or []),
            "verdict": occ_state,
        })

    # Landholding
    land_state = _check_landholding(
        scheme.landholding_min_ha, scheme.landholding_max_ha, profile.get("landholding_ha")
    )
    if land_state != "skip":
        bits = []
        if scheme.landholding_min_ha is not None:
            bits.append(f"≥ {scheme.landholding_min_ha} ha")
        if scheme.landholding_max_ha is not None:
            bits.append(f"≤ {scheme.landholding_max_ha} ha")
        rules.append({
            "rule": "landholding",
            "label": "Landholding " + " and ".join(bits),
            "verdict": land_state,
        })

    # Caste
    caste_state = _check_set(scheme.caste, profile.get("caste"))
    if caste_state != "skip":
        rules.append({
            "rule": "caste",
            "label": "Caste: " + " / ".join(scheme.caste or []),
            "verdict": caste_state,
        })

    # Disability
    dis_state = _check_bool(scheme.disability_required, profile.get("disability"))
    if dis_state != "skip":
        rules.append({"rule": "disability", "label": "Person with Disability", "verdict": dis_state})

    # Rural / urban
    ru_state = _check_rural_urban(scheme.rural_urban, profile.get("rural_urban"))
    if ru_state != "skip":
        rules.append({
            "rule": "rural_urban",
            "label": f"Residence: {scheme.rural_urban}",
            "verdict": ru_state,
        })

    # ── Aggregate ─────────────────────────────────────────────
    if not rules:
        verdict = "unknown"
    else:
        states = [r["verdict"] for r in rules]
        if "fail" in states:
            verdict = "ineligible"
        elif all(s == "pass" for s in states):
            verdict = "eligible"
        elif "unknown" in states:
            verdict = "partial"
        else:
            verdict = "eligible"

    return {
        "verdict": verdict,
        "rules": rules,
        "exclusions": scheme.exclusions or [],
        "scheme_slug": scheme.slug,
        "scheme_name": scheme.name_en,
        "ministry": scheme.ministry,
        "documents_required": scheme.documents_required or [],
        "application_url": scheme.application_url,
        "status_check_url": scheme.status_check_url,
        "source_url": scheme.source_url,
        "helpline": scheme.helpline,
        "benefit_summary_en": scheme.benefit_summary_en,
        "benefit_summary_hi": scheme.benefit_summary_hi,
        "eligibility_notes_en": scheme.eligibility_notes_en,
        "eligibility_notes_hi": scheme.eligibility_notes_hi,
    }


def evaluate_many(schemes: list[Scheme], profile: dict[str, Any]) -> list[dict]:
    """Run evaluate() over a list and sort by verdict (eligible → partial → ineligible)."""
    weight = {"eligible": 0, "partial": 1, "unknown": 2, "ineligible": 3}
    results = [evaluate(s, profile) for s in schemes]
    results.sort(key=lambda r: (weight.get(r["verdict"], 4), r["scheme_name"]))
    return results
