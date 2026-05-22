"""
routes/channel_verify.py
------------------------
Flask Blueprint: /api/vaani/channel/* — verify-then-grant for the
three reminder channels (WhatsApp / SMS / Email).

Why this exists
~~~~~~~~~~~~~~~
Bryan 2026-05-22: "For whats app linkage, use mobile number & send
read code from the message. Same goes with sms. For email, confirm
email addresses via code. Once u get all 3, u have the access."

Flow
~~~~
  /verify/start    POST {user_token, channel, contact}
       → Generates a 6-digit code, stores (user_token, channel, hash,
         expiry) in memory, dispatches the code via the channel's
         provider (or honest demo if no provider configured).
       → 200 { ok, sent_to, expires_at_iso, demo_mode, hint? }

  /verify/confirm  POST {user_token, channel, code, contact}
       → Compares the constant-time hash of (user_token, channel,
         contact, code) with the stored hash. On match marks the
         channel verified for that user_token.
       → 200 { ok, channel, contact, verified_at }

  /status          GET ?user_token=...
       → 200 { whatsapp: {...} | null, sms: ..., email: ... }

  /disconnect      POST {user_token, channel}
       → 200 { ok, channel }

Honesty
~~~~~~~
The SMS / WhatsApp Business / Gmail send providers are not wired yet
(Phase 2.7). Until they are:
  - demo_mode = True is returned on every /verify/start
  - the only accepted code is "123456" (per the page banner)
  - hint is set to "Demo mode — code is 123456"

When real providers land, swap the `_dispatch_code(channel, contact,
code)` body for the provider call. The rest of the flow stays
identical, demo_mode flips to False, the hint disappears, and the
real send happens.

Storage
~~~~~~~
In-memory dicts for v1. When Turso wires for chitti-vaani, move the
pending + verified maps into the `channels` table:
  pending:  (user_token, channel) → (code_hash, expires_at_ms, contact)
  verified: (user_token, channel) → (contact, verified_at_iso)
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import secrets
import time
from typing import Any

from flask import Blueprint, abort, jsonify, request

log = logging.getLogger("routes.channel_verify")

bp = Blueprint("vaani_channel_verify", __name__, url_prefix="/api/vaani/channel")

# In-memory stores. Keyed by (user_token, channel). Cleared on process
# restart — acceptable for v1 because the page-side localStorage holds
# the verified state too.
_pending: dict[tuple[str, str], dict[str, Any]] = {}
_verified: dict[tuple[str, str], dict[str, Any]] = {}

# Channel allow-list — must match the page-side IDs.
CHANNELS = {"whatsapp", "sms", "email"}
CODE_TTL_S = 10 * 60  # codes expire after 10 minutes
PEPPER = os.environ.get("CHITTI_VAANI_CHANNEL_PEPPER", "chitti-vaani-channel-pepper-v1")

# Demo-mode toggles — flip these env vars to False (or wire the
# provider env vars below) when the real WhatsApp Business / SMS /
# Email senders are configured. Until then, every code that goes "out"
# is the literal string "123456" and the API tells the client so.
DEMO_MODE_DEFAULT = True
DEMO_CODE = "123456"


def _user_token_or_400(body: dict) -> str:
    t = (body.get("user_token") or "").strip()
    if not t or len(t) < 8:
        abort(400, description="user_token is required (frontend should generate a UUID per device)")
    return t


def _channel_or_400(body: dict) -> str:
    c = (body.get("channel") or "").strip().lower()
    if c not in CHANNELS:
        abort(400, description=f"channel must be one of {sorted(CHANNELS)}")
    return c


def _contact_or_400(channel: str, body: dict) -> str:
    c = (body.get("contact") or "").strip()
    if not c:
        abort(400, description="contact is required")
    if channel == "email":
        if "@" not in c or "." not in c.split("@", 1)[1]:
            abort(400, description="contact must be a valid email address")
    else:
        # WhatsApp + SMS: simple digit / + check; normalise to +91... if no country code.
        digits = "".join(ch for ch in c if ch.isdigit() or ch == "+")
        if len(digits.replace("+", "")) < 8:
            abort(400, description="contact must be a valid mobile number")
        if not digits.startswith("+"):
            digits = "+91" + digits.lstrip("0")
        c = digits
    return c


def _code_hash(user_token: str, channel: str, contact: str, code: str) -> str:
    msg = f"{user_token}|{channel}|{contact}|{code}".encode("utf-8")
    return hmac.new(PEPPER.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def _provider_configured(channel: str) -> bool:
    """Return True only when the real provider env vars are set. Until
    then the bp runs in demo mode — honest about the fact.
    """
    if channel == "whatsapp":
        return bool(os.environ.get("WHATSAPP_BUSINESS_TOKEN") and os.environ.get("WHATSAPP_BUSINESS_PHONE_ID"))
    if channel == "sms":
        return bool(os.environ.get("MSG91_AUTH_KEY") or os.environ.get("TWILIO_AUTH_TOKEN"))
    if channel == "email":
        # Hook into the existing Gmail OAuth path — if a Vaani-app
        # Gmail account is connected on the server, we can send.
        return bool(os.environ.get("GOOGLE_CLIENT_ID") and os.environ.get("GOOGLE_CLIENT_SECRET"))
    return False


def _dispatch_code(channel: str, contact: str, code: str) -> None:
    """Real-provider dispatch. Stub for now — see the file docstring."""
    log.info("channel_verify dispatch (stub) channel=%s contact=%s code=%s",
             channel, contact, "***" + code[-2:])
    # Phase 2.7 — wire the providers here:
    #   if channel == "whatsapp": whatsapp_business.send_text(contact, msg)
    #   if channel == "sms":      msg91.send_sms(contact, msg)
    #   if channel == "email":    email_service.send_otp(contact, code)
    return None


@bp.post("/verify/start")
def verify_start_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    channel = _channel_or_400(body)
    contact = _contact_or_400(channel, body)

    demo = DEMO_MODE_DEFAULT or not _provider_configured(channel)
    code = DEMO_CODE if demo else f"{secrets.randbelow(1000000):06d}"
    expires_at = int(time.time()) + CODE_TTL_S

    _pending[(user_token, channel)] = {
        "code_hash": _code_hash(user_token, channel, contact, code),
        "contact": contact,
        "expires_at": expires_at,
        "demo": demo,
    }
    if not demo:
        try:
            _dispatch_code(channel, contact, code)
        except Exception as e:  # pragma: no cover — provider errors
            log.warning("channel_verify dispatch failed channel=%s: %s", channel, e)

    resp = {
        "ok": True,
        "channel": channel,
        "sent_to": contact,
        "expires_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at)),
        "demo_mode": demo,
    }
    if demo:
        resp["hint"] = f"Demo mode — code is {DEMO_CODE}. Real provider lands in Phase 2.7."
    return jsonify(resp)


@bp.post("/verify/confirm")
def verify_confirm_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    channel = _channel_or_400(body)
    code = (body.get("code") or "").strip()
    if not (code.isdigit() and len(code) == 6):
        abort(400, description="code must be 6 digits")
    contact = _contact_or_400(channel, body)

    key = (user_token, channel)
    p = _pending.get(key)
    if not p:
        abort(404, description="No pending verification for that channel — call /verify/start first.")
    if time.time() > p["expires_at"]:
        _pending.pop(key, None)
        abort(410, description="Code expired — call /verify/start again.")
    if p["contact"] != contact:
        abort(400, description="contact does not match the one /verify/start was called with.")

    expected = p["code_hash"]
    got = _code_hash(user_token, channel, contact, code)
    if not hmac.compare_digest(expected, got):
        abort(401, description="Wrong code.")

    verified_at_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    _verified[key] = {"contact": contact, "verified_at": verified_at_iso, "demo": p["demo"]}
    _pending.pop(key, None)
    return jsonify({"ok": True, "channel": channel, "contact": contact, "verified_at": verified_at_iso})


@bp.get("/status")
def status_route():
    user_token = (request.args.get("user_token") or "").strip()
    if not user_token or len(user_token) < 8:
        abort(400, description="user_token is required")
    out: dict[str, Any] = {}
    for ch in sorted(CHANNELS):
        v = _verified.get((user_token, ch))
        out[ch] = v if v else None
    return jsonify(out)


@bp.post("/disconnect")
def disconnect_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    channel = _channel_or_400(body)
    _verified.pop((user_token, channel), None)
    _pending.pop((user_token, channel), None)
    return jsonify({"ok": True, "channel": channel})
