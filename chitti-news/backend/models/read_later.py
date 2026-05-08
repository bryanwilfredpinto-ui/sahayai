"""
models/read_later.py
--------------------
Per-device "Read Later" + "Cancelled" folders. Auth via X-User-Token
header (per chitti-medupi pattern). Folder = 'saved' | 'cancelled'.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database import Base
from models._schema import TABLE_KW, fk_target


class ReadLater(Base):
    __tablename__ = "read_later"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    user_token = Column(String(80), index=True, nullable=False)
    article_id = Column(Integer, ForeignKey(fk_target("articles")), index=True, nullable=False)
    folder = Column(String(16), index=True, nullable=False, default="saved")  # 'saved' | 'cancelled'
    note = Column(String(240), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
