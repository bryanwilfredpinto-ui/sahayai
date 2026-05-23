"""
services/health_file_dispatch.py
--------------------------------
Phase B-4 — Health File reminder dispatch worker.

Runs every 5 minutes inside the existing APScheduler. Picks up any
HealthReminder rows whose `next_fire_at <= now` (plus any advance-alert
days for premium_due / renewal kinds), then for each row:

  1. Builds a HealthDispatch queue row with three channel payloads baked
     in:
       - browser_push_payload  — JSON the frontend hands to Notification
       - wa_deep_link          — wa.me/<phone>?text=<urlencoded summary>
       - twilio_sid            — set only if TWILIO_* env vars are present
                                  AND the user gave a phone number (the
                                  family-cascade contract — never auto-cop).
  2. Updates the source reminder:
       - last_fired_at = now
       - next_fire_at  = recomputed from RRULE (FREQ=DAILY;BYHOUR=...,
                          FREQ=WEEKLY;BYDAY=..., FREQ=MONTHLY;BYMONTHDAY=...)
                         OR for one-shot reminders, leaves next_fire_at
                         alone but flips enabled=0 so we don't re-fire.
       - For premium_due/renewal with advance_alerts="30,7,1", computes
         the *next* advance alert and parks the reminder there.
  3. Spoken-en / spoken-hi fields stored on the dispatch row so the
     frontend (and a future Twilio TwiML endpoint) can speak directly.

Frontend integration:
  - GET /api/health-file/dispatch/pending?user_token=...&since=ISO
    returns un-acknowledged dispatch rows. The page polls every 60s and
    fires window.Notification + plays the spoken text via Voice Factory.
  - POST /api/health-file/dispatch/<id>/ack  marks ack_at=now so the
    banner disappears.

Privacy:
  - We never store the user's phone number server-side. The frontend
    appends ?phone=… to /pending and we render wa.me links with that
    phone, but the phone never lands in the DB.

Honest stubs (matches §3 #4 — "Honest stubs over fake demos"):
  - If TWILIO_* env vars are unset, twilio_sid stays NULL and we add a
    "twilio_not_configured" note. Cron stays GREEN.
  - WhatsApp deep-link works without any env config — wa.me is just a URL.
"""
from __future__ import annotations

import json
import logging
import re
import urllib.parse
from datetime import datetime, time, timedelta
from typing import Iterable, Optional

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from config import settings
from database import SessionLocal
from models.health_file import HealthDispatch, HealthReminder
from services import health_file_crypto as crypto

log = logging.getLogger("health_file_dispatch")


# ─────────────────────────────────────────────────────
# Public — scheduler entrypoint
# ─────────────────────────────────────────────────────

def run_dispatch(*, now: Optional[datetime] = None) -> dict:
    """
    APScheduler hook. Walks every enabled HealthReminder that's due (or
    has an advance alert due), queues HealthDispatch rows, and reschedules.

    Returns a dict the scheduler audit row can store.
    """
    now = now or datetime.utcnow()
    queued = 0
    rescheduled = 0
    disabled = 0
    errors = 0

    db = SessionLocal()
    try:
        # Cheap pull: every reminder due in the next 24h, then we
        # filter in Python (advance_alerts make a pure-SQL cutoff awkward).
        rows = db.execute(
            select(HealthReminder).where(
                and_(
                    HealthReminder.enabled == 1,
                    HealthReminder.next_fire_at <= now + timedelta(days=1),
                )
            )
        ).scalars().all()

        for r in rows:
            try:
                fired = _maybe_dispatch_one(db, r, now=now)
                if fired:
                    queued += 1
                # Update next_fire_at regardless — _maybe_dispatch_one only
                # writes the row, this advances the schedule.
                advanced, killed = _advance_schedule(r, now=now)
                if advanced:
                    rescheduled += 1
                if killed:
                    disabled += 1
            except Exception as e:  # noqa: BLE001
                log.exception("dispatch row failed for reminder %s: %s", r.id, e)
                errors += 1
        db.commit()
    finally:
        db.close()

    return {
        "upserted": queued,
        "skipped": rescheduled,
        "errors": errors,
        "note": (
            f"dispatch tick — queued={queued} rescheduled={rescheduled} "
            f"disabled_oneshots={disabled} errors={errors}"
        ),
    }


# ─────────────────────────────────────────────────────
# Single-row dispatch
# ─────────────────────────────────────────────────────

def _maybe_dispatch_one(db: Session, r: HealthReminder, *, now: datetime) -> bool:
    """Returns True if a HealthDispatch row was queued for this reminder."""
    fire_severity = _severity_for(r, now=now)
    if fire_severity is None:
        # Not due yet (next advance alert is still in the future).
        return False

    spoken_en, spoken_hi = _spoken_phrases(r, fire_severity)
    push_payload = json.dumps(
        {
            "title": _push_title_en(r, fire_severity),
            "body":  spoken_en,
            "tag":   f"hf-reminder-{r.id}",
            "icon":  "/favicon.ico",
            "data": {
                "reminder_id": r.id,
                "kind": r.kind,
                "severity": fire_severity,
                "label": r.label,
            },
        },
        ensure_ascii=False,
    )

    channels = _split_channels(r.channels)
    wa_link = _build_wa_link(r, spoken_hi if "hi" in channels else spoken_en) if "whatsapp" in channels else None
    twilio_sid = None
    twilio_note = None
    if "voice_call" in channels:
        twilio_sid, twilio_note = _maybe_place_twilio_call(r, spoken_hi or spoken_en)

    attempted = []
    delivered = []
    if "browser" in channels:
        attempted.append("browser")
        delivered.append("browser")  # JS will actually fire it; we mark as best-effort sent
    if wa_link:
        attempted.append("whatsapp")
        delivered.append("whatsapp")
    if twilio_sid:
        attempted.append("voice_call")
        delivered.append("voice_call")
    elif "voice_call" in channels:
        attempted.append("voice_call")

    row = HealthDispatch(
        reminder_id=r.id,
        user_token_hash=r.user_token_hash,
        profile_id=r.profile_id,
        kind=r.kind,
        severity=fire_severity,
        label=r.label[:240],
        detail=(r.detail or "")[:1000],
        spoken_en=spoken_en[:1000],
        spoken_hi=spoken_hi[:1000],
        wa_deep_link=wa_link,
        browser_push_payload=push_payload,
        twilio_sid=twilio_sid,
        channels_attempted=",".join(attempted)[:80],
        channels_delivered=",".join(delivered)[:80],
        last_error=twilio_note,
        fire_at=now,
    )
    db.add(row)
    r.last_fired_at = now
    return True


# ─────────────────────────────────────────────────────
# Severity decision — handles advance_alerts="30,7,1"
# ─────────────────────────────────────────────────────

def _severity_for(r: HealthReminder, *, now: datetime) -> Optional[str]:
    """Returns one of None / 'info' / 'advance_30d' / 'advance_7d' /
    'advance_1d' / 'overdue'.

    For non-advance kinds: 'info' if next_fire_at <= now, else None.
    For premium_due / renewal with advance_alerts: returns the matching
    advance bucket if the fire date is within that many days of next_fire_at.
    """
    if r.next_fire_at is None:
        return None
    delta_s = (r.next_fire_at - now).total_seconds()

    advance_days = _parse_advance(r.advance_alerts)
    if advance_days and r.kind in {"premium_due", "renewal", "vaccine_booster", "test_due", "dental_checkup"}:
        # next_fire_at lives at the actual due date; we fire at due_date - N days.
        for d in advance_days:
            window_start = (timedelta(days=d) - timedelta(hours=1)).total_seconds()
            window_end = (timedelta(days=d) + timedelta(hours=23)).total_seconds()
            if window_start <= delta_s <= window_end:
                return {30: "advance_30d", 7: "advance_7d", 1: "advance_1d"}.get(d, f"advance_{d}d")
        # Past due, no more advance buckets matched → overdue if delta_s < 0
        if delta_s <= 0:
            return "overdue"
        return None

    # Default: fire when due.
    if delta_s <= 60:  # 1-min grace
        return "info" if delta_s > -3600 else "overdue"
    return None


def _parse_advance(s: Optional[str]) -> list[int]:
    if not s:
        return []
    out = []
    for tok in str(s).split(","):
        tok = tok.strip()
        if tok.isdigit():
            out.append(int(tok))
    return sorted(set(out), reverse=True)


# ─────────────────────────────────────────────────────
# Schedule advance — RRULE subset
# ─────────────────────────────────────────────────────

# Supported RRULE shapes (RFC 5545 subset):
#   FREQ=DAILY                          → +1 day
#   FREQ=DAILY;BYHOUR=8,20              → next 8am or 8pm after now
#   FREQ=WEEKLY;BYDAY=MO,WE,FR          → next listed weekday
#   FREQ=MONTHLY;BYMONTHDAY=15          → next 15th
#
# Anything we don't recognise falls back to "leave next_fire_at where it
# is + advance by 1 day" so the worker never loops on a single row.

_DAY_MAP = {"MO": 0, "TU": 1, "WE": 2, "TH": 3, "FR": 4, "SA": 5, "SU": 6}


def _advance_schedule(r: HealthReminder, *, now: datetime) -> tuple[bool, bool]:
    """
    Returns (advanced?, disabled?).
    - advanced: next_fire_at moved forward
    - disabled: this was a one-shot, we flipped enabled=0
    """
    if r.next_fire_at is None:
        return False, False
    # Not due yet — leave alone.
    if (r.next_fire_at - now).total_seconds() > 60:
        return False, False

    if not r.rrule:
        # One-shot. Disable so we don't re-fire next tick.
        r.enabled = 0
        return False, True

    nxt = _next_after(r.rrule, base=now)
    if nxt is None or nxt <= now:
        # Couldn't parse → advance by a day so we don't spin.
        nxt = now + timedelta(days=1)
    r.next_fire_at = nxt
    return True, False


def _next_after(rrule: str, *, base: datetime) -> Optional[datetime]:
    parts = {k.upper(): v for k, v in (p.split("=", 1) for p in rrule.split(";") if "=" in p)}
    freq = parts.get("FREQ", "").upper()

    if freq == "DAILY":
        hours = _parse_int_csv(parts.get("BYHOUR")) or [base.hour]
        # Find next datetime > base whose hour is in `hours`.
        candidates = []
        for day_offset in (0, 1):
            day = base + timedelta(days=day_offset)
            for h in hours:
                cand = day.replace(hour=h % 24, minute=0, second=0, microsecond=0)
                if cand > base:
                    candidates.append(cand)
        return min(candidates) if candidates else base + timedelta(days=1)

    if freq == "WEEKLY":
        weekdays_raw = parts.get("BYDAY") or ""
        wanted = [_DAY_MAP[w.strip().upper()] for w in weekdays_raw.split(",")
                  if w.strip().upper() in _DAY_MAP]
        if not wanted:
            return base + timedelta(weeks=1)
        for d in range(1, 8):
            cand = (base + timedelta(days=d)).replace(
                hour=base.hour, minute=base.minute, second=0, microsecond=0
            )
            if cand.weekday() in wanted:
                return cand
        return base + timedelta(weeks=1)

    if freq == "MONTHLY":
        days = _parse_int_csv(parts.get("BYMONTHDAY")) or [base.day]
        # Find the next occurrence: this month if a later listed day,
        # else 1st matching day of next month.
        for day in sorted(set(d for d in days if d >= 1 and d <= 28)):
            try:
                cand = base.replace(day=day, hour=base.hour, minute=base.minute, second=0, microsecond=0)
            except ValueError:
                continue
            if cand > base:
                return cand
        nxt_month = base.replace(day=1) + timedelta(days=32)
        return nxt_month.replace(day=sorted(days)[0], hour=base.hour, minute=base.minute, second=0, microsecond=0)

    if freq == "YEARLY":
        return base.replace(year=base.year + 1)

    return None


def _parse_int_csv(s: Optional[str]) -> list[int]:
    if not s:
        return []
    out = []
    for tok in str(s).split(","):
        tok = tok.strip()
        if tok.lstrip("-").isdigit():
            out.append(int(tok))
    return out


# ─────────────────────────────────────────────────────
# Spoken phrases per kind × severity
# ─────────────────────────────────────────────────────

def _spoken_phrases(r: HealthReminder, severity: str) -> tuple[str, str]:
    name = (r.label or "").strip() or "reminder"
    if r.kind == "medicine":
        en = f"💊 Chitti reminder: time to take {name}."
        hi = f"💊 Chitti yaad dila rahi hai: {name} lene ka time ho gaya."
        return en, hi
    if r.kind == "premium_due":
        if severity == "advance_30d":
            return (
                f"📅 {name} premium is due in 30 days.",
                f"📅 {name} ka premium 30 din me due hai.",
            )
        if severity == "advance_7d":
            return (
                f"⚠️ {name} premium is due in 7 days.",
                f"⚠️ {name} ka premium 7 din me due hai.",
            )
        if severity == "advance_1d":
            return (
                f"🚨 {name} premium is due tomorrow — please pay.",
                f"🚨 {name} ka premium kal due hai — pay kar dijiye.",
            )
        if severity == "overdue":
            return (
                f"🚨 {name} premium is overdue.",
                f"🚨 {name} ka premium late ho gaya hai.",
            )
        return f"📅 {name} premium reminder.", f"📅 {name} ka premium reminder."
    if r.kind == "followup":
        return (
            f"🩺 Doctor follow-up today: {name}.",
            f"🩺 Aaj doctor follow-up hai: {name}.",
        )
    if r.kind == "test_due":
        return (
            f"🩸 Lab test due: {name}. Doctor asked to repeat.",
            f"🩸 Test due hai: {name}. Doctor ne repeat karne ko kaha tha.",
        )
    if r.kind == "prescription_expiry":
        return (
            f"📋 Prescription expires soon: {name}. Renew with your doctor.",
            f"📋 Prescription jald expire ho rahi hai: {name}. Doctor se renew karwa lijiye.",
        )
    if r.kind == "vaccine_booster":
        return (
            f"💉 Vaccine booster due: {name}.",
            f"💉 Vaccine booster due hai: {name}.",
        )
    if r.kind == "dental_checkup":
        return (
            f"🦷 Dental check-up due: {name}.",
            f"🦷 Dental check-up due hai: {name}.",
        )
    # default
    return f"⏰ Chitti reminder: {name}.", f"⏰ Chitti reminder: {name}."


def _push_title_en(r: HealthReminder, severity: str) -> str:
    if severity.startswith("advance_"):
        days = severity.split("_")[1].rstrip("d")
        return f"Chitti reminder — {days} day{'s' if days != '1' else ''} ahead"
    if severity == "overdue":
        return "Chitti reminder — OVERDUE"
    return "Chitti reminder"


# ─────────────────────────────────────────────────────
# Channel builders
# ─────────────────────────────────────────────────────

def _split_channels(csv: Optional[str]) -> set[str]:
    if not csv:
        return {"browser"}
    return {c.strip().lower() for c in csv.split(",") if c.strip()}


def _build_wa_link(r: HealthReminder, body: str) -> str:
    """
    wa.me link with the spoken phrase URL-encoded.
    We deliberately omit the phone number from the URL itself (`wa.me/?text=…`).
    The frontend can prepend `phone=<digits>` at render time so the link
    becomes `wa.me/<phone>?text=…` for the user's chosen contact. We never
    store the phone number server-side.
    """
    text = urllib.parse.quote(body)
    return f"https://wa.me/?text={text}"


_PHONE_RE = re.compile(r"^\+?\d{8,15}$")


def _maybe_place_twilio_call(r: HealthReminder, text: str) -> tuple[Optional[str], Optional[str]]:
    """
    Voice-call channel. Returns (twilio_sid_or_none, note_or_none).

    Honest stub: if Twilio env vars are missing OR no phone available, we
    skip the call and record a note. This matches the
    "Honest stubs over fake demos" rule in §3.

    Phone resolution: today the reminder model doesn't store a phone
    number. A future migration will add a per-profile phone column.
    Until then, voice_call attempts always go to the "stub" path.
    """
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER):
        return None, "twilio_not_configured"
    # No phone on file yet — Phase B will plumb a per-profile phone.
    return None, "no_phone_on_profile_yet"


# ─────────────────────────────────────────────────────
# Frontend queries
# ─────────────────────────────────────────────────────

def list_pending(user_token: str, *, since: Optional[datetime] = None, limit: int = 50) -> list[dict]:
    """Un-ack'd dispatches for this user_token, newest first."""
    if not user_token:
        return []
    u_hash = crypto.user_token_hash(user_token)
    cutoff = since or (datetime.utcnow() - timedelta(days=2))
    with SessionLocal() as s:
        rows = s.execute(
            select(HealthDispatch).where(
                and_(
                    HealthDispatch.user_token_hash == u_hash,
                    HealthDispatch.ack_at.is_(None),
                    HealthDispatch.queued_at >= cutoff,
                )
            ).order_by(HealthDispatch.queued_at.desc()).limit(max(1, min(limit, 200)))
        ).scalars().all()
    return [_dispatch_dict(r) for r in rows]


def ack(user_token: str, dispatch_id: int) -> bool:
    if not user_token:
        return False
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        row = s.execute(
            select(HealthDispatch).where(
                and_(
                    HealthDispatch.id == dispatch_id,
                    HealthDispatch.user_token_hash == u_hash,
                )
            )
        ).scalar_one_or_none()
        if not row or row.ack_at is not None:
            return False
        row.ack_at = datetime.utcnow()
        s.commit()
    return True


def _dispatch_dict(r: HealthDispatch) -> dict:
    try:
        push = json.loads(r.browser_push_payload) if r.browser_push_payload else None
    except (ValueError, TypeError):
        push = None
    return {
        "id": r.id,
        "reminder_id": r.reminder_id,
        "profile_id": r.profile_id,
        "kind": r.kind,
        "severity": r.severity,
        "label": r.label,
        "detail": r.detail,
        "spoken_en": r.spoken_en,
        "spoken_hi": r.spoken_hi,
        "wa_deep_link": r.wa_deep_link,
        "browser_push": push,
        "channels_attempted": r.channels_attempted,
        "channels_delivered": r.channels_delivered,
        "twilio_sid": r.twilio_sid,
        "last_error": r.last_error,
        "fire_at": r.fire_at.isoformat() if r.fire_at else None,
        "queued_at": r.queued_at.isoformat() if r.queued_at else None,
    }
