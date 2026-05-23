from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Index

from database import Base


class Article(Base):
    """One ingested AI-news article. Natural key: url (unique). The full RSS
    body (`content:encoded`) is stored in `content` when the publisher ships
    it, so the speaker can read the entire article — not just the headline
    snippet."""
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False, index=True)
    source_slug = Column(String(80), nullable=False, index=True)
    source_name = Column(String(200), nullable=True)
    url = Column(String(900), unique=True, nullable=False)
    title = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)              # full body when publisher ships content:encoded
    image_url = Column(String(900), nullable=True)
    tab = Column(String(20), default="ai-news", nullable=False, index=True)   # ai-news | tools | bharat-ai
    is_bharat = Column(Integer, default=0, nullable=False)
    language = Column(String(8), default="en", nullable=False)
    published_utc = Column(DateTime, nullable=True, index=True)
    ingested_utc = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_articles_tab_published", "tab", "published_utc"),
    )
