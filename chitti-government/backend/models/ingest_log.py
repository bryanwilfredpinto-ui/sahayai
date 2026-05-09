"""
models/ingest_log.py
--------------------
One row per scheduled ingest run (PIB poll, MyScheme refresh, document
expiry sweep). Lets the /scheduler/status endpoint report when each
job last ran and how many rows changed — surfaced verbatim in the
frontend's "🔒 Privacy & Freshness" footer block.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


class IngestLog(Base):
    __tablename__ = "ingest_logs"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_name = Column(String(48), nullable=False, index=True)
    status = Column(String(16), nullable=False)  # ok / error
    rows_in = Column(Integer, nullable=False, default=0)
    rows_new = Column(Integer, nullable=False, default=0)
    detail = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
