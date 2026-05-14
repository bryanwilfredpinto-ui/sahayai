from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from database import Base


class TrustScoreHistory(Base):
    __tablename__ = "trust_score_history"

    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, nullable=False)
    computed_utc = Column(DateTime, default=datetime.utcnow, nullable=False)
    score = Column(Float, nullable=False)
    band = Column(String(16), nullable=False)
    breakdown = Column(Text, nullable=True)   # JSON: per-factor values
    note = Column(Text, nullable=True)


class TrustCheck(Base):
    __tablename__ = "trust_checks"

    id = Column(Integer, primary_key=True)
    url = Column(String(500), nullable=False)
    requested_utc = Column(DateTime, default=datetime.utcnow, nullable=False)
    requested_by = Column(String(80), nullable=True)
    score = Column(Float, nullable=False)
    band = Column(String(16), nullable=False)
    checks_json = Column(Text, nullable=True)
    recommendation = Column(String(32), nullable=False)
