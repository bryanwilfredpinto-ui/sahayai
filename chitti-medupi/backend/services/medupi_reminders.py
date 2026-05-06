"""
services/medupi_reminders.py
----------------------------
Refill / expiry / dose / appointment reminder CRUD.

Notification channel wires next session — first browser push, then
WhatsApp Business, then Twilio voice for grandparents-without-smartphone.
The Twilio scaffold (`send_voice_call`) is here as a stub so the route
shape doesn't change later.
"""
from __future__ import annotations

import logging
from datetime import datetime
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
