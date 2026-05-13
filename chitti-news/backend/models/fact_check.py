"""
models/fact_check.py
--------------------
Cross-source verification result for an article. Computed lazily on
demand (POST /api/news/article/<id>/factcheck) by the Fact-Checker
sub-agent and cached here.

verdict: 'verified' | 'partial' | 'disputed' | 'unverified'
  verified  → ≥2 trusted sources publish the same headline + agree on key facts
  partial   → ≥2 sources but they disagree on at least one detail
  disputed  → only 1 source OR sources conflict
  unverified → no cross-source signal yet
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from database import Base
from models._schema import TABLE_KW, fk_target


class FactCheck(Base):
    __tablename__ = "fact_checks"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey(fk_target("articles")), unique=True, nullable=False)

    verdict = Column(String(16), nullable=False, default="unverified")
    confidence = Column(Integer, nullable=False, default=50)         # 0–100
    matched_sources = Column(Text, nullable=True)                    # JSON list of source slugs
    rationale = Column(Text, nullable=True)                          # template-rendered explanation; v2 may swap to DeepSeek
    rationale_hi = Column(Text, nullable=True)

    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
