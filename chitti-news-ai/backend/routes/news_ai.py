"""
Chitti News AI route surface.

Endpoints not yet implemented return HTTP 501 with a structured
COMING SOON payload — matches the §3 "Honest stubs over fake demos" rule.

LIVE endpoints in this revision:
  GET  /api/news-ai/languages
  GET  /api/news-ai/disclaimer
  GET  /api/news-ai/sources         — reads from DB (17 seeded + any community)
  GET  /api/news-ai/today           — articles ingested last 24 h, trust-ordered
  GET  /api/news-ai/launches        — articles classified is_launch=1 in last 7 days
  POST /api/news-ai/admin/rss/poll-now — token-gated manual RSS trigger
"""
from __future__ import annotations

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import desc

from config import settings
from database import SessionLocal
from models.articles import Article
from models.sources import Source
from services import rss_fetcher

bp = Blueprint("news_ai", __name__, url_prefix="/api/news-ai")

DISCLAIMER = (
    "I am an AI tool tracker. Rankings are dynamic and update every 6 hours. "
    "Pricing and free tiers may change. Always check official websites. "
    "I do not endorse any tool."
)


def _coming_soon(feature: str, eta: str | None = None, why: str | None = None):
    payload = {
        "ok": False,
        "status": "coming_soon",
        "feature": feature,
        "disclaimer": DISCLAIMER,
        "message": f"{feature} is queued. See chitti-news-ai/skills/FEATURES.md for the full plan.",
        "eta": eta,
        "why": why,
        "now_utc": datetime.utcnow().isoformat() + "Z",
    }
    return jsonify(payload), 501


def _trust_band(score: float | None) -> str:
    if score is None:
        return "pending"
    if score >= 80:
        return "trusted"
    if score >= 70:
        return "acceptable"
    if score >= 60:
        return "questionable"
    return "reject"


def _serialize_article(a: Article, src: Source | None) -> dict:
    return {
        "url": a.url,
        "title": a.title,
        "summary": a.summary,
        "published_utc": a.published_utc.isoformat() + "Z" if a.published_utc else None,
        "ingested_utc": a.ingested_utc.isoformat() + "Z" if a.ingested_utc else None,
        "language": a.language,
        "is_launch": bool(a.is_launch),
        "is_pricing_change": bool(a.is_pricing_change),
        "is_free_tier_change": bool(a.is_free_tier_change),
        "importance_score": a.importance_score,
        "importance_note": (
            "LLM importance scorer pending — ordering uses source trust + recency until ship."
            if (a.importance_score or 0) == 0
            else None
        ),
        "source": {
            "id": src.id if src else None,
            "name": src.name if src else None,
            "url": src.url if src else None,
            "category": src.category if src else None,
            "trust_score": src.trust_score if src else None,
            "trust_band": src.trust_band if src else _trust_band(getattr(src, "trust_score", None)),
        } if src else None,
    }


# ------------------------------------------------------------- LIVE ----

@bp.get("/sources")
def list_sources():
    """All approved sources + trust scores. Reads from DB (seeded on first boot)."""
    with SessionLocal() as db:
        rows = db.query(Source).order_by(desc(Source.trust_score)).all()
        items = [{
            "id": s.id,
            "name": s.name,
            "url": s.url,
            "kind": s.kind,
            "category": s.category,
            "language": s.language,
            "active": s.active,
            "trust_score": s.trust_score,
            "trust_band": s.trust_band or _trust_band(s.trust_score),
            "ai_crawl_blocked": s.ai_crawl_blocked,
            "last_fetched_utc": s.last_fetched_utc.isoformat() + "Z" if s.last_fetched_utc else None,
            "reason_for_inclusion": s.reason_for_inclusion,
        } for s in rows]
    return jsonify({
        "ok": True,
        "count": len(items),
        "items": items,
        "disclaimer": DISCLAIMER,
    })


@bp.get("/today")
def daily_briefing():
    """Articles ingested in the last 24 h, ordered by source trust then recency.
    Honest note: until DeepSeek importance scorer ships, ordering is trust + recency,
    not a true importance ranking — communicated via `importance_note` on every item."""
    since = datetime.utcnow() - timedelta(hours=24)
    with SessionLocal() as db:
        rows = (
            db.query(Article, Source)
            .join(Source, Source.id == Article.source_id)
            .filter(Article.ingested_utc >= since)
            .order_by(desc(Source.trust_score), desc(Article.ingested_utc))
            .limit(40)
            .all()
        )
        items = [_serialize_article(a, s) for (a, s) in rows]
    return jsonify({
        "ok": True,
        "window_hours": 24,
        "count": len(items),
        "items": items,
        "ordering": "source_trust_then_recency",
        "importance_scorer_status": "pending",
        "disclaimer": DISCLAIMER,
    })


@bp.get("/launches")
def new_launches():
    """Articles classified is_launch=1 in the last 7 days (heuristic — see
    services/scorer.py classify_article). LLM importance scorer is queued."""
    since = datetime.utcnow() - timedelta(days=7)
    with SessionLocal() as db:
        rows = (
            db.query(Article, Source)
            .join(Source, Source.id == Article.source_id)
            .filter(Article.is_launch == 1, Article.ingested_utc >= since)
            .order_by(desc(Article.ingested_utc))
            .limit(60)
            .all()
        )
        items = [_serialize_article(a, s) for (a, s) in rows]
    return jsonify({
        "ok": True,
        "window_days": 7,
        "count": len(items),
        "items": items,
        "classifier": "deterministic_keyword (services.scorer.classify_article)",
        "llm_importance_status": "pending",
        "disclaimer": DISCLAIMER,
    })


@bp.get("/languages")
def languages():
    return jsonify({
        "ok": True,
        "languages": [
            {"code": "hi", "name_en": "Hindi", "native": "हिंदी"},
            {"code": "bn", "name_en": "Bengali", "native": "বাংলা"},
            {"code": "te", "name_en": "Telugu", "native": "తెలుగు"},
            {"code": "ta", "name_en": "Tamil", "native": "தமிழ்"},
            {"code": "kn", "name_en": "Kannada", "native": "ಕನ್ನಡ"},
            {"code": "ml", "name_en": "Malayalam", "native": "മലയാളം"},
            {"code": "mr", "name_en": "Marathi", "native": "मराठी"},
            {"code": "gu", "name_en": "Gujarati", "native": "ગુજરાતી"},
            {"code": "or", "name_en": "Odia", "native": "ଓଡ଼ିଆ"},
            {"code": "pa", "name_en": "Punjabi", "native": "ਪੰਜਾਬੀ"},
            {"code": "as", "name_en": "Assamese", "native": "অসমীয়া"},
            {"code": "ur", "name_en": "Urdu", "native": "اردو"},
            {"code": "bho", "name_en": "Bhojpuri", "native": "भोजपुरी"},
            {"code": "hne", "name_en": "Chhattisgarhi", "native": "छत्तीसगढ़ी"},
            {"code": "mai", "name_en": "Maithili", "native": "मैथिली"},
            {"code": "kok", "name_en": "Konkani", "native": "कोंकणी"},
            {"code": "doi", "name_en": "Dogri", "native": "डोगरी"},
            {"code": "sd", "name_en": "Sindhi", "native": "سنڌي"},
            {"code": "ks", "name_en": "Kashmiri", "native": "کٲشُر"},
            {"code": "mni", "name_en": "Meitei", "native": "ꯃꯩꯇꯩꯂꯣꯟ"},
            {"code": "brx", "name_en": "Bodo", "native": "बड़ो"},
            {"code": "sat", "name_en": "Santali", "native": "ᱥᱟᱱᱛᱟᱲᱤ"},
            {"code": "sa", "name_en": "Sanskrit", "native": "संस्कृतम्"},
            {"code": "tcy", "name_en": "Tulu", "native": "ತುಳು"},
            {"code": "kfa", "name_en": "Kodava", "native": "ಕೊಡವ"},
            {"code": "kru", "name_en": "Oraon", "native": "कुड़ुख़"},
            {"code": "en", "name_en": "English", "native": "English"},
        ],
        "default": None,
        "note": "Chitti News AI has no default language. The user must pick.",
        "disclaimer": DISCLAIMER,
    })


@bp.get("/disclaimer")
def disclaimer():
    """Server-enforced disclaimer text. Frontend renders this, never inlines."""
    return jsonify({"ok": True, "disclaimer": DISCLAIMER})


# ------------------------------------------------------------- ADMIN ----

@bp.post("/admin/rss/poll-now")
def admin_rss_poll_now():
    """Manually trigger the full RSS poll. Token-gated via METRICS_TOKEN.
    Returns the same stats object the scheduler logs after each tick."""
    if not settings.metrics_token:
        return jsonify({
            "ok": False,
            "error": "metrics_token_unset",
            "message": "Set METRICS_TOKEN on the service to enable manual admin triggers.",
        }), 403
    supplied = request.headers.get("X-Admin-Token") or request.args.get("token") or ""
    if supplied != settings.metrics_token:
        return jsonify({"ok": False, "error": "forbidden"}), 403
    stats = rss_fetcher.poll_all()
    return jsonify({"ok": True, **stats})


# ----------------------------------------------------- COMING SOON ----

@bp.post("/tools-for-me")
def tools_for_me():
    body = request.get_json(silent=True) or {}
    language = body.get("language") or request.args.get("language")
    if not language:
        return jsonify({
            "ok": False,
            "error": "language_required",
            "message": "Chitti News AI has no default language. Pass `language` (e.g. 'ta', 'hi', 'en') with every request.",
        }), 400
    return _coming_soon(
        "Profession → Tools",
        eta="P0",
        why="Needs DeepSeek topic extractor + ranker.py + tool corpus. Honest stub returns no fake recommendations.",
    )


@bp.get("/free-tier-tracker")
def free_tier_tracker():
    return _coming_soon(
        "Free Tier Tracker",
        eta="P0",
        why="Needs nightly diff vs previous snapshot of each tracked tool's free-tier summary.",
    )


@bp.post("/trust-check")
def trust_check():
    body = request.get_json(silent=True) or {}
    url = body.get("url") or request.args.get("url")
    if not url:
        return jsonify({
            "ok": False,
            "error": "url_required",
            "message": "Pass `url` to verify.",
        }), 400
    return _coming_soon(
        "4-layer trust check",
        eta="P0",
        why="Layer 1 + 2 + 3 + 4 implementation in services/trust_scorer.py. Until shipped, returning honest stub — never a fake verdict on a real URL.",
    )


@bp.post("/sources/submit")
def submit_source():
    body = request.get_json(silent=True) or {}
    url = body.get("url")
    if not url:
        return jsonify({
            "ok": False,
            "error": "url_required",
        }), 400
    return _coming_soon(
        "Community source submission",
        eta="P1",
        why="Lands in discovery_queue with status `pending_layer_1`. Submission UI live; backend acceptance pending.",
    )


@bp.get("/leaderboard")
def leaderboard():
    return _coming_soon(
        "Tool Leaderboard",
        eta="P1",
        why="Dynamic top-by-importance + community-signal ranking. Needs corpus + ranker.",
    )


@bp.get("/models")
def models():
    return _coming_soon(
        "Model Tracker (LLM / SLM / vision / audio)",
        eta="P1",
        why="Hugging Face RSS seed + LMSYS eval ingest. Honest stub until both wired.",
    )
