"""
models/courses_v2.py
--------------------
Aggregator-doctrine course schema (CHITTI_NEWS_AI_MASTER_SPEC v0.2 §7).

The existing `services/courses.py` static-curated list (the 14 courses
locked 2026-05-23 LIVE in production) is NOT touched. This module adds a
parallel rich-schema table for the Phase 0 aggregator pipeline. The two
do not interact — the old endpoint keeps serving the locked list; the new
endpoint serves the aggregated feed.

One row per (source_slug, external_id) — the natural key. Every row
carries the provider's own URL so the user can always open the source.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint

from database import Base


class CourseV2(Base):
    """One ingested course. Provider-attributed, never AI-generated.

    Free / paid label is captured verbatim from the source — never inferred.
    Profession relevance lives in the separate `profession_relevance` table
    so a course can be tagged with multiple professions without bloating
    this row.
    """
    __tablename__ = "courses_v2"

    id = Column(Integer, primary_key=True)

    # Source attribution — every row points back to an entry in courses_sources.json.
    source_slug = Column(String(80), nullable=False, index=True)       # e.g. "microsoft-learn"
    source_name = Column(String(200), nullable=False)                  # e.g. "Microsoft Learn"
    source_domain = Column(String(200), nullable=False)                # e.g. "learn.microsoft.com"
    external_id = Column(String(200), nullable=False)                  # provider's own ID or slug

    # The thing itself — pulled verbatim from the source.
    title = Column(Text, nullable=False)
    url = Column(String(900), nullable=False)                          # always the provider's own URL
    summary = Column(Text, nullable=True)                              # provider-supplied where available
    duration_minutes = Column(Integer, nullable=True)
    level = Column(String(40), nullable=True)                          # beginner | intermediate | advanced
    topics = Column(Text, nullable=True)                               # comma-separated, provider-supplied

    # Honest cost label. Phase 0 only ingests free or audit-mode-free sources.
    # `cost_label` is verbatim from the provider; `is_free` is a derived bool
    # for fast filtering but NEVER overrides cost_label on display.
    is_free = Column(Integer, default=1, nullable=False)
    cost_label = Column(String(200), nullable=True)

    # Bookkeeping.
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_verified_at = Column(DateTime, nullable=True)                 # set by link-checker
    last_verified_status = Column(Integer, nullable=True)              # HTTP status on last HEAD probe
    last_error = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("source_slug", "external_id", name="ux_courses_v2_source_external"),
        Index("ix_courses_v2_source_ingested", "source_slug", "ingested_at"),
    )


class ProfessionRelevance(Base):
    """Multi-label profession tags per aggregated item.

    `item_kind` lets the same table tag courses today, certifications and
    tools tomorrow without a schema change. `confidence` is whatever the
    classifier returned (Gemini few-shot). `classifier_version` lets us
    invalidate stale classifications when the prompt is revised.
    """
    __tablename__ = "profession_relevance"

    id = Column(Integer, primary_key=True)
    item_kind = Column(String(40), nullable=False, index=True)         # course | cert | tool | job | scheme | roadmap_node
    item_id = Column(Integer, nullable=False, index=True)              # FK to the kind-specific table (logical, not enforced)
    profession_slug = Column(String(80), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    classifier_version = Column(String(40), nullable=False)            # e.g. "gemini-2.0-flash-2026-05-29"
    classified_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("item_kind", "item_id", "profession_slug", "classifier_version",
                         name="ux_profrel_kind_item_prof_ver"),
        Index("ix_profrel_kind_prof", "item_kind", "profession_slug"),
    )
