"""
models/_schema.py
-----------------
Schema isolation for the Chitti Government backend.

We share the chitti-shares Supabase Postgres database (Render free tier
caps at one free DB per workspace) but keep all our tables under a
dedicated `government` schema so the services don't collide.

Postgres → schema = 'government'.   Cross-schema FK target = 'government.foo.id'
SQLite  → schema = None.             FK target = 'foo.id' (SQLite has no schemas)

Usage in a model:

    from models._schema import TABLE_KW, fk_target

    class Feedback(Base):
        __tablename__ = "feedback"
        scheme_id = Column(Integer, ForeignKey(fk_target("schemes")), nullable=True)
        __table_args__ = TABLE_KW
"""
from __future__ import annotations

from config import settings


def _detect_schema() -> str | None:
    url = (settings.DATABASE_URL or "").lower()
    if url.startswith("postgres://") or url.startswith("postgresql"):
        return "government"
    return None


SCHEMA: str | None = _detect_schema()
TABLE_KW: dict = {"schema": SCHEMA} if SCHEMA else {}


def fk_target(table_name: str, column: str = "id") -> str:
    prefix = f"{SCHEMA}." if SCHEMA else ""
    return f"{prefix}{table_name}.{column}"


def qualified(table_name: str) -> str:
    return f"{SCHEMA}.{table_name}" if SCHEMA else table_name
