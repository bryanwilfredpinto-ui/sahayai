from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from database import Base


class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    vendor = Column(String(120), nullable=True)
    url = Column(String(500), nullable=False)
    one_line = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)                # JSON array
    free_tier_summary = Column(Text, nullable=True)
    free_generosity = Column(Integer, default=5, nullable=False)   # 1-10
    paid_starts_at = Column(String(80), nullable=True)
    launched_on = Column(DateTime, nullable=True)
    github_stars = Column(Integer, default=0, nullable=False)
    hn_upvotes = Column(Integer, default=0, nullable=False)
    reddit_mentions = Column(Integer, default=0, nullable=False)
    community_signal = Column(Float, default=0.0, nullable=False)  # normalised 0-100
    last_seen_utc = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)


class FreeTierHistory(Base):
    __tablename__ = "free_tier_history"

    id = Column(Integer, primary_key=True)
    tool_id = Column(Integer, nullable=False)
    snapshot_utc = Column(DateTime, default=datetime.utcnow, nullable=False)
    free_generosity = Column(Integer, nullable=False)
    summary = Column(Text, nullable=True)
    change_note = Column(Text, nullable=True)
