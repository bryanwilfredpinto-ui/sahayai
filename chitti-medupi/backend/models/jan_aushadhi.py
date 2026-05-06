"""
models/jan_aushadhi.py
----------------------
Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) store row.
11,000+ stores nationwide. Public CSV at janaushadhi.gov.in.

Seed in data/jan_aushadhi_seed.json (a representative sample — full CSV
import wires next session via a one-shot loader).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from database import Base


class JanAushadhiStore(Base):
    __tablename__ = "jan_aushadhi_stores"

    id = Column(Integer, primary_key=True, index=True)
    store_code = Column(String(40), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    address = Column(String(400), nullable=True)
    district = Column(String(80), index=True, nullable=True)
    state = Column(String(80), index=True, nullable=True)
    pincode = Column(String(10), index=True, nullable=True)
    phone = Column(String(40), nullable=True)
    hours = Column(String(120), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    last_verified = Column(DateTime, default=datetime.utcnow, nullable=False)
