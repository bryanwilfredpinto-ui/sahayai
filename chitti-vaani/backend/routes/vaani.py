"""
routes/vaani.py
---------------
Flask Blueprint covering the /api/vaani/* surface.

Endpoints (prefix /api/vaani):
  POST  /ask        — body { text, language?, mode? } → DeepSeek reply
  GET   /health     — diagnostic
  GET   /languages  — supported language codes (for the frontend selector)
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request

from services import vaani_service

log = logging.getLogger("routes.vaani")

bp = Blueprint("vaani", __name__, url_prefix="/api/vaani")


@bp.post("/ask")
def ask_route():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        abort(400, description="text is required")
    if len(text) > 6000:
        abort(413, description="text too long (max 6000 chars)")
    language = (body.get("language") or "hi").strip().lower()
    mode = (body.get("mode") or "ask").strip().lower()
    return jsonify(vaani_service.ask(text=text, language=language, mode=mode))


@bp.get("/health")
def health_route():
    return jsonify(vaani_service.health())


@bp.get("/languages")
def languages_route():
    return jsonify({
        "items": [
            {"code": "hi", "name": "हिन्दी (Hindi)"},
            {"code": "en", "name": "English"},
            {"code": "ta", "name": "தமிழ் (Tamil)"},
            {"code": "te", "name": "తెలుగు (Telugu)"},
            {"code": "bn", "name": "বাংলা (Bengali)"},
            {"code": "mr", "name": "मराठी (Marathi)"},
            {"code": "gu", "name": "ગુજરાતી (Gujarati)"},
            {"code": "kn", "name": "ಕನ್ನಡ (Kannada)"},
            {"code": "ml", "name": "മലയാളം (Malayalam)"},
        ]
    })
