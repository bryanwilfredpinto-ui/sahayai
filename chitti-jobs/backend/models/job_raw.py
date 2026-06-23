"""
models/job_raw.py
-----------------
BO1 — raw job listings. Per the CEOS BO1 schema (and the founder's
2026-06-23 confirmation), rows are PER-USER: different users may apply to
the same posting independently, so `user_id` is intentional on jobs_raw.

Specified columns (verbatim from CEOS BO1):
  id, user_id, platform, title, company, location, url, jd_text,
  scraped_at, status

Additive support columns (needed to implement CEOS-specified behaviour —
recency scoring in §23B Step 3, and cross-platform dedup in Step 2):
  posted_at   — posting date (recency: +1 if < 48h)
  dedup_key   — normalised (title|company|location) for duplicate removal
  source      — 'naukri_rss' | 'indeed_rss' | 'manual_paste'
  created_at  — row insert time
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, Index

from database import Base
from models._schema import TABLE_KW


# status: new (just ingested) → scored (passed through BO5) → archived
JOB_RAW_STATUSES = ("new", "scored", "archived")


class JobRaw(Base):
    __tablename__ = "jobs_raw"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(80), index=True, nullable=False)   # X-User-Token uid

    platform = Column(String(60), nullable=True)               # naukri | indeed | manual | ...
    title = Column(String(300), nullable=False)
    company = Column(String(240), nullable=True)
    location = Column(String(200), nullable=True)
    url = Column(String(800), nullable=True)
    jd_text = Column(Text, nullable=True)
    scraped_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), index=True, nullable=False, default="new")

    # additive support columns
    posted_at = Column(DateTime, nullable=True)
    dedup_key = Column(String(400), index=True, nullable=True)
    source = Column(String(40), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# A user should not hold the same posting twice (cross-platform dedup, Step 2).
Index("ix_jobs_raw_user_dedup", JobRaw.user_id, JobRaw.dedup_key, unique=True)
