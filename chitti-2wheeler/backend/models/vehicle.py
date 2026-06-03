"""
chitti-2wheeler / backend / models / vehicle.py
-----------------------------------------------
SQLAlchemy models for Chitti 2-Wheeler. Today: BikeProfile only —
matches the in-memory dict the routes used before the Turso migration.

Planned (P1):
  - FuelLog (rolling km/l, monthly expense — FEATURES.md W4)
  - ServiceLog (oil change, chain lube, etc. — FEATURES.md W17)
  - DocVault (RC, insurance, PUC, licence — FEATURES.md W3)
  - DTCCode (full ~600-code library — FEATURES.md W6)

Camera-Intelligence rows (FEATURES.md W11) land in a separate camera
DB per the §2b cross-product capture path.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from database import Base


class BikeProfile(Base):
    """One row per device — saved bike profile (brand, model, odo, etc.)."""

    __tablename__ = "bike_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_token = Column(String(128), nullable=False, index=True, unique=True)
    brand = Column(String(64), nullable=True)
    model = Column(String(128), nullable=True)
    year = Column(Integer, nullable=True)
    fuel = Column(String(16), nullable=True)  # Petrol / Electric
    odo = Column(Integer, nullable=True)
    reg = Column(String(32), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class PassportEvent(Base):
    """One row per Vehicle Health Passport event — keyed by device token.

    kind ∈ service | repair | diagnosis | inspection | doc. The Trust
    Score in routes/doctor.py is computed deterministically from the
    spread + recency of these events (FEATURES.md Health Passport).
    """

    __tablename__ = "passport_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_token = Column(String(128), nullable=False, index=True)
    kind = Column(String(24), nullable=False)  # service|repair|diagnosis|inspection|doc
    title = Column(String(200), nullable=False)
    detail = Column(String(1000), nullable=True)
    cost = Column(Integer, nullable=True)  # rupees
    odo = Column(Integer, nullable=True)
    at = Column(DateTime, server_default=func.now(), nullable=False)
