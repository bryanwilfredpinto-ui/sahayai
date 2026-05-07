"""
models/family.py
----------------
Multi-profile family wallet. Each row = one family member tracked by the
account-holder (self / mother / father / child / etc.).

Auth is intentionally light for v1 — keyed by `user_token` (a per-device
opaque string the frontend stores in localStorage). When ABDM-grade auth
ships, swap user_token for the verified phone hash.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


class FamilyProfile(Base):
    __tablename__ = "family_profiles"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    user_token = Column(String(80), index=True, nullable=False)

    name = Column(String(120), nullable=False)
    relation = Column(String(40), nullable=False, default="self")  # self/mother/father/spouse/child/...
    dob = Column(String(12), nullable=True)                        # ISO date string

    # JSON list dumped as text — e.g. ["diabetes", "BP"] for chronic-care projection
    conditions = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
