"""
models/aggregated_items.py
--------------------------
Generic aggregator table for the 5 streams beyond courses + news
(CHITTI_NEWS_AI_MASTER_SPEC v0.3 §3 rows: certifications / tools / jobs /
government / roadmap).

One table, multiple `kind` values. Per-stream specifics (source-default
tags, URL-pattern rules) live in `data/<kind>_sources.json` and are
applied by the same deterministic classifier already used for courses.

Why a single table:
  - Same classifier infrastructure (the ProfessionRelevance table is
    already kind-agnostic — item_kind column).
  - Same /api/news-ai/feed/<kind>?profession=X route shape — one route,
    parameterised.
  - Same explainability contract — every row carries source attribution
    + classifier signals.

News continues to live in `articles` (existing) so the RSS poller is
untouched. Courses continue to live in `courses_v2` (already-built).
The five NEW streams here unify under `aggregated_items` so we don't
ship five near-identical tables.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint

from database import Base


class AggregatedItem(Base):
    """One item from any of: certifications / tools / jobs / govt-schemes /
    roadmap-nodes. The `kind` column distinguishes; everything else is
    shared shape per the v0.3 trust contract.
    """
    __tablename__ = "aggregated_items"

    id = Column(Integer, primary_key=True)

    # Stream selector. Indexed because every feed query filters on it.
    kind = Column(String(40), nullable=False, index=True)
    # cert | tool | job | scheme | roadmap_node

    # Source attribution — every row points at an entry in <kind>_sources.json.
    source_slug = Column(String(80), nullable=False, index=True)
    source_name = Column(String(200), nullable=False)
    source_domain = Column(String(200), nullable=False)
    external_id = Column(String(200), nullable=False)

    # The thing itself — verbatim from the source.
    title = Column(Text, nullable=False)
    url = Column(String(900), nullable=False)
    summary = Column(Text, nullable=True)
    topics = Column(Text, nullable=True)               # comma-separated, provider-supplied

    # Per-kind extras stored as plain columns so /feed/<kind> can sort + filter
    # without parsing JSON. Fields not used by a given kind stay NULL.
    duration_minutes = Column(Integer, nullable=True)   # cert / tool tutorial
    level = Column(String(40), nullable=True)           # cert / roadmap_node
    location = Column(String(120), nullable=True)       # job
    employer = Column(String(200), nullable=True)       # job
    cost_label = Column(String(200), nullable=True)     # cert (exam cost), tool (paid tier note)
    is_free = Column(Integer, default=1, nullable=False)

    # Bookkeeping.
    ingested_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_verified_at = Column(DateTime, nullable=True)
    last_verified_status = Column(Integer, nullable=True)
    last_error = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("kind", "source_slug", "external_id",
                         name="ux_agg_items_kind_source_external"),
        Index("ix_agg_items_kind_ingested", "kind", "ingested_at"),
    )
