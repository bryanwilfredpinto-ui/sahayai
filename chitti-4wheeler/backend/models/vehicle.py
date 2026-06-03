"""
chitti-4wheeler / backend / models / vehicle.py
-----------------------------------------------
SQLAlchemy models for Chitti 4-Wheeler. Today: CarProfile only —
matches the in-memory dict the routes used before the Turso migration.

Planned (P1):
  - FuelLog (rolling km/l, monthly expense — FEATURES.md C15)
  - ServiceLog — FEATURES.md C1
  - DocVault (RC, insurance, PUC, licence, road tax, FASTag — C3)
  - DTCCode (full ~2 000-code library — FEATURES.md C5)
  - DriveScore (privacy-first; only score syncs — C18)
"""
from __future__ import annotations

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from database import Base


class CarProfile(Base):
    """One row per device — saved car profile (brand, model, fuel, tx, odo, etc.)."""

    __tablename__ = "car_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_token = Column(String(128), nullable=False, index=True, unique=True)
    brand = Column(String(64), nullable=True)
    model = Column(String(128), nullable=True)
    year = Column(Integer, nullable=True)
    fuel = Column(String(16), nullable=True)  # Petrol / Diesel / CNG / Electric / Hybrid
    tx = Column(String(16), nullable=True)    # Manual / Automatic / AMT / CVT / DCT
    odo = Column(Integer, nullable=True)
    reg = Column(String(32), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class PassportEvent(Base):
    """One row per Vehicle Health Passport event — keyed by device token.

    Powers the deterministic Trust Score in routes/doctor.py. `kind` is one
    of service | repair | diagnosis | inspection | doc.
    """

    __tablename__ = "passport_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_token = Column(String(128), nullable=False, index=True)
    kind = Column(String(16), nullable=False)  # service / repair / diagnosis / inspection / doc
    title = Column(String(160), nullable=False)
    detail = Column(String(1000), nullable=True)
    cost = Column(Integer, nullable=True)       # rupees
    odo = Column(Integer, nullable=True)        # odometer at the event
    resolved = Column(Integer, nullable=True)   # 1/0 for repair events; null = n/a
    at = Column(DateTime, server_default=func.now(), nullable=False)
