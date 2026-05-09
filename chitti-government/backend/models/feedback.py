"""
models/feedback.py
------------------
Anonymous thumbs-up / thumbs-down on a Chitti Government interaction.

PRIVACY: no user_token, no IP, no name. Just the scheme slug (or a
generic feature key like 'eligibility_checker'), the verdict, and an
optional free-text note (capped at 240 chars). Aggregated counts are
visible to the operator via /api/government/feedback/summary; the raw
notes never leave the database.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


class Feedback(Base):
    __tablename__ = "feedback"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, autoincrement=True)
    feature = Column(String(64), nullable=False, index=True)  # eligibility / alerts / locator...
    scheme_slug = Column(String(120), nullable=True, index=True)
    verdict = Column(String(8), nullable=False)  # 'up' / 'down'
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
