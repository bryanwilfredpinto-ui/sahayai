from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text

from database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    url = Column(String(500), unique=True, nullable=False)
    title = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    published_utc = Column(DateTime, nullable=True)
    ingested_utc = Column(DateTime, default=datetime.utcnow, nullable=False)

    importance_score = Column(Float, default=0.0, nullable=False)
    is_launch = Column(Integer, default=0, nullable=False)           # 0/1
    is_pricing_change = Column(Integer, default=0, nullable=False)   # 0/1
    is_free_tier_change = Column(Integer, default=0, nullable=False) # 0/1

    topics = Column(Text, nullable=True)        # JSON array (DeepSeek extracted)
    chitti_take = Column(Text, nullable=True)   # 3-bullet summary
    language = Column(String(8), default="en", nullable=False)
