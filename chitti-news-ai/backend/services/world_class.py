"""
services/world_class.py
-----------------------
Chitti News AI — World-class features v1 (rules-only, no LLM).

Implements per features/*.md:
  - Skill Gap Radar     -- jobs (demand) vs courses+certs (supply) per profession
  - Chitti Mentor       -- profession + current_level -> next 3 actions from streams
  - Chitti Coach        -- profession + skill -> 4-week learning plan from streams
  - Opportunity Engine  -- profession -> ranked top-N actionable opportunities
                          (jobs / grants / schemes / startups)

All four read the same DB and shared skill vocabulary from
opportunity_radar._SKILL_KEYWORDS to stay coherent. Output is
deterministic, traceable to specific DB rows, and labelled with
rule_version for audit + cache invalidation.

Public API:
    skill_gap_radar(profession_slug, geo="india", lookback_days=30) -> dict
    chitti_mentor(profession_slug, current_level="any", lookback_days=14) -> dict
    chitti_coach(profession_slug, skill_keyword, weeks=4) -> dict
    opportunity_engine(profession_slug, geo="india", lookback_days=30, limit=20) -> dict
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import desc

from database import SessionLocal
from models.courses_v2 import CourseV2, ProfessionRelevance
from models.aggregated_items import AggregatedItem
from services.opportunity_radar import _SKILL_KEYWORDS, _count_keyword_hits

RULE_VERSION = "world-class-v1-2026-06-04"


# ────────────────────────────────────────────────────────────────────────
# 1. Skill Gap Radar
# ────────────────────────────────────────────────────────────────────────

def skill_gap_radar(profession_slug: str, geo: str = "india",
                    lookback_days: int = 30) -> dict:
    """Compare skill DEMAND (jobs) vs SUPPLY (courses + certs) per profession.

    Output ranks skills by gap = demand - supply, surfacing the top
    "underserved" skills where there are many jobs but few learning paths.
    Conversely surfaces "oversupplied" skills (lots of courses, few jobs)
    to honest-warn learners away from saturated areas.
    """
    since = datetime.utcnow() - timedelta(days=lookback_days)
    skills = [k for k, profs in _SKILL_KEYWORDS.items() if profession_slug in profs]
    if not skills:
        return _empty(profession_slug, geo, lookback_days, "skill-gap-radar")

    demand: Counter = Counter()  # job hits per skill
    supply: Counter = Counter()  # course + cert hits per skill

    with SessionLocal() as db:
        # DEMAND: jobs
        jobs = (db.query(AggregatedItem)
                  .filter(AggregatedItem.kind == "job",
                          AggregatedItem.ingested_at >= since)
                  .order_by(desc(AggregatedItem.ingested_at))
                  .limit(500).all())
        for j in jobs:
            pool = [j.title or "", j.summary or "", j.topics or ""]
            for k, n in _count_keyword_hits(pool, skills).items():
                demand[k] += n

        # SUPPLY: courses + certs
        courses = (db.query(CourseV2)
                     .filter(CourseV2.ingested_at >= since)
                     .order_by(desc(CourseV2.ingested_at))
                     .limit(1000).all())
        for c in courses:
            pool = [c.title or "", c.summary or "", c.topics or ""]
            for k, n in _count_keyword_hits(pool, skills).items():
                supply[k] += n

        certs = (db.query(AggregatedItem)
                   .filter(AggregatedItem.kind == "cert",
                           AggregatedItem.ingested_at >= since)
                   .order_by(desc(AggregatedItem.ingested_at))
                   .limit(200).all())
        for cert in certs:
            pool = [cert.title or "", cert.summary or "", cert.topics or ""]
            for k, n in _count_keyword_hits(pool, skills).items():
                supply[k] += n

    gaps = []
    for skill in skills:
        d, s = demand.get(skill, 0), supply.get(skill, 0)
        gap = d - s
        if d == 0 and s == 0:
            continue
        ratio = (d + 1) / (s + 1)  # > 1 = underserved; < 1 = oversupplied
        gaps.append({
            "skill_keyword": skill,
            "demand_signal": d,
            "supply_signal": s,
            "gap_score": gap,
            "demand_supply_ratio": round(ratio, 2),
            "verdict": (
                "UNDERSERVED" if ratio >= 2.0 else
                "BALANCED"    if 0.5 <= ratio < 2.0 else
                "OVERSUPPLIED"
            ),
        })

    gaps.sort(key=lambda x: -x["gap_score"])
    return {
        "profession": profession_slug,
        "geo": geo,
        "lookback_days": lookback_days,
        "underserved_top5": [g for g in gaps if g["verdict"] == "UNDERSERVED"][:5],
        "balanced_top5":    [g for g in gaps if g["verdict"] == "BALANCED"][:5],
        "oversupplied":     [g for g in gaps if g["verdict"] == "OVERSUPPLIED"][:5],
        "rule_version": RULE_VERSION,
        "honest_note": (
            "Rules-only. demand=job hits, supply=course+cert hits, gap=demand-supply, "
            "ratio=(demand+1)/(supply+1). UNDERSERVED (ratio>=2) = high-job-low-learning; "
            "OVERSUPPLIED (ratio<0.5) = many courses chasing few jobs (warn learners)."
        ),
    }


# ────────────────────────────────────────────────────────────────────────
# 2. Chitti Mentor
# ────────────────────────────────────────────────────────────────────────

def chitti_mentor(profession_slug: str, current_level: str = "any",
                  lookback_days: int = 14) -> dict:
    """1-on-1 mentor: surface the next 3 most relevant items across streams.

    Picks one item from each of: course (LEARN), cert (PROVE), job (APPLY)
    where each is the freshest profession-relevant item from the last
    lookback window. If a stream is empty, says so honestly.
    """
    since = datetime.utcnow() - timedelta(days=lookback_days)
    actions = []
    with SessionLocal() as db:
        # LEARN: top course
        course_rel = (db.query(ProfessionRelevance, CourseV2)
                        .join(CourseV2, ProfessionRelevance.item_id == CourseV2.id)
                        .filter(ProfessionRelevance.profession_slug == profession_slug,
                                ProfessionRelevance.item_kind == "course",
                                ProfessionRelevance.classified_at >= since)
                        .order_by(desc(ProfessionRelevance.confidence),
                                  desc(CourseV2.ingested_at))
                        .first())
        if course_rel:
            _, c = course_rel
            actions.append({"step": "LEARN", "stream": "course", "id": c.id,
                            "title": c.title, "url": c.url, "source": c.source_slug,
                            "why": "freshest profession-tagged course in lookback window"})
        else:
            actions.append({"step": "LEARN", "stream": "course",
                            "honest_empty": "no profession-tagged course in last "
                                            f"{lookback_days} days"})

        # PROVE: top cert
        cert_rel = (db.query(ProfessionRelevance, AggregatedItem)
                      .join(AggregatedItem, ProfessionRelevance.item_id == AggregatedItem.id)
                      .filter(ProfessionRelevance.profession_slug == profession_slug,
                              ProfessionRelevance.item_kind == "cert",
                              ProfessionRelevance.classified_at >= since)
                      .order_by(desc(ProfessionRelevance.confidence),
                                desc(AggregatedItem.ingested_at))
                      .first())
        if cert_rel:
            _, x = cert_rel
            actions.append({"step": "PROVE", "stream": "cert", "id": x.id,
                            "title": x.title, "url": x.url, "source": x.source_slug,
                            "why": "highest-confidence cert tagged to your profession"})
        else:
            actions.append({"step": "PROVE", "stream": "cert",
                            "honest_empty": "no profession-tagged cert in lookback"})

        # APPLY: top job
        job_rel = (db.query(ProfessionRelevance, AggregatedItem)
                     .join(AggregatedItem, ProfessionRelevance.item_id == AggregatedItem.id)
                     .filter(ProfessionRelevance.profession_slug == profession_slug,
                             ProfessionRelevance.item_kind == "job",
                             ProfessionRelevance.classified_at >= since)
                     .order_by(desc(ProfessionRelevance.confidence),
                               desc(AggregatedItem.ingested_at))
                     .first())
        if job_rel:
            _, j = job_rel
            actions.append({"step": "APPLY", "stream": "job", "id": j.id,
                            "title": j.title, "url": j.url, "source": j.source_slug,
                            "why": "freshest job tagged to your profession"})
        else:
            actions.append({"step": "APPLY", "stream": "job",
                            "honest_empty": "no profession-tagged job in lookback"})

    return {
        "profession": profession_slug,
        "current_level": current_level,
        "lookback_days": lookback_days,
        "next_3_actions": actions,
        "mentor_principle": "LEARN -> PROVE -> APPLY. One item per step. No fluff.",
        "rule_version": RULE_VERSION,
        "honest_note": (
            "Rules-only. Mentor never invents items. If a stream is empty, "
            "the action says 'honest_empty' instead of fabricating one."
        ),
    }


# ────────────────────────────────────────────────────────────────────────
# 3. Chitti Coach
# ────────────────────────────────────────────────────────────────────────

def chitti_coach(profession_slug: str, skill_keyword: str,
                 weeks: int = 4) -> dict:
    """Multi-week learning plan: sequence courses + certs for a (profession, skill).

    Picks `weeks` distinct course-like items from the DB whose title/topics
    mention the target skill_keyword, ordered by ingested_at desc for
    freshness. Caps each week to one primary item + one supporting item if
    available.
    """
    weeks = max(1, min(weeks, 12))
    skill_keyword = skill_keyword.lower().strip()
    plan = []

    with SessionLocal() as db:
        candidates_course = (db.query(CourseV2)
                               .order_by(desc(CourseV2.ingested_at))
                               .limit(500).all())
        candidates_cert   = (db.query(AggregatedItem)
                               .filter(AggregatedItem.kind == "cert")
                               .order_by(desc(AggregatedItem.ingested_at))
                               .limit(200).all())

    def matches(item) -> bool:
        text = " ".join(filter(None, [
            (getattr(item, "title", "") or "").lower(),
            (getattr(item, "summary", "") or "").lower(),
            (getattr(item, "topics", "") or "").lower(),
        ]))
        return skill_keyword in text

    matched_courses = [c for c in candidates_course if matches(c)]
    matched_certs   = [c for c in candidates_cert   if matches(c)]

    seen_urls: set[str] = set()
    course_idx = cert_idx = 0
    for week in range(1, weeks + 1):
        week_items = []
        while course_idx < len(matched_courses) and len(week_items) < 2:
            c = matched_courses[course_idx]
            course_idx += 1
            if c.url and c.url not in seen_urls:
                week_items.append({"role": "primary" if not week_items else "support",
                                   "stream": "course", "id": c.id,
                                   "title": c.title, "url": c.url})
                seen_urls.add(c.url)
        if len(week_items) < 2 and cert_idx < len(matched_certs):
            c = matched_certs[cert_idx]
            cert_idx += 1
            if c.url and c.url not in seen_urls:
                week_items.append({"role": "cert", "stream": "cert", "id": c.id,
                                   "title": c.title, "url": c.url})
                seen_urls.add(c.url)
        plan.append({
            "week": week,
            "items": week_items,
            "honest_empty": (None if week_items else
                             f"no item matched skill='{skill_keyword}' for week {week}"),
        })

    return {
        "profession": profession_slug,
        "skill_keyword": skill_keyword,
        "weeks": weeks,
        "plan": plan,
        "matched_courses_total": len(matched_courses),
        "matched_certs_total":   len(matched_certs),
        "rule_version": RULE_VERSION,
        "honest_note": (
            "Rules-only. Coach assembles a week-by-week plan ONLY from items "
            "already in the DB. Never invents weeks; if the corpus is thin, "
            "later weeks carry honest_empty notes."
        ),
    }


# ────────────────────────────────────────────────────────────────────────
# 4. Opportunity Engine
# ────────────────────────────────────────────────────────────────────────

def opportunity_engine(profession_slug: str, geo: str = "india",
                       lookback_days: int = 30, limit: int = 20) -> dict:
    """Ranked top-N actionable opportunities across job + grant + scheme + startup.

    Ranking signal per item:
        score = profession_relevance_confidence * 100
              + freshness_bonus  (0..30, decays linearly over lookback_days)
              + stream_weight    (job=20, grant=15, scheme=10, startup=5)
    Returns the top `limit` items, with full provenance.
    """
    limit = max(1, min(limit, 100))
    lookback_days = max(1, min(lookback_days, 90))
    since = datetime.utcnow() - timedelta(days=lookback_days)

    stream_weight = {"job": 20, "grant": 15, "scheme": 10, "startup": 5}
    interesting_kinds = list(stream_weight.keys())

    ranked = []
    with SessionLocal() as db:
        rows = (db.query(ProfessionRelevance, AggregatedItem)
                  .join(AggregatedItem, ProfessionRelevance.item_id == AggregatedItem.id)
                  .filter(ProfessionRelevance.profession_slug == profession_slug,
                          ProfessionRelevance.item_kind.in_(interesting_kinds),
                          ProfessionRelevance.classified_at >= since)
                  .order_by(desc(ProfessionRelevance.classified_at))
                  .limit(500).all())
        for rel, item in rows:
            age_days = (datetime.utcnow() - (item.ingested_at or datetime.utcnow())).days
            freshness = max(0, 30 - (age_days * 30 // max(1, lookback_days)))
            score = ((rel.confidence or 0) * 100
                     + freshness
                     + stream_weight.get(rel.item_kind, 0))
            ranked.append({
                "id": item.id,
                "stream": rel.item_kind,
                "title": item.title,
                "url": item.url,
                "source": item.source_slug,
                "ingested_at": item.ingested_at.isoformat() if item.ingested_at else None,
                "age_days": age_days,
                "profession_confidence": round(rel.confidence or 0, 3),
                "score": round(score, 1),
                "matched_keywords": rel.matched_keywords,
            })

    ranked.sort(key=lambda x: -x["score"])
    top = ranked[:limit]
    return {
        "profession": profession_slug,
        "geo": geo,
        "lookback_days": lookback_days,
        "limit": limit,
        "total_candidates": len(ranked),
        "opportunities": top,
        "ranking_formula": (
            "score = profession_confidence*100 + freshness(0..30) + "
            "stream_weight(job=20/grant=15/scheme=10/startup=5)"
        ),
        "rule_version": RULE_VERSION,
        "honest_note": (
            "Rules-only. Ranks profession-tagged items from "
            "job/grant/scheme/startup streams. If total_candidates=0 the "
            "corpus is empty for this profession; we never pad."
        ),
    }


# ────────────────────────────────────────────────────────────────────────
# helpers
# ────────────────────────────────────────────────────────────────────────

def _empty(profession_slug, geo, lookback_days, feature_name) -> dict:
    return {
        "profession": profession_slug, "geo": geo,
        "lookback_days": lookback_days, feature_name: [],
        "rule_version": RULE_VERSION,
        "honest_note": (
            f"Profession '{profession_slug}' has no skill-keyword vocabulary "
            f"in opportunity_radar._SKILL_KEYWORDS yet -- {feature_name} cannot "
            "surface anything until the vocabulary is extended."
        ),
    }
