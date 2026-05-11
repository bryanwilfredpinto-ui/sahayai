"""
database.py
-----------
SQLAlchemy engine + session + ensure_schema().

Supports three URL shapes:
  - libsql://<host>?authToken=<token>     (Turso libSQL — production)
  - sqlite:///path/to/file.db             (local dev)
  - postgresql://... or postgres://...    (legacy — pre-Turso migration; will be
                                           removed once every Chitti is on Turso)

`models/_schema.py` returns SCHEMA=None for anything that isn't `postgresql`,
so libSQL/SQLite both get unprefixed table names automatically.
"""
from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings


def _resolve_url(raw: str) -> str:
    """
    Normalise the DATABASE_URL into a form SQLAlchemy can use directly.

    - libsql://... becomes sqlite+libsql://... so SQLAlchemy picks up the
      libSQL dialect from the `sqlalchemy-libsql` package.
    - postgres:// (Heroku-style) becomes postgresql:// so psycopg2-style
      drivers attach. Kept only for the migration window; remove after
      every Chitti is on Turso.
    """
    if raw.startswith("libsql://"):
        return "sqlite+" + raw
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql://", 1)
    return raw


db_url = _resolve_url(settings.DATABASE_URL)

connect_args: dict = {}
if db_url.startswith("sqlite") and not db_url.startswith("sqlite+libsql"):
    # Local file SQLite: allow multi-thread access via Flask.
    # (Turso libSQL is HTTP-based, no thread restriction.)
    connect_args = {"check_same_thread": False}

# Turso libSQL note: SQLAlchemy's sqlite dialect auto-detects isolation
# level on first connect via `PRAGMA read_uncommitted`. The Hrana HTTP
# protocol rejects PRAGMAs with HTTP 405. Pin the level explicitly so
# the dialect skips the probe.
engine_kwargs = {"connect_args": connect_args, "pool_pre_ping": True}
if db_url.startswith("sqlite+libsql"):
    engine_kwargs["isolation_level"] = "SERIALIZABLE"

engine = create_engine(db_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """
    CREATE SCHEMA IF NOT EXISTS news — only on Postgres.
    SQLite and libSQL have no schemas; this is a no-op there.
    """
    from models._schema import SCHEMA
    if not SCHEMA:
        return
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA}"))
