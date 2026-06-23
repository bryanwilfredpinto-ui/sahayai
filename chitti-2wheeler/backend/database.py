"""
chitti-2wheeler / backend / database.py
---------------------------------------
SQLAlchemy engine + session + ensure_schema().

Per SAHAYAI_MASTER.md §2 row 3 (LOCKED, REVISED 2026-05-29): writes MUST land
on Turso REMOTE. The earlier embedded-replica pattern wrote to
/tmp/chitti_2wheeler.db via stdlib sqlite3; sync to Turso failed with
wal_insert_begin; Railway restart wiped /tmp.

Replacement: direct HTTPS via lib.turso_http (PEP-249 shim talking to
/v2/pipeline) with HTTP/1.1 keepalive for fast create_all. Plugged into
SQLAlchemy via create_engine(..., creator=..., poolclass=NullPool).

URL shapes accepted:
  - libsql://<host>?authToken=<token>   (Turso — production; direct HTTPS)
  - sqlite:///path/to/file.db           (local dev fallback)
"""
from __future__ import annotations

import logging
import urllib.parse

from sqlalchemy import create_engine, text
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


def _resolve_url(raw: str) -> str:
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql://", 1)
    if raw.startswith(("sqlite:", "postgresql:", "mysql:", "mariadb:")):
        return raw
    # Unrecognised placeholder — local SQLite fallback so /health still binds.
    log.warning("Unrecognised DATABASE_URL=%r — falling back to local SQLite for boot", raw)
    return "sqlite:////tmp/chitti_2wheeler_fallback.db"


def _build_engine(raw: str) -> Engine:
    if raw.startswith("libsql://"):
        return _build_libsql_engine(raw)
    url = _resolve_url(raw)
    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(url, connect_args=connect_args, pool_pre_ping=True)


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


def ensure_schema() -> None:
    """No-op on SQLite/libsql. Hook left in to mirror chitti-news shape."""
    return


def sync_now() -> None:
    """No-op. Retained for backward compatibility with the embedded-replica era."""
    return None
