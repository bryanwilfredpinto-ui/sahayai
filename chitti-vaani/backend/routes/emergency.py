"""
routes/emergency.py
-------------------
Flask Blueprint: /api/vaani/emergency/* — 24/7 family cascade.

Endpoints (all bodies are JSON):
  POST /trigger      — { user_token, reason?, transcript?, source? }
  POST /check-in     — { user_token, said? }                     (master is OK)
  POST /pair/issue   — { user_token, label? } -> { code, expires_in_seconds }
  POST /pair/accept  — { user_token, code, label? }
  POST /pair/unpair  — { user_token, partner_token }
  GET  /pair/list?user_token=…
  GET  /poll?user_token=…    — returns queued emergency events for this device
  POST /poll          — same as GET (Web Push fallback path; same body shape)
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request

from services import emergency_service

log = logging.getLogger("routes.emergency")

bp = Blueprint("vaani_emergency", __name__, url_prefix="/api/vaani/emergency")


def _user_token(body) -> str:
    if isinstance(body, dict):
        t = (body.get("user_token") or "").strip()
    else:
        t = (request.args.get("user_token") or "").strip()
    if not t or len(t) < 8:
        abort(400, description="user_token required (frontend should generate a UUID per device)")
    return t


@bp.post("/trigger")
def trigger_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    return jsonify(emergency_service.trigger(
        user_token,
        reason=str(body.get("reason") or ""),
        transcript=str(body.get("transcript") or ""),
        source=str(body.get("source") or "web"),
    ))


@bp.post("/check-in")
def check_in_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    return jsonify(emergency_service.check_in(user_token, str(body.get("said") or "")))


@bp.post("/pair/issue")
def pair_issue_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    return jsonify(emergency_service.issue_pair_code(user_token, str(body.get("label") or "")))


@bp.post("/pair/accept")
def pair_accept_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    code = (body.get("code") or "").strip()
    if not code or len(code) != 6 or not code.isdigit():
        abort(400, description="code must be a 6-digit string")
    return jsonify(emergency_service.accept_pair_code(code, user_token, str(body.get("label") or "")))


@bp.post("/pair/unpair")
def pair_unpair_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    partner = (body.get("partner_token") or "").strip()
    if not partner or len(partner) < 8:
        abort(400, description="partner_token required")
    return jsonify(emergency_service.unpair(user_token, partner))


@bp.get("/pair/list")
def pair_list_route():
    user_token = _user_token(None)
    return jsonify(emergency_service.list_partners(user_token))


@bp.get("/poll")
def poll_get_route():
    user_token = _user_token(None)
    return jsonify(emergency_service.poll(user_token))


@bp.post("/poll")
def poll_post_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    return jsonify(emergency_service.poll(user_token))
