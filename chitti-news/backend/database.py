"""
database.py
-----------
SQLAlchemy engine + session + ensure_schema().

URL shapes supported:
  - libsql://<host>?authToken=<token>     (Turso libSQL — production)
  - sqlite:///path/to/file.db             (local dev)
  - postgresql://... or postgres://...    (legacy — pre-Turso migration)

Turso compatibility note
------------------------
SQLAlchemy's stock `pysqlite` dialect assumes the DBAPI Connection is the
stdlib `sqlite3.Connection` — a mutable `.isolation_level` attribute and
support for `PRAGMA read_uncommitted` to detect default isolation level.

libsql-experimental's Connection is a Rust binding over Hrana HTTP:
  - It doesn't expose `isolation_level` as a writable attribute.
  - Hrana returns HTTP 405 on PRAGMA queries.

So we patch the pysqlite dialect class — JUST for the methods Turso can't
satisfy — to short-circuit isolation-level probes. Turso's transactional
model is fixed by Hrana, so "SERIALIZABLE" is the truthful constant answer.
The patch is gated by URL shape, so a local sqlite:/// file in dev still
gets the real pysqlite behaviour.
"""
from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings


def _resolve_url(raw: str) -> str:
    if raw.startswith("libsql://"):
        return "sqlite+" + raw
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql://", 1)
    return raw


db_url = _resolve_url(settings.DATABASE_URL)
_is_libsql = db_url.startswith("sqlite+libsql")


def _patch_pysqlite_for_libsql() -> None:
    """Make pysqlite dialect tolerant of libsql-experimental's Connection."""
    from sqlalchemy.dialects.sqlite.pysqlite import SQLiteDialect_pysqlite

    def _fixed_isolation(self, dbapi_conn):
        return "SERIALIZABLE"

    def _noop_set(self, dbapi_conn, level):
        return  # libsql Connection has no writable isolation_level attr

    SQLiteDialect_pysqlite.get_isolation_level = _fixed_isolation          # type: ignore[assignment]
    SQLiteDialect_pysqlite.get_default_isolation_level = _fixed_isolation  # type: ignore[assignment]
    SQLiteDialect_pysqlite.set_isolation_level = _noop_set                 # type: ignore[assignment]


if _is_libsql:
    _patch_pysqlite_for_libsql()

connect_args: dict = {}
if db_url.startswith("sqlite") and not _is_libsql:
    connect_args = {"check_same_thread": False}

engine_kwargs: dict = {"connect_args": connect_args, "pool_pre_ping": True}
if _is_libsql:
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
    """CREATE SCHEMA IF NOT EXISTS news — only on Postgres. No-op elsewhere."""
    from models._schema import SCHEMA
    if not SCHEMA:
        return
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA}"))
