"""
database.py
-----------
SQLAlchemy engine + session + ensure_schema().

Per SAHAYAI_MASTER.md §2 row 3 (LOCKED, REVISED 2026-05-29): writes MUST land
on Turso REMOTE. The earlier embedded-replica pattern wrote to /tmp/chitti_news.db
via stdlib sqlite3 and lost every row on Railway container restart — the
background `.sync()` produced `wal_insert_begin failed` because libsql could
not reconcile sqlite3-authored WAL frames with Turso's expected state.

Replacement: direct HTTPS to Turso via `lib.turso_http` (a PEP-249 DBAPI shim
talking to `/v2/pipeline`). Plugged into SQLAlchemy via `creator=`, no local
file, no background sync — every commit lands on Turso before it returns.

Public surface unchanged: engine, SessionLocal, Base, get_db, ensure_schema,
sync_now. Callers do not need to be touched.

URL shapes:
  - libsql://<host>?authToken=<token>   (Turso — production; direct HTTPS)
  - sqlite:///path/to/file.db           (local dev)
  - postgresql://... or postgres://...  (legacy; remove after migration)
"""
from __future__ import annotations

import logging
import urllib.parse

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from config import settings

log = logging.getLogger("database")


def _parse_libsql_url(raw: str) -> tuple[str, str]:
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0]
    return parsed.netloc, token


def _build_libsql_engine(raw: str) -> Engine:
    """Direct HTTPS to Turso via lib.turso_http (no local file, no /tmp)."""
    from lib import turso_http

    host, token = _parse_libsql_url(raw)
    if not token:
        log.warning("libsql URL for %s has no authToken — Turso will reject the connection", host)

    def _creator():
        return turso_http.connect(host=host, token=token)

    log.info("Opening Turso engine via direct HTTPS: host=%s pool=NullPool", host)
    return create_engine(
        "sqlite://",                # placeholder; creator handles the real transport
        creator=_creator,
        module=turso_http,          # tell the sqlite dialect to use our DBAPI
        poolclass=NullPool,         # each checkout = fresh HTTPS conn (cheap)
    )


def _resolve_url(raw: str) -> str:
    """Legacy normaliser kept for backward compat."""
    if not raw:
        return raw or ""
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql://", 1)
    return raw


def make_engine(raw: str) -> Engine:
    if not raw:
        raise ValueError("make_engine: empty DATABASE_URL")
    if raw.startswith("libsql://"):
        return _build_libsql_engine(raw)

    url = _resolve_url(raw)
    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(url, connect_args=connect_args, pool_pre_ping=True)


engine: Engine = make_engine(settings.DATABASE_URL)
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
    """CREATE SCHEMA IF NOT EXISTS news — only on Postgres. No-op elsewhere."""
    from models._schema import SCHEMA
    if not SCHEMA:
        return
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA}"))


def sync_now() -> None:
    """No-op. Retained for backward compatibility with the embedded-replica era."""
    return None
