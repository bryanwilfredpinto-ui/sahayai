"""
services/rss_fetcher.py
-----------------------
Fetch every enabled source from data/sources.json (mirrored into the Source
table on first boot). Idempotent on (url). Per-source errors are captured
into source.last_error — one bad feed never takes down the whole poll.

Rewrite 2026-05-23 per Sire's final architecture: 8 sources only, no spice,
no extras. Articles store full body when the publisher ships content:encoded
so the speaker can read the entire article (not just the headline snippet).
"""
from __future__ import annotations

import logging
import re
from datetime import datetime
from time import mktime
from typing import Optional

import feedparser
import requests
from sqlalchemy.orm import Session

from database import SessionLocal
from models.articles import Article
from models.sources import Source

log = logging.getLogger("rss_fetcher")

USER_AGENT = "ChittiNewsAI/1.0 (+https://sahayai.in/chitti_news_ai.html)"


def _strip_html(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip() or None


def _parse_published(entry) -> Optional[datetime]:
    for key in ("published_parsed", "updated_parsed", "created_parsed"):
        v = entry.get(key)
        if v:
            try:
                return datetime.utcfromtimestamp(mktime(v))
            except Exception:  # noqa: BLE001
                pass
    return None


def _extract_image(entry) -> Optional[str]:
    media = entry.get("media_content") or []
    if media and isinstance(media, list):
        u = media[0].get("url") if isinstance(media[0], dict) else None
        if u:
            return u
    enc = entry.get("enclosures") or []
    if enc and isinstance(enc, list) and isinstance(enc[0], dict):
        if enc[0].get("type", "").startswith("image/"):
            return enc[0].get("href") or enc[0].get("url")
    summary = entry.get("summary") or entry.get("description") or ""
    m = re.search(r'<img[^>]+src=["\']([^"\']+)', summary)
    return m.group(1) if m else None


def _extract_full_body(entry) -> Optional[str]:
    raw = ""
    content_field = entry.get("content")
    if isinstance(content_field, list) and content_field:
        raw = content_field[0].get("value", "") or ""
    elif isinstance(content_field, str):
        raw = content_field
    return _strip_html(raw) if raw else None


def _slugify(name: str) -> str:
    if not name:
        return ""
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.lower()).strip("-")
    return s[:80]


def fetch_source(db: Session, source: Source) -> dict:
    """Fetch one source. Returns {fetched, inserted, skipped, error}."""
    if not source.active:
        source.last_fetched_utc = datetime.utcnow()
        source.last_error = "active=false (honest stub — see source.reason_for_inclusion)"
        db.commit()
        return {"slug": source.name, "fetched": 0, "inserted": 0, "skipped": 0, "error": source.last_error}

    try:
        resp = requests.get(
            source.url,
            headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
            timeout=20,
            allow_redirects=True,
        )
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
    except Exception as e:  # noqa: BLE001
        msg = str(e).strip()[:400]
        source.last_error = msg
        source.last_fetched_utc = datetime.utcnow()
        db.commit()
        log.warning("[%s] fetch failed: %s", source.name, msg)
        return {"slug": source.name, "fetched": 0, "inserted": 0, "skipped": 0, "error": msg}

    inserted = skipped = 0
    for entry in (feed.entries or [])[:50]:
        try:
            link = (entry.get("link") or "").strip()[:900]
            title = (entry.get("title") or "").strip()[:1000]
            if not (link and title):
                skipped += 1
                continue

            existing = db.query(Article).filter(Article.url == link).first()
            if existing:
                skipped += 1
                continue

            summary_text = _strip_html(entry.get("summary") or entry.get("description"))
            full_body = _extract_full_body(entry)
            published = _parse_published(entry)

            a = Article(
                source_id=source.id,
                source_slug=_slugify(source.name),
                source_name=source.name,
                url=link,
                title=title,
                summary=(summary_text or "")[:2000] or None,
                content=full_body,
                image_url=_extract_image(entry),
                tab=source.tab or "ai-news",
                is_bharat=1 if source.is_bharat else 0,
                language=source.language or "en",
                published_utc=published,
            )
            db.add(a)
            inserted += 1
        except Exception as e:  # noqa: BLE001
            log.exception("[%s] entry failed: %s", source.name, e)
            skipped += 1

    source.last_error = None
    source.last_fetched_utc = datetime.utcnow()
    db.commit()
    log.info("[%s] %d new, %d skipped", source.name, inserted, skipped)
    return {"slug": source.name, "fetched": len(feed.entries or []),
            "inserted": inserted, "skipped": skipped, "error": None}


def fetch_all() -> dict:
    """Fetch every source row (active filter inside fetch_source). Aggregated stats."""
    db = SessionLocal()
    totals = {"sources": 0, "inserted": 0, "skipped": 0, "errors": 0}
    try:
        sources = db.query(Source).all()
        for s in sources:
            res = fetch_source(db, s)
            totals["sources"] += 1
            totals["inserted"] += res["inserted"]
            totals["skipped"] += res["skipped"]
            if res["error"]:
                totals["errors"] += 1
    finally:
        db.close()
    log.info("fetch_all: %s", totals)
    return totals
