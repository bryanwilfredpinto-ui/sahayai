"""
models/memory.py
----------------
CHITTI MEMORY OS — BO1 foundation (per-user episodic memory).

Two tables, both keyed by a device-pseudonymous UUID (`device_uuid`,
sent by the frontend as the `X-User-Token` header / localStorage
`sahay_device_id`). No PII required — DPDP data-minimisation.

  user_sessions  — the turn log (what was said, which Chitti, when).
  user_facts     — distilled durable facts about the user (upsert on
                   device_uuid+fact_type+fact_value; last_seen bumped).

BO1 stores + retrieves only. Vector recall, fact-extraction, consent
enforcement, decay/consolidation and the privacy tab arrive in BO3-BO5
(see MEMORY_ARCHITECTURE.md). Memory is best-effort — see
services/medupi_memory.py for the graceful (never-throw) wrappers.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint

from database import Base
from models._schema import TABLE_KW


class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = TABLE_KW

    id           = Column(Integer, primary_key=True, index=True)
    device_uuid  = Column(String(80), index=True, nullable=False)
    chitti_name  = Column(String(40), index=True, nullable=False)
    timestamp    = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    message_role = Column(String(16), nullable=False)   # 'user' | 'chitti'
    message_text = Column(Text, nullable=True)


class UserFact(Base):
    __tablename__ = "user_facts"
    __table_args__ = (
        UniqueConstraint("device_uuid", "fact_type", "fact_value",
                         name="uq_user_fact"),
        TABLE_KW,
    )

    id           = Column(Integer, primary_key=True, index=True)
    device_uuid  = Column(String(80), index=True, nullable=False)
    fact_type    = Column(String(40), nullable=False)    # e.g. 'scanned_medicine','allergy','condition','preference'
    fact_value   = Column(String(240), nullable=False)
    source_chitti = Column(String(40), nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen    = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
