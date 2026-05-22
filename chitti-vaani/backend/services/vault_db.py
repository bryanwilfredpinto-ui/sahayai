"""
services/vault_db.py
--------------------
Chitti Document Vault (Phase 1) — SQLAlchemy model + engine.

Stores ONLY metadata. The encrypted file blob is on the filesystem
at `${VAULT_STORAGE_ROOT}/<user_hash>/<doc_id>.bin`, encrypted with a
per-user Fernet key derived from `user_token + VAULT_PEPPER`.

Schema (`vault_documents`):
  id                — UUID4 string, primary key
  user_token_hash   — sha256(user_token + USER_TOKEN_PEPPER), indexed
  display_name      — human-readable name ("PAN card")
  category          — aadhaar / pan / passport / dl / insurance /
                      property / certificate / contract / health /
                      other
  mime_type         — e.g. application/pdf, image/jpeg
  size_bytes        — int, plain (encrypted blob is slightly larger
                      but this is the original size shown to the user)
  blob_path         — relative path under VAULT_STORAGE_ROOT
  blob_sha256       — sha256 of the ciphertext (integrity check)
  expiry_date       — date | null (e.g. driving licence expiry)
  uploaded_at       — UTC datetime
  notes             — Text | null
  forget_at         — UTC datetime | null (set by user's "Chitti forget X"
                      voice command; soft-delete sweeper purges files)

Schema (`vault_share_tokens`):
  token             — base64url 24-byte token, primary key
  user_token_hash   — sha256 of issuing user
  doc_id            — FK
  target_label      — "WhatsApp to +91…" / "Email to …" for the audit log
  expires_at        — UTC datetime
  consumed_at       — UTC datetime | null (one-shot — set on first hit)
  created_at        — UTC datetime
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Iterator, Optional

from sqlalchemy import (
    BigInteger, Column, Date, DateTime, Index, Integer, String, Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

log = logging.getLogger("vault_db")

Base = declarative_base()


def _resolve_url() -> str:
    raw = os.environ.get("VAULT_DATABASE_URL") or os.environ.get("DATABASE_URL") or ""
    if not raw:
        path = os.environ.get("VAULT_DB_PATH", "/tmp/chitti_vaani_vault.sqlite")
        return f"sqlite:///{path}"
    from database import resolve_db_url
    return resolve_db_url(raw)


_DB_URL = _resolve_url()
_IS_SQLITE = _DB_URL.startswith("sqlite")
_engine = create_engine(
    _DB_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if _IS_SQLITE else {},
    future=True,
)
SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)


class VaultDocument(Base):
    __tablename__ = "vault_documents"

    id              = Column(String(36), primary_key=True)
    user_token_hash = Column(String(64), nullable=False, index=True)
    display_name    = Column(String(200), nullable=False)
    category        = Column(String(32), nullable=False, default="other")
    mime_type       = Column(String(128), nullable=False, default="application/octet-stream")
    size_bytes      = Column(BigInteger, nullable=False, default=0)
    blob_path       = Column(String(400), nullable=False)
    blob_sha256     = Column(String(64), nullable=False)
    expiry_date     = Column(Date)
    uploaded_at     = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    notes           = Column(Text)
    forget_at       = Column(DateTime)

    __table_args__ = (
        Index("ix_vault_documents_user_expiry", "user_token_hash", "expiry_date"),
        Index("ix_vault_documents_user_category", "user_token_hash", "category"),
    )


class VaultShareToken(Base):
    __tablename__ = "vault_share_tokens"

    token           = Column(String(64), primary_key=True)
    user_token_hash = Column(String(64), nullable=False, index=True)
    doc_id          = Column(String(36), nullable=False, index=True)
    target_label    = Column(String(200), nullable=False, default="")
    expires_at      = Column(DateTime, nullable=False)
    consumed_at     = Column(DateTime)
    created_at      = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


def init_tables() -> None:
    Base.metadata.create_all(bind=_engine)


def session_scope() -> Iterator:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


# Eagerly create the tables at import time so the routes blueprint
# doesn't need to call init_tables() defensively.
try:
    init_tables()
except Exception as e:  # pragma: no cover — start-time logging only
    log.warning("vault_db init_tables failed: %s", e)
