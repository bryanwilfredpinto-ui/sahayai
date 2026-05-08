"""
models/article.py
-----------------
One article = one ingested news item from any RSS source.
Natural key: link URL (unique). Hash falls back when an outlet
publishes the same article under multiple URLs.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Index

from database import Base
from models._schema import TABLE_KW


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)

    # ── Identity ──
    title = Column(String(500), nullable=False)
    title_hash = Column(String(64), index=True, nullable=True)  # for cross-source dedup
    link = Column(String(900), unique=True, index=True, nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)             # full text where available

    # ── Source metadata ──
    source_slug = Column(String(60), index=True, nullable=False)   # e.g. "toi", "bhaskar", "moneycontrol"
    source_name = Column(String(120), nullable=True)
    source_url = Column(String(300), nullable=True)
    image_url = Column(String(500), nullable=True)
    author = Column(String(160), nullable=True)

    # ── Targeting (state + language + category) ──
    state = Column(String(40), index=True, nullable=False, default="india")  # india / mp / mh / ka / tn / ...
    language = Column(String(8),  index=True, nullable=False, default="en")  # en / hi / bn / te / ta / mr / kn
    category = Column(String(32), index=True, nullable=False, default="national")
    # category: national / state / business / tech / sports / entertainment / politics / science / breaking

    # ── Editorial ──
    is_breaking = Column(Integer, nullable=False, default=0)        # 1 = breaking news
    sentiment = Column(String(8), nullable=True)                    # pos / neg / neu (future)
    importance = Column(Integer, nullable=False, default=5)         # 1–10

    # ── Time ──
    published_at = Column(DateTime, index=True, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_articles_state_lang_cat", "state", "language", "category"),
        Index("ix_articles_published_recent", "published_at"),
        TABLE_KW,
    )
