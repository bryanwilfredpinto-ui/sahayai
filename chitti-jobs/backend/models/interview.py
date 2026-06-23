"""
models/interview.py
-------------------
BO1 (+ BO15/BO16 future) — a scheduled / proposed interview for an
application.

Specified columns (verbatim from CEOS BO1):
  id, application_id, proposed_time, confirmed_time,
  calendar_event_id, brief_generated

Calendar: per the founder-approved no-OAuth approach, booking is a
downloadable .ics file the user adds to their own calendar — there is no
Google Calendar API in v1, so `calendar_event_id` stays null until the
BO15+ future phase. `brief_text` holds the auto-generated interview brief
(BO16); `brief_generated` is the boolean flag the CEOS schema names.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, index=True, nullable=False)   # → applications.id

    proposed_time = Column(DateTime, nullable=True)
    confirmed_time = Column(DateTime, nullable=True)
    calendar_event_id = Column(String(200), nullable=True)        # null in v1 (.ics, no Google API)
    brief_generated = Column(Boolean, nullable=False, default=False)

    brief_text = Column(Text, nullable=True)                       # additive: BO16 brief body
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
