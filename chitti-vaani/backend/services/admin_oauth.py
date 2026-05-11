"""
services/admin_oauth.py
-----------------------
Per-product Gmail OAuth + send for the Sahay AI Admin Dashboard.

Mirrors the user-facing Vaani flow (services/email_service.py), but:
  - Tokens belong to PRODUCT accounts (chittinews@gmail.com etc.),
    keyed by product_id, stored in product_gmail_accounts (Postgres/SQLite).
  - The OAuth `state` parameter carries the product_id so the callback
    knows which row to update.
  - Sender/recipient header uses the product mailbox; "from" is whatever
    Google says the connected email is (we do NOT trust the user-entered
    address — Google is authoritative).

Reuses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET that are already set
for Vaani in Render. Adds a NEW redirect URI:
   ADMIN_OAUTH_REDIRECT_URI
   default: https://chitti-vaani-api.onrender.com/api/admin/products/oauth/callback
This redirect URI MUST be added to the Google Cloud Console OAuth client
(Authorized redirect URIs) before the flow will work.
"""
from __future__ import annotations

import base64
import logging
import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Optional, Tuple
from urllib.parse import urlencode

import httpx

from services.admin_db import OAuthState, ProductGmailAccount, log_action, session

log = logging.getLogger("admin_oauth")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
]

GOOGLE_AUTH_URL     = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL    = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_REVOKE_URL   = "https://oauth2.googleapis.com/revoke"
GMAIL_SEND_URL      = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"

_STATE_TTL_SECONDS = 600


def _client_id() -> str:     return os.environ.get("GOOGLE_CLIENT_ID", "")
def _client_secret() -> str: return os.environ.get("GOOGLE_CLIENT_SECRET", "")
def _redirect_uri() -> str:
    return os.environ.get(
        "ADMIN_OAUTH_REDIRECT_URI",
        "https://chitti-vaani-api.onrender.com/api/admin/products/oauth/callback",
    )


def is_configured() -> bool:
    return bool(_client_id() and _client_secret())


def _save_state(state: str, product_id: int, frontend_redirect: str) -> None:
    cutoff = datetime.now(tz=timezone.utc) - timedelta(seconds=_STATE_TTL_SECONDS)
    with session() as s:
        s.add(OAuthState(state=state, product_id=int(product_id),
                         frontend_redirect=(frontend_redirect or "")[:500]))
        s.query(OAuthState).filter(OAuthState.created_at < cutoff).delete(synchronize_session=False)


def _pop_state(state: str) -> Optional[Tuple[int, str]]:
    """One-shot lookup. Returns (product_id, frontend_redirect) or None if missing/expired."""
    cutoff = datetime.now(tz=timezone.utc) - timedelta(seconds=_STATE_TTL_SECONDS)
    with session() as s:
        row = s.get(OAuthState, state)
        if not row:
            return None
        # Capture before delete; SQLAlchemy keeps loaded attrs available on detached.
        captured = (int(row.product_id), row.frontend_redirect or "")
        created = row.created_at
        s.delete(row)
        if created and created.replace(tzinfo=created.tzinfo or timezone.utc) < cutoff:
            return None
        return captured


def build_authorize_url(product_id: int, frontend_redirect: str = "") -> dict:
    """Return the Google consent URL for a specific product mailbox."""
    if not is_configured():
        return {"ok": False, "error": "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set in env."}
    state = secrets.token_urlsafe(24)
    _save_state(state, product_id, frontend_redirect)

    params = {
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",                 # force refresh_token issuance every time
        "include_granted_scopes": "true",
        "state": state,
    }
    return {"ok": True, "url": GOOGLE_AUTH_URL + "?" + urlencode(params)}


def handle_callback(code: str, state: str) -> dict:
    """Exchange auth code for tokens, persist on the product row."""
    if not is_configured():
        return {"ok": False, "error": "oauth_not_configured"}
    if not code or not state:
        return {"ok": False, "error": "missing_code_or_state"}

    pulled = _pop_state(state)
    if not pulled:
        return {"ok": False, "error": "invalid_or_expired_state"}
    product_id, frontend_redirect = pulled

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
            ui = client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {tok['access_token']}"},
            )
            ui.raise_for_status()
            info = ui.json()
    except httpx.HTTPStatusError as e:
        log.error("token exchange %s: %s", e.response.status_code, e.response.text[:200])
        log_action(product_id, "oauth_callback_fail", "fail",
                   f"http_{e.response.status_code}: {e.response.text[:300]}")
        return {"ok": False, "error": f"google_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("token exchange failed")
        log_action(product_id, "oauth_callback_fail", "fail", str(e)[:300])
        return {"ok": False, "error": str(e)[:200]}

    expiry = int(time.time()) + int(tok.get("expires_in") or 3600)
    connected_email = (info.get("email") or "").lower()

    with session() as s:
        row = s.get(ProductGmailAccount, product_id)
        if not row:
            return {"ok": False, "error": "product_not_found"}
        # If the human signed in to the wrong Google account, surface the mismatch
        # but still save tokens (admin can retry; or accept the mismatch by editing the row).
        mismatch = (
            connected_email
            and row.gmail_address
            and connected_email != row.gmail_address.lower()
        )
        row.access_token  = tok.get("access_token")
        row.refresh_token = tok.get("refresh_token") or row.refresh_token  # Google may omit on re-consent
        row.token_expiry  = expiry
        row.scopes        = tok.get("scope") or " ".join(SCOPES)
        row.connected_email = connected_email
        row.oauth_status  = "connected"
        s.flush()
        product_id_final = row.id
        expected_email = row.gmail_address

    log_action(product_id_final, "oauth_callback_ok", "ok",
               f"connected={connected_email}" + (f" MISMATCH expected={expected_email}" if mismatch else ""))
    return {
        "ok": True,
        "email": connected_email,
        "mismatch": bool(mismatch),
        "frontend_redirect": frontend_redirect,
    }


def _refresh_if_needed(product_id: int) -> Optional[dict]:
    """Return a dict of token fields (access_token, expiry) usable right now, refreshing if stale."""
    with session() as s:
        row = s.get(ProductGmailAccount, product_id)
        if not row or not row.access_token:
            return None
        from_addr = row.connected_email or row.gmail_address
        # 60s skew buffer
        if (row.token_expiry or 0) - int(time.time()) > 60:
            return {"access_token": row.access_token, "from": from_addr}
        if not row.refresh_token:
            return None
        refresh_token = row.refresh_token

    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": _client_id(),
                    "client_secret": _client_secret(),
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            r.raise_for_status()
            nt = r.json()
    except httpx.HTTPStatusError as e:
        # 400 invalid_grant typically means the refresh_token was revoked or expired (>6mo unused)
        log.error("refresh failed for product %s: %s %s", product_id, e.response.status_code, e.response.text[:200])
        with session() as s2:
            row2 = s2.get(ProductGmailAccount, product_id)
            if row2:
                row2.oauth_status = "expired" if e.response.status_code == 400 else "needs_auth"
        log_action(product_id, "oauth_callback_fail", "fail",
                   f"refresh_http_{e.response.status_code}: {e.response.text[:300]}")
        return None
    except Exception as e:  # noqa: BLE001
        log.error("refresh exception for product %s: %s", product_id, e)
        return None

    new_access = nt.get("access_token")
    new_expiry = int(time.time()) + int(nt.get("expires_in") or 3600)
    with session() as s3:
        row3 = s3.get(ProductGmailAccount, product_id)
        if row3:
            row3.access_token = new_access
            row3.token_expiry = new_expiry
            row3.oauth_status = "connected"
            return {"access_token": new_access, "from": row3.connected_email or row3.gmail_address}
    return None


def send_email(product_id: int, to: str, subject: str, body: str) -> dict:
    """Send a Gmail message as the product mailbox."""
    if not is_configured():
        return {"ok": False, "error": "oauth_not_configured"}
    tok = _refresh_if_needed(product_id)
    if not tok:
        return {"ok": False, "error": "no_connected_account"}

    msg = MIMEText(body or "", _charset="utf-8")
    msg["To"] = to
    msg["From"] = tok["from"]
    msg["Subject"] = subject or "(no subject)"
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("ascii")

    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(
                GMAIL_SEND_URL,
                json={"raw": raw},
                headers={
                    "Authorization": f"Bearer {tok['access_token']}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        log.error("send HTTP %s: %s", e.response.status_code, e.response.text[:300])
        return {"ok": False, "error": f"gmail_http_{e.response.status_code}",
                "detail": e.response.text[:300]}
    except Exception as e:  # noqa: BLE001
        log.exception("send failed")
        return {"ok": False, "error": str(e)[:300]}

    return {"ok": True, "message_id": data.get("id"), "from": tok["from"], "to": to, "subject": subject}


def disconnect(product_id: int) -> dict:
    """Revoke + clear tokens. Row stays so the dashboard still shows the product."""
    with session() as s:
        row = s.get(ProductGmailAccount, product_id)
        if not row:
            return {"ok": False, "error": "product_not_found"}
        rt = row.refresh_token

    if rt:
        try:
            with httpx.Client(timeout=10.0) as client:
                client.post(GOOGLE_REVOKE_URL, params={"token": rt})
        except Exception:  # noqa: BLE001
            pass

    with session() as s2:
        row2 = s2.get(ProductGmailAccount, product_id)
        if row2:
            row2.access_token = None
            row2.refresh_token = None
            row2.token_expiry = None
            row2.oauth_status = "needs_auth"
            row2.connected_email = None

    log_action(product_id, "deleted", "ok", "tokens revoked")
    return {"ok": True}