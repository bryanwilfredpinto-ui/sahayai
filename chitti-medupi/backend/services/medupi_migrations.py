"""
services/medupi_migrations.py
-----------------------------
One-shot, idempotent schema patches we run on FastAPI startup.

Two responsibilities:
  1. ensure_schema()  — CREATE SCHEMA IF NOT EXISTS medupi (Postgres only)
                         must run BEFORE Base.metadata.create_all() so that
                         create_all has a place to put the tables.
  2. run_all()        — ALTER TABLE … ADD COLUMN for v1.7 additions
                         (`price_source`, `updated_at`) on existing rows.
                         Idempotent + dialect-aware (SQLite + Postgres).

All raw SQL is schema-qualified via models._schema.qualified() so we
hit `medupi.medicines` on Postgres but plain `medicines` on SQLite.
"""
from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import inspect, text

from database import engine
from models._schema import SCHEMA, qualified

log = logging.getLogger("medupi_migrations")


_PATCHES_MEDICINES = [
    ("price_source", "VARCHAR(40)"),
    # SQLite TIMESTAMP vs Postgres TIMESTAMP — both accept this literal
    ("updated_at", "TIMESTAMP"),
]


# ───── Schema bootstrap ─────

def ensure_schema() -> None:
    """CREATE SCHEMA IF NOT EXISTS medupi on Postgres. No-op on SQLite."""
    if not SCHEMA:
        return
    try:
        with engine.begin() as conn:
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS {SCHEMA}'))
        log.info("ensure_schema: schema '%s' ready", SCHEMA)
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema failed (will retry on next migration): %s", e)


# ───── Column-level migrations ─────

def _column_exists(table: str, column: str) -> bool:
    insp = inspect(engine)
    cols = {c["name"] for c in insp.get_columns(table, schema=SCHEMA)}
    return column in cols


def _add_column_if_missing(table: str, column: str, ddl_type: str) -> bool:
    """Returns True when the column was actually added."""
    if _column_exists(table, column):
        return False
    qname = qualified(table)
    log.info("migration: ALTER TABLE %s ADD COLUMN %s %s", qname, column, ddl_type)
    with engine.begin() as conn:
        conn.execute(text(f'ALTER TABLE {qname} ADD COLUMN {column} {ddl_type}'))
        # Backfill updated_at for legacy rows
        if column == "updated_at":
            conn.execute(
                text(f'UPDATE {qname} SET {column} = :ts WHERE {column} IS NULL'),
                {"ts": datetime.utcnow()},
            )
    return True


def run_all() -> dict:
    """
    Apply every column-level migration. Idempotent — safe to call on
    every startup. Returns a dict with the number of changes per table.
    """
    insp = inspect(engine)
    table_names = set(insp.get_table_names(schema=SCHEMA))
    if "medicines" not in table_names:
        return {
            "note": (
                f"medicines table missing in {SCHEMA or 'default'} schema "
                "— fresh DB, no migration needed"
            )
        }

    changes = 0
    for col, ddl in _PATCHES_MEDICINES:
        try:
            if _add_column_if_missing("medicines", col, ddl):
                changes += 1
        except Exception as e:  # noqa: BLE001
            log.warning("migration for medicines.%s skipped: %s", col, e)
    return {"medicines_columns_added": changes, "schema": SCHEMA or "default"}
