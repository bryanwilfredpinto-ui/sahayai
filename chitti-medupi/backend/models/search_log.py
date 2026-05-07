"""
models/search_log.py
--------------------
Lightweight search-frequency log. One row per distinct medicine query.
Each search bumps `count` and `last_searched_at` — no per-search rows.

Used by the daily 2 AM IST scheduler to refresh prices for the
top-100 most-searched medicines via Brave Search.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base
from models._schema import TABLE_KW


class SearchLog(Base):
    __tablename__ = "search_log"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    query_normalized = Column(String(160), unique=True, index=True, nullable=False)
    display_query = Column(String(160), nullable=False)
    count = Column(Integer, nullable=False, default=1)
    last_searched_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
