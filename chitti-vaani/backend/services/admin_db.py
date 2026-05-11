"""
services/admin_db.py
--------------------
DB layer for the Sahay AI Admin Dashboard (product Gmail accounts).

Two tables:
  - product_gmail_accounts  (one row per Chitti product mailbox)
  - product_action_logs     (audit trail of OAuth events + keep-alive sends)

Auto-detects backend via DATABASE_URL:
  - postgres://...   → Postgres (Supabase). Persistent. Production.
  - missing / sqlite → SQLite at ADMIN_TOKEN_DB (default /tmp/chitti_admin.sqlite).
                       Ephemeral on Render free-tier — local dev only.

We deliberately do NOT reuse Vaani's email_db.oauth_tokens table — those
are end-user tokens (per-device, gmail.send-as-user). Admin product
tokens are PRODUCT-OWNED accounts (e.g. chittinews@gmail.com), keyed
by product_id, and live in their own table.
"""
from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator, Optional

from sqlalchemy import (
    BigInteger, Column, DateTime, Index, Integer, String, Text,
    create_engine, func, inspect, text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

log = logging.getLogger("admin_db")

Base = declarative_base()


def _resolve_url() -> str:
    url = os.environ.get("ADMIN_DATABASE_URL") or os.environ.get("DATABASE_URL") or ""
    if url.startswith("postgres://"):
        # SQLAlchemy 2.x requires the +psycopg2 / psycopg dialect prefix
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    if not url:
        path = os.environ.get("ADMIN_TOKEN_DB", "/tmp/chitti_admin.sqlite")
        url = f"sqlite:///{path}"
    return url


_DB_URL = _resolve_url()
_IS_SQLITE = _DB_URL.startswith("sqlite")

_engine = create_engine(
    _DB_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if _IS_SQLITE else {},
    future=True,
)
SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)


class ProductGmailAccount(Base):
    __tablename__ = "product_gmail_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_key   = Column(String(64), nullable=False, unique=True)   # e.g. "chittinews"
    product_name  = Column(String(128), nullable=False)               # e.g. "Chitti News"
    gmail_address = Column(String(256), nullable=False)               # e.g. "chittinews@gmail.com"

    # OAuth state
    oauth_status        = Column(String(32), nullable=False, default="not_added")
    # one of: "not_added" | "needs_auth" | "connected" | "expired" | "revoked"
    access_token        = Column(Text)
    refresh_token       = Column(Text)
    token_expiry        = Column(BigInteger)   # unix seconds
    scopes              = Column(Text)         # space-separated
    connected_email     = Column(String(256))  # what Google said when we exchanged the code

    # Keep-alive bookkeeping
    last_keep_alive_at  = Column(DateTime)     # UTC
    last_keep_alive_ok  = Column(Integer)      # 1 / 0 / null
    last_keep_alive_msg = Column(String(512))
    next_keep_alive_at  = Column(DateTime)     # advisory; the scheduler is the source of truth

    # Product domain (e.g. "shop_management", "healthcare") + comma-separated
    # feature list. Used by the admin dashboard to group products and to
    # surface what each Chitti is supposed to do. Optional — original
    # products (chittinews etc.) leave them null.
    domain_template = Column(String(64))
    features        = Column(Text)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "product_key": self.product_key,
            "product_name": self.product_name,
            "gmail_address": self.gmail_address,
            "oauth_status": self.oauth_status,
            "connected_email": self.connected_email,
            "domain_template": self.domain_template,
            "features": [f.strip() for f in (self.features or "").split(",") if f.strip()],
            "token_expires_in": (
                max(0, int(self.token_expiry) - int(datetime.now(tz=timezone.utc).timestamp()))
                if self.token_expiry else None
            ),
            "last_keep_alive_at":  self.last_keep_alive_at.isoformat() if self.last_keep_alive_at else None,
            "last_keep_alive_ok":  bool(self.last_keep_alive_ok) if self.last_keep_alive_ok is not None else None,
            "last_keep_alive_msg": self.last_keep_alive_msg,
            "next_keep_alive_at":  self.next_keep_alive_at.isoformat() if self.next_keep_alive_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ProductActionLog(Base):
    __tablename__ = "product_action_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id   = Column(Integer, nullable=False, index=True)
    action       = Column(String(48), nullable=False)
    # one of: "oauth_start" | "oauth_callback_ok" | "oauth_callback_fail"
    #         "keepalive_ok" | "keepalive_fail" | "manual_send_ok" | "manual_send_fail"
    #         "added" | "deleted"
    status       = Column(String(16), nullable=False)   # "ok" | "fail"
    detail       = Column(Text)
    created_at   = Column(DateTime, server_default=func.now(), nullable=False)


Index("ix_product_action_logs_recent", ProductActionLog.product_id, ProductActionLog.created_at.desc())


class OAuthState(Base):
    """Short-lived OAuth state tokens. Persisted (not in-memory) so the
    Google callback works even when it lands on a different gunicorn
    worker than the one that issued the state."""
    __tablename__ = "admin_oauth_state"

    state              = Column(String(96), primary_key=True)
    product_id         = Column(Integer, nullable=False)
    frontend_redirect  = Column(String(512))
    created_at         = Column(DateTime, server_default=func.now(), nullable=False)


@contextmanager
def session() -> Iterator:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


_INITIALISED = False


def _migrate_added_columns() -> None:
    """Add columns introduced after the initial deploy. SQLite + Postgres
    both support `ALTER TABLE ... ADD COLUMN`, so a hand-written migration
    keeps us off Alembic for now. Idempotent."""
    try:
        insp = inspect(_engine)
        if not insp.has_table("product_gmail_accounts"):
            return  # create_all just made it — schema is already current
        cols = {c["name"] for c in insp.get_columns("product_gmail_accounts")}
        adds = []
        if "domain_template" not in cols:
            adds.append("ALTER TABLE product_gmail_accounts ADD COLUMN domain_template VARCHAR(64)")
        if "features" not in cols:
            adds.append("ALTER TABLE product_gmail_accounts ADD COLUMN features TEXT")
        if not adds:
            return
        with _engine.begin() as conn:
            for sql in adds:
                conn.execute(text(sql))
        log.info("admin_db: applied %d column migration(s)", len(adds))
    except Exception as e:  # noqa: BLE001
        log.warning("admin_db column migration skipped: %s", e)


def init_db() -> None:
    """Create tables. Idempotent. Call from app boot (NOT at import time —
    a misconfigured DATABASE_URL would otherwise crash the whole web
    process before it can serve any non-admin route)."""
    global _INITIALISED
    if _INITIALISED:
        return
    Base.metadata.create_all(bind=_engine)
    _migrate_added_columns()
    _INITIALISED = True
    log.info("admin_db ready (backend=%s)", "sqlite" if _IS_SQLITE else "postgres")


def log_action(product_id: int, action: str, status: str, detail: Optional[str] = None) -> None:
    """Audit-trail helper. Never raises."""
    try:
        with session() as s:
            s.add(ProductActionLog(
                product_id=product_id,
                action=action,
                status=status,
                detail=(detail or "")[:4000],
            ))
    except Exception as e:  # noqa: BLE001
        log.warning("log_action failed: %s", e)