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

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
