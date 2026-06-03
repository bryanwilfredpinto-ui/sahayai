"""
routes/news.py
--------------
Flask Blueprint covering /api/news/*.

  GET   /api/news/feed                              ?state=&language=&category=&limit=
  GET   /api/news/<state>/<language>/<category>     pretty alias
  GET   /api/news/breaking                          ?state=&language=
  GET   /api/news/article/<id>                      single article
  GET   /api/news/article/<id>/take                 ?language=  Chitti's Take
  GET   /api/news/article/<id>/explain              ?language=  Explain Simply (P0)
  POST  /api/news/article/<id>/factcheck            forces recompute (force=1)
  GET   /api/news/sources                           ?state=&language=

  ── Per-device folders (X-User-Token header) ──
  POST   /api/news/save                             {article_id, folder='saved'|'cancelled', note}
  GET    /api/news/save                             ?folder=saved
  DELETE /api/news/save/<entry_id>

  ── Scheduler ops ──
  GET   /api/news/scheduler/status
  POST  /api/news/scheduler/trigger/<job_id>        light auth via X-User-Token
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from functools import wraps

from flask import Blueprint, abort, jsonify, request

from database import SessionLocal
from models.article import Article
from models.read_later import ReadLater
from services import (
    article_body,
    news_db,
    news_explain,
    news_factcheck,
    news_scheduler,
    news_summary,
)
from services.category_classifier import classify_article

log = logging.getLogger("routes.news")

bp = Blueprint("news", __name__, url_prefix="/api/news")


# ─── Helpers ───

def with_db(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        db = SessionLocal()
        try:
            return fn(db, *args, **kwargs)
        finally:
            db.close()
    return wrapper


def _user_token_or_400() -> str:
    token = (request.headers.get("X-User-Token") or "").strip()
    if not token or len(token) < 8:
        abort(400, description=(
            "Missing X-User-Token header. Frontend should generate a UUID and store it in localStorage."
        ))
    return token


def _str_arg(name: str, default: str = "") -> str:
    return (request.args.get(name) or default).strip()


def _int_arg(name: str, default: int, lo: int = 1, hi: int = 200) -> int:
    raw = request.args.get(name)
    if raw is None or raw == "":
        return default
    try:
        v = int(raw)
    except (TypeError, ValueError):
        abort(400, description=f"{name} must be an integer")
    return max(lo, min(hi, v))


# ─── Feed ───

@bp.get("/feed")
@with_db
def feed(db):
    state = _str_arg("state", "india").lower()
    language = _str_arg("language", "en").lower()
    category = _str_arg("category", "national").lower()
    limit = _int_arg("limit", default=30, lo=1, hi=100)
    return jsonify(news_db.feed(db, state=state, language=language, category=category, limit=limit))


@bp.get("/<state>/<language>/<category>")
@with_db
def feed_pretty(db, state, language, category):
    """Pretty alias: /api/news/india/en/national."""
    limit = _int_arg("limit", default=30, lo=1, hi=100)
    return jsonify(news_db.feed(
        db,
        state=state.lower(),
        language=language.lower(),
        category=category.lower(),
        limit=limit,
    ))


@bp.get("/breaking")
@with_db
def breaking(db):
    state = _str_arg("state", "india").lower()
    language = _str_arg("language", "en").lower()
    items = news_db.list_breaking(db, state=state, language=language, limit=10)
    return jsonify({"items": items, "count": len(items), "state": state, "language": language})


@bp.get("/article/<int:article_id>")
@with_db
def article(db, article_id):
    a = news_db.get_article(db, article_id)
    if not a:
        abort(404, description="article not found")
    return jsonify(a)


@bp.get("/article/<int:article_id>/body")
@with_db
def article_body_route(db, article_id):
    """
    Sire 2026-06-02 — speaker-reads-full-news contract. Many regional
    RSS publishers ship only a 300-char summary. When the 🔊 button
    fires on such an article, the frontend hits this endpoint, which
    fetches the article URL server-side, extracts the main body
    (BeautifulSoup heuristic over <article> / itemprop="articleBody" /
    article-content classes), caches it in Article.content, and returns
    plain text. Blind users then hear the ENTIRE news.

    Idempotent — if Article.content is already populated with enough
    words, returns it immediately.
    """
    from models.article import Article
    a = db.query(Article).filter(Article.id == article_id).first()
    if not a:
        abort(404, description="article not found")
    body = article_body.ensure_body(db, a)
    return jsonify({
        "article_id": article_id,
        "body": body or "",
        "word_count": len((body or "").split()),
        "cached": bool(a.content),
        "source": "rss_content" if (a.content and len((a.content or "").split()) >= 80) else "extracted",
    })


@bp.get("/article/<int:article_id>/take")
@with_db
def article_take(db, article_id):
    language = _str_arg("language", "en").lower()
    return jsonify(news_summary.chittis_take(db, article_id, language))


@bp.get("/article/<int:article_id>/explain")
@with_db
def article_explain(db, article_id):
    """
    P0 'Explain Simply' (2026-05-13) — class-5 plain-language version
    of the article in the user's chosen language. Voice-first.
    """
    language = _str_arg("language", "en").lower()
    return jsonify(news_explain.explain_simply(db, article_id, language))


@bp.post("/article/<int:article_id>/factcheck")
@with_db
def article_factcheck(db, article_id):
    force = _str_arg("force", "0") == "1"
    return jsonify(news_factcheck.factcheck(db, article_id, force=force))


@bp.get("/article/<int:article_id>/factcheck")
@with_db
def article_factcheck_get(db, article_id):
    """GET version — returns cached if any, else recomputes."""
    return jsonify(news_factcheck.factcheck(db, article_id, force=False))


# ─── Sources ───

@bp.get("/sources")
@with_db
def sources(db):
    state = request.args.get("state")
    language = request.args.get("language")
    items = news_db.list_sources(db, state=state, language=language)
    return jsonify({"items": items, "count": len(items)})


# ─── Per-device folders (Read Later / Cancelled) ───

@bp.post("/save")
@with_db
def save_add(db):
    token = _user_token_or_400()
    body = request.get_json(silent=True) or {}
    article_id = body.get("article_id")
    if not isinstance(article_id, int):
        abort(400, description="article_id (int) required")
    folder = (body.get("folder") or "saved").lower()
    if folder not in ("saved", "cancelled"):
        abort(400, description="folder must be 'saved' or 'cancelled'")
    if not db.query(Article).filter(Article.id == article_id).first():
        abort(404, description="article not found")
    note = (body.get("note") or "")[:240] or None
    # Upsert by (token, article, folder)
    existing = (
        db.query(ReadLater)
        .filter(ReadLater.user_token == token, ReadLater.article_id == article_id, ReadLater.folder == folder)
        .first()
    )
    if existing:
        existing.note = note
        existing.added_at = datetime.utcnow()
    else:
        db.add(ReadLater(
            user_token=token, article_id=article_id, folder=folder, note=note,
            added_at=datetime.utcnow(),
        ))
    db.commit()
    return jsonify({"ok": True, "folder": folder, "article_id": article_id})


@bp.get("/save")
@with_db
def save_list(db):
    token = _user_token_or_400()
    folder = _str_arg("folder", "saved").lower()
    if folder not in ("saved", "cancelled"):
        abort(400, description="folder must be 'saved' or 'cancelled'")
    rows = (
        db.query(ReadLater, Article)
        .join(Article, Article.id == ReadLater.article_id)
        .filter(ReadLater.user_token == token, ReadLater.folder == folder)
        .order_by(ReadLater.added_at.desc())
        .limit(200).all()
    )
    items = []
    for rl, a in rows:
        items.append({
            "entry_id": rl.id,
            "added_at": rl.added_at.isoformat() if rl.added_at else None,
            "note": rl.note,
            "article": {
                "id": a.id, "title": a.title, "link": a.link, "summary": a.summary,
                "content": a.content,
                "source_name": a.source_name, "source_slug": a.source_slug,
                "image_url": a.image_url, "category": a.category,
                "language": a.language, "state": a.state,
                "published_at": a.published_at.isoformat() if a.published_at else None,
            },
        })
    return jsonify({"items": items, "count": len(items), "folder": folder})


@bp.delete("/save/<int:entry_id>")
@with_db
def save_delete(db, entry_id):
    token = _user_token_or_400()
    row = db.query(ReadLater).filter(ReadLater.user_token == token, ReadLater.id == entry_id).first()
    if not row:
        abort(404, description="entry not found")
    db.delete(row)
    db.commit()
    return jsonify({"ok": True})


# ─── Scheduler ops ───

@bp.get("/scheduler/status")
def scheduler_status_route():
    return jsonify(news_scheduler.status())


@bp.post("/scheduler/trigger/<job_id>")
def scheduler_trigger(job_id):
    _user_token_or_400()
    return jsonify(news_scheduler.trigger_now(job_id))


# ─── Retroactive category reclassifier ───
# Sire 2026-06-03 — trust-in-IA fix. Before this endpoint shipped,
# clicking "Business" surfaced "West Indies vs Sri Lanka: Schedule…"
# as the top card because NDTV's /business RSS mixed cricket into
# business at the source. We now re-classify at ingest, but the 7000+
# rows already in the DB still carry the polluted source.category.
#
# This endpoint walks every Article and re-classifies from title+
# summary. Dry-run by default (?apply=0) so an audit pass costs nothing
# and surfaces the counts before any UPDATE. Pass ?apply=1 + the
# X-User-Token header to commit the corrected categories. Returns the
# per-bank delta so we can see "Business shed 412 sports rows, gained
# 17 from tech."

@bp.post("/admin/reclassify")
@with_db
def admin_reclassify(db):
    _user_token_or_400()
    apply_changes = request.args.get("apply", "0").lower() in ("1", "true", "yes")
    limit_raw = request.args.get("limit")
    try:
        limit = int(limit_raw) if limit_raw else None
    except (TypeError, ValueError):
        abort(400, description="limit must be an integer")

    q = db.query(Article).order_by(Article.id.desc())
    if limit:
        q = q.limit(limit)

    moves: dict = {}     # (from_cat, to_cat) -> count
    examples: dict = {}  # (from_cat, to_cat) -> [titles]
    scanned = 0
    overridden = 0
    for art in q.yield_per(500):
        scanned += 1
        new_cat = classify_article(art.title or "", art.summary or "", art.category)
        if new_cat == art.category:
            continue
        overridden += 1
        key = f"{art.category}->{new_cat}"
        moves[key] = moves.get(key, 0) + 1
        if len(examples.setdefault(key, [])) < 3:
            examples[key].append({
                "id": art.id, "source": art.source_name,
                "title": (art.title or "")[:120],
            })
        if apply_changes:
            art.category = new_cat
    if apply_changes:
        db.commit()
    return jsonify({
        "applied": apply_changes,
        "scanned": scanned,
        "overridden": overridden,
        "moves": moves,
        "examples": examples,
    })
