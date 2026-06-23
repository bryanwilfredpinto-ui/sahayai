"""
models/application.py
---------------------
BO1 + BO10 — one row per (user, job) application the user chose to act on.

Specified columns (verbatim from CEOS BO1):
  id, user_id, job_id, email_draft, cover_letter, sent_at,
  response_received, follow_up_count

BO10 (Application CRM) tracks the status across the pipeline:
  Found → Reviewed → Applied → Replied → Interview → Offer → Rejected
We store that in `status` + an audit trail in `history` (JSON text).
`sent_at` is set when the USER confirms send (Art 5 — Chitti never
auto-sends; the mailto: hand-off means the user's own mail app sends it).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, Index

from database import Base
from models._schema import TABLE_KW


# CRM status vocabulary (BO10, CEOS §5 feature 9). Lowercased internally.
APPLICATION_STATUSES = (
    "found", "reviewed", "applied", "replied",
    "interview", "offer", "rejected", "withdrawn",
)


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(80), index=True, nullable=False)
    job_id = Column(Integer, index=True, nullable=False)        # → jobs_raw.id

    email_draft = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    mailto_link = Column(Text, nullable=True)                   # BO8 deep link (additive)

    status = Column(String(20), index=True, nullable=False, default="found")
    sent_at = Column(DateTime, nullable=True)
    response_received = Column(Boolean, nullable=False, default=False)
    follow_up_count = Column(Integer, nullable=False, default=0)

    history = Column(Text, nullable=True)                       # JSON list of {status, ts, note}

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


Index("ix_applications_user_job", Application.user_id, Application.job_id, unique=True)
