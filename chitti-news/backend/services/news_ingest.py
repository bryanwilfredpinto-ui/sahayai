"""
services/news_ingest.py
-----------------------
Fetch all enabled sources via RSS / Atom and upsert into `articles`.

Pure-Python: feedparser + requests. Idempotent on (link). Per-source
errors are caught + logged, never propagated — one bad feed shouldn't
take down the whole poll cycle.
"""
from __future__ import annotations

import hashlib
import logging
import re
from datetime import datetime, timedelta
from time import mktime
from typing import Optional

import feedparser
import requests
from sqlalchemy.orm import Session

from database import SessionLocal
from models.article import Article
from models.source import Source

log = logging.getLogger("news_ingest")

USER_AGENT = "ChittiNews/1.0 (+https://sahayai.in/chitti_news.html)"


def _title_hash(t: str) -> str:
    if not t:
        return ""
    norm = " ".join(t.lower().split())[:200]
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()


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
    """Best-effort image extraction from RSS extensions."""
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


def fetch_source(db: Session, source: Source) -> dict:
    """Fetch one source. Returns {fetched, inserted, skipped, error}."""
    try:
        resp = requests.get(
            source.rss_url,
            headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
            timeout=20,
            allow_redirects=True,
        )
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
    except Exception as e:  # noqa: BLE001
        msg = str(e).strip()[:400]
        source.last_error = msg
        source.last_fetched_at = datetime.utcnow()
        db.commit()
        log.warning("[%s] fetch failed: %s", source.slug, msg)
        return {"slug": source.slug, "fetched": 0, "inserted": 0, "skipped": 0, "error": msg}

    inserted = skipped = 0
    for entry in (feed.entries or [])[:50]:   # cap per-feed to keep poll fast
        try:
            link = (entry.get("link") or "").strip()[:900]
            title = (entry.get("title") or "").strip()[:500]
            if not (link and title):
                skipped += 1
                continue

            # Idempotent: skip if link already in DB
            existing = db.query(Article).filter(Article.link == link).first()
            if existing:
                skipped += 1
                continue

            summary_text = _strip_html(entry.get("summary") or entry.get("description"))
            published = _parse_published(entry)

            a = Article(
                title=title,
                title_hash=_title_hash(title),
                link=link,
                summary=(summary_text or "")[:2000],
                source_slug=source.slug,
                source_name=source.display_name,
                source_url=source.homepage_url,
                image_url=(_extract_image(entry) or None),
                author=(entry.get("author") or None),
                state=source.state,
                language=source.language,
                category=source.category,
                is_breaking=0,
                importance=5,
                published_at=published,
                fetched_at=datetime.utcnow(),
            )
            db.add(a)
            inserted += 1
        except Exception as e:  # noqa: BLE001
            log.exception("[%s] entry failed: %s", source.slug, e)
            skipped += 1

    source.last_error = None
    source.last_fetched_at = datetime.utcnow()
    db.commit()
    log.info("[%s] %d new, %d skipped", source.slug, inserted, skipped)
    return {"slug": source.slug, "fetched": len(feed.entries or []),
            "inserted": inserted, "skipped": skipped, "error": None}


def fetch_all() -> dict:
    """Fetch every enabled source. Returns aggregated stats."""
    db = SessionLocal()
    totals = {"sources": 0, "inserted": 0, "skipped": 0, "errors": 0}
    try:
        sources = db.query(Source).filter(Source.enabled == 1).all()
        for s in sources:
            res = fetch_source(db, s)
            totals["sources"] += 1
            totals["inserted"] += res["inserted"]
            totals["skipped"] += res["skipped"]
            if res["error"]:
                totals["errors"] += 1
        # Trim very old articles (90+ days) — bounds growth
        cutoff = datetime.utcnow() - timedelta(days=90)
        n_old = db.query(Article).filter(Article.fetched_at < cutoff).delete()
        db.commit()
        totals["pruned"] = n_old
    finally:
        db.close()
    log.info("fetch_all: %s", totals)
    return totals
