"""
routes/missed_call.py
---------------------
P1 (2026-05-13) — Missed-call callback endpoints.

Public surface (all under /api/vaani/missed-call):

  POST /webhook         — telephony provider hook. Body shape:
                           { phone, call_sid?, language?, note? }
                          Provider-signed payloads validated by
                          CHITTI_MISSED_CALL_SECRET when set; open
                          POSTs accepted in dev.

  POST /link            — link an existing missed-call row to a
                          user_token after the user opens any Chitti
                          page on the same number's phone.
                           Body: { phone }   Header: X-User-Token

  GET  /                — list this user's missed-call rows
                           Header: X-User-Token

  DELETE /<id>          — cancel a queued row (pre-dispatch only)
                           Header: X-User-Token

  POST /run             — admin/debug — force run the dispatch queue
                          right now.
"""
from __future__ import annotations

import hmac
import logging
import os
from hashlib import sha256

from flask import Blueprint, abort, jsonify, request

from services import missed_call_service

log = logging.getLogger("routes.missed_call")

bp = Blueprint("vaani_missed_call", __name__, url_prefix="/api/vaani/missed-call")


def _user_token(body) -> str:
    token = (request.headers.get("X-User-Token") or "").strip()
    if not token or len(token) < 8:
        # In /link we accept the token from the body too — but everywhere else
        # it's the header.
        if isinstance(body, dict):
            token = (body.get("user_token") or "").strip()
    if not token or len(token) < 8:
        abort(400, description="X-User-Token required (frontend should generate a UUID per device).")
    return token


def _check_webhook_signature(raw_body: bytes) -> bool:
    secret = (os.environ.get("CHITTI_MISSED_CALL_SECRET") or "").strip()
    if not secret:
        return True            # dev mode — accept open POSTs
    sig = (request.headers.get("X-Chitti-Signature") or "").strip()
    if not sig:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


@bp.post("/webhook")
def webhook_route():
    raw = request.get_data(cache=False)
    if not _check_webhook_signature(raw):
        abort(401, description="invalid signature")
    body = request.get_json(silent=True) or {}
    phone = (body.get("phone") or body.get("From") or "").strip()
    if not phone:
        abort(400, description="phone is required")
    try:
        out = missed_call_service.enqueue(
            phone,
            user_token=None,                 # pending_link until /link
            language=str(body.get("language") or "hi"),
            call_sid=str(body.get("call_sid") or body.get("CallSid") or "") or None,
            source="webhook",
            note=str(body.get("note") or "")[:240] or None,
        )
    except ValueError as e:
        abort(400, description=str(e))
    return jsonify(out)


@bp.post("/link")
def link_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    phone = (body.get("phone") or "").strip()
    if not phone:
        abort(400, description="phone is required")
    return jsonify(missed_call_service.link_to_user(phone, user_token))


@bp.get("/")
def list_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    return jsonify({
        "ok": True,
        "items": missed_call_service.list_for_user(user_token, limit=50),
    })


@bp.delete("/<int:mc_id>")
def cancel_route(mc_id: int):
    body = request.get_json(silent=True) or {}
    user_token = _user_token(body)
    if not missed_call_service.cancel(user_token, mc_id):
        abort(404, description="row not found or already dispatched")
    return jsonify({"ok": True})


@bp.post("/run")
def run_route():
    """Force the dispatch queue now (debug + admin)."""
    return jsonify(missed_call_service.run_dispatch_queue())
