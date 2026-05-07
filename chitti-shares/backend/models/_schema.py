"""
models/_schema.py
-----------------
Schema isolation for the Chitti Shares backend.

We share the Supabase Postgres database with chitti-medupi (Render's
free-tier permits only one free DB) and keep our tables under a
dedicated `shares` schema so the two services don't collide.

Postgres → schema = 'shares'.   Cross-schema FK target = 'shares.foo.id'
SQLite  → schema = None.        FK target = 'foo.id' (SQLite has no schemas)

Layout in Supabase:
  public.*      (Supabase internals, auth tables, etc.)
  shares.*      (this service)
  medupi.*      (chitti-medupi)

Usage in a model:

    from models._schema import TABLE_KW, fk_target

    class Alert(Base):
        __tablename__ = "alerts"
        user_id = Column(Integer, ForeignKey(fk_target("users")),
                         nullable=False, index=True)
        # ... columns ...
        __table_args__ = TABLE_KW           # → {"schema": "shares"} on Postgres
"""
from __future__ import annotations

from config import settings


def _detect_schema() -> str | None:
    """Postgres → 'shares'. Anything else (SQLite local dev) → None."""
    url = (settings.DATABASE_URL or "").lower()
    if url.startswith("postgres://") or url.startswith("postgresql"):
        return "shares"
    return None


SCHEMA: str | None = _detect_schema()

# Pass to __table_args__ on every model.
TABLE_KW: dict = {"schema": SCHEMA} if SCHEMA else {}


def fk_target(table_name: str, column: str = "id") -> str:
    """ForeignKey target string. 'shares.foo.id' on Postgres; 'foo.id' on SQLite."""
    prefix = f"{SCHEMA}." if SCHEMA else ""
    return f"{prefix}{table_name}.{column}"


def qualified(table_name: str) -> str:
    """Schema-qualified table name for raw SQL (ALTER TABLE etc.)."""
    return f"{SCHEMA}.{table_name}" if SCHEMA else table_name
