"""
models/user.py
--------------
The User table. One row per registered trader.

Phase 1 fields:
- id: primary key
- mobile: 10-digit Indian mobile number, unique
- name: display name (editable from Settings)
- created_at: when they signed up

Future phases will add: email, watchlist link, kite tokens, etc.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    mobile = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(80), nullable=False, default="Trader")
    language = Column(String(4), nullable=False, default="en")  # 'en' | 'hi'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
