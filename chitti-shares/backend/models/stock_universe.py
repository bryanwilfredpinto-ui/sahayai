"""
models/stock_universe.py
------------------------
The Stock master table. Seeded with Nifty 500 on first start.

Why a master table?
  - Search-as-you-type ("rel...") returns from local DB instantly,
    no Yahoo round-trip.
  - Sector + market-cap shown without an extra fetch.
  - Foreign-key target for future tables (sector indices, etc.)
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Index

from database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(40), nullable=False, unique=True, index=True)  # canonical e.g. NSE:RELIANCE
    name = Column(String(120), nullable=False)
    sector = Column(String(60), nullable=True)
    market_cap_cr = Column(Float, nullable=True)
    instrument_token = Column(Integer, nullable=True)  # Kite instrument token, populated later
    in_nifty_500 = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_stocks_name", "name"),
    )
