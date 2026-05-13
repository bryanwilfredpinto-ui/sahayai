"""
routes/checkin.py
-----------------
P0 (2026-05-13) — Daily check-in for elderly users.

Endpoints (all JSON, all under /api/vaani/checkin):

  POST /schedule  — body {user_token, hour_ist, minute_ist, language?,
                          elderly_label?, max_prompts?, enabled?}
                    upsert; returns the canonical row
  POST /ack       — body {user_token, said?}     master responded
  POST /disable   — body {user_token}            switch off
  GET  /          — ?user_token=…                inspect current schedule
  POST /run       — admin / debug — force run_scan() now

The actual prompts arrive on the user's own inbox via the existing
/api/vaani/emergency/poll endpoint with kind="checkin_prompt". Silence
escalates through emergency_service.trigger() — family cascade, never
cops. See project_chitti_vaani_emergency_protocol.
"""
from __future__ import annotations

from flask import Blueprint, abort, jsonify, request

from services import checkin_service

bp = Blueprint("vaani_checkin", __name__, url_prefix="/api/vaani/checkin")


def _user_token(body) -> str:
    if isinstance(body, dict):
        t = (body.get("user_token") or "").strip()
    else:
        t = (request.args.get("user_token") or "").strip()
    if not t or len(t) < 8:
        abort(400, description="user_token required (frontend should generate a UUID per device)")
    return t


def _int(body, name: str, *, default=None, lo=None, hi=None):
    raw = body.get(name) if isinstance(body, dict) else None
    if raw is None or raw == "":
        return default
    try:
        v = int(raw)
    except (TypeError, ValueError):
        abort(400, description=f"{name} must be an integer")
    if lo is not None and v < lo:
        abort(400, description=f"{name} must be >= {lo}")
    if hi is not None and v > hi:
        abort(400, description=f"{name} must be <= {hi}")
    return v


@bp.post("/schedule")
def schedule_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    hour = _int(body, "hour_ist", default=None, lo=0, hi=23)
    minute = _int(body, "minute_ist", default=0, lo=0, hi=59)
    if hour is None:
        abort(400, description="hour_ist is required (0..23 IST)")
    language = (body.get("language") or "hi").strip()
    elderly_label = (body.get("elderly_label") or "").strip()
    max_prompts = _int(body, "max_prompts", default=3, lo=1, hi=10)
    enabled = bool(body.get("enabled", True))
    return jsonify(checkin_service.schedule(
        user_token,
        hour_ist=hour,
        minute_ist=minute,
        language=language,
        elderly_label=elderly_label,
        max_prompts=max_prompts,
        enabled=enabled,
    ))


@bp.post("/ack")
def ack_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    said = str(body.get("said") or "")
    return jsonify(checkin_service.ack(user_token, said))


@bp.post("/disable")
def disable_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    return jsonify(checkin_service.disable(user_token))


@bp.get("/")
def get_route():
    user_token = _user_token(None)
    return jsonify(checkin_service.get(user_token))


@bp.post("/run")
def run_route():
    """Force-run the scan immediately. Useful for debugging + manual ops."""
    return jsonify(checkin_service.run_scan())
