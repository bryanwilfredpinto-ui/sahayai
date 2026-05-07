"""
models/price_cache.py
---------------------
Cached real-time pharmacy prices fetched via Brave Search snippets.

Why store search-engine snippets instead of scraping pharmacy sites?
  Brave Search returns title + description + URL of pharmacy listings.
  We parse the snippet text only. We never visit the pharmacy URL —
  that would be scraping (Tata 1mg / PharmEasy / NetMeds / Apollo /
  Amazon Pharmacy ToS forbid it).

Cache TTL: 24 hours per (medicine_query, source_domain) pair.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Index

from database import Base
from models._schema import TABLE_KW


class PriceCache(Base):
    __tablename__ = "price_cache"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    medicine_query = Column(String(160), index=True, nullable=False)   # lowercased search term
    source_domain = Column(String(80), nullable=False)                 # 1mg.com / pharmeasy.in / netmeds.com / etc.

    price = Column(Float, nullable=True)
    title = Column(String(300), nullable=True)
    snippet = Column(Text, nullable=True)
    url = Column(String(500), nullable=True)

    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)


Index(
    "ix_price_cache_medicine_source",
    PriceCache.medicine_query,
    PriceCache.source_domain,
)
