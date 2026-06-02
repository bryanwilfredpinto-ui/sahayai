"""
services/alerts.py
------------------
SMTP alert helper for the feeds-health monitor. Mirrors the
chitti-founder/backend/main.py self-ping email pattern so we don't
re-roll our own.

Env vars (set on Railway / Render for production alerts):
  SMTP_HOST      e.g. smtp.gmail.com
  SMTP_PORT      e.g. 587
  SMTP_USER      e.g. bryanwilfredpinto@gmail.com
  SMTP_PASS      Gmail App Password (https://myaccount.google.com/apppasswords)
  ALERT_RECIPIENT (default: bryanwilfredpinto@gmail.com)
  ALERT_FROM     (default: SMTP_USER)
  ALERTS_ENABLED (default: "true"; set "false" to silence prod alerts)

If any required var is missing, send_alert() logs the intent and
returns False — never raises. This matches Sire's "honest stub when
upstream missing" pattern across the rest of the platform.
"""
from __future__ import annotations

import logging
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from typing import Optional

log = logging.getLogger("alerts")


def _env(k: str, default: str = "") -> str:
    return (os.environ.get(k) or "").strip() or default


def alerts_enabled() -> bool:
    return _env("ALERTS_ENABLED", "true").lower() not in ("false", "0", "no", "off")


def send_alert(subject: str, body: str, *, recipient: Optional[str] = None) -> bool:
    """
    Send a plain-text alert email. Returns True on success.
    Honest-stub returns False (with log line) on missing config or
    SMTP errors — never raises into the calling cron.
    """
    if not alerts_enabled():
        log.info("[alerts] disabled via ALERTS_ENABLED=false — would have sent: %s", subject)
        return False

    host = _env("SMTP_HOST")
    port = int(_env("SMTP_PORT", "587"))
    user = _env("SMTP_USER")
    password = _env("SMTP_PASS")
    sender = _env("ALERT_FROM", user)
    to = recipient or _env("ALERT_RECIPIENT", "bryanwilfredpinto@gmail.com")

    missing = [n for n, v in
               (("SMTP_HOST", host), ("SMTP_USER", user), ("SMTP_PASS", password))
               if not v]
    if missing:
        log.warning(
            "[alerts] missing env vars %s — would have sent: %s\nbody:\n%s",
            missing, subject, body[:1000],
        )
        return False

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to

    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=30) as s:
            s.starttls(context=ctx)
            s.login(user, password)
            s.sendmail(sender, [to], msg.as_string())
        log.info("[alerts] sent: %s → %s", subject, to)
        return True
    except Exception as e:  # noqa: BLE001
        log.exception("[alerts] SMTP failed: %s — subject was: %s", e, subject)
        return False
