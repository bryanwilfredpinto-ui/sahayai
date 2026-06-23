"""
services/pipeline.py
--------------------
Thin orchestrator that wires the separately-built skills (BO4 sourcing →
BO5 scoring → BO6 ATS) into the CEOS §23B daily cycle:

  source → deduplicate → score (1-10) → ATS check → store

It does NOT merge the skills into one blob — each skill stays its own
testable module (Section 22). This module only sequences them.
"""
from __future__ import annotations

import json
import logging

from sqlalchemy.orm import Session

from models.job_raw import JobRaw
from models.job_scored import JobScored
from services import ats_engine, job_sources, scoring_engine

log = logging.getLogger("services.pipeline")


def source_user(db: Session, uid: str, profile: dict, per_feed: int = 15) -> dict:
    """BO4: fetch RSS for the user's primary target role(s) + location, ingest."""
    roles = profile.get("target_roles") or []
    locs = profile.get("target_locations") or []
    query = roles[0] if roles else (profile.get("current_role") or "jobs")
    location = locs[0] if locs else ""

    results = {"inserted": 0, "feeds": []}
    feeds = [
        ("naukri_rss", job_sources.naukri_rss_url(query, location)),
        ("indeed_rss", job_sources.indeed_rss_url(query, location)),
    ]
    for source, url in feeds:
        res = job_sources.fetch_rss(url, source, limit=per_feed)
        if res["items"]:
            results["inserted"] += job_sources.ingest_items(db, uid, res["items"])
        results["feeds"].append({"source": source, "got": len(res["items"]), "error": res["error"]})
    return results


def score_pending(db: Session, uid: str, profile: dict) -> dict:
    """BO5 + BO6: score every 'new' raw job for the user; store verdict."""
    resume = profile.get("resume_text") or ""
    pending = db.query(JobRaw).filter(JobRaw.user_id == uid, JobRaw.status == "new").all()
    scored = surfaced = 0
    for raw in pending:
        job = {
            "title": raw.title, "company": raw.company, "location": raw.location,
            "jd_text": raw.jd_text, "posted_at": raw.posted_at,
        }
        verdict = scoring_engine.score_job(profile, job)
        ats = ats_engine.score(resume, raw.jd_text or "") if (resume and raw.jd_text) else None
        reasons = {"score_breakdown": verdict["breakdown"], "raw_delta": verdict["raw_delta"]}
        if ats:
            reasons["ats"] = {"match_pct": ats["match_pct"], "missing": ats["missing"][:8],
                              "tailor_recommended": ats["tailor_recommended"]}

        existing = (
            db.query(JobScored)
            .filter(JobScored.user_id == uid, JobScored.job_id == raw.id)
            .first()
        )
        if existing is None:
            existing = JobScored(user_id=uid, job_id=raw.id)
            db.add(existing)
        existing.score = verdict["score"]
        existing.ats_match_pct = ats["match_pct"] if ats else None
        existing.match_reasons = json.dumps(reasons)
        existing.status = "pending"
        raw.status = "scored"
        scored += 1
        if verdict["surfaced"]:
            surfaced += 1
    if scored:
        db.commit()
    return {"scored": scored, "surfaced": surfaced}


def run_daily_for_user(db: Session, uid: str, profile: dict) -> dict:
    src = source_user(db, uid, profile)
    sc = score_pending(db, uid, profile)
    return {"uid": uid, "source": src, "score": sc}
