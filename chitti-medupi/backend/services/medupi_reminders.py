"""
services/medupi_reminders.py
----------------------------
Refill / expiry / dose / appointment reminder CRUD.

Notification channel wires next session — first browser push, then
WhatsApp Business, then Twilio voice for grandparents-without-smartphone.
The Twilio scaffold (`send_voice_call`) is here as a stub so the route
shape doesn't change later.

Expiry summary helpers (added 2026-05-13) — P0 safety feature. Buckets
upcoming medicine-expiry reminders into EXPIRED / EXPIRING_SOON (≤7d) /
EXPIRING (≤30d) / OK with a voice-readable phrase per bucket, so the
frontend can render symbol + word labels (never colour alone) and the
daily 08:00 IST scheduler can hand the same phrase to the
notification channels.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from config import settings
from models.family import FamilyProfile
from models.reminder import Reminder

log = logging.getLogger("medupi_reminders")


def _entry_dict(r: Reminder) -> dict:
    return {
        "id": r.id,
        "profile_id": r.profile_id,
        "medicine_name": r.medicine_name,
        "kind": r.kind,
        "next_due": r.next_due.isoformat() if r.next_due else None,
        "recurrence": r.recurrence,
        "note": r.note,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def add_reminder(
    db: Session,
    user_token: str,
    profile_id: int,
    medicine_name: str,
    next_due: datetime,
    kind: str = "refill",
    recurrence: Optional[str] = None,
    note: Optional[str] = None,
) -> dict:
    profile = (
        db.query(FamilyProfile)
        .filter(FamilyProfile.user_token == user_token, FamilyProfile.id == profile_id)
        .first()
    )
    if not profile:
        raise ValueError("profile not found for this user_token")

    if kind not in ("refill", "expiry", "dose", "appointment"):
        kind = "refill"

    r = Reminder(
        profile_id=profile.id,
        user_token=user_token,
        medicine_name=medicine_name.strip(),
        kind=kind,
        next_due=next_due,
        recurrence=recurrence,
        note=note,
        status="active",
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _entry_dict(r)


def list_reminders(
    db: Session,
    user_token: str,
    profile_id: int | None = None,
    status: str = "active",
    limit: int = 100,
) -> list[dict]:
    q = db.query(Reminder).filter(Reminder.user_token == user_token)
    if profile_id is not None:
        q = q.filter(Reminder.profile_id == profile_id)
    if status:
        q = q.filter(Reminder.status == status)
    rows = q.order_by(Reminder.next_due.asc()).limit(limit).all()
    return [_entry_dict(r) for r in rows]


def update_status(db: Session, user_token: str, reminder_id: int, status: str) -> bool:
    r = (
        db.query(Reminder)
        .filter(Reminder.user_token == user_token, Reminder.id == reminder_id)
        .first()
    )
    if not r:
        return False
    if status not in ("active", "done", "dismissed"):
        return False
    r.status = status
    db.commit()
    return True


def delete_reminder(db: Session, user_token: str, reminder_id: int) -> bool:
    r = (
        db.query(Reminder)
        .filter(Reminder.user_token == user_token, Reminder.id == reminder_id)
        .first()
    )
    if not r:
        return False
    db.delete(r)
    db.commit()
    return True


# ───── Expiry summary (P0 safety, 2026-05-13) ─────

# Urgency bucket constants. Symbol + word label, never colour alone —
# the frontend must render BOTH. See SAHAYAI_MASTER §7 four-user contract.
_EXPIRY_BUCKETS = ("EXPIRED", "EXPIRING_SOON", "EXPIRING", "OK")
_BUCKET_BADGE = {
    "EXPIRED":       {"symbol": "❌", "word": "EXPIRED",       "hi": "एक्सपायर हो चुकी"},
    "EXPIRING_SOON": {"symbol": "⚠️", "word": "EXPIRING SOON", "hi": "जल्द एक्सपायर"},
    "EXPIRING":      {"symbol": "⏰", "word": "EXPIRING",      "hi": "एक्सपायर होने वाली"},
    "OK":            {"symbol": "✅", "word": "OK",            "hi": "ठीक है"},
}


def _bucket_for(next_due: datetime, now: datetime) -> str:
    delta = next_due - now
    if delta.total_seconds() < 0:
        return "EXPIRED"
    if delta <= timedelta(days=7):
        return "EXPIRING_SOON"
    if delta <= timedelta(days=30):
        return "EXPIRING"
    return "OK"


def expiry_summary(
    db: Session,
    user_token: str,
    profile_id: Optional[int] = None,
    window_days: int = 30,
    *,
    now: Optional[datetime] = None,
) -> dict:
    """
    Group active `kind='expiry'` reminders by urgency bucket.

    Returns a payload the frontend can render directly:
      {
        "now": "2026-05-13T...",
        "window_days": 30,
        "counts": {"EXPIRED": 0, "EXPIRING_SOON": 1, ...},
        "items": [
          { "id", "medicine_name", "next_due", "days_remaining",
            "bucket", "badge": {"symbol", "word", "hi"},
            "spoken_en", "spoken_hi" },
          ...
        ],
        "spoken_summary_en": "1 medicine expiring this week. ...",
        "spoken_summary_hi": "1 दवा इस हफ्ते एक्सपायर हो रही है। ...",
      }
    """
    now = now or datetime.utcnow()
    q = db.query(Reminder).filter(
        Reminder.user_token == user_token,
        Reminder.kind == "expiry",
        Reminder.status == "active",
    )
    if profile_id is not None:
        q = q.filter(Reminder.profile_id == profile_id)
    rows = q.order_by(Reminder.next_due.asc()).all()

    counts = {b: 0 for b in _EXPIRY_BUCKETS}
    items: list[dict] = []
    for r in rows:
        if r.next_due is None:
            continue
        bucket = _bucket_for(r.next_due, now)
        if bucket == "OK" and (r.next_due - now) > timedelta(days=window_days):
            # Out of window — count but don't surface in items list.
            counts["OK"] += 1
            continue
        counts[bucket] += 1
        days_remaining = int((r.next_due - now).total_seconds() // 86400)
        badge = _BUCKET_BADGE[bucket]
        items.append({
            "id": r.id,
            "profile_id": r.profile_id,
            "medicine_name": r.medicine_name,
            "next_due": r.next_due.isoformat(),
            "days_remaining": days_remaining,
            "bucket": bucket,
            "badge": badge,
            "spoken_en": _spoken_phrase_en(r.medicine_name, bucket, days_remaining),
            "spoken_hi": _spoken_phrase_hi(r.medicine_name, bucket, days_remaining),
        })

    return {
        "now": now.isoformat(),
        "window_days": window_days,
        "counts": counts,
        "items": items,
        "spoken_summary_en": _summary_phrase_en(counts),
        "spoken_summary_hi": _summary_phrase_hi(counts),
    }


def _spoken_phrase_en(name: str, bucket: str, days_remaining: int) -> str:
    if bucket == "EXPIRED":
        d = abs(days_remaining)
        return f"{name} has expired {d} day{'s' if d != 1 else ''} ago. Do not use."
    if bucket == "EXPIRING_SOON":
        if days_remaining == 0:
            return f"{name} expires today."
        return f"{name} expires in {days_remaining} day{'s' if days_remaining != 1 else ''}. Use it or replace it."
    if bucket == "EXPIRING":
        return f"{name} expires in {days_remaining} days."
    return f"{name} is safe — expires in {days_remaining} days."


def _spoken_phrase_hi(name: str, bucket: str, days_remaining: int) -> str:
    if bucket == "EXPIRED":
        return f"{name} एक्सपायर हो चुकी है। मत लीजिए।"
    if bucket == "EXPIRING_SOON":
        if days_remaining == 0:
            return f"{name} आज एक्सपायर हो रही है।"
        return f"{name} {days_remaining} दिन में एक्सपायर हो रही है।"
    if bucket == "EXPIRING":
        return f"{name} {days_remaining} दिन में एक्सपायर हो रही है।"
    return f"{name} ठीक है — {days_remaining} दिन बाकी।"


def _summary_phrase_en(counts: dict) -> str:
    bits = []
    if counts["EXPIRED"]:
        bits.append(f"{counts['EXPIRED']} expired")
    if counts["EXPIRING_SOON"]:
        bits.append(f"{counts['EXPIRING_SOON']} expiring this week")
    if counts["EXPIRING"]:
        bits.append(f"{counts['EXPIRING']} expiring this month")
    if not bits:
        return "No medicines expiring soon."
    return "Medicine cabinet check: " + ", ".join(bits) + "."


def _summary_phrase_hi(counts: dict) -> str:
    bits = []
    if counts["EXPIRED"]:
        bits.append(f"{counts['EXPIRED']} एक्सपायर")
    if counts["EXPIRING_SOON"]:
        bits.append(f"{counts['EXPIRING_SOON']} इस हफ्ते एक्सपायर")
    if counts["EXPIRING"]:
        bits.append(f"{counts['EXPIRING']} इस महीने एक्सपायर")
    if not bits:
        return "अभी कोई दवा एक्सपायर नहीं हो रही।"
    return "दवाई कैबिनेट: " + ", ".join(bits) + "।"


def run_daily_expiry_scan(db: Session, *, now: Optional[datetime] = None) -> dict:
    """
    Daily 08:00 IST scheduler job — scan every active expiry reminder.

    Today this only computes the audit summary (rows scanned + bucket
    counts). Notification fan-out (browser push / WhatsApp / Twilio)
    plugs into the same payload once those channels land — `expiry_summary`
    already returns spoken_en/spoken_hi per row.
    """
    now = now or datetime.utcnow()
    rows = (
        db.query(Reminder)
        .filter(Reminder.kind == "expiry", Reminder.status == "active")
        .all()
    )
    counts = {b: 0 for b in _EXPIRY_BUCKETS}
    for r in rows:
        if r.next_due is None:
            continue
        counts[_bucket_for(r.next_due, now)] += 1
    note = (
        f"scanned {len(rows)} expiry reminders — "
        f"EXPIRED={counts['EXPIRED']} "
        f"SOON={counts['EXPIRING_SOON']} "
        f"EXPIRING={counts['EXPIRING']} OK={counts['OK']}"
    )
    return {"upserted": 0, "skipped": 0, "errors": 0, "note": note, "counts": counts}


# ───── Notification channels (stubs — wires next session) ─────

def send_voice_call(phone: str, text: str) -> dict:
    """
    Twilio voice-call reminder. Stub — wires when TWILIO_* env vars are set.
    Reaches grandparents without smartphones (Chitti Special).
    """
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER):
        return {"ok": False, "skipped": True, "reason": "Twilio not configured"}
    log.info("voice-call stub — phone=%s text=%r", phone, text)
    return {"ok": True, "stub": True, "channel": "twilio_voice"}
