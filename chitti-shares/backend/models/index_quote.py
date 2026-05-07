"""
models/index_quote.py
---------------------
Stores live index quotes pushed from a remote source (e.g. user's laptop).

Why: Yahoo and NSE both block Render's cloud IPs. The user's home laptop
is NOT blocked, so they run a small script that fetches NSE every 5 min
and POSTs to /debug/ingest-indices. We store the latest values here.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from models._schema import TABLE_KW


class IndexQuote(Base):
    __tablename__ = "index_quotes"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    canonical = Column(String(64), unique=True, index=True, nullable=False)
    last_price = Column(Float, nullable=True)
    prev_close = Column(Float, nullable=True)
    day_open = Column(Float, nullable=True)
    day_high = Column(Float, nullable=True)
    day_low = Column(Float, nullable=True)
    change = Column(Float, nullable=True)
    pchange = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
