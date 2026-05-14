"""
database.py
-----------
SQLAlchemy engine + session factory for the Chitti MedUPI backend.

Turso integration via **embedded replica** mode (not direct Hrana).
See project memory project_turso_embedded_replica_pattern for rationale.

URL shapes:
  - libsql://<host>?authToken=<token>   (Turso, production)
  - sqlite:///path/to/file.db           (local dev)
  - postgresql://... or postgres://...  (legacy Neon; remove after cutover verified)
"""
from __future__ import annotations

import logging
import os
import threading
import time
import urllib.parse

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings

log = logging.getLogger("database")


def _parse_libsql_url(raw: str) -> tuple[str, str]:
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0]
    sync_url = f"{parsed.scheme}://{parsed.netloc}"
    return sync_url, token


_REPLICA_SYNCER = None


def _bootstrap_replica(libsql_url: str, local_path: str) -> None:
    global _REPLICA_SYNCER
    import libsql_experimental as libsql

    sync_url, token = _parse_libsql_url(libsql_url)
    log.info("Opening embedded replica at %s (sync_url=%s)", local_path, sync_url)
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
    if raw.startswith("libsql://"):
        local = os.environ.get("LIBSQL_REPLICA_PATH", "/tmp/chitti_medupi.db")
        _bootstrap_replica(raw, local)
        return f"sqlite:///{local}"
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql://", 1)
    return raw


db_url = _resolve_url(settings.DATABASE_URL)

connect_args = {}
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


def sync_now() -> None:
    """Force an immediate sync to Turso. Call after batch writes if needed."""
    if _REPLICA_SYNCER is not None:
        try:
            _REPLICA_SYNCER.sync()
        except Exception as e:  # noqa: BLE001
            log.warning("Forced Turso sync failed: %s", e)
