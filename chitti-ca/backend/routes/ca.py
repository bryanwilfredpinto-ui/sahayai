"""HTTP routes for /api/ca/*.

  POST   /ask                          → DeepSeek-backed Q&A (existing)
  GET    /health                       → service health (existing)

  P1 (2026-05-13) — deadline reminders:
  GET    /deadlines                    → ?audience=&within_days=&language= next deadlines
  POST   /deadlines/subscribe          → {rule_key, language?} log subscription (X-User-Token)
  POST   /deadlines/unsubscribe        → {rule_key} (X-User-Token)
  GET    /deadlines/subscriptions      → my current subscriptions (X-User-Token)
"""

from flask import Blueprint, abort, jsonify, request

from services import ca_deadlines, ca_service


bp = Blueprint("ca", __name__, url_prefix="/api/ca")


def _user_token_or_400() -> str:
    token = (request.headers.get("X-User-Token") or "").strip()
    if not token or len(token) < 8:
        abort(400, description="Missing X-User-Token header (frontend should generate a UUID per device).")
    return token


@bp.get("/health")
def health():
    return jsonify(ca_service.health())


@bp.post("/ask")
def ask():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    language = (body.get("language") or "en").strip()
    topic = (body.get("topic") or "").strip() or None
    if not text:
        return jsonify({"ok": False, "error": "missing_text"}), 400
    if len(text) > 4000:
        return jsonify({"ok": False, "error": "text_too_long", "max_chars": 4000}), 413
    return jsonify(ca_service.ask(text, language=language, topic=topic))


# ───────────── deadlines (P1 — reminder + calendar) ─────────────

@bp.get("/deadlines")
def deadlines_list():
    audience = (request.args.get("audience") or "").strip().lower() or None
    language = (request.args.get("language") or "en").strip().lower()
    try:
        within_days = max(1, min(int(request.args.get("within_days") or "120"), 365))
    except ValueError:
        within_days = 120
    return jsonify({
        "ok": True,
        "items": ca_deadlines.upcoming(
            audience=audience, within_days=within_days, language=language,
        ),
        "disclaimer": ca_service.CA_DISCLAIMER,
    })


@bp.post("/deadlines/subscribe")
def deadlines_subscribe():
    token = _user_token_or_400()
    body = request.get_json(silent=True) or {}
    rule_key = (body.get("rule_key") or "").strip()
    language = (body.get("language") or "en").strip().lower()
    if not rule_key:
        abort(400, description="rule_key is required")
    try:
        return jsonify(ca_deadlines.subscribe(token, rule_key, language))
    except ValueError as e:
        abort(400, description=str(e))


@bp.post("/deadlines/unsubscribe")
def deadlines_unsubscribe():
    token = _user_token_or_400()
    body = request.get_json(silent=True) or {}
    rule_key = (body.get("rule_key") or "").strip()
    if not rule_key:
        abort(400, description="rule_key is required")
    return jsonify(ca_deadlines.unsubscribe(token, rule_key))


@bp.get("/deadlines/subscriptions")
def deadlines_subscriptions():
    token = _user_token_or_400()
    language = (request.args.get("language") or "en").strip().lower()
    return jsonify({
        "ok": True,
        "items": ca_deadlines.list_subscriptions(token, language=language),
    })
