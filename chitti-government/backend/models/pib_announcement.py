"""
models/pib_announcement.py
--------------------------
PIB scheme announcements ingested every 6 h from the public RSS feeds.

Dedupe key is the GUID returned by PIB ViewRss.aspx — stable across
poll cycles. We keep only items classified as scheme-relevant (the
poller filters by keyword: "scheme / yojana / awas / kisan / pension /
pmjay / nrega / scholarship / aushadhi / ujjwala / ladli / sukanya").
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


class PIBAnnouncement(Base):
    __tablename__ = "pib_announcements"
    __table_args__ = (
        Index("ix_pib_announcements_published", "published_at"),
        TABLE_KW,
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    guid = Column(String(400), unique=True, nullable=False, index=True)
    title_en = Column(String(600), nullable=False)
    title_hi = Column(String(600), nullable=True)
    summary = Column(Text, nullable=True)
    link = Column(String(600), nullable=False)
    ministry = Column(String(160), nullable=True)
    feed_id = Column(String(48), nullable=False, index=True)  # the reg= value
    language = Column(String(4), nullable=False, default="en")
    matched_scheme_slug = Column(String(120), nullable=True, index=True)
    published_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    fetched_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "guid": self.guid,
            "title": self.title_en,
            "title_hi": self.title_hi,
            "summary": self.summary,
            "link": self.link,
            "ministry": self.ministry,
            "language": self.language,
            "matched_scheme_slug": self.matched_scheme_slug,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }
