"""
models/kite_token.py
--------------------
Single-row table that stores the current Kite Connect access_token.

Why a DB table (not an env var)?
  Kite tokens expire EVERY DAY at ~6 AM IST. The admin re-auths once
  a day and the new token is written here. All app workers read it
  from here so we don't need to redeploy.

Why a single row?
  We use one Kite account to serve all app users (per spec).
  We just upsert id=1 every time.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database import Base
from models._schema import TABLE_KW


class KiteToken(Base):
    __tablename__ = "kite_tokens"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True)  # always 1
    access_token = Column(String(200), nullable=False)
    public_token = Column(String(200), nullable=True)
    user_id = Column(String(40), nullable=True)        # Kite user id (e.g. "AB1234")
    user_name = Column(String(120), nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
