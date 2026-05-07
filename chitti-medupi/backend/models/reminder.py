"""
models/reminder.py
------------------
Refill / expiry / dose / appointment reminder for a family profile.

Notification channel wires next session — first browser push, then
WhatsApp Business, then Twilio voice for grandparents-without-smartphone.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database import Base
from models._schema import TABLE_KW, fk_target


class Reminder(Base):
    __tablename__ = "reminders"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey(fk_target("family_profiles")), index=True, nullable=False)
    user_token = Column(String(80), index=True, nullable=False)

    medicine_name = Column(String(160), nullable=False)
    kind = Column(String(20), nullable=False, default="refill")   # refill / expiry / dose / appointment
    next_due = Column(DateTime, nullable=False, index=True)
    recurrence = Column(String(40), nullable=True)                # daily / weekly / monthly / once
    note = Column(String(240), nullable=True)
    status = Column(String(16), nullable=False, default="active") # active / done / dismissed

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
