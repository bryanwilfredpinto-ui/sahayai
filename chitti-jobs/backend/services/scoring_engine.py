"""
services/scoring_engine.py  —  BO5
----------------------------------
Deterministic 1–10 job score for a user, implementing CEOS §23B Step 3
EXACTLY (the deltas are the spec):

  +3  role title exact/close match
  +2  location preference match
  +2  industry / target-company match
  +1  salary within expectation (only when both sides are parseable)
  +1  recent posting (< 48 h)
  -2  level mismatch (≥ 2 tiers off)
  -2  blacklisted company
  -1  outdated posting (> 14 days)

Final score = clamp(1 + Σ deltas, 1, 10). Every delta is returned with a
human reason so the score is fully auditable (CEOS §24, Art transparency).
Only score ≥ 7 is surfaced to the user (§23B Step 5).

Pure function. rapidfuzz if available, difflib fallback (keeps unit tests
dependency-free).
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta

try:  # pragma: no cover - prefer rapidfuzz in prod
    from rapidfuzz import fuzz

    def _ratio(a: str, b: str) -> float:
        return float(fuzz.token_set_ratio(a or "", b or ""))
except Exception:  # noqa: BLE001
    from difflib import SequenceMatcher

    def _ratio(a: str, b: str) -> float:
        return 100.0 * SequenceMatcher(None, (a or "").lower(), (b or "").lower()).ratio()


_LEVEL_INDEX = {"fresher": 0, "junior": 1, "mid": 2, "senior": 3, "cxo": 4}

# Title → seniority tier inference (for the level-mismatch delta).
_TITLE_TIER = [
    (("intern", "trainee", "fresher", "graduate apprentice", "entry level"), 0),
    (("junior", "associate", "executive", "analyst", "jr "), 1),
    (("senior", "lead", "specialist", "sr ", "manager"), 2),
    (("head", "principal", "director", "avp", "general manager"), 3),
    (("chief", "ceo", "cfo", "cto", "coo", "chro", "vp", "vice president", "president"), 4),
]


def _as_list(v):
    if v is None:
        return []
    if isinstance(v, (list, tuple)):
        return [str(x) for x in v if str(x).strip()]
    return [s.strip() for s in str(v).split(",") if s.strip()]


def _infer_job_tier(title: str) -> int | None:
    t = f" {(title or '').lower()} "
    best = None
    for kws, tier in _TITLE_TIER:
        if any(k in t for k in kws):
            best = tier if best is None else max(best, tier)
    return best


def _first_int(s: str):
    m = re.findall(r"\d[\d,]*", s or "")
    if not m:
        return None
    try:
        return int(m[0].replace(",", ""))
    except ValueError:
        return None


def score_job(profile: dict, job: dict, now: datetime | None = None) -> dict:
    """profile: {target_roles[], target_locations[], target_industries[],
    salary_expectation, blacklist_companies[], user_level}
    job: {title, company, location, jd_text, posted_at(datetime|None)}"""
    now = now or datetime.utcnow()
    breakdown: list[dict] = []

    title = job.get("title") or ""
    company = (job.get("company") or "").strip()
    location = (job.get("location") or "").lower()
    jd = (job.get("jd_text") or "").lower()

    # +3 role title match
    roles = _as_list(profile.get("target_roles"))
    best_role = max((_ratio(title, r) for r in roles), default=0.0)
    if best_role >= 80:
        breakdown.append({"factor": "role_title_match", "delta": 3, "reason": f"title closely matches target role ({best_role:.0f}%)"})
    elif best_role >= 60:
        breakdown.append({"factor": "role_title_partial", "delta": 1, "reason": f"title partially matches a target role ({best_role:.0f}%)"})

    # +2 location match
    locs = [l.lower() for l in _as_list(profile.get("target_locations"))]
    if any(l and (l in location or location in l) for l in locs) or ("remote" in location and any("remote" in l for l in locs)):
        breakdown.append({"factor": "location_match", "delta": 2, "reason": "location matches a preferred location"})

    # +2 industry / target-company match
    inds = [i.lower() for i in _as_list(profile.get("target_industries"))]
    if any(i and (i in jd or i in company.lower()) for i in inds):
        breakdown.append({"factor": "industry_match", "delta": 2, "reason": "industry/company matches a target"})

    # +1 salary within expectation (only if both parseable)
    want = _first_int(profile.get("salary_expectation") or "")
    jd_sal = None
    msal = re.search(r"(?:salary|ctc|package|compensation)[^\d]{0,20}([\d,]{4,})", jd)
    if msal:
        jd_sal = _first_int(msal.group(1))
    if want and jd_sal and jd_sal >= want * 0.9:
        breakdown.append({"factor": "salary_match", "delta": 1, "reason": "advertised pay meets expectation"})

    # +1 recent / -1 outdated
    posted = job.get("posted_at")
    if isinstance(posted, datetime):
        age = now - posted
        if age <= timedelta(hours=48):
            breakdown.append({"factor": "recent_posting", "delta": 1, "reason": "posted within 48 hours"})
        elif age > timedelta(days=14):
            breakdown.append({"factor": "stale_posting", "delta": -1, "reason": "posting older than 2 weeks"})

    # -2 level mismatch
    user_idx = _LEVEL_INDEX.get((profile.get("user_level") or "").lower())
    job_tier = _infer_job_tier(title)
    if user_idx is not None and job_tier is not None and abs(job_tier - user_idx) >= 2:
        rel = "too junior" if job_tier < user_idx else "too senior"
        breakdown.append({"factor": "level_mismatch", "delta": -2, "reason": f"role looks {rel} for your level"})

    # -2 blacklisted company
    black = [b.lower() for b in _as_list(profile.get("blacklist_companies"))]
    if company and any(b and b in company.lower() for b in black):
        breakdown.append({"factor": "blacklisted_company", "delta": -2, "reason": "company is on your block list"})

    raw = sum(d["delta"] for d in breakdown)
    final = max(1, min(10, 1 + raw))
    return {
        "score": final,
        "raw_delta": raw,
        "breakdown": breakdown,
        "surfaced": final >= 7,  # CEOS §23B Step 5: only 7+ shown to the user
    }
