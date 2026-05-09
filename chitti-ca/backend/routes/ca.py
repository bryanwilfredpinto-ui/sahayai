"""HTTP routes for /api/ca/*."""

from flask import Blueprint, jsonify, request

from services import ca_service


bp = Blueprint("ca", __name__, url_prefix="/api/ca")


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
