"""
database.py
-----------
SQLAlchemy engine + session + ensure_schema().

Turso integration via **embedded replica** mode (not direct Hrana).
Rationale: sqlalchemy-libsql 0.2.0 inherits the stock pysqlite dialect,
which assumes a stdlib sqlite3.Connection (PRAGMA support + mutable
isolation_level). Turso's remote Hrana protocol satisfies neither. We
sidestep the whole class of problems by:

  1. Asking libsql-experimental to maintain a **local SQLite file** that
     syncs (read AND write) with the Turso DB in the background. The
     local file is a real SQLite database — full PRAGMA support, real
     stdlib sqlite3.Connection semantics — so SQLAlchemy is happy.
  2. Letting SQLAlchemy talk to the local file via plain
     `sqlite:////tmp/<name>.db`. The library `libsql_experimental` does
     the Turso syncing on the side.

Render free tier wipes /tmp on every deploy, so we re-sync from Turso
at boot. Background sync runs every 60s after that. Writes hit the
local file first and are pushed up on the next sync tick.

URL shapes:
  - libsql://<host>?authToken=<token>   (Turso — production; uses embedded replica)
  - sqlite:///path/to/file.db           (local dev)
  - postgresql://... or postgres://...  (legacy; remove after migration)
"""
from __future__ import annotations

import logging
import os
import threading
import time
import urllib.parse

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings

log = logging.getLogger("database")


def _parse_libsql_url(raw: str) -> tuple[str, str]:
    """Pull (sync_url, auth_token) out of a libsql://host?authToken=... string."""
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0]
    # libsql-experimental wants the sync_url with scheme libsql:// stripped of query.
    # Format that works in practice: libsql://<host> (no path, no query).
    sync_url = f"{parsed.scheme}://{parsed.netloc}"
    return sync_url, token


_REPLICA_PATH: str | None = None
_REPLICA_SYNCER = None  # libsql_experimental connection used purely for sync()


def _bootstrap_replica(libsql_url: str, local_path: str) -> None:
    """Pull the Turso DB into a local SQLite file and start background sync."""
    global _REPLICA_SYNCER
    import libsql_experimental as libsql

    sync_url, token = _parse_libsql_url(libsql_url)
    log.info("Opening embedded replica at %s (sync_url=%s)", local_path, sync_url)
    # Note: libsql.connect with sync_url creates the local file if missing.
    _REPLICA_SYNCER = libsql.connect(local_path, sync_url=sync_url, auth_token=token)

    def _loop():
        # Immediate first sync in the background — never blocks /health.
        # libsql.connect() above is foreground (local SQLite open, no
        # network); the first .sync() hits Turso over the wire and can
        # take seconds on a cold boot. Pushing it here keeps the gunicorn
        # worker free to bind /health well under Render's 30 s probe.
        try:
            _REPLICA_SYNCER.sync()
            log.info("Initial sync from Turso complete")
        except Exception as e:  # noqa: BLE001
            log.warning("Initial Turso sync failed (will retry in background): %s", e)
        # Steady-state 60 s refresh.
        while True:
            time.sleep(60)
            try:
                _REPLICA_SYNCER.sync()
            except Exception as e:  # noqa: BLE001
                log.warning("Background Turso sync failed: %s", e)

    threading.Thread(target=_loop, name="turso-sync", daemon=True).start()


def _resolve_url(raw: str) -> str:
    global _REPLICA_PATH

    if raw.startswith("libsql://"):
        # Pick a stable local file path. Render's /tmp is writable + wiped per deploy.
        local = os.environ.get("LIBSQL_REPLICA_PATH", "/tmp/chitti_news.db")
        _REPLICA_PATH = local
        _bootstrap_replica(raw, local)
        return f"sqlite:///{local}"

    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql://", 1)
    return raw


db_url = _resolve_url(settings.DATABASE_URL)

connect_args: dict = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
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
    """Force an immediate sync to Turso. Call this after batch writes if needed."""
    if _REPLICA_SYNCER is not None:
        try:
            _REPLICA_SYNCER.sync()
        except Exception as e:  # noqa: BLE001
            log.warning("Forced Turso sync failed: %s", e)
