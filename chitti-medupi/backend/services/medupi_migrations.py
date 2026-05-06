"""
services/medupi_migrations.py
-----------------------------
One-shot, idempotent schema patches we run on FastAPI startup.

`Base.metadata.create_all()` only creates *missing tables* — it does NOT
add new columns to existing ones. So when v1.7 added `updated_at` and
`price_source` to the existing `medicines` table, deployments that
already had a populated DB needed an ALTER TABLE … ADD COLUMN.

This module hand-rolls those ALTERs, dialect-aware (SQLite + Postgres),
and uses IF NOT EXISTS / PRAGMA introspection so re-runs are no-ops.
"""
from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import inspect, text

from database import engine

log = logging.getLogger("medupi_migrations")


_PATCHES_MEDICINES = [
    ("price_source", "VARCHAR(40)"),
    # SQLite TIMESTAMP vs Postgres TIMESTAMP — both accept this literal
    ("updated_at", "TIMESTAMP"),
]


def _column_exists(table: str, column: str) -> bool:
    insp = inspect(engine)
    cols = {c["name"] for c in insp.get_columns(table)}
    return column in cols


def _add_column_if_missing(table: str, column: str, ddl_type: str) -> bool:
    """Returns True when the column was actually added."""
    if _column_exists(table, column):
        return False
    log.info("migration: ALTER TABLE %s ADD COLUMN %s %s", table, column, ddl_type)
    with engine.begin() as conn:
        conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {ddl_type}'))
        # Backfill updated_at for legacy rows
        if column == "updated_at":
            conn.execute(text(
                f'UPDATE {table} SET {column} = :ts WHERE {column} IS NULL'
            ), {"ts": datetime.utcnow()})
    return True


def run_all() -> dict:
    """
    Apply every migration. Idempotent — safe to call on every startup.
    Returns a dict with the number of changes per table.
    """
    insp = inspect(engine)
    if "medicines" not in insp.get_table_names():
        return {"note": "medicines table missing — fresh DB, no migration needed"}

    changes = 0
    for col, ddl in _PATCHES_MEDICINES:
        try:
            if _add_column_if_missing("medicines", col, ddl):
                changes += 1
        except Exception as e:  # noqa: BLE001
            log.warning("migration for medicines.%s skipped: %s", col, e)
    return {"medicines_columns_added": changes}
