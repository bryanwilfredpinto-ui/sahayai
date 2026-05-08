"""
routes/scanner.py
-----------------
Flask Blueprint covering /api/scanner/* — Chitti Product Scanner.

Endpoints (prefix /api/scanner):
  POST  /analyze       — multipart image upload OR JSON {text, language?}
  POST  /analyze/text  — JSON-only path: {text, language?}
  GET   /health        — diagnostic
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request

from services import scanner_service

log = logging.getLogger("routes.scanner")

bp = Blueprint("scanner", __name__, url_prefix="/api/scanner")


@bp.post("/analyze")
def analyze_route():
    """Either a multipart image upload (field 'image') or a JSON body
    `{text, language?}`. Returning the same shape in both cases keeps
    the frontend simple."""
    # Image branch
    if request.files and "image" in request.files:
        f = request.files["image"]
        if f.content_type and not f.content_type.startswith("image/"):
            abort(415, description="Only image uploads are accepted (jpg/png/webp).")
        image_bytes = f.read()
        if not image_bytes:
            abort(400, description="empty image upload")
        if len(image_bytes) > 8 * 1024 * 1024:
            abort(413, description="image too large (max 8 MB)")
        language = (request.form.get("language") or "hi").strip().lower()
        return jsonify(scanner_service.analyze_image(image_bytes, f.content_type or "image/jpeg", language))

    # Text branch
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        abort(400, description="Provide either an 'image' file (multipart) or {text} (JSON).")
    if len(text) > 6000:
        abort(413, description="text too long (max 6000 chars)")
    language = (body.get("language") or "hi").strip().lower()
    return jsonify(scanner_service.analyze_text(text=text, language=language))


@bp.post("/analyze/text")
def analyze_text_route():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        abort(400, description="text is required")
    if len(text) > 6000:
        abort(413, description="text too long (max 6000 chars)")
    language = (body.get("language") or "hi").strip().lower()
    return jsonify(scanner_service.analyze_text(text=text, language=language))


@bp.get("/health")
def health_route():
    return jsonify(scanner_service.health())
