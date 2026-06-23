"""
services/ats_engine.py  —  BO6
------------------------------
Deterministic ATS keyword scoring: a user's resume vs a job description.
98% of Fortune 500 use ATS; 58% of resumes are rejected on keyword
mismatch before a human reads them (CEOS §1.1). This is the gate.

Output: {match_pct, matched[], missing[], jd_keywords[], suggestions[]}.

Thresholds (CEOS):
  < 60%  → suggest resume tailoring before applying (§23B Step 4)
  ≥ 70%  → required before an application may fire (§24)

Pure function — no LLM, no I/O. Uses a curated skill lexicon plus
frequency-ranked JD terms so the "critical keyword" set is explainable.
"""
from __future__ import annotations

import re

# Words that carry no ATS signal.
_STOP = set("""
a an the and or of to in for with on at by from as is are be was were been being this that these those
will would can could should may might must shall not no nor so than then too very just only own same
we you they it he she i me my our your their his her its us them who whom which what when where why how
job role work team teams company companies experience experiences year years month months day days
candidate candidates applicant applicants looking seeking join joining strong good great excellent
ability able responsibilities responsibility requirement requirements qualification qualifications
plus etc using use used across within into out over under more most less least new etc per via
""".split())

# Curated high-signal skills/keywords. If present in the JD, they count as
# CRITICAL keywords (heavier than generic frequency terms).
_SKILL_LEXICON = set("""
python java javascript typescript react angular vue node nodejs django flask fastapi spring
sql mysql postgresql postgres mongodb redis kafka spark hadoop hive airflow etl
aws azure gcp cloud docker kubernetes k8s terraform ci cd jenkins git linux microservices
rest api graphql html css tailwind sass figma ux ui
machine learning ml ai nlp deeplearning pytorch tensorflow pandas numpy scikit data science analytics
excel powerbi tableau looker dashboards reporting forecasting
salesforce sap oracle erp crm dynamics
accounting audit taxation gst tds ifrs gaap reconciliation payroll compliance
marketing seo sem content social campaigns branding crm hubspot
project agile scrum kanban jira pmp prince2 stakeholder roadmap delivery
sales negotiation pipeline quota b2b b2c retention churn
recruitment talent sourcing onboarding hrbp employee engagement
communication leadership mentoring strategy operations procurement logistics supplychain
""".split())


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z+#.\-]{1,}", (text or "").lower())


def _norm(tok: str) -> str:
    return tok.strip(".-").lower()


def extract_jd_keywords(jd_text: str, top_n: int = 25) -> list[str]:
    """Critical lexicon hits first, then frequency-ranked content terms."""
    toks = [_norm(t) for t in _tokens(jd_text)]
    toks = [t for t in toks if t and t not in _STOP and len(t) >= 2]

    crit = []
    seen = set()
    for t in toks:
        if t in _SKILL_LEXICON and t not in seen:
            crit.append(t)
            seen.add(t)

    freq: dict[str, int] = {}
    for t in toks:
        if t in seen:
            continue
        freq[t] = freq.get(t, 0) + 1
    ranked = [w for w, _ in sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))]

    out = crit + [w for w in ranked if w not in seen]
    return out[:top_n]


def score(resume_text: str, jd_text: str) -> dict:
    """Return ATS match between a resume and a JD."""
    jd_keywords = extract_jd_keywords(jd_text)
    if not jd_keywords:
        return {
            "match_pct": 0.0, "matched": [], "missing": [],
            "jd_keywords": [], "suggestions": [],
            "note": "No keywords could be extracted from the job description.",
        }

    resume_toks = {_norm(t) for t in _tokens(resume_text)}
    matched = [k for k in jd_keywords if k in resume_toks]
    missing = [k for k in jd_keywords if k not in resume_toks]
    match_pct = round(100.0 * len(matched) / len(jd_keywords), 1)

    # Suggest the highest-value missing keywords (lexicon ones first).
    missing_sorted = sorted(missing, key=lambda k: (0 if k in _SKILL_LEXICON else 1))
    suggestions = missing_sorted[:8]

    return {
        "match_pct": match_pct,
        "matched": matched,
        "missing": missing,
        "jd_keywords": jd_keywords,
        "suggestions": suggestions,
        "tailor_recommended": match_pct < 60.0,
        "send_ready": match_pct >= 70.0,
    }
