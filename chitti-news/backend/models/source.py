"""
models/source.py
----------------
RSS source registry — one row per (slug, state, language, category) feed.
Loaded from data/sources.json on first startup.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base
from models._schema import TABLE_KW


class Source(Base):
    __tablename__ = "sources"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(60), index=True, nullable=False)            # 'toi', 'bhaskar', etc.
    display_name = Column(String(120), nullable=False)
    rss_url = Column(String(500), nullable=False)
    homepage_url = Column(String(300), nullable=True)

    state = Column(String(40), index=True, nullable=False, default="india")
    language = Column(String(8), index=True, nullable=False, default="en")
    category = Column(String(32), index=True, nullable=False, default="national")

    enabled = Column(Integer, nullable=False, default=1)
    last_fetched_at = Column(DateTime, nullable=True)
    last_error = Column(String(500), nullable=True)

    # Health monitoring (added 2026-06-02 per Sire's monitoring spec)
    consecutive_failures = Column(Integer, nullable=False, default=0)
    last_success_at = Column(DateTime, nullable=True)
    # status: 'healthy' (default), 'degraded' (3+ fails, still retrying),
    # 'dead' (24h continuous failure, excluded from rss_poll until manual revive)
    status = Column(String(16), nullable=False, default="healthy")
    # next_retry_at — set during backoff. fetch_all skips sources where
    # status='dead' OR next_retry_at > now.
    next_retry_at = Column(DateTime, nullable=True)
    # last_alert_at — debounce alerts so one dead feed doesn't spam
    # Sire's inbox more than once per 24h.
    last_alert_at = Column(DateTime, nullable=True)
    # When auto-discovery finds an alternative URL during the dead handler,
    # the candidate goes here for Sire's review; we don't auto-update the
    # rss_url (that would be a self-modifying source registry).
    alternative_url_candidate = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
