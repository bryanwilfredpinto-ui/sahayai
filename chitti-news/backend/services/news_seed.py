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

from database import SessionLocal
from models.article import Article
from models.source import Source

log = logging.getLogger("news_seed")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SOURCES_PATH = DATA_DIR / "sources.json"
ARTICLES_SEED = DATA_DIR / "articles_seed.json"


def seed_sources_if_empty() -> int:
    db = SessionLocal()
    try:
        if db.query(Source).count() > 0:
            return 0
        if not SOURCES_PATH.exists():
            log.warning("sources.json not found — skipping")
            return 0
        rows = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
        n = 0
        for r in rows:
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
        db.commit()
        log.info("seeded %d sources", n)
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
