"""
services/email_service.py
-------------------------
Gmail OAuth + send for Chitti Vaani.

Three public functions:
  - oauth_start(user_token)        → returns the Google consent URL
  - oauth_callback(code, state)    → exchanges code for token, stores it
  - send_as_user(user_token, to, subject, body) → sends email through
       Gmail API with Chitti's identity footer auto-appended

Scope: `https://www.googleapis.com/auth/gmail.send`
This is a Restricted Scope. Production use requires Google's CASA
security audit (annual). For development & "trusted testers" up to 100
users, the scope works while the OAuth project is in "Testing" mode.

Environment variables (set in Render dashboard, NOT in repo):
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  GOOGLE_REDIRECT_URI   (default: https://chitti-vaani-api.onrender.com/api/vaani/email/auth/callback)
"""
from __future__ import annotations

import base64
import logging
import os
import secrets
import time
from email.mime.text import MIMEText
from typing import Optional

from config import settings
from services import email_db

log = logging.getLogger("email_service")


# Gmail Restricted Scope. Send-as-user.
SCOPES = ["https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/userinfo.email"]
# We use openid + email so we can fetch the connected email address for display.

GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GMAIL_SEND_URL   = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"


def _client_id():     return os.environ.get("GOOGLE_CLIENT_ID", "")
def _client_secret(): return os.environ.get("GOOGLE_CLIENT_SECRET", "")
def _redirect_uri():
    return os.environ.get(
        "GOOGLE_REDIRECT_URI",
        "https://chitti-vaani-api.onrender.com/api/vaani/email/auth/callback",
    )


def _is_configured() -> bool:
    return bool(_client_id() and _client_secret())


def status(user_token: Optional[str] = None) -> dict:
    out = {
        "ok": True,
        "configured": _is_configured(),
        "redirect_uri": _redirect_uri(),
        "scopes": SCOPES,
    }
    if user_token:
        tok = email_db.load_token(user_token, "gmail")
        out["connected"] = bool(tok)
        if tok:
            out["email"] = tok.get("email")
            out["expires_in"] = max(0, (tok.get("expiry") or 0) - int(time.time()))
    return out


def oauth_start(user_token: str, frontend_redirect: str = "") -> dict:
    """Build the Google consent URL. The frontend redirects the user there."""
    if not _is_configured():
        return {
            "ok": False,
            "error": "Gmail OAuth not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Render env.",
        }
    state = secrets.token_urlsafe(24)
    # Store frontend redirect inside state lookup so callback can hop back to the right page
    email_db.save_state(state, user_token, "gmail")
    if frontend_redirect:
        # Append a marker we can read back in the callback
        # Stored in oauth_state table only via state key; safer than putting raw URL in querystring
        pass
    # NOTE: We pass user_token NOT the email. The email comes back from the
    # token exchange via the userinfo endpoint.
    from urllib.parse import urlencode
    params = {
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",        # we want refresh tokens
        "prompt": "consent",             # force a consent each time so refresh_token is always issued
        "include_granted_scopes": "true",
        "state": state,
    }
    if frontend_redirect:
        params["state"] = state + "|" + frontend_redirect
    return {"ok": True, "url": GOOGLE_AUTH_URL + "?" + urlencode(params)}


def oauth_callback(code: str, state: str) -> dict:
    """Exchange the auth code for tokens. Persist. Return the connected email."""
    if not _is_configured():
        return {"ok": False, "error": "OAuth not configured"}
    if not code:
        return {"ok": False, "error": "missing code"}

    # state may carry a bonus '|<frontend_redirect>' tail
    raw_state, _, redirect_tail = state.partition("|")
    s = email_db.pop_state(raw_state)
    if not s:
        return {"ok": False, "error": "invalid or expired state"}

    import httpx
    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": _client_id(),
                    "client_secret": _client_secret(),
                    "redirect_uri": _redirect_uri(),
                    "grant_type": "authorization_code",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            r.raise_for_status()
            tok = r.json()
            # Userinfo
            ui = client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {tok['access_token']}"},
            )
            ui.raise_for_status()
            info = ui.json()
    except httpx.HTTPStatusError as e:
        log.error("Token exchange HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return {"ok": False, "error": f"google_token_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("Token exchange failed: %s", e)
        return {"ok": False, "error": str(e)[:200]}

    expires_in = int(tok.get("expires_in") or 3600)
    email_db.save_token(s["user_token"], "gmail", {
        "email":         info.get("email"),
        "access_token":  tok.get("access_token"),
        "refresh_token": tok.get("refresh_token"),
        "token_uri":     GOOGLE_TOKEN_URL,
        "client_id":     _client_id(),
        "client_secret": _client_secret(),
        "scopes":        (tok.get("scope") or "").split(),
        "expiry":        int(time.time()) + expires_in,
    })
    return {
        "ok": True,
        "email": info.get("email"),
        "frontend_redirect": redirect_tail or "",
    }


def _refresh_if_needed(user_token: str) -> Optional[dict]:
    tok = email_db.load_token(user_token, "gmail")
    if not tok:
        return None
    # 60-second skew buffer
    if (tok.get("expiry") or 0) - int(time.time()) > 60:
        return tok
    if not tok.get("refresh_token"):
        return None
    import httpx
    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id":     tok["client_id"],
                    "client_secret": tok["client_secret"],
                    "refresh_token": tok["refresh_token"],
                    "grant_type":    "refresh_token",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            r.raise_for_status()
            nt = r.json()
    except Exception as e:  # noqa: BLE001
        log.error("Refresh failed: %s", e)
        return None
    tok["access_token"] = nt.get("access_token") or tok["access_token"]
    tok["expiry"]       = int(time.time()) + int(nt.get("expires_in") or 3600)
    email_db.save_token(user_token, "gmail", tok)
    return tok


def disconnect(user_token: str) -> dict:
    """Forget the user's Gmail token (revocation on Google side is best-effort)."""
    tok = email_db.load_token(user_token, "gmail")
    if tok and tok.get("refresh_token"):
        import httpx
        try:
            with httpx.Client(timeout=10.0) as client:
                client.post(
                    "https://oauth2.googleapis.com/revoke",
                    params={"token": tok["refresh_token"]},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
        except Exception:  # noqa: BLE001
            pass
    removed = email_db.delete_token(user_token, "gmail")
    return {"ok": True, "removed": removed}


def _signature(user_real_name: Optional[str]) -> str:
    name = (user_real_name or "the user").strip()
    return (
        f"\n\n— Sent via Chitti Vaani, an AI assistant for {name}. "
        "Replies do not pass through Chitti."
    )


def send_as_user(
    user_token: str,
    to: str,
    subject: str,
    body: str,
    *,
    user_real_name: Optional[str] = None,
) -> dict:
    """Send email via the connected Gmail account.

    Returns:
      { ok, message_id, from, to, subject, ... }  on success
      { ok=False, error, ... }                    on failure
    """
    if not _is_configured():
        return {"ok": False, "error": "OAuth not configured on the server"}
    tok = _refresh_if_needed(user_token)
    if not tok:
        return {"ok": False, "error": "no_connected_account", "hint": "User must complete the Connect Gmail flow first."}
    to = (to or "").strip()
    if not to or "@" not in to:
        return {"ok": False, "error": "to is required and must be an email address"}
    body = (body or "").rstrip() + _signature(user_real_name)

    msg = MIMEText(body, _charset="utf-8")
    msg["To"] = to
    msg["From"] = tok.get("email") or "me"
    msg["Subject"] = subject or "(no subject)"
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("ascii")

    import httpx
    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(
                GMAIL_SEND_URL,
                json={"raw": raw},
                headers={
                    "Authorization": f"Bearer {tok['access_token']}",
                    "Content-Type":  "application/json",
                },
            )
            if r.status_code == 401:
                # Try one refresh + retry
                tok = _refresh_if_needed(user_token)
                if tok:
                    r = client.post(
                        GMAIL_SEND_URL,
                        json={"raw": raw},
                        headers={
                            "Authorization": f"Bearer {tok['access_token']}",
                            "Content-Type":  "application/json",
                        },
                    )
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        log.error("Gmail send HTTP %s: %s", e.response.status_code, e.response.text[:300])
        return {"ok": False, "error": f"gmail_send_http_{e.response.status_code}", "detail": e.response.text[:300]}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("Gmail send failed: %s", e)
        return {"ok": False, "error": str(e)[:200]}

    return {
        "ok": True,
        "message_id": data.get("id"),
        "thread_id":  data.get("threadId"),
        "from":       tok.get("email"),
        "to":         to,
        "subject":    subject,
        "speak_hi":   "Email bhej diya.",
        "speak_en":   "Email sent.",
    }
