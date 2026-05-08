"""
routes/upi.py
-------------
Flask Blueprint covering /api/upi/* — Chitti UPI Fraud Guard.

Endpoints (prefix /api/upi):
  POST  /check       — body {text, language?} → risk classification
  GET   /rules       — RBI 2026 educational cards
  GET   /health      — diagnostic
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request

from services import upi_service

log = logging.getLogger("routes.upi")

bp = Blueprint("upi", __name__, url_prefix="/api/upi")


@bp.post("/check")
def check_route():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        abort(400, description="text is required")
    if len(text) > 4000:
        abort(413, description="text too long (max 4000 chars)")
    language = (body.get("language") or "hi").strip().lower()
    return jsonify(upi_service.check(text=text, language=language))


@bp.get("/rules")
def rules_route():
    return jsonify(upi_service.rbi_2026_rules())


@bp.get("/health")
def health_route():
    return jsonify(upi_service.health())
