"""
models/daily_tips.py
--------------------

Cache row for the AI Daily Tip engine — one row per
(profession_norm, lang, date_ist) tuple. Backs `services.daily_tip` and the
`GET /api/daily-tip` endpoint that feeds Chitti PA's 07:00 IST morning brief
(CHITTI_NEWS_AI_MASTER_SPEC.md §10a, LOCKED 2026-05-15).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, UniqueConstraint

from database import Base


class DailyTip(Base):
    __tablename__ = "daily_tips"
    __table_args__ = (
        UniqueConstraint("profession_norm", "lang", "date_ist", name="ux_daily_tip_key"),
    )

    id = Column(Integer, primary_key=True)
    profession_norm = Column(String(80), nullable=False, index=True)
    lang = Column(String(8), nullable=False)
    date_ist = Column(String(10), nullable=False)  # YYYY-MM-DD in Asia/Kolkata
    tip_text = Column(Text, nullable=False)
    source_article_url = Column(String(500), nullable=False)
    source_trust_score = Column(Float, default=0.0, nullable=False)
    generated_at_utc = Column(DateTime, default=datetime.utcnow, nullable=False)
