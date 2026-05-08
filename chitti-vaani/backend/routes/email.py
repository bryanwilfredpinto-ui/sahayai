"""
routes/email.py
---------------
Flask Blueprint: /api/vaani/email/* — Gmail OAuth + send-as-user.

Endpoints:
  GET  /api/vaani/email/status                 — is OAuth configured? is this user connected?
  POST /api/vaani/email/auth/start             — body { user_token, redirect? } → { ok, url }
  GET  /api/vaani/email/auth/callback?code&state → Google calls this; we close the loop
  POST /api/vaani/email/send                   — body { user_token, to, subject, body, user_real_name? }
  POST /api/vaani/email/disconnect             — body { user_token } → revoke + delete tokens
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, redirect, request

from services import email_service

log = logging.getLogger("routes.email")

bp = Blueprint("vaani_email", __name__, url_prefix="/api/vaani/email")


def _user_token_or_400(body: dict) -> str:
    t = (body.get("user_token") or "").strip()
    if not t or len(t) < 8:
        abort(400, description="user_token is required (frontend should generate a UUID per device)")
    return t


@bp.get("/status")
def status_route():
    user_token = (request.args.get("user_token") or "").strip()
    return jsonify(email_service.status(user_token or None))


@bp.post("/auth/start")
def auth_start_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    redirect_after = (body.get("redirect") or "").strip()[:500]
    return jsonify(email_service.oauth_start(user_token, redirect_after))


@bp.get("/auth/callback")
def auth_callback_route():
    code  = (request.args.get("code")  or "").strip()
    state = (request.args.get("state") or "").strip()
    err   = (request.args.get("error") or "").strip()
    if err:
        # Redirect back to a friendly page that explains
        return redirect(f"/api/vaani/email/auth/done?ok=0&error={err}")
    out = email_service.oauth_callback(code, state)
    fr  = (out.get("frontend_redirect") or "").rstrip("/")
    if out.get("ok") and fr:
        # Bounce back to the user's frontend with a success flag
        sep = "&" if "?" in fr else "?"
        return redirect(f"{fr}{sep}email_connected=1&email={out.get('email','')}")
    if out.get("ok"):
        return f"""<!doctype html><meta charset="utf-8"><title>Chitti — Gmail connected</title>
<body style="font-family:Inter,sans-serif;text-align:center;padding:40px">
<h1>✓ Gmail connected</h1>
<p>You can close this tab and return to Chitti Vaani. The email <b>{out.get('email','')}</b> is now ready to send on your behalf.</p>
</body>"""
    return f"""<!doctype html><meta charset="utf-8"><title>Chitti — connection failed</title>
<body style="font-family:Inter,sans-serif;text-align:center;padding:40px;color:#b91c1c">
<h1>Could not connect Gmail</h1>
<pre>{out.get('error','unknown error')}</pre>
</body>""", 400


@bp.post("/send")
def send_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    to      = (body.get("to") or "").strip()
    subject = (body.get("subject") or "").strip()
    text    = (body.get("body") or "").strip()
    user_real_name = (body.get("user_real_name") or "").strip()
    if not to:
        abort(400, description="to is required")
    if not text:
        abort(400, description="body is required")
    if len(text) > 20000:
        abort(413, description="body too long (max 20000 chars)")
    res = email_service.send_as_user(
        user_token, to, subject, text, user_real_name=user_real_name or None,
    )
    return jsonify(res), (200 if res.get("ok") else 400)


@bp.post("/disconnect")
def disconnect_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    return jsonify(email_service.disconnect(user_token))
