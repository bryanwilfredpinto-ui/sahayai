"""
routes/news_ai.py
-----------------
Chitti News AI — clean surface per Sire's 2026-05-23 final architecture.

  GET  /api/news-ai/feed?tab=<t>&language=<l>&profession=<p>&limit=N
  POST /api/news-ai/article/<id>/explain   body: {language, profession}
  GET  /api/news-ai/courses
  GET  /api/news-ai/sources
  GET  /api/news-ai/scheduler/status
  POST /api/news-ai/scheduler/trigger/<job_id>     (async — never blocks)
  GET  /api/news-ai/disclaimer
  GET  /api/news-ai/languages
"""
from __future__ import annotations

from datetime import datetime, timedelta

from flask import Blueprint, abort, jsonify, request
from sqlalchemy import desc

from database import SessionLocal
from models.articles import Article
from models.sources import Source
from services import courses as courses_service
from services import news_explain
from services import news_scheduler

bp = Blueprint("news_ai", __name__, url_prefix="/api/news-ai")

# Kept for backward-compat with main.py register; intentionally empty
# blueprint (no AI daily-tip in the new spec).
daily_tip_bp = Blueprint("daily_tip", __name__, url_prefix="/api")

DISCLAIMER_EN = (
    "Chitti News AI aggregates headlines from 8 trusted AI publishers via public RSS feeds. "
    "We do not write the news — we deliver it. The Chitti icon explains an article in your "
    "language, in simple words, using ONLY what the article says. No opinions added. "
    "Always verify with the original source link before sharing."
)
DISCLAIMER_HI = (
    "चिट्टी न्यूज़ AI 8 भरोसेमंद AI प्रकाशकों के सार्वजनिक RSS फ़ीड से शीर्षक एकत्र करता है। "
    "हम खबरें नहीं लिखते — हम पहुँचाते हैं। चिट्टी का आइकन हर लेख को आपकी भाषा में, सिर्फ़ उसी "
    "लेख में लिखी बातों से समझाता है। कोई राय नहीं जोड़ी जाती। शेयर करने से पहले मूल स्रोत पर पुष्टि करें।"
)


def _str_arg(name: str, default: str) -> str:
    return (request.args.get(name) or default).strip()


def _int_arg(name: str, default: int) -> int:
    v = request.args.get(name)
    if not v:
        return default
    try:
        return int(v)
    except Exception:  # noqa: BLE001
        abort(400, description=f"{name} must be an integer")


def _article_to_dict(a: Article) -> dict:
    return {
        "id": a.id,
        "title": a.title,
        "url": a.url,
        "summary": a.summary,
        "content": a.content,
        "image_url": a.image_url,
        "source_slug": a.source_slug,
        "source_name": a.source_name,
        "tab": a.tab,
        "is_bharat": bool(a.is_bharat),
        "language": a.language,
        "published_utc": a.published_utc.isoformat() if a.published_utc else None,
        "ingested_utc": a.ingested_utc.isoformat() if a.ingested_utc else None,
    }


# ─────────────────────────────────────────────────────────────────────
# FEED
# ─────────────────────────────────────────────────────────────────────
@bp.get("/feed")
def feed():
    tab = _str_arg("tab", "ai-news").lower()
    language = _str_arg("language", "en").lower()  # kept for echo; UI does headline translation lazily
    limit = max(1, min(_int_arg("limit", 30), 100))

    with SessionLocal() as db:
        q = db.query(Article).filter(Article.ingested_utc >= datetime.utcnow() - timedelta(days=14))
        if tab == "bharat-ai":
            q = q.filter(Article.is_bharat == 1)
        elif tab == "tools":
            q = q.filter(Article.tab == "tools")
        elif tab == "ai-news":
            pass  # everything — no tab filter
        elif tab == "prashikshan":
            # Prashikshan tab is courses only; redirect callers to /courses for the canonical surface.
            return jsonify({
                "items": [],
                "count": 0,
                "tab": tab,
                "redirect": "/api/news-ai/courses",
                "speak_en": "The Prashikshan tab shows free AI courses, not news articles. Switch to the Courses view.",
                "speak_hi": "प्रशिक्षण टैब में मुफ़्त AI कोर्स दिखते हैं, खबरें नहीं। कोर्सेज़ देखें।",
            })
        else:
            # Fail-open: tabs that have their own dedicated client-side
            # loader (foryou, profession-hub, coach-picks, my-coach,
            # what-not-to-do, stream-*) should never break the page if the
            # caller hits this generic endpoint. Return an honest empty
            # state instead of 400. Per CTO §FR-1.3 + SAHAYAI fail-open
            # contract.
            return jsonify({
                "items": [],
                "count": 0,
                "tab": tab,
                "language": language,
                "honest_note_en": f"Tab '{tab}' uses a dedicated client-side loader, not this endpoint. Returning an empty list so the page never breaks.",
                "honest_note_hi": f"टैब '{tab}' का अपना लोडर है। पेज न टूटे, इसलिए खाली सूची लौटाई।",
            })

        rows = (
            q.order_by(desc(Article.published_utc), desc(Article.ingested_utc))
             .limit(limit).all()
        )

    items = [_article_to_dict(a) for a in rows]
    return jsonify({
        "items": items,
        "count": len(items),
        "tab": tab,
        "language": language,
        "speak_en": f"{len(items)} AI news stories." if items else "No stories yet — RSS poll has not run.",
        "speak_hi": f"{len(items)} AI ख़बरें।" if items else "अभी कोई ख़बर नहीं। RSS फ़ेच जल्द ही चलेगा।",
        "disclaimer_en": DISCLAIMER_EN,
        "disclaimer_hi": DISCLAIMER_HI,
    })


# ─────────────────────────────────────────────────────────────────────
# EXPLAIN — the heart of the product (Sire 2026-05-23)
# ─────────────────────────────────────────────────────────────────────
@bp.post("/article/<int:article_id>/explain")
def explain_article(article_id: int):
    """Chitti explains ONLY this article, in the requested language, in
    simple words. No profiling — everyone gets the same explanation per
    Sire 2026-05-23."""
    body = request.get_json(silent=True) or {}
    language = (body.get("language") or _str_arg("language", "en")).lower()

    with SessionLocal() as db:
        a = db.query(Article).filter(Article.id == article_id).first()
        if not a:
            abort(404, description="article not found")
        article_dict = {
            "title": a.title,
            "summary": a.summary,
            "content": a.content,
            "source_name": a.source_name,
            "url": a.url,
            "language": a.language,
        }
    result = news_explain.explain(article_dict, language=language)
    status = 200 if result.get("ok") else 502
    result["article_id"] = article_id
    result["article_url"] = article_dict["url"]
    result["article_source"] = article_dict["source_name"]
    return jsonify(result), status


@bp.post("/article/<int:article_id>/translate_headline")
def translate_headline(article_id: int):
    body = request.get_json(silent=True) or {}
    language = (body.get("language") or _str_arg("language", "en")).lower()
    with SessionLocal() as db:
        a = db.query(Article).filter(Article.id == article_id).first()
        if not a:
            abort(404, description="article not found")
        title = a.title
    return jsonify(news_explain.translate_headline(title, language=language))


# ─────────────────────────────────────────────────────────────────────
# COURSES (static, curated)
# ─────────────────────────────────────────────────────────────────────
@bp.get("/courses")
def courses_endpoint():
    return jsonify(courses_service.list_courses())


# ─────────────────────────────────────────────────────────────────────
# SOURCES + SCHEDULER
# ─────────────────────────────────────────────────────────────────────
@bp.get("/sources")
def sources_endpoint():
    with SessionLocal() as db:
        rows = db.query(Source).order_by(Source.name).all()
        items = [{
            "id": r.id,
            "name": r.name,
            "url": r.url,
            "kind": r.kind,
            "tab": r.tab,
            "is_bharat": bool(r.is_bharat),
            "language": r.language,
            "active": bool(r.active),
            "trust_score": r.trust_score,
            "trust_band": r.trust_band,
            "last_fetched_utc": r.last_fetched_utc.isoformat() if r.last_fetched_utc else None,
            "last_error": (r.last_error or "")[:200] or None,
            "reason_for_inclusion": r.reason_for_inclusion,
        } for r in rows]
    return jsonify({"items": items, "count": len(items)})


@bp.get("/scheduler/status")
def scheduler_status_route():
    return jsonify(news_scheduler.status())


@bp.post("/scheduler/trigger/<job_id>")
def scheduler_trigger(job_id: str):
    return jsonify(news_scheduler.trigger_now(job_id))


# ─────────────────────────────────────────────────────────────────────
# META
# ─────────────────────────────────────────────────────────────────────
@bp.get("/disclaimer")
def disclaimer():
    return jsonify({"disclaimer_en": DISCLAIMER_EN, "disclaimer_hi": DISCLAIMER_HI})


@bp.get("/languages")
def languages():
    return jsonify({"items": [{"code": c, "name": n} for c, n in news_explain.LANG_NAMES.items()]})
