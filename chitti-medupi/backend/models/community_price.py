"""
models/community_price.py
-------------------------
User-reported "I bought this medicine for ₹X at <pharmacy> in <city>" rows.

Crowdsourced — zero acquisition cost, accuracy grows with users. Surfaces
overpricing (above NPPA ceiling) AND underpricing surprises (a pharmacy
quietly stocking generics).

Always rendered with a "User reported — verify before purchase" badge.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Index

from database import Base


class CommunityPrice(Base):
    __tablename__ = "community_prices"

    id = Column(Integer, primary_key=True, index=True)
    user_token = Column(String(80), index=True, nullable=False)

    medicine_name = Column(String(160), index=True, nullable=False)
    salt_composition = Column(String(240), nullable=True)
    strength = Column(String(60), nullable=True)
    dosage_form = Column(String(40), nullable=True)

    price_paid = Column(Float, nullable=False)

    pharmacy_name = Column(String(200), nullable=True)
    city = Column(String(120), index=True, nullable=True)
    state = Column(String(80), nullable=True)
    pincode = Column(String(10), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    # active / flagged / removed — moderation hook for the future
    status = Column(String(16), nullable=False, default="active", index=True)

    reported_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


Index(
    "ix_community_prices_lookup",
    CommunityPrice.medicine_name,
    CommunityPrice.city,
    CommunityPrice.status,
)
