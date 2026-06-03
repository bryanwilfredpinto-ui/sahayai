"""
routes/feed.py
--------------
Per-profession aggregator feed (CHITTI_NEWS_AI_MASTER_SPEC v0.3 §7).

Phase 1 scope: 7 streams. Each carries the v0.3 §4.2 explainability
contract on every classified item (category + matched_keywords +
confidence + source_signals + rule_version).

Streams:
  - news               → articles table (existing RSS feed corpus)
  - courses            → courses_v2 table (Phase 0)
  - cert / tool / job / scheme / roadmap_node → aggregated_items table

Route:
  GET /api/news-ai/feed/<stream>
        ?profession=<slug>            default: 'everyone' (no filter)
        &lang=<code>                  echoed, data fields stay verbatim
        &n=<int>                      1..100
        &min_confidence=<float>       0..1, default 0.5

Plus three admin endpoints (METRICS_TOKEN-gated):
  POST /api/news-ai/feed/admin/ingest/courses-now
  POST /api/news-ai/feed/admin/ingest/streams-now
  POST /api/news-ai/feed/admin/classify/all-now
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from flask import Blueprint, abort, jsonify, request
from sqlalchemy import desc

from database import SessionLocal
from models.courses_v2 import CourseV2, ProfessionRelevance
from models.aggregated_items import AggregatedItem
from models.articles import Article

log = logging.getLogger("routes.feed")

bp = Blueprint("feed", __name__, url_prefix="/api/news-ai/feed")

_STREAM_KINDS = {"news", "courses", "cert", "tool", "job", "scheme", "roadmap_node"}
_AGG_KINDS    = {"cert", "tool", "job", "scheme", "roadmap_node"}
_DEFAULT_LIMIT = 20
_MAX_LIMIT = 100


# ────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────

def _arg_str(key: str, default: str = "") -> str:
    v = request.args.get(key) or default
    return (v or "").strip().lower()


def _arg_int(key: str, default: int) -> int:
    try:
        return int(request.args.get(key, default))
    except (TypeError, ValueError):
        return default


def _explain(relevance: Optional[ProfessionRelevance],
             title: str, summary: Optional[str], topics: Optional[str],
             source_slug: Optional[str], url: Optional[str]) -> Optional[dict]:
    """Re-derive the explainability bundle so re-tunes show up without re-ingest."""
    if relevance is None:
        return None
    from services.profession_classifier import classify as _classify
    tags = _classify(title, summary, topics, source_slug=source_slug, url=url)
    match = next((t for t in tags if t["profession_slug"] == relevance.profession_slug), None)
    return {
        "category":         relevance.profession_slug,
        "confidence":       float(relevance.confidence),
        "matched_keywords": (match or {}).get("matched_keywords", []),
        "source_signals":   (match or {}).get("source_signals", []),
        "rule_version":     relevance.classifier_version,
    }


def _source_block(name: str, slug: str, domain: str) -> dict:
    return {"slug": slug, "name": name, "domain": domain}


def _course_to_dict(c: CourseV2, relevance: Optional[ProfessionRelevance]) -> dict:
    return {
        "id": c.id, "kind": "course", "title": c.title, "url": c.url,
        "summary": c.summary,
        "duration_minutes": c.duration_minutes, "level": c.level,
        "topics": (c.topics or "").split(",") if c.topics else [],
        "source": _source_block(c.source_name, c.source_slug, c.source_domain),
        "is_free": bool(c.is_free), "cost_label": c.cost_label,
        "classification": _explain(relevance, c.title, c.summary, c.topics, c.source_slug, c.url),
        "ingested_at": c.ingested_at.isoformat() + "Z" if c.ingested_at else None,
        "last_verified_at": c.last_verified_at.isoformat() + "Z" if c.last_verified_at else None,
        "last_verified_status": c.last_verified_status,
    }


def _agg_to_dict(a: AggregatedItem, relevance: Optional[ProfessionRelevance]) -> dict:
    return {
        "id": a.id, "kind": a.kind, "title": a.title, "url": a.url,
        "summary": a.summary,
        "duration_minutes": a.duration_minutes, "level": a.level,
        "location": a.location, "employer": a.employer,
        "topics": (a.topics or "").split(",") if a.topics else [],
        "source": _source_block(a.source_name, a.source_slug, a.source_domain),
        "is_free": bool(a.is_free), "cost_label": a.cost_label,
        "classification": _explain(relevance, a.title, a.summary, a.topics, a.source_slug, a.url),
        "ingested_at": a.ingested_at.isoformat() + "Z" if a.ingested_at else None,
    }


def _article_to_dict(a: Article, relevance: Optional[ProfessionRelevance]) -> dict:
    return {
        "id": a.id, "kind": "news", "title": a.title, "url": a.url,
        "summary": a.summary,
        "image_url": a.image_url, "language": a.language,
        "topics": [a.tab] if a.tab else [],
        "source": _source_block(a.source_name or a.source_slug, a.source_slug, ""),
        "is_free": True, "cost_label": None,
        "classification": _explain(relevance, a.title, a.summary, None, None, a.url),
        "ingested_at": a.ingested_utc.isoformat() + "Z" if a.ingested_utc else None,
        "published_at": a.published_utc.isoformat() + "Z" if a.published_utc else None,
    }


# ────────────────────────────────────────────────────────────────────────
# Main route
# ────────────────────────────────────────────────────────────────────────

@bp.get("/<string:stream>")
def feed_stream(stream: str):
    stream = stream.lower()
    if stream not in _STREAM_KINDS:
        abort(400, description=f"unknown stream {stream!r}; allowed: {sorted(_STREAM_KINDS)}")

    profession = _arg_str("profession", "everyone")
    lang = _arg_str("lang", "en")
    n = max(1, min(_arg_int("n", _DEFAULT_LIMIT), _MAX_LIMIT))
    min_conf = float(request.args.get("min_confidence", "0.5"))
    no_filter = profession in {"", "everyone"}

    items: list[dict] = []
    classification_mode = "off" if no_filter else "on"

    with SessionLocal() as db:
        if stream == "courses":
            if no_filter:
                rows = db.query(CourseV2).order_by(desc(CourseV2.ingested_at)).limit(n).all()
                items = [_course_to_dict(c, None) for c in rows]
            else:
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

        elif stream == "news":
            if no_filter:
                rows = db.query(Article).order_by(desc(Article.ingested_utc)).limit(n).all()
                items = [_article_to_dict(a, None) for a in rows]
            else:
                rels = (
                    db.query(ProfessionRelevance, Article)
                      .join(Article, Article.id == ProfessionRelevance.item_id)
                      .filter(
                          ProfessionRelevance.item_kind == "article",
                          ProfessionRelevance.profession_slug == profession,
                          ProfessionRelevance.confidence >= min_conf,
                      )
                      .order_by(desc(ProfessionRelevance.confidence), desc(Article.ingested_utc))
                      .limit(n).all()
                )
                items = [_article_to_dict(a, r) for r, a in rels]

        elif stream in _AGG_KINDS:
            if no_filter:
                rows = (
                    db.query(AggregatedItem)
                      .filter(AggregatedItem.kind == stream)
                      .order_by(desc(AggregatedItem.ingested_at))
                      .limit(n).all()
                )
                items = [_agg_to_dict(a, None) for a in rows]
            else:
                rels = (
                    db.query(ProfessionRelevance, AggregatedItem)
                      .join(AggregatedItem, AggregatedItem.id == ProfessionRelevance.item_id)
                      .filter(
                          AggregatedItem.kind == stream,
                          ProfessionRelevance.item_kind == stream,
                          ProfessionRelevance.profession_slug == profession,
                          ProfessionRelevance.confidence >= min_conf,
                      )
                      .order_by(desc(ProfessionRelevance.confidence), desc(AggregatedItem.ingested_at))
                      .limit(n).all()
                )
                items = [_agg_to_dict(a, r) for r, a in rels]

    if not items:
        return jsonify({
            "items": [], "count": 0, "stream": stream,
            "profession": profession, "language": lang,
            "classification_mode": classification_mode,
            "speak_en": f"No {stream} for this profession yet — Chitti is still building. Try profession 'everyone'.",
            "speak_hi": f"इस पेशे के लिए अभी कोई {stream} नहीं — चिट्टी अभी जोड़ रहा है। 'everyone' चुनें।",
            "honest_note_en": "Aggregator returns no rows — never a fabricated entry.",
        }), 200

    return jsonify({
        "items": items, "count": len(items), "stream": stream,
        "profession": profession, "language": lang,
        "classification_mode": classification_mode,
        "speak_en": f"{len(items)} {stream} items for {profession}.",
        "speak_hi": f"{profession} के लिए {len(items)} {stream}।",
    }), 200


# ────────────────────────────────────────────────────────────────────────
# Admin triggers
# ────────────────────────────────────────────────────────────────────────

def _require_metrics_token() -> None:
    expected = (os.environ.get("METRICS_TOKEN") or "").strip()
    if not expected:
        abort(503, description="METRICS_TOKEN not configured on the server")
    provided = (request.headers.get("X-Metrics-Token") or request.args.get("token") or "").strip()
    if provided != expected:
        abort(401, description="bad or missing metrics token")


@bp.post("/admin/ingest/courses-now")
def admin_ingest_courses_now():
    _require_metrics_token()
    from services.courses_ingestor import ingest_all
    return jsonify(ingest_all()), 200


@bp.post("/admin/ingest/streams-now")
def admin_ingest_streams_now():
    _require_metrics_token()
    from services.streams_ingestor import ingest_all
    return jsonify(ingest_all()), 200


@bp.post("/admin/classify/all-now")
def admin_classify_all_now():
    _require_metrics_token()
    from services.profession_classifier import (
        classify_unlabeled_courses, classify_unlabeled_articles,
        classify_unlabeled_stream_items,
    )
    limit = int(request.args.get("limit", "1000"))
    return jsonify({
        "courses":   classify_unlabeled_courses(limit=limit),
        "articles":  classify_unlabeled_articles(limit=limit),
        "streams":   classify_unlabeled_stream_items(limit=limit),
    }), 200


# ────────────────────────────────────────────────────────────────────────
# Enhancement endpoints (v0.3 §4.3) — LLM optional, extractive fallback
# ────────────────────────────────────────────────────────────────────────

@bp.post("/<string:stream>/<int:item_id>/explain")
def explain_item(stream: str, item_id: int):
    """On-demand long-form explanation. Tries LLM, falls back to extractive."""
    stream = stream.lower()
    if stream not in _STREAM_KINDS:
        abort(400, description=f"unknown stream {stream!r}")
    body = request.get_json(silent=True) or {}
    language = (body.get("language") or _arg_str("language", "en")).lower()

    with SessionLocal() as db:
        if stream == "courses":
            row = db.query(CourseV2).filter(CourseV2.id == item_id).first()
            if not row:
                abort(404, description="course not found")
            item = {"title": row.title, "summary": row.summary,
                    "content": None, "url": row.url, "language": "en"}
        elif stream == "news":
            row = db.query(Article).filter(Article.id == item_id).first()
            if not row:
                abort(404, description="article not found")
            item = {"title": row.title, "summary": row.summary,
                    "content": row.content, "url": row.url,
                    "language": row.language or "en"}
        elif stream in _AGG_KINDS:
            row = db.query(AggregatedItem).filter(
                AggregatedItem.kind == stream, AggregatedItem.id == item_id
            ).first()
            if not row:
                abort(404, description=f"{stream} item not found")
            item = {"title": row.title, "summary": row.summary,
                    "content": None, "url": row.url, "language": "en"}

    from services.enhancement import explain as _explain_item
    result = _explain_item(item, language=language)
    result["item_id"] = item_id
    result["stream"] = stream
    result["url"] = item.get("url")
    return jsonify(result), 200


@bp.post("/<string:stream>/<int:item_id>/career-insight")
def career_insight_endpoint(stream: str, item_id: int):
    """Extractive career-insight bullets for a profession (no LLM)."""
    stream = stream.lower()
    if stream not in _STREAM_KINDS:
        abort(400, description=f"unknown stream {stream!r}")
    body = request.get_json(silent=True) or {}
    profession = (body.get("profession") or _arg_str("profession", "")).lower()
    if not profession:
        abort(400, description="profession is required")
    language = (body.get("language") or _arg_str("language", "en")).lower()

    with SessionLocal() as db:
        if stream == "courses":
            row = db.query(CourseV2).filter(CourseV2.id == item_id).first()
            if not row:
                abort(404, description="course not found")
            item = {"title": row.title, "summary": row.summary,
                    "topics": row.topics, "url": row.url}
        elif stream == "news":
            row = db.query(Article).filter(Article.id == item_id).first()
            if not row:
                abort(404, description="article not found")
            item = {"title": row.title, "summary": row.summary,
                    "topics": row.tab, "url": row.url}
        elif stream in _AGG_KINDS:
            row = db.query(AggregatedItem).filter(
                AggregatedItem.kind == stream, AggregatedItem.id == item_id
            ).first()
            if not row:
                abort(404, description=f"{stream} item not found")
            item = {"title": row.title, "summary": row.summary,
                    "topics": row.topics, "url": row.url}

    from services.enhancement import career_insight as _ci
    result = _ci(item, profession_slug=profession, language=language)
    result["item_id"] = item_id
    result["stream"] = stream
    result["profession"] = profession
    return jsonify(result), 200


@bp.get("/admin/stats")
def admin_stats():
    _require_metrics_token()
    with SessionLocal() as db:
        out: dict = {
            "courses_total": db.query(CourseV2).count(),
            "articles_total": db.query(Article).count(),
            "agg_items_by_kind": {},
            "labels_by_kind": {},
            "labels_by_profession": {},
        }
        for r in db.query(AggregatedItem.kind).all():
            out["agg_items_by_kind"][r[0]] = out["agg_items_by_kind"].get(r[0], 0) + 1
        for r in db.query(ProfessionRelevance.item_kind).all():
            out["labels_by_kind"][r[0]] = out["labels_by_kind"].get(r[0], 0) + 1
        for r in db.query(ProfessionRelevance.profession_slug).all():
            out["labels_by_profession"][r[0]] = out["labels_by_profession"].get(r[0], 0) + 1
    return jsonify(out), 200
