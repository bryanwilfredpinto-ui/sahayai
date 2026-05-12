"""
models.py — SQLAlchemy models for the ledger.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base


class SynthesisLog(Base):
    __tablename__ = "synthesis_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    language_code = Column(String(16), nullable=False, index=True)
    supplier = Column(String(32), nullable=False)
    text_sha256 = Column(String(64), nullable=False)
    text_chars = Column(Integer, nullable=False)
    bytes_out = Column(Integer)
    latency_ms = Column(Integer)
    ok = Column(Integer, nullable=False, default=0)
    error_code = Column(String(64))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<SynthesisLog {self.language_code} {self.supplier} ok={self.ok}>"


class DonorConsent(Base):
    __tablename__ = "donor_consents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    language_code = Column(String(16), nullable=False)
    donor_name = Column(String(256), nullable=False)
    donor_email = Column(String(256))
    cc_by_4_acknowledged = Column(Integer, nullable=False, default=0)
    audio_sha256 = Column(String(64))
    audio_duration_sec = Column(Integer)
    supabase_path = Column(Text)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<DonorConsent {self.language_code} {self.donor_name}>"
