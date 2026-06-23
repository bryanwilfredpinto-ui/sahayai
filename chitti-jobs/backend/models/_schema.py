"""
models/_schema.py
-----------------
Schema isolation helper. On Turso (libSQL) / SQLite there are no schemas,
so SCHEMA is None and tables live in the default namespace. The helper is
kept identical to the other Chitti backends so a future Postgres move is a
one-line change.
"""
from __future__ import annotations

from config import settings


def _detect_schema() -> str | None:
    url = (settings.DATABASE_URL or "").lower()
    if url.startswith("postgres://") or url.startswith("postgresql"):
        return "jobs"
    return None


SCHEMA: str | None = _detect_schema()
TABLE_KW: dict = {"schema": SCHEMA} if SCHEMA else {}


def fk_target(table_name: str, column: str = "id") -> str:
    prefix = f"{SCHEMA}." if SCHEMA else ""
    return f"{prefix}{table_name}.{column}"


def qualified(table_name: str) -> str:
    return f"{SCHEMA}.{table_name}" if SCHEMA else table_name
