from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from database import Base


class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True)
    name = Column(String(160), nullable=False)
    vendor = Column(String(120), nullable=True)
    kind = Column(String(40), nullable=False)         # "llm", "slm", "vision", "audio", "multimodal"
    parameters = Column(String(40), nullable=True)    # "7B", "70B", "MoE", "unknown"
    context_length = Column(Integer, nullable=True)
    license = Column(String(80), nullable=True)
    free_tier_available = Column(Integer, default=0, nullable=False)
    released_on = Column(DateTime, nullable=True)
    hf_downloads_30d = Column(Integer, default=0, nullable=False)
    eval_score_lmsys = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    last_seen_utc = Column(DateTime, default=datetime.utcnow, nullable=False)
