"""
models/follow_up.py
-------------------
BO1 (+ BO14 future) — a follow-up draft for an application.

Specified columns (verbatim from CEOS BO1):
  id, application_id, draft, sent_at, response

The day-5 auto-draft (BO14) creates a row with the drafted text; like
every outbound action it is NOT sent automatically — the user approves
and sends via the mailto: hand-off (Art 5). `day_number` records which
follow-up this is (5, 10, ...).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, Text

from database import Base
from models._schema import TABLE_KW


class FollowUp(Base):
    __tablename__ = "follow_ups"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, index=True, nullable=False)   # → applications.id

    draft = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    response = Column(Text, nullable=True)

    day_number = Column(Integer, nullable=True)                    # additive: 5, 10, ...
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
