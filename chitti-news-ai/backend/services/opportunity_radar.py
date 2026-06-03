"""
services/opportunity_radar.py
-----------------------------
Opportunity Radar v1 — per CHITTI_NEWS_AI_MASTER_SPEC v0.3 +
features/OPPORTUNITY_RADAR.md.

Rules-only. No LLM. Aggregates fresh signals across the 9 aggregator
streams per profession × per geography → surfaces the top 3
"opportunity skills" worth learning.

Output is deterministic, auditable, and traceable to specific items
in the live DB.

Public API:

    compute(profession_slug, geo="india", lookback_days=7) -> dict
        Returns: top-3 skill_keywords by signal strength + the source
                 items that produced the signal.

    ai_impact_score(profession_slug, geo="india") -> dict
        Returns: 0-100 score per profession based on stream activity
                 (per features/AI_IMPACT_SCORE.md).
"""
from __future__ import annotations

import logging
from collections import Counter
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import desc

from database import SessionLocal
from models.courses_v2 import CourseV2, ProfessionRelevance
from models.aggregated_items import AggregatedItem
from models.articles import Article

log = logging.getLogger("opportunity_radar")

# Skill-keyword vocabulary — deliberate subset that maps to professions.
# Each keyword → list of profession_slugs it's most relevant for.
_SKILL_KEYWORDS = {
    "agentic-ai":          ["software-developer", "doctor", "accountant", "business-owner"],
    "llm":                 ["software-developer", "business-owner", "lawyer"],
    "prompt-engineering":  ["software-developer", "student", "teacher"],
    "rag":                 ["software-developer"],
    "fine-tuning":         ["software-developer"],
    "vector-database":     ["software-developer"],
    "computer-vision":     ["software-developer", "doctor", "farmer"],
    "nlp":                 ["software-developer", "lawyer", "doctor"],
    "machine-learning":    ["software-developer", "student"],
    "deep-learning":       ["software-developer", "student", "doctor"],
    "cuda":                ["software-developer"],
    "kubernetes":          ["software-developer"],
    "docker":              ["software-developer"],
    "devops":              ["software-developer"],
    "ai-interviewing":     ["hr-professional", "talent-acquisition"],
    "ats":                 ["talent-acquisition", "hr-professional"],
    "clinical-decision-support": ["doctor", "nurse"],
    "ehr":                 ["doctor", "nurse"],
    "oncology":            ["oncologist", "doctor"],
    "precision-agriculture": ["farmer"],
    "agritech":            ["farmer"],
    "lesson-plan":         ["teacher"],
    "nep-2020":            ["teacher"],
    "diksha":              ["teacher"],
    "gst":                 ["accountant", "business-owner"],
    "tds":                 ["accountant"],
    "itr":                 ["accountant"],
    "icai":                ["accountant"],
    "power-bi":            ["accountant", "business-owner"],
    "bns":                 ["lawyer"],
    "bnss":                ["lawyer"],
    "case-law":            ["lawyer"],
    "msme":                ["business-owner"],
    "ondc":                ["business-owner"],
    "udyam":               ["business-owner"],
    "igot":                ["government-employee"],
    "karmayogi":           ["government-employee"],
}


def _count_keyword_hits(text_pool: list[str], keywords: list[str]) -> dict[str, int]:
    """Count occurrences of each keyword in the text pool."""
    text = " ".join(t.lower() for t in text_pool if t)
    return {k: text.count(k) for k in keywords if text.count(k) > 0}


def compute(profession_slug: str, geo: str = "india", lookback_days: int = 7) -> dict:
    """Compute Opportunity Radar for a profession.

    Signals counted (last `lookback_days`):
      - jobs mentioning each skill keyword
      - courses tagged with each skill keyword
      - certs tagged with each skill keyword
      - tools tagged with each skill keyword

    Top 3 skills (by total signal) returned with recommended next items.
    """
    since = datetime.utcnow() - timedelta(days=lookback_days)
    skills_for_profession = [
        k for k, profs in _SKILL_KEYWORDS.items()
        if profession_slug in profs
    ]
    if not skills_for_profession:
        return {
            "profession": profession_slug, "geo": geo, "lookback_days": lookback_days,
            "opportunities": [],
            "honest_note": f"Profession '{profession_slug}' has no skill-keyword vocabulary yet — Opportunity Radar v1 covers only the seed list.",
        }

    skill_signal: Counter = Counter()
    skill_evidence: dict[str, list[dict]] = {k: [] for k in skills_for_profession}

    with SessionLocal() as db:
        # Job signals
        jobs = (db.query(AggregatedItem)
                  .filter(AggregatedItem.kind == "job",
                          AggregatedItem.ingested_at >= since)
                  .order_by(desc(AggregatedItem.ingested_at))
                  .limit(200).all())
        for j in jobs:
            text_pool = [j.title or "", j.summary or "", j.topics or ""]
            hits = _count_keyword_hits(text_pool, skills_for_profession)
            for k, n in hits.items():
                skill_signal[k] += n * 3  # job postings are highest signal
                if len(skill_evidence[k]) < 3:
                    skill_evidence[k].append({"stream": "job", "id": j.id, "title": j.title[:80], "url": j.url})

        # Course signals
        courses = (db.query(CourseV2)
                     .filter(CourseV2.ingested_at >= since)
                     .order_by(desc(CourseV2.ingested_at))
                     .limit(500).all())
        for c in courses:
            text_pool = [c.title or "", c.summary or "", c.topics or ""]
            hits = _count_keyword_hits(text_pool, skills_for_profession)
            for k, n in hits.items():
                skill_signal[k] += n * 2
                if len(skill_evidence[k]) < 3:
                    skill_evidence[k].append({"stream": "course", "id": c.id, "title": c.title[:80], "url": c.url})

        # Cert + tool signals
        for kind in ("cert", "tool"):
            items = (db.query(AggregatedItem)
                       .filter(AggregatedItem.kind == kind,
                               AggregatedItem.ingested_at >= since)
                       .order_by(desc(AggregatedItem.ingested_at))
                       .limit(100).all())
            for it in items:
                text_pool = [it.title or "", it.summary or "", it.topics or ""]
                hits = _count_keyword_hits(text_pool, skills_for_profession)
                for k, n in hits.items():
                    skill_signal[k] += n * 1
                    if len(skill_evidence[k]) < 3:
                        skill_evidence[k].append({"stream": kind, "id": it.id, "title": it.title[:80], "url": it.url})

    # Top 3 skills by signal
    opportunities = []
    for skill, signal in skill_signal.most_common(3):
        opportunities.append({
            "skill_keyword": skill,
            "signal_strength": signal,
            "evidence": skill_evidence.get(skill, []),
            "rule_version": "opportunity-radar-v1-2026-06-04",
        })

    return {
        "profession": profession_slug,
        "geo": geo,
        "lookback_days": lookback_days,
        "opportunities": opportunities,
        "skills_evaluated": skills_for_profession,
        "rule_version": "opportunity-radar-v1-2026-06-04",
        "honest_note": (
            "Rules-only. Signal = sum(keyword hits * stream weight) over lookback window. "
            "Stream weights: job=3, course=2, cert=1, tool=1. "
            "If a profession has no listed skills here, the radar surfaces nothing — never invents."
        ) if not opportunities else None,
    }


def ai_impact_score(profession_slug: str, geo: str = "india") -> dict:
    """AI Impact Score per features/AI_IMPACT_SCORE.md.

    Weighted sum across stream activity over last 90 days. Rules-only.
    """
    since = datetime.utcnow() - timedelta(days=90)

    # Count items per stream relevant to this profession.
    with SessionLocal() as db:
        # Profession-relevant counts from ProfessionRelevance
        rel_query = db.query(ProfessionRelevance).filter(
            ProfessionRelevance.profession_slug == profession_slug,
            ProfessionRelevance.classified_at >= since,
        )
        per_kind: Counter = Counter()
        for r in rel_query.all():
            per_kind[r.item_kind] += 1

    # Component scores (each [0, 100])
    def cap(n: int, target: int) -> float:
        return min(100.0, 100.0 * n / max(1, target))

    comp = {
        "job_signals":         cap(per_kind.get("job", 0),    20),  # 20 jobs/90d = 100
        "course_signals":      cap(per_kind.get("course", 0), 30),
        "cert_signals":        cap(per_kind.get("cert", 0),   5),
        "tool_signals":        cap(per_kind.get("tool", 0),   5),
        "scheme_signals":      cap(per_kind.get("scheme", 0), 3),
        "research_signals":    cap(per_kind.get("research", 0) + per_kind.get("startup", 0), 5),
        "news_signals":        cap(per_kind.get("article", 0), 30),
    }
    weights = {
        "job_signals":      0.30,
        "course_signals":   0.20,
        "cert_signals":     0.20,
        "tool_signals":     0.10,
        "scheme_signals":   0.10,
        "research_signals": 0.05,
        "news_signals":     0.05,
    }
    score = sum(comp[k] * weights[k] for k in comp)

    if score >= 76:
        band = "very_high"
        interp = "Very high AI impact — career disruption + opportunity window."
    elif score >= 51:
        band = "high"
        interp = "Substantial reskilling opportunity (and risk)."
    elif score >= 26:
        band = "moderate"
        interp = "Moderate — emerging tools relevant."
    else:
        band = "low"
        interp = "Low immediate AI impact."

    return {
        "profession": profession_slug,
        "geo": geo,
        "score": round(score, 1),
        "band": band,
        "components": {k: round(v, 1) for k, v in comp.items()},
        "weights": weights,
        "interpretation_en": interp,
        "rule_version": "ai-impact-score-v1-2026-06-04",
        "honest_note": (
            "Rules-only. Score is a weighted sum of per-stream signal counts "
            "over 90 days. Components: job_signals 30% · course_signals 20% · "
            "cert_signals 20% · tool_signals 10% · scheme_signals 10% · "
            "research_signals 5% · news_signals 5%."
        ),
    }
