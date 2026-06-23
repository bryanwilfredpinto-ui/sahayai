"""
database.py
-----------
SQLAlchemy engine + session + ensure_schema().

Per SAHAYAI_MASTER.md §2 row 3 (LOCKED, REVISED 2026-05-29): writes MUST land
on Turso REMOTE. The earlier embedded-replica pattern wrote to
/tmp/chitti_news_ai.db via stdlib sqlite3, producing WAL frames libsql could
not push back to Turso. Container restart wiped /tmp; data was lost.

Replacement: direct HTTPS via lib.turso_http (a PEP-249 DBAPI shim talking to
Turso's /v2/pipeline endpoint). Plugged into SQLAlchemy via `create_engine(...,
creator=...)`, the stock sqlite dialect, NullPool — no local file, no
background sync, no /tmp anywhere.

Env-var shape for chitti-news-ai is the **split** pattern (see
[[project_turso_env_var_patterns]]):
  - DATABASE_URL=libsql://<host>          (no query string)
  - TURSO_AUTH_TOKEN=<jwt>                (separate env var)

For robustness this module also accepts the composed form
`libsql://<host>?authToken=<jwt>` — the query-string token takes precedence
if both are present.

URL shapes accepted:
  - libsql://<host>?authToken=<token>   (Turso composed; direct HTTPS)
  - libsql://<host>                     (Turso split; token from TURSO_AUTH_TOKEN)
  - sqlite:///path/to/file.db           (local dev)
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

log = logging.getLogger("chitti-news-ai.db")


def _parse_libsql_url(raw: str, fallback_token: str | None) -> tuple[str, str]:
    """Return (host, auth_token). Query-string token wins over fallback."""
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0] or (fallback_token or "")
    return parsed.netloc, token


def _build_libsql_engine(raw: str, fallback_token: str | None) -> Engine:
    from lib import turso_http

    host, token = _parse_libsql_url(raw, fallback_token)
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
    if raw.startswith(("sqlite:", "postgresql:", "postgres:", "mysql:", "mariadb:")):
        if raw.startswith("postgres://"):
            return raw.replace("postgres://", "postgresql://", 1)
        return raw
    # Unrecognised placeholder — fall back to local SQLite so /health still binds.
    log.warning("Unrecognised DATABASE_URL=%r — falling back to local SQLite for boot", raw)
    return "sqlite:////tmp/chitti_news_ai_fallback.db"


def _build_engine(raw: str) -> Engine:
    if raw.startswith("libsql://"):
        return _build_libsql_engine(raw, settings.turso_auth_token)

    url = _resolve_url(raw)
    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(url, connect_args=connect_args, pool_pre_ping=True, future=True)


engine: Engine = _build_engine(guard_database_url(settings.database_url))
db_url = str(engine.url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def ensure_schema() -> None:
    """Create all tables. Idempotent. Called once on boot."""
    Base.metadata.create_all(bind=engine)
    log.info("schema ensured at %s", engine.url)


def sync_now() -> None:
    """No-op. Retained for backward compatibility with the embedded-replica era."""
    return None
