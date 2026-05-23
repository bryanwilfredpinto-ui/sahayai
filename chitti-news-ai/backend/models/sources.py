from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    url = Column(String(500), unique=True, nullable=False)
    kind = Column(String(40), nullable=False)            # rss | scrape | api
    category = Column(String(40), nullable=False)        # vendor | press | community
    language = Column(String(8), default="en", nullable=False)
    tab = Column(String(20), default="ai-news", nullable=False)  # ai-news | tools | bharat-ai | prashikshan
    is_bharat = Column(Boolean, default=False, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    trust_score = Column(Float, default=0.0, nullable=False)
    trust_band = Column(String(16), default="pending", nullable=False)
    last_fetched_utc = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    last_verified_utc = Column(DateTime, nullable=True)
    reason_for_inclusion = Column(Text, nullable=True)
    ai_crawl_blocked = Column(Boolean, default=False, nullable=False)
    created_utc = Column(DateTime, default=datetime.utcnow, nullable=False)


class DiscoveryQueue(Base):
    __tablename__ = "discovery_queue"

    id = Column(Integer, primary_key=True)
    url = Column(String(500), unique=True, nullable=False)
    submitted_by = Column(String(80), nullable=True)
    status = Column(String(32), default="pending_layer_1", nullable=False)
    notes = Column(Text, nullable=True)
    submitted_utc = Column(DateTime, default=datetime.utcnow, nullable=False)
