"""
services/checkin_service.py
---------------------------
P0 (2026-05-13) — Daily check-in for elderly users.

User flow (voice-first):
  1. Spouse / family member sets up a check-in for grandparent on the
     grandparent's device (or own device): time (IST hour:minute),
     language (default hi), max_silent_prompts (default 3).
  2. The scheduler (vaani_scheduler.daily_checkin_scan) fires every 5
     minutes. For each user_token whose scheduled time has just passed
     and whose last check-in was on a previous calendar day, it pushes
     a `kind="checkin_prompt"` relay event to that user's own inbox.
  3. The frontend polls the inbox (existing emergency `/poll`) and
     speaks "Aap theek hain?". The user says "haan" (or taps an OK
     button). The frontend posts /api/vaani/checkin/ack — we mark the
     check-in done for the day.
  4. If max_silent_prompts pass with no ack, we **reuse the existing
     emergency cascade** — emergency_service.trigger() — which fans out
     to paired family. This deliberately re-uses the locked
     family-cascade-never-cops contract; the 112/100/102 denylist still
     applies.

Storage: lightweight SQLite at /tmp (matches relay_db.py pattern). No
SQLAlchemy — same dependency footprint as the existing emergency code.
"""
from __future__ import annotations

import json
import logging
import os
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from services import emergency_service, relay_db

log = logging.getLogger("checkin_service")

IST = ZoneInfo("Asia/Kolkata")

_LOCK = threading.Lock()
_DB_PATH = os.environ.get("VAANI_CHECKIN_DB", "/tmp/chitti_vaani_checkin.sqlite")

# Per check-in, after the scheduled time we send up to N reminder
# prompts spaced PROMPT_INTERVAL_MIN minutes apart. After the Nth
# prompt without an ack we escalate. Defaults keep the user-experience
# gentle (3 prompts, ~5 minutes between) but loud enough to wake an
# elderly user — actual ringing / alarm bypass is frontend's job.
PROMPT_INTERVAL_MIN = int(os.environ.get("VAANI_CHECKIN_PROMPT_INTERVAL_MIN", "5"))
DEFAULT_MAX_PROMPTS = int(os.environ.get("VAANI_CHECKIN_MAX_PROMPTS", "3"))


def _conn():
    c = sqlite3.connect(_DB_PATH, timeout=10.0, isolation_level=None)
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA synchronous=NORMAL")
    return c


def init_db() -> None:
    with _LOCK, _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS checkins (
                user_token       TEXT PRIMARY KEY,
                enabled          INTEGER NOT NULL DEFAULT 1,
                hour_ist         INTEGER NOT NULL,
                minute_ist       INTEGER NOT NULL,
                language         TEXT    NOT NULL DEFAULT 'hi',
                elderly_label    TEXT,
                max_prompts      INTEGER NOT NULL DEFAULT 3,
                last_ack_day_ist TEXT,
                last_prompt_at   INTEGER,
                prompt_count_today INTEGER NOT NULL DEFAULT 0,
                escalated_at     INTEGER,
                created_at       INTEGER NOT NULL
            )
            """
        )


def _today_ist_str(now_utc: Optional[datetime] = None) -> str:
    now = now_utc or datetime.now(tz=timezone.utc)
    return now.astimezone(IST).strftime("%Y-%m-%d")


def _row_to_dict(row) -> dict:
    if not row:
        return {}
    keys = (
        "user_token enabled hour_ist minute_ist language elderly_label "
        "max_prompts last_ack_day_ist last_prompt_at prompt_count_today "
        "escalated_at created_at"
    ).split()
    return dict(zip(keys, row))


def schedule(
    user_token: str,
    *,
    hour_ist: int,
    minute_ist: int,
    language: str = "hi",
    elderly_label: str = "",
    max_prompts: int = DEFAULT_MAX_PROMPTS,
    enabled: bool = True,
) -> dict:
    if not user_token or len(user_token) < 8:
        return {"ok": False, "error": "user_token required"}
    hour_ist = max(0, min(23, int(hour_ist)))
    minute_ist = max(0, min(59, int(minute_ist)))
    max_prompts = max(1, min(10, int(max_prompts)))
    language = (language or "hi").strip()
    elderly_label = (elderly_label or "")[:80]
    with _LOCK, _conn() as c:
        c.execute(
            """
            INSERT INTO checkins
              (user_token, enabled, hour_ist, minute_ist, language, elderly_label,
               max_prompts, created_at)
            VALUES (?,?,?,?,?,?,?,?)
            ON CONFLICT(user_token) DO UPDATE SET
              enabled = excluded.enabled,
              hour_ist = excluded.hour_ist,
              minute_ist = excluded.minute_ist,
              language = excluded.language,
              elderly_label = excluded.elderly_label,
              max_prompts = excluded.max_prompts
            """,
            (
                user_token,
                1 if enabled else 0,
                hour_ist,
                minute_ist,
                language,
                elderly_label,
                max_prompts,
                int(time.time()),
            ),
        )
    log.info(
        "checkin scheduled user_token=%s time=%02d:%02d IST max_prompts=%d enabled=%s",
        user_token[:8] + "…", hour_ist, minute_ist, max_prompts, enabled,
    )
    return get(user_token)


def disable(user_token: str) -> dict:
    with _LOCK, _conn() as c:
        c.execute("UPDATE checkins SET enabled=0 WHERE user_token=?", (user_token,))
    return get(user_token)


def get(user_token: str) -> dict:
    with _LOCK, _conn() as c:
        row = c.execute(
            "SELECT user_token, enabled, hour_ist, minute_ist, language, "
            "elderly_label, max_prompts, last_ack_day_ist, last_prompt_at, "
            "prompt_count_today, escalated_at, created_at "
            "FROM checkins WHERE user_token=?",
            (user_token,),
        ).fetchone()
    if not row:
        return {"ok": True, "exists": False}
    d = _row_to_dict(row)
    return {"ok": True, "exists": True, "checkin": d}


def ack(user_token: str, said: str = "") -> dict:
    """Master responded — reset counters for the day."""
    today = _today_ist_str()
    with _LOCK, _conn() as c:
        cur = c.execute(
            "UPDATE checkins SET last_ack_day_ist=?, prompt_count_today=0, "
            "escalated_at=NULL WHERE user_token=?",
            (today, user_token),
        )
        if cur.rowcount == 0:
            return {"ok": False, "error": "no checkin scheduled for this user_token"}
    log.info("checkin ack user_token=%s said=%r", user_token[:8] + "…", (said or "")[:60])
    return {"ok": True, "ack_day_ist": today, "said": (said or "")[:200]}


def _due_now(c, now_utc: datetime) -> list[tuple]:
    """
    Return checkins that should fire a prompt right now.

    Conditions:
      - enabled
      - today's check-in not yet acked
      - either no prompt sent today yet AND scheduled time already passed,
        or last prompt was >= PROMPT_INTERVAL_MIN min ago and we haven't
        hit max_prompts.
    """
    now_ist = now_utc.astimezone(IST)
    today = now_ist.strftime("%Y-%m-%d")
    now_minutes = now_ist.hour * 60 + now_ist.minute
    now_ts = int(now_utc.timestamp())
    interval = PROMPT_INTERVAL_MIN * 60
    rows = c.execute(
        "SELECT user_token, hour_ist, minute_ist, language, elderly_label, "
        "max_prompts, last_ack_day_ist, last_prompt_at, prompt_count_today "
        "FROM checkins WHERE enabled=1"
    ).fetchall()
    due = []
    for r in rows:
        (token, h, m, lang, label, maxp, ack_day, last_prompt, count) = r
        sched_minutes = (h or 0) * 60 + (m or 0)
        if now_minutes < sched_minutes:
            continue                          # not yet time today
        if ack_day == today:
            continue                          # already done for today
        if (count or 0) >= (maxp or DEFAULT_MAX_PROMPTS):
            continue                          # ready for escalation, handled separately
        if last_prompt and (now_ts - int(last_prompt)) < interval:
            continue                          # respect interval between prompts
        due.append(r)
    return due


def _to_escalate(c, now_utc: datetime) -> list[tuple]:
    """Find rows where prompt_count_today >= max_prompts and not yet escalated."""
    today = _today_ist_str(now_utc)
    rows = c.execute(
        "SELECT user_token, language, elderly_label, max_prompts, last_ack_day_ist, "
        "prompt_count_today, escalated_at FROM checkins WHERE enabled=1"
    ).fetchall()
    out = []
    for r in rows:
        (token, lang, label, maxp, ack_day, count, esc_at) = r
        if ack_day == today:
            continue
        if (count or 0) < (maxp or DEFAULT_MAX_PROMPTS):
            continue
        if esc_at:
            continue                          # already escalated
        out.append(r)
    return out


def run_scan(now_utc: Optional[datetime] = None) -> dict:
    """
    Called by the APScheduler job every ~5 min. Returns the usual
    scheduler audit shape. Side effects:
      - emits `checkin_prompt` relay events to user's own inbox
      - escalates silence via emergency_service.trigger()
    """
    init_db()                                  # idempotent on every call
    now = now_utc or datetime.now(tz=timezone.utc)
    now_ts = int(now.timestamp())
    today = _today_ist_str(now)

    prompts_sent = 0
    escalated = 0
    with _LOCK, _conn() as c:
        for row in _due_now(c, now):
            (token, h, m, lang, label, maxp, ack_day, last_prompt, count) = row
            # If new day, reset count
            if ack_day != today and (count or 0) > 0 and (last_prompt or 0) < (now_ts - 16 * 3600):
                # safety net — if we somehow rolled over a day, reset
                c.execute(
                    "UPDATE checkins SET prompt_count_today=0, last_prompt_at=NULL "
                    "WHERE user_token=?",
                    (token,),
                )
                count = 0
            try:
                relay_db.push_event(
                    to_user=token,
                    from_user=token,           # self-emit so the master's own device speaks
                    kind="checkin_prompt",
                    payload={
                        "language": lang,
                        "elderly_label": label or "",
                        "prompt_index": int(count or 0) + 1,
                        "max_prompts": int(maxp or DEFAULT_MAX_PROMPTS),
                        "ts": now_ts,
                    },
                )
                c.execute(
                    "UPDATE checkins SET last_prompt_at=?, prompt_count_today=COALESCE(prompt_count_today,0)+1 "
                    "WHERE user_token=?",
                    (now_ts, token),
                )
                prompts_sent += 1
            except Exception as e:             # noqa: BLE001
                log.warning("checkin prompt push failed for %s: %s", (token or "?")[:8], e)

        for row in _to_escalate(c, now):
            (token, lang, label, maxp, ack_day, count, _) = row
            try:
                reason = (
                    f"Daily check-in silence: no response after {count} prompts. "
                    "Family cascade — NEVER cops."
                )
                # Reuse the locked emergency cascade — same 112/100/102
                # denylist, same family fan-out. project_chitti_vaani_emergency_protocol.
                emergency_service.trigger(
                    token,
                    reason=reason,
                    transcript=(label or "")[:200],
                    source="daily_checkin_escalation",
                )
                c.execute(
                    "UPDATE checkins SET escalated_at=? WHERE user_token=?",
                    (now_ts, token),
                )
                escalated += 1
            except Exception as e:             # noqa: BLE001
                log.exception("checkin escalation failed for %s: %s", (token or "?")[:8], e)

    note = (
        f"checkin scan: prompts_sent={prompts_sent} escalated={escalated} "
        f"day_ist={today}"
    )
    log.info("%s", note)
    return {"upserted": prompts_sent, "errors": 0, "skipped": escalated, "note": note}
