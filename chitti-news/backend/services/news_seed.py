"""
services/news_seed.py
---------------------
First-boot seed loaders for `sources` + `articles` tables.

Idempotent — both check row count and short-circuit if non-empty.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path

from sqlalchemy import inspect, text

from database import SessionLocal, engine
from models.article import Article
from models.source import Source

log = logging.getLogger("news_seed")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SOURCES_PATH = DATA_DIR / "sources.json"
ARTICLES_SEED = DATA_DIR / "articles_seed.json"


# Health-monitor columns added 2026-06-02. SQLAlchemy doesn't auto-ALTER
# existing tables, so we add columns at startup if missing. SQLite +
# Postgres + Turso libSQL all accept ALTER TABLE ADD COLUMN.
_HEALTH_COLUMNS = [
    ("consecutive_failures",       "INTEGER NOT NULL DEFAULT 0"),
    ("last_success_at",            "TIMESTAMP"),
    ("status",                     "VARCHAR(16) NOT NULL DEFAULT 'healthy'"),
    ("next_retry_at",              "TIMESTAMP"),
    ("last_alert_at",              "TIMESTAMP"),
    ("alternative_url_candidate",  "VARCHAR(500)"),
]


def ensure_health_columns() -> int:
    """
    Idempotent ALTER TABLE for health-monitor columns. Returns the
    number of columns actually added. Safe to call on every startup.
    """
    insp = inspect(engine)
    existing_cols = {c["name"] for c in insp.get_columns("sources")}
    added = 0
    with engine.begin() as conn:
        for col_name, col_def in _HEALTH_COLUMNS:
            if col_name in existing_cols:
                continue
            try:
                conn.execute(text(f"ALTER TABLE sources ADD COLUMN {col_name} {col_def}"))
                added += 1
                log.info("migrated: added sources.%s", col_name)
            except Exception as e:  # noqa: BLE001
                log.warning("could not add column sources.%s: %s", col_name, e)
    return added


def seed_sources_if_empty() -> int:
    """
    Idempotent upsert (2026-06-02 — was empty-only check):
      * If table is empty → bulk insert every row from sources.json
      * If table has rows → INSERT only NEW slugs from sources.json
        (existing rows are left untouched; we don't overwrite an admin
         who tweaked `enabled` or `last_fetched_at` in prod)

    This makes the JSON registry the source of truth for "what sources
    exist" without sacrificing prod-side mutability.
    """
    db = SessionLocal()
    try:
        if not SOURCES_PATH.exists():
            log.warning("sources.json not found — skipping")
            return 0
        rows = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
        existing_slugs = {s.slug for s in db.query(Source.slug).all()}
        n = 0
        for r in rows:
            if r["slug"] in existing_slugs:
                continue
            s = Source(
                slug=r["slug"],
                display_name=r["display_name"],
                rss_url=r["rss_url"],
                homepage_url=r.get("homepage_url"),
                state=r.get("state", "india"),
                language=r.get("language", "en"),
                category=r.get("category", "national"),
                enabled=int(r.get("enabled", 1)),
            )
            db.add(s); n += 1
        if n:
            db.commit()
            log.info("upserted %d new sources (registry total → %d)", n, len(existing_slugs) + n)
        return n
    finally:
        db.close()


def seed_articles_if_empty() -> int:
    db = SessionLocal()
    try:
        if db.query(Article).count() > 0:
            return 0
        if not ARTICLES_SEED.exists():
            return 0
        rows = json.loads(ARTICLES_SEED.read_text(encoding="utf-8"))
        n = 0
        for r in rows:
            title = r.get("title") or ""
            a = Article(
                title=title[:500],
                title_hash=_title_hash(title),
                link=r["link"][:900],
                summary=r.get("summary"),
                source_slug=r.get("source_slug", "chitti"),
                source_name=r.get("source_name"),
                source_url=r.get("source_url"),
                state=r.get("state", "india"),
                language=r.get("language", "en"),
                category=r.get("category", "national"),
                is_breaking=int(r.get("is_breaking") or 0),
                importance=int(r.get("importance") or 5),
                published_at=datetime.utcnow(),
                fetched_at=datetime.utcnow(),
            )
            db.add(a); n += 1
        db.commit()
        log.info("seeded %d articles", n)
        return n
    finally:
        db.close()


def _title_hash(t: str) -> str:
    """64-char SHA-256 of normalized title for cross-source dedup."""
    if not t:
        return ""
    norm = " ".join(t.lower().split())[:200]
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()
