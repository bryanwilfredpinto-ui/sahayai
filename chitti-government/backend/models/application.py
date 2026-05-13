"""
models/application.py
---------------------
P1 (2026-05-13) — per-user application status tracker.

A row per (user_token, scheme_slug). The user records when they applied
to a scheme and Chitti tracks the status. Today the status is
user-asserted (we ask the user to update it; no portal-scraping). Once
DigiLocker / per-state SSO partnerships land, an automated poller will
update these rows — the data model is the same.

Status vocabulary (small, honest, never coerced):
  draft          — user hasn't submitted yet
  submitted      — sent to the portal, awaiting acknowledgement
  acknowledged   — portal received it (application ID known)
  under_review   — moved into review queue
  approved       — beneficiary list / sanction order issued
  rejected       — explicit refusal with reason
  needs_action   — portal asked for more documents / clarification
  withdrawn      — user pulled the application
  unknown        — fallback, never assume good news

The reminder column lets the user opt-in to a periodic "check on this
application" prompt via the existing scheduler.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, Index

from database import Base
from models._schema import TABLE_KW


VALID_STATUSES = (
    "draft", "submitted", "acknowledged", "under_review",
    "approved", "rejected", "needs_action", "withdrawn", "unknown",
)


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)

    user_token = Column(String(80), index=True, nullable=False)
    scheme_slug = Column(String(120), index=True, nullable=False)

    status = Column(String(20), index=True, nullable=False, default="draft")
    application_id = Column(String(160), nullable=True)            # portal-assigned ID
    portal_url = Column(String(400), nullable=True)                # convenience link
    state_code = Column(String(8), nullable=True)
    note = Column(Text, nullable=True)
    reminder_days = Column(Integer, nullable=True)                 # 0/null = no reminder

    # Lightweight audit trail for status transitions — list of dicts
    # serialised as JSON text so we don't add a separate table for a
    # rarely-queried log. Most recent at the end.
    history = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_checked_at = Column(DateTime, nullable=True)


Index(
    "ix_applications_user_scheme",
    Application.user_token,
    Application.scheme_slug,
    unique=True,
)
