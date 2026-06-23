"""
database.py
-----------
SQLAlchemy engine + session factory for the Chitti MedUPI backend.

Per SAHAYAI_MASTER.md §2 row 3 (LOCKED, REVISED 2026-05-29) every write MUST
land on Turso REMOTE.

History (preserved here because it explains what changed):
  - The embedded-replica pattern via libsql_experimental was identified as
    broken on 2026-05-23 — SQLAlchemy writes against the local sqlite file
    were lost on the next `.sync()` (which is pull-only and overwrites
    local state).
  - The tactical mitigation at the time was a "LIBSQL_REPLICA=0 bypass"
    that pointed SQLAlchemy at a vanilla `sqlite:////tmp/chitti_medupi.db`,
    explicitly accepting that data is ephemeral across container restarts.
  - 2026-05-29: replaced both legs with a direct-HTTPS shim (lib.turso_http)
    that talks to Turso /v2/pipeline over HTTPS with HTTP/1.1 keepalive.
    Every commit lands on Turso REMOTE before it returns. The
    LIBSQL_REPLICA env var is no longer consulted — there is nothing to
    "bypass" because there is no local file anymore.

URL shapes accepted:
  - libsql://<host>?authToken=<token>   (Turso — production; direct HTTPS)
  - sqlite:///path/to/file.db           (local dev only)
  - postgresql://... or postgres://...  (legacy Neon; deprecated)
"""
from __future__ import annotations

import logging
import urllib.parse

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from config import settings
from lib.devmode import guard_database_url

log = logging.getLogger("database")


def _parse_libsql_url(raw: str) -> tuple[str, str]:
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0]
    return parsed.netloc, token


def _build_libsql_engine(raw: str) -> Engine:
    from lib import turso_http

    host, token = _parse_libsql_url(raw)
    if not token:
        log.warning("libsql URL for %s has no authToken — Turso will reject the connection", host)

    def _creator():
        return turso_http.connect(host=host, token=token)

    log.info("Opening Turso engine via direct HTTPS: host=%s pool=NullPool", host)
    return create_engine(
        "sqlite://",
        creator=_creator,
        module=turso_http,
        poolclass=NullPool,
    )


def _build_engine(raw: str) -> Engine:
    if raw.startswith("libsql://"):
        return _build_libsql_engine(raw)
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql://", 1)

    connect_args: dict = {}
    if raw.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(raw, connect_args=connect_args, pool_pre_ping=True)


engine: Engine = _build_engine(guard_database_url(settings.DATABASE_URL))
db_url = str(engine.url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sync_now() -> None:
    """No-op. Retained for backward compatibility with the embedded-replica era."""
    return None
