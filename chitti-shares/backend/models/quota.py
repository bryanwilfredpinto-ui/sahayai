"""
models/quota.py
---------------
Per-API-call usage logging + daily summaries.

Why log every call:
  - Catches runaway loops before they melt the DeepSeek bill
  - Lets us show "today: ₹2.43 spent" widget on the dashboard
  - Per-user breakdown for future per-user quotas (premium tiers)

Pricing (April 2026):
  DeepSeek chat:  ₹22.50 / 1M input tokens, ₹91.50 / 1M output tokens
  Fast2SMS OTP:   ₹0.22 / SMS sent
  Yahoo Finance:  free (we still log calls for rate-limit visibility)

If pricing changes, edit services/usage_tracker.PRICING and redeploy.
"""

from datetime import datetime
from sqlalchemy import (
    Column, DateTime, Float, Integer, String, Text, Index,
    UniqueConstraint, ForeignKey,
)

from database import Base
from models._schema import TABLE_KW, fk_target


class UsageLog(Base):
    """Every external API call - one row per call."""
    __tablename__ = "usage_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(fk_target("users")), nullable=True, index=True)
    # null user_id = system call (cron job, alert checker, etc.)

    provider = Column(String(20), nullable=False)   # 'deepseek', 'fast2sms', 'yahoo'
    operation = Column(String(60), nullable=False)  # 'chat', 'send_otp', 'quote', etc.

    # Cost components - we split tokens for DeepSeek so we can show "75% of bill is output"
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    units = Column(Integer, nullable=True)   # for SMS: count; for Yahoo: symbols requested
    cost_inr = Column(Float, nullable=False, default=0.0)

    success = Column(Integer, nullable=False, default=1)  # 0 = failed (still might cost ₹)
    error = Column(String(200), nullable=True)
    duration_ms = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_usage_provider_date", "provider", "created_at"),
        TABLE_KW,
    )


class DailyQuotaSummary(Base):
    """One row per day. Updated incrementally; cheaper to read for the widget."""
    __tablename__ = "daily_quota_summary"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    date_ist = Column(String(10), nullable=False, unique=True)  # 'YYYY-MM-DD' in IST
    total_inr = Column(Float, nullable=False, default=0.0)
    deepseek_inr = Column(Float, nullable=False, default=0.0)
    fast2sms_inr = Column(Float, nullable=False, default=0.0)
    yahoo_inr = Column(Float, nullable=False, default=0.0)
    call_count = Column(Integer, nullable=False, default=0)
    blocked_count = Column(Integer, nullable=False, default=0)  # times hard cap fired
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
