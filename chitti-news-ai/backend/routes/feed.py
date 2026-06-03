"""
routes/feed.py
--------------
Per-profession aggregator feed (CHITTI_NEWS_AI_MASTER_SPEC v0.2 §7).

Phase 0 scope: ONE endpoint, ONE section (courses), gated by the 5-metric
benchmark report. Other sections (news / certs / tools / jobs / govt /
roadmap) land in Phase 1 only after Sire approves the benchmark.

Honest contract per item (v0.2 §10):
  - source_name + source_domain (provider attribution always visible)
  - url (the provider's own page, never a Chitti-owned link)
  - cost_label (verbatim from the provider — never inferred)
  - confidence (the classifier's number, never hidden)
  - classifier_mode ∈ {"llm","rule"} so the UI can show "classification offline"
  - last_verified_at (the link-checker timestamp, or null if never checked)
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from flask import Blueprint, abort, jsonify, request
from sqlalchemy import desc

from database import SessionLocal
from models.courses_v2 import CourseV2, ProfessionRelevance

log = logging.getLogger("routes.feed")

bp = Blueprint("feed", __name__, url_prefix="/api/news-ai/feed")


_VALID_SECTIONS = {"courses"}                            # Phase 0; expand only after benchmark passes
_DEFAULT_LIMIT = 20
_MAX_LIMIT = 100


def _arg_str(key: str, default: str = "") -> str:
    v = request.args.get(key) or default
    return (v or "").strip().lower()


def _arg_int(key: str, default: int) -> int:
    try:
        return int(request.args.get(key, default))
    except (TypeError, ValueError):
        return default


def _course_to_dict(c: CourseV2, relevance: Optional[ProfessionRelevance]) -> dict:
    """One course → JSON. Source attribution + classifier transparency are mandatory."""
    return {
        "id": c.id,
        "kind": "course",
        "title": c.title,
        "url": c.url,                                    # provider's own URL — always
        "summary": c.summary,
        "duration_minutes": c.duration_minutes,
        "level": c.level,
        "topics": (c.topics or "").split(",") if c.topics else [],
        # Provider attribution — required by v0.2 §10 Trust contract.
        "source": {
            "slug": c.source_slug,
            "name": c.source_name,
            "domain": c.source_domain,
        },
        # Cost — verbatim from the provider; never inferred.
        "is_free": bool(c.is_free),
        "cost_label": c.cost_label,
        # Classifier transparency — required by v0.2 §10.
        "classification": {
            "profession_slug": relevance.profession_slug if relevance else None,
            "confidence": float(relevance.confidence) if relevance else None,
            "classifier_version": relevance.classifier_version if relevance else None,
        } if relevance else None,
        # Bookkeeping — visible on tap-and-hold for stale flagging.
        "ingested_at": c.ingested_at.isoformat() + "Z" if c.ingested_at else None,
        "last_verified_at": c.last_verified_at.isoformat() + "Z" if c.last_verified_at else None,
        "last_verified_status": c.last_verified_status,
    }


@bp.get("/courses")
def feed_courses():
    """Aggregated courses, optionally filtered by profession.

    Query:
      profession  — slug from profession_registry.json; default 'everyone' = no filter
      lang        — display language for response strings; data fields stay verbatim
      n           — max items, 1..100
      min_confidence — items below this classifier confidence are excluded (default 0.6)
    """
    profession = _arg_str("profession", "everyone")
    lang = _arg_str("lang", "en")
    n = max(1, min(_arg_int("n", _DEFAULT_LIMIT), _MAX_LIMIT))
    min_conf = float(request.args.get("min_confidence", "0.6"))

    with SessionLocal() as db:
        if profession in {"", "everyone"}:
            # No filter — return latest ingested courses across all sources.
            rows = (
                db.query(CourseV2)
                  .order_by(desc(CourseV2.ingested_at))
                  .limit(n).all()
            )
            items = [_course_to_dict(c, None) for c in rows]
            classification_mode = "off"
        else:
            # Filter by classified profession relevance.
            rels = (
                db.query(ProfessionRelevance, CourseV2)
                  .join(CourseV2, CourseV2.id == ProfessionRelevance.item_id)
                  .filter(
                      ProfessionRelevance.item_kind == "course",
                      ProfessionRelevance.profession_slug == profession,
                      ProfessionRelevance.confidence >= min_conf,
                  )
                  .order_by(desc(ProfessionRelevance.confidence), desc(CourseV2.ingested_at))
                  .limit(n).all()
            )
            items = [_course_to_dict(c, r) for r, c in rels]
            classification_mode = "on"

    # Honest empty state — never fabricate, never recommend.
    if not items:
        return jsonify({
            "items": [],
            "count": 0,
            "section": "courses",
            "profession": profession,
            "language": lang,
            "classification_mode": classification_mode,
            "speak_en": ("No classified courses for this profession yet — Chitti is still learning. "
                         "Try profession 'everyone' to see all ingested courses."),
            "speak_hi": ("इस पेशे के लिए अभी कोई वर्गीकृत कोर्स नहीं मिला — चिट्टी अभी सीख रहा है। "
                         "सभी कोर्स देखने के लिए 'everyone' चुनें।"),
            "honest_note_en": "Aggregator returns no rows — never a fabricated entry.",
        }), 200

    return jsonify({
        "items": items,
        "count": len(items),
        "section": "courses",
        "profession": profession,
        "language": lang,
        "classification_mode": classification_mode,
        "speak_en": f"{len(items)} courses for {profession}.",
        "speak_hi": f"{profession} के लिए {len(items)} कोर्स।",
    }), 200


# ────────────────────────────────────────────────────────────────────────
# Admin triggers — METRICS_TOKEN-gated, same pattern as the daily-tip prewarm
# ────────────────────────────────────────────────────────────────────────

def _require_metrics_token() -> None:
    expected = (os.environ.get("METRICS_TOKEN") or "").strip()
    if not expected:
        abort(503, description="METRICS_TOKEN not configured on the server")
    provided = (request.headers.get("X-Metrics-Token")
                or request.args.get("token") or "").strip()
    if provided != expected:
        abort(401, description="bad or missing metrics token")


@bp.post("/admin/ingest/courses-now")
def admin_ingest_courses_now():
    """Run the full courses ingest pass against the 8 seeded sources."""
    _require_metrics_token()
    from services.courses_ingestor import ingest_all
    return jsonify(ingest_all()), 200


@bp.post("/admin/classify/courses-now")
def admin_classify_courses_now():
    """Classify all un-classified courses at the current classifier_version."""
    _require_metrics_token()
    from services.profession_classifier import classify_unlabeled_courses
    limit = int(request.args.get("limit", "500"))
    return jsonify(classify_unlabeled_courses(limit=limit)), 200


@bp.get("/admin/stats")
def admin_stats():
    """How many courses + classifications do we have right now?"""
    _require_metrics_token()
    with SessionLocal() as db:
        total_courses = db.query(CourseV2).count()
        total_rels = db.query(ProfessionRelevance).filter(
            ProfessionRelevance.item_kind == "course",
        ).count()
        by_source = {}
        for r in db.query(CourseV2.source_slug).all():
            by_source[r[0]] = by_source.get(r[0], 0) + 1
        by_prof = {}
        for r in db.query(ProfessionRelevance.profession_slug).filter(
            ProfessionRelevance.item_kind == "course",
        ).all():
            by_prof[r[0]] = by_prof.get(r[0], 0) + 1
    return jsonify({
        "total_courses": total_courses,
        "total_profession_labels": total_rels,
        "courses_by_source": by_source,
        "labels_by_profession": by_prof,
    }), 200
