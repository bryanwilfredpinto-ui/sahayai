"""
models/price_alert.py
---------------------
"Tell me when Crocin drops below ₹20" — P1 from the 2026-05-13 wave.

A row per (user_token, medicine_name, threshold). The matcher runs in
the daily scheduler (`run_price_alert_scan`) and reads against the
NPPA ceiling + the Jan Aushadhi MRP + the latest community-reported
price within the user's pincode radius. Honest signals only — never
fires on stale or single-source quotes.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Index

from database import Base
from models._schema import TABLE_KW


class PriceAlert(Base):
    __tablename__ = "price_alerts"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    user_token = Column(String(80), index=True, nullable=False)

    medicine_name = Column(String(160), index=True, nullable=False)
    threshold_inr = Column(Float, nullable=False)

    # Optional geo scope — when set, only quotes within service_radius_km
    # of the pincode count toward triggering the alert.
    pincode = Column(String(10), nullable=True)
    service_radius_km = Column(Float, nullable=True)

    # active / paused / fired
    status = Column(String(16), nullable=False, default="active", index=True)

    # Audit columns
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_checked_at = Column(DateTime, nullable=True)
    fired_at = Column(DateTime, nullable=True)
    fired_price = Column(Float, nullable=True)
    fired_source = Column(String(40), nullable=True)
    # comma-separated channels we attempted on fire (browser_push / whatsapp /
    # voice_call). Stubs today; honest log so we can see what would have
    # happened once the channels land.
    fired_channels = Column(String(120), nullable=True)


Index(
    "ix_price_alerts_user_status",
    PriceAlert.user_token,
    PriceAlert.status,
)
