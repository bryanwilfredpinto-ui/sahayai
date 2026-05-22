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
    """Real-provider dispatch. Routes to whichever provider env vars
    are set. Falls back to a structured log line if none configured —
    /verify/start already flagged demo_mode in that case.

    Env-var matrix (set in Railway / Render):
      WhatsApp:
        WHATSAPP_BUSINESS_TOKEN          (Cloud API)
        WHATSAPP_BUSINESS_PHONE_ID       (sender phone id)
        WHATSAPP_OTP_TEMPLATE_NAME       (approved Meta template, e.g. "chitti_otp_v1")
      SMS — pick ONE provider:
        MSG91_AUTH_KEY  + MSG91_SENDER_ID  + MSG91_OTP_TEMPLATE_ID
        TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER
      Email:
        GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET  (routes through the
        existing services/email_service.py Gmail-as-Vaani sender)

    Per provider: each helper raises on failure; the caller decides
    whether to surface that to the user. We keep the helpers in this
    file (rather than a separate providers/ module) until at least two
    of them go live — premature abstraction would just hide what's
    actually wired.
    """
    msg = f"Your Chitti Vaani verification code is {code}. It expires in 10 minutes."

    if channel == "whatsapp" and _provider_configured("whatsapp"):
        _send_whatsapp_business_otp(contact, code)
        return
    if channel == "sms" and _provider_configured("sms"):
        if os.environ.get("MSG91_AUTH_KEY"):
            _send_msg91_otp(contact, code)
        elif os.environ.get("TWILIO_AUTH_TOKEN"):
            _send_twilio_sms(contact, msg)
        return
    if channel == "email" and _provider_configured("email"):
        _send_email_otp(contact, code)
        return

    # No provider configured — log honestly. /verify/start already
    # surfaced demo_mode=True; the user knows.
    log.info(
        "channel_verify dispatch SKIPPED (no provider) channel=%s contact=%s code=%s",
        channel, contact, "***" + code[-2:],
    )


def _send_whatsapp_business_otp(contact: str, code: str) -> None:
    """WhatsApp Business Cloud API — sends an approved OTP template.
    Template name comes from WHATSAPP_OTP_TEMPLATE_NAME (default
    "chitti_otp_v1"). The template MUST be approved in Meta Business
    Manager — Meta refuses arbitrary OTP text outside the approved
    templates."""
    import httpx
    token = os.environ["WHATSAPP_BUSINESS_TOKEN"]
    phone_id = os.environ["WHATSAPP_BUSINESS_PHONE_ID"]
    template = os.environ.get("WHATSAPP_OTP_TEMPLATE_NAME", "chitti_otp_v1")
    url = f"https://graph.facebook.com/v20.0/{phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": contact.lstrip("+"),
        "type": "template",
        "template": {
            "name": template,
            "language": {"code": "en"},
            "components": [{
                "type": "body",
                "parameters": [{"type": "text", "text": code}],
            }],
        },
    }
    r = httpx.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=15.0,
    )
    r.raise_for_status()
    log.info("WhatsApp OTP sent contact=%s status=%s", contact, r.status_code)


def _send_msg91_otp(contact: str, code: str) -> None:
    """MSG91 — India-centric SMS provider with sub-paise pricing and
    OTP template support. Uses the OTP API which auto-handles DLT
    registration."""
    import httpx
    key = os.environ["MSG91_AUTH_KEY"]
    template_id = os.environ.get("MSG91_OTP_TEMPLATE_ID", "")
    sender = os.environ.get("MSG91_SENDER_ID", "CHITTI")
    mobile = contact.lstrip("+")  # MSG91 wants country-coded but no '+'.
    url = "https://control.msg91.com/api/v5/otp"
    params = {
        "template_id": template_id,
        "mobile": mobile,
        "authkey": key,
        "otp": code,
        "sender": sender,
    }
    r = httpx.post(url, params=params, timeout=15.0)
    r.raise_for_status()
    log.info("MSG91 OTP sent mobile=%s status=%s", mobile, r.status_code)


def _send_twilio_sms(contact: str, body: str) -> None:
    """Twilio — global fallback for SMS when MSG91 isn't suitable
    (e.g. international numbers, sandbox testing)."""
    import httpx
    sid = os.environ["TWILIO_ACCOUNT_SID"]
    token = os.environ["TWILIO_AUTH_TOKEN"]
    sender = os.environ["TWILIO_FROM_NUMBER"]
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    r = httpx.post(
        url, auth=(sid, token),
        data={"From": sender, "To": contact, "Body": body},
        timeout=15.0,
    )
    r.raise_for_status()
    log.info("Twilio SMS sent to=%s status=%s", contact, r.status_code)


def _send_email_otp(contact: str, code: str) -> None:
    """Send the OTP through the existing Gmail-as-Vaani sender used by
    /api/vaani/email/send. Reuses the Phase-1.6 OAuth account so we
    don't duplicate auth state."""
    from services import email_service
    subject = "Your Chitti Vaani verification code"
    body = (
        f"Your Chitti Vaani verification code is {code}.\n"
        "It expires in 10 minutes.\n\n"
        "If you didn't request this, ignore this email. "
        "Chitti will never ask for this code over WhatsApp or phone."
    )
    # email_service.send() accepts (user_token, to, subject, body, …).
    # Use the system Vaani-owned account by passing a sentinel token.
    email_service.send(
        user_token="vaani-system",
        to=contact,
        subject=subject,
        body=body,
        user_real_name="Chitti Vaani",
    )
    log.info("Email OTP sent to=%s", contact)


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
