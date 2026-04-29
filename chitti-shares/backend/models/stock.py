"""
models/stock.py
---------------
Phase 3-5 tables:

  watchlist_items  : user's watched stocks
  alerts           : price + indicator alerts
  alert_events     : audit log of fired alerts (so we don't double-fire)
  call_reports     : every signal Chitti generates, with tracking fields
  chat_messages    : Chitti AI chat history per user
"""

from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text,
    UniqueConstraint, Index,
)

from database import Base


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(40), nullable=False)   # canonical e.g. "NSE:RELIANCE"
    note = Column(String(200), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)  # for drag-to-reorder
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_watchlist_user_symbol"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(40), nullable=False)

    # 'price_above', 'price_below', 'rsi_above', 'rsi_below',
    # 'macd_cross_up', 'macd_cross_down'
    kind = Column(String(40), nullable=False)
    threshold = Column(Float, nullable=True)        # for price/rsi alerts
    timeframe = Column(String(8), nullable=False, default="day")  # day/week/4h etc

    active = Column(Boolean, default=True, nullable=False)
    triggered_at = Column(DateTime, nullable=True)
    last_checked_at = Column(DateTime, nullable=True)

    note = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_alerts_active_user", "active", "user_id"),
    )


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(40), nullable=False)
    fired_value = Column(Float, nullable=True)
    note = Column(String(300), nullable=True)
    fired_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    seen = Column(Boolean, default=False, nullable=False)


class CallReport(Base):
    """Every BUY/SELL signal Chitti generates. Tracks performance over time."""
    __tablename__ = "call_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    # null user_id = system-wide call (Chitti's market view picks)

    symbol = Column(String(40), nullable=False, index=True)
    call_type = Column(String(8), nullable=False)         # 'BUY' | 'SELL' | 'WAIT'
    timeframe = Column(String(8), nullable=False, default="day")
    rationale = Column(Text, nullable=True)               # Chitti's explanation

    entry_price = Column(Float, nullable=False)
    target = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)

    # Tracked over time (cron-updated):
    high_seen = Column(Float, nullable=True)
    low_seen = Column(Float, nullable=True)
    last_price = Column(Float, nullable=True)
    last_updated_at = Column(DateTime, nullable=True)

    # 'open' | 'target_hit' | 'sl_hit' | 'closed_manual'
    status = Column(String(20), nullable=False, default="open")
    closed_price = Column(Float, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(16), nullable=False)             # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class PortfolioHolding(Base):
    """User's portfolio for the Doctor module. Manually entered for now."""
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(40), nullable=False)
    qty = Column(Float, nullable=False)
    avg_buy_price = Column(Float, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_portfolio_user_symbol"),
    )


class CustomRule(Base):
    """User-saved custom rules (max 5 per user, enforced in route)."""
    __tablename__ = "custom_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(80), nullable=False)
    rule_text = Column(String(400), nullable=False)
    signal = Column(String(10), nullable=False, default="BUY")  # BUY|SELL|WAIT
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
