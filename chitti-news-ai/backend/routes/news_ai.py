"""
Chitti News AI route surface.

Every endpoint not yet implemented returns HTTP 501 with a structured
COMING SOON payload — matches the §3 "Honest stubs over fake demos" rule.
The frontend renders this honestly without inventing fake data.
"""
from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request

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


@bp.get("/today")
def daily_briefing():
    return _coming_soon(
        "Daily AI Briefing",
        eta="P1 — wires onto RSS poll once 17 sources are seeded",
        why="The RSS poll + importance scorer must be live before this can return real data. Until then, returning an honest 501 instead of a fake demo briefing.",
    )


@bp.get("/launches")
def new_launches():
    return _coming_soon(
        "New launches (last 7 days)",
        eta="P0",
        why="Needs rss_fetcher cron @ 6h + launch detector heuristic in services/scorer.py.",
    )


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


@bp.get("/sources")
def list_sources():
    return _coming_soon(
        "Approved sources + trust scores",
        eta="P0",
        why="Returns seeded list from backend/data/sources.json once schema seed runs on first boot.",
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
