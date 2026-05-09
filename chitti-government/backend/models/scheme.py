"""
models/scheme.py
----------------
Government scheme catalog row. One row per central or state scheme.

Eligibility predicates are stored as nullable scalars (NULL = not
constrained) plus a JSON `exclusions` blob for the long-tail rules
that don't fit a column (PM-Kisan's "income-tax-payer", PMAY-G's
13-point exclusion list, etc.). This shape lets the rule engine in
services/government_eligibility.py compute Eligible/Partial/Ineligible
in O(n) over the user's profile.

The `documents_required` and `category` fields are stored as JSON
arrays for portability between Postgres (jsonb-backed) and SQLite
(text-backed).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
)

from database import Base
from models._schema import TABLE_KW


class Scheme(Base):
    __tablename__ = "schemes"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    name_en = Column(String(240), nullable=False)
    name_hi = Column(String(240), nullable=True)
    short_code = Column(String(40), nullable=True, index=True)  # PMK, PMAY-G, PMJAY...
    ministry = Column(String(160), nullable=True)
    level = Column(String(16), nullable=False, default="central")  # central / state
    state_code = Column(String(8), nullable=True, index=True)  # ISO 3166-2:IN minus IN-

    category = Column(JSON, nullable=False, default=list)  # ['agriculture','health',...]
    benefit_amount_inr = Column(Integer, nullable=True)
    benefit_type = Column(String(24), nullable=True)  # cash / insurance / subsidy / service
    benefit_summary_en = Column(Text, nullable=True)
    benefit_summary_hi = Column(Text, nullable=True)

    # ── Eligibility predicates (NULL = not constrained) ──
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    gender = Column(String(8), nullable=True)  # any / f / m / other
    income_max_annual_inr = Column(Integer, nullable=True)
    bpl_required = Column(Boolean, nullable=True)
    secc_deprivation_required = Column(Boolean, nullable=True)
    occupation = Column(JSON, nullable=False, default=list)
    landholding_max_ha = Column(Float, nullable=True)
    landholding_min_ha = Column(Float, nullable=True)
    caste = Column(JSON, nullable=False, default=list)  # ['SC','ST','OBC','GEN']
    disability_required = Column(Boolean, nullable=True)
    rural_urban = Column(String(8), nullable=True)  # rural / urban / both
    exclusions = Column(JSON, nullable=False, default=list)
    eligibility_notes_en = Column(Text, nullable=True)
    eligibility_notes_hi = Column(Text, nullable=True)

    # ── Application + documents ──
    documents_required = Column(JSON, nullable=False, default=list)
    application_url = Column(String(400), nullable=True)
    status_check_url = Column(String(400), nullable=True)
    source_url = Column(String(400), nullable=True)
    helpline = Column(String(48), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)
    last_synced_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "slug": self.slug,
            "name_en": self.name_en,
            "name_hi": self.name_hi,
            "short_code": self.short_code,
            "ministry": self.ministry,
            "level": self.level,
            "state_code": self.state_code,
            "category": self.category or [],
            "benefit_amount_inr": self.benefit_amount_inr,
            "benefit_type": self.benefit_type,
            "benefit_summary_en": self.benefit_summary_en,
            "benefit_summary_hi": self.benefit_summary_hi,
            "age_min": self.age_min,
            "age_max": self.age_max,
            "gender": self.gender,
            "income_max_annual_inr": self.income_max_annual_inr,
            "bpl_required": self.bpl_required,
            "secc_deprivation_required": self.secc_deprivation_required,
            "occupation": self.occupation or [],
            "landholding_max_ha": self.landholding_max_ha,
            "landholding_min_ha": self.landholding_min_ha,
            "caste": self.caste or [],
            "disability_required": self.disability_required,
            "rural_urban": self.rural_urban,
            "exclusions": self.exclusions or [],
            "eligibility_notes_en": self.eligibility_notes_en,
            "eligibility_notes_hi": self.eligibility_notes_hi,
            "documents_required": self.documents_required or [],
            "application_url": self.application_url,
            "status_check_url": self.status_check_url,
            "source_url": self.source_url,
            "helpline": self.helpline,
            "is_active": self.is_active,
            "last_synced_at": self.last_synced_at.isoformat() if self.last_synced_at else None,
        }
