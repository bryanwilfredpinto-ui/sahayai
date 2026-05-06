"""
models/wallet.py
----------------
One row per medicine purchase logged against a family profile. Used to
power the Family Wallet's "this month spend" / "this month saved" /
"annual projection" cards.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from database import Base


class WalletEntry(Base):
    __tablename__ = "wallet_entries"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("family_profiles.id"), index=True, nullable=False)
    user_token = Column(String(80), index=True, nullable=False)

    medicine_name = Column(String(160), nullable=False)
    salt_composition = Column(String(240), nullable=True)
    qty = Column(Integer, nullable=False, default=1)
    price_paid = Column(Float, nullable=False, default=0.0)
    cheapest_equivalent_price = Column(Float, nullable=True)
    savings_realized = Column(Float, nullable=False, default=0.0)

    purchased_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
