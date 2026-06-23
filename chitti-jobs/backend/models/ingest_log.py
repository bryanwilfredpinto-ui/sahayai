"""
models/ingest_log.py
--------------------
Observability row for every scheduled / on-demand source poll (BO4) so
the daily 07:00 IST scrape is auditable (freshness metric, CEOS §24).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


class IngestLog(Base):
    __tablename__ = "ingest_log"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String(80), index=True, nullable=False)
    status = Column(String(20), nullable=False, default="ok")
    rows_in = Column(Integer, nullable=False, default=0)
    rows_new = Column(Integer, nullable=False, default=0)
    detail = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
