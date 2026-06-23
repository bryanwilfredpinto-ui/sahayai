"""
models/job_scored.py
--------------------
BO1 + BO5 + BO6 — the per-user scoring verdict for a raw job.

Specified columns (verbatim from CEOS BO1):
  job_id, user_id, score, ats_match_pct, match_reasons,
  status: pending | apply | skip | applied

`match_reasons` holds the deterministic score breakdown as JSON text so
every 1-10 score is fully auditable (CEOS §24 "scoring accuracy" +
transparency). Only score >= 7 is surfaced to the user (CEOS §23B Step 5).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Index

from database import Base
from models._schema import TABLE_KW


SCORED_STATUSES = ("pending", "apply", "skip", "applied")


class JobScored(Base):
    __tablename__ = "jobs_scored"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, index=True, nullable=False)        # → jobs_raw.id
    user_id = Column(String(80), index=True, nullable=False)

    score = Column(Integer, nullable=False, default=0)          # 1..10 (clamped)
    ats_match_pct = Column(Float, nullable=True)                # 0..100
    match_reasons = Column(Text, nullable=True)                 # JSON: [{factor, delta}], +missing keywords
    status = Column(String(20), index=True, nullable=False, default="pending")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


Index("ix_jobs_scored_user_job", JobScored.user_id, JobScored.job_id, unique=True)
