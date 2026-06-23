"""
services/jobs_database.py
-------------------------
DB bootstrap helpers for the Chitti Jobs backend.

ensure_schema()  — CREATE SCHEMA only matters on Postgres; on Turso/SQLite
                   it is a no-op (SCHEMA is None). Table creation itself is
                   done by Base.metadata.create_all() in main.py.
load_sources()   — reads the RSS source registry (data/job_sources_seed.json).
"""
from __future__ import annotations

import json
import logging
import os

from sqlalchemy import text

from database import engine
from models._schema import SCHEMA

log = logging.getLogger("services.jobs_database")

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_SOURCES_PATH = os.path.join(_DATA_DIR, "job_sources_seed.json")


def ensure_schema() -> None:
    if not SCHEMA:
        return
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA}"'))
    log.info("ensured schema %s", SCHEMA)


def load_sources() -> list[dict]:
    try:
        with open(_SOURCES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return [s for s in data.get("sources", []) if s.get("enabled")]
    except (OSError, ValueError) as e:
        log.warning("could not load job sources: %s", e)
        return []
