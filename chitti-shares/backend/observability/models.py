"""
🎖️ World Class Chitti Observability — Commando Discipline. Zero Excuses.

observability/models.py
=======================
SQLAlchemy models for the 4 observability tables (Sire-spec 2026-05-29).

All tables live in the `shares` schema for chitti-shares co-hosting. The DDL
under `ensure_schema()` is idempotent and safe to run on every cold-start.
"""
from __future__ import annotations

from sqlalchemy import (
    Column, Integer, String, Text, TIMESTAMP, Index,
    func, text,
)

from database import Base, engine


class SlowOp(Base):
    """A translation / widget-attach / feedback-post that exceeded 3 s."""
    __tablename__ = "obs_slow_ops"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    audit_id    = Column(String(40), nullable=False, index=True)
    ts          = Column(TIMESTAMP, server_default=func.current_timestamp())
    page        = Column(String(120))
    box_id      = Column(String(160))
    text_length = Column(Integer)
    elapsed_ms  = Column(Integer)
    source_lang = Column(String(8))
    target_lang = Column(String(8))
    kind        = Column(String(32))   # translation | card_attach | feedback_post


class Alert(Base):
    """A Verification Agent breach (Degraded / Failed)."""
    __tablename__ = "obs_alerts"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    audit_id       = Column(String(40), nullable=False, index=True)
    ts             = Column(TIMESTAMP, server_default=func.current_timestamp())
    page           = Column(String(120))
    check_name     = Column(String(64))
    severity       = Column(String(16))    # degraded | failed
    observed_value = Column(String(120))
    threshold      = Column(String(120))
    resolved_at    = Column(TIMESTAMP, nullable=True)


class AuditSession(Base):
    """A user session — minted client-side, looked up by audit_id."""
    __tablename__ = "obs_audits"

    audit_id           = Column(String(40), primary_key=True)
    started_at         = Column(TIMESTAMP, server_default=func.current_timestamp())
    last_seen_at       = Column(TIMESTAMP, server_default=func.current_timestamp())
    device_fingerprint = Column(String(64))     # SHA-256 of UA+screen+lang, NOT PII
    user_token         = Column(String(64))     # existing chitti_user_token
    pages_visited      = Column(Text)           # JSON array of page slugs
    total_cards        = Column(Integer, default=0)
    total_translations = Column(Integer, default=0)
    total_alerts       = Column(Integer, default=0)
    status             = Column(String(16), default="active")  # active | closed


class RetrainQueueItem(Base):
    """Weekly-aggregated feedback patterns awaiting Sire's review."""
    __tablename__ = "obs_retrain_queue"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    created_at         = Column(TIMESTAMP, server_default=func.current_timestamp())
    page               = Column(String(120))
    box_id             = Column(String(160))
    target_lang        = Column(String(8))
    thumbs_down_count  = Column(Integer, default=0)
    thumbs_up_count    = Column(Integer, default=0)
    sample_corrections = Column(Text)           # JSON array of ✏️ feedback texts
    status             = Column(String(16), default="pending")  # pending | reviewed | applied | rejected


# Composite indexes (Turso supports the same CREATE INDEX syntax as SQLite)
Index("idx_slow_ops_audit_ts", SlowOp.audit_id, SlowOp.ts)
Index("idx_alerts_audit_ts",   Alert.audit_id, Alert.ts)
Index("idx_retrain_status",    RetrainQueueItem.status, RetrainQueueItem.created_at)


def ensure_schema() -> None:
    """Idempotent. Creates the 4 observability tables on Turso if missing.

    Safe to call on every cold-start; SQLAlchemy emits IF NOT EXISTS via
    create_all. Called from chitti-shares main.py startup hook.
    """
    Base.metadata.create_all(bind=engine, tables=[
        SlowOp.__table__,
        Alert.__table__,
        AuditSession.__table__,
        RetrainQueueItem.__table__,
    ])
