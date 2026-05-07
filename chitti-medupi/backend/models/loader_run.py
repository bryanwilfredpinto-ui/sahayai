"""
models/loader_run.py
--------------------
Audit log for every scheduler-triggered loader run (Jan Aushadhi monthly,
NPPA weekly, top-100 daily, manual loader runs). Powers the "last
updated" badges + lets ops verify the scheduler is firing.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base
from models._schema import TABLE_KW


class LoaderRun(Base):
    __tablename__ = "loader_runs"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(40), nullable=False, index=True)   # jan_aushadhi/nppa/top100_brave/manual/community
    status = Column(String(16), nullable=False, default="ok") # ok / failed / partial
    rows_upserted = Column(Integer, nullable=False, default=0)
    rows_skipped = Column(Integer, nullable=False, default=0)
    rows_errors = Column(Integer, nullable=False, default=0)
    note = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    finished_at = Column(DateTime, nullable=True)
