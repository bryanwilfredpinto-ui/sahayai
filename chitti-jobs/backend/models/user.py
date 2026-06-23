"""
models/user.py
--------------
BO1 + BO2 — the per-device user job profile ("users" table in the CEOS
BO1 schema). One row per device-user, keyed by `uid` (the X-User-Token
UUID — the same identity the Memory OS uses; see MEMORY_ARCHITECTURE.md
§1). This IS the durable job profile that makes "Chitti already knows
you" true across sessions (Constitution Art 10), and it is the local
mirror that the central Memory OS (mem_fact) syncs with when
CHITTI_MEMORY_URL is configured (BO2).

Privacy (Art 7): the profile is per-device, never shared across users.
Consent-first (memory design): `consent_basic` defaults OFF; nothing is
persisted to a durable profile until the user opts in during onboarding.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


# Career situation vocabulary — drives gap-narrative selection (Section 23C).
CAREER_SITUATIONS = (
    "actively_hunting", "passively_open", "career_change",
    "returning", "fresher", "laid_off",
)

# User levels (BO3 classifier output).
USER_LEVELS = ("fresher", "junior", "mid", "senior", "cxo")


class UserProfile(Base):
    __tablename__ = "users"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(80), unique=True, index=True, nullable=False)  # X-User-Token UUID

    # ── Identity / profile (sourced from memory or captured at onboarding) ──
    name = Column(String(160), nullable=True)
    experience_years = Column(Float, nullable=True)
    current_role = Column(String(200), nullable=True)
    target_roles = Column(Text, nullable=True)          # JSON list
    target_locations = Column(Text, nullable=True)      # JSON list
    target_industries = Column(Text, nullable=True)     # JSON list
    salary_expectation = Column(String(120), nullable=True)
    work_type = Column(String(20), nullable=True)       # wfh | hybrid | office | any
    resume_text = Column(Text, nullable=True)
    linkedin_url = Column(String(400), nullable=True)
    career_situation = Column(String(30), nullable=True)
    blacklist_companies = Column(Text, nullable=True)   # JSON list
    gulf_target = Column(Boolean, nullable=False, default=False)

    # ── Derived (BO3) ──
    user_level = Column(String(20), index=True, nullable=True)

    # ── Preferences / consent ──
    lang = Column(String(8), nullable=False, default="hi")
    consent_basic = Column(Boolean, nullable=False, default=False)  # opt-in, never silent

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
