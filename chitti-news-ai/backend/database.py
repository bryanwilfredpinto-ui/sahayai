"""
database.py
-----------
SQLAlchemy engine + session + ensure_schema().

Turso integration via **embedded replica** mode (not direct Hrana).
Ported from chitti-news/backend/database.py — same rationale: the stock
sqlalchemy pysqlite dialect assumes a stdlib sqlite3.Connection (PRAGMA
support + mutable isolation_level) which the remote Hrana protocol doesn't
satisfy. We sidestep by:

  1. Asking libsql-experimental to maintain a **local SQLite file** that
     syncs (read AND write) with the Turso DB in the background. The
     local file is a real SQLite database, so SQLAlchemy is happy.
  2. Letting SQLAlchemy talk to the local file via plain
     `sqlite:////tmp/chitti_news_ai.db`. libsql_experimental does the
     Turso syncing on the side.

Render free tier wipes /tmp on every deploy, so we re-sync from Turso at
boot. Background sync runs every 60s after that. Writes hit the local
file first and are pushed up on the next sync tick.

Env-var shape for chitti-news-ai is the **split** pattern (see
[[project_turso_env_var_patterns]]):
  - DATABASE_URL=libsql://<host>          (no query string)
  - TURSO_AUTH_TOKEN=<jwt>                (separate env var)

For robustness this module also accepts the composed form
`libsql://<host>?authToken=<jwt>` — the query-string token takes
precedence if both are present.

URL shapes accepted:
  - libsql://<host>?authToken=<token>   (Turso composed)
  - libsql://<host>                     (Turso split; token from TURSO_AUTH_TOKEN)
  - sqlite:///path/to/file.db           (local dev)
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

log = logging.getLogger("chitti-news-ai.db")


def _parse_libsql_url(raw: str, fallback_token: str | None) -> tuple[str, str]:
    """Pull (sync_url, auth_token) out of a libsql:// URL.

    Token resolution order: query-string `authToken` first (composed form),
    then `fallback_token` (split form, typically settings.turso_auth_token).
    sync_url is the bare `libsql://<host>` with any path/query stripped —
    that's what libsql-experimental wants.
    """
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0] or (fallback_token or "")
    sync_url = f"{parsed.scheme}://{parsed.netloc}"
    return sync_url, token


_REPLICA_PATH: str | None = None
_REPLICA_SYNCER = None  # libsql_experimental connection used purely for sync()


def _bootstrap_replica(libsql_url: str, local_path: str, fallback_token: str | None) -> None:
    """Pull the Turso DB into a local SQLite file and start background sync."""
    global _REPLICA_SYNCER
    import libsql_experimental as libsql

    sync_url, token = _parse_libsql_url(libsql_url, fallback_token)
    log.info("Opening embedded replica at %s (sync_url=%s)", local_path, sync_url)
    _REPLICA_SYNCER = libsql.connect(local_path, sync_url=sync_url, auth_token=token)

    def _loop():
        # First sync runs in the background — never blocks /health.
        # libsql.connect() above is foreground (local SQLite open, no
        # network); the first .sync() hits Turso over the wire and can
        # take seconds on a cold boot. Pushing it here keeps the gunicorn
        # worker free to bind /health well under Render's 30s probe.
        try:
            _REPLICA_SYNCER.sync()
            log.info("Initial sync from Turso complete")
        except Exception as e:  # noqa: BLE001
            log.warning("Initial Turso sync failed (will retry in background): %s", e)
        # Steady-state 60s refresh.
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
        local = os.environ.get("LIBSQL_REPLICA_PATH", "/tmp/chitti_news_ai.db")
        _REPLICA_PATH = local
        _bootstrap_replica(raw, local, settings.turso_auth_token)
        return f"sqlite:///{local}"

    if raw.startswith(("sqlite:", "postgresql:", "postgres:", "mysql:", "mariadb:")):
        if raw.startswith("postgres://"):
            return raw.replace("postgres://", "postgresql://", 1)
        return raw

    # Unrecognised value (placeholder like PASTE_LIBSQL_URL_HERE, or empty).
    # Fall back to local SQLite so the gunicorn worker still boots and /health
    # responds — DB-backed routes will return empty rows until a real value lands.
    log.warning("Unrecognised DATABASE_URL=%r — falling back to local SQLite for boot", raw)
    return "sqlite:////tmp/chitti_news_ai_fallback.db"


db_url = _resolve_url(settings.database_url)

connect_args: dict = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def ensure_schema() -> None:
    """Create all tables. Idempotent. Called once on boot."""
    Base.metadata.create_all(bind=engine)
    log.info("schema ensured at %s", engine.url)


def sync_now() -> None:
    """Force an immediate sync to Turso. Call after batch writes if needed."""
    if _REPLICA_SYNCER is not None:
        try:
            _REPLICA_SYNCER.sync()
        except Exception as e:  # noqa: BLE001
            log.warning("Forced Turso sync failed: %s", e)
