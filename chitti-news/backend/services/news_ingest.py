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
import json
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from time import mktime
from typing import Optional

import feedparser
import requests
from sqlalchemy.orm import Session

from database import SessionLocal
from models.article import Article
from models.source import Source
from services.category_classifier import classify_article

# Optional Cloudflare-bypass fetcher. Imported lazily — falling back to
# requests-only behaviour if cloudscraper isn't installed in this env.
try:
    import cloudscraper  # type: ignore
    _HAS_CLOUDSCRAPER = True
except ImportError:
    _HAS_CLOUDSCRAPER = False

log = logging.getLogger("news_ingest")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Per-source JSON config dir for json+ ingestion (b) — Eenadu/Thanthi
# app-API captures land here when Sire pastes them. File-based so
# adding a new app-API source needs no DB schema migration.
JSON_CONFIG_DIR = Path(__file__).resolve().parent.parent / "data" / "json_configs"


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


_IMG_SRC_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)', re.IGNORECASE)


def _extract_image(entry) -> Optional[str]:
    """
    Best-effort image extraction from RSS extensions.

    Sire 2026-06-04 (pillar audit) — earlier version only checked
    media:content / enclosures / <img> in summary. That missed:
      • media:thumbnail   — BBC Tamil/Bengali/Marathi/Punjabi/Urdu
                            ship images here, not media:content
      • content:encoded   — every WordPress feed (Saamana, Anandabazar,
                            Punjabi Tribune…) embeds <img> in this field
                            via feedparser's entry.content[0].value
    Result: 6 Indic languages went from 100% placeholder tiles to
    real images.

    Branch order (cheapest → most expensive):
      1. media:content (most common)
      2. media:thumbnail (BBC family)
      3. enclosures (RSS 2.0 standard)
      4. <img> in content:encoded (WordPress family)
      5. <img> in summary / description (fallback)
    """
    # 1. media:content
    media = entry.get("media_content") or []
    if media and isinstance(media, list):
        u = media[0].get("url") if isinstance(media[0], dict) else None
        if u:
            return u
    # 2. media:thumbnail — BBC standard, missed by the original extractor
    thumb = entry.get("media_thumbnail") or []
    if thumb and isinstance(thumb, list):
        u = thumb[0].get("url") if isinstance(thumb[0], dict) else None
        if u:
            return u
    # 3. enclosures
    enc = entry.get("enclosures") or []
    if enc and isinstance(enc, list) and isinstance(enc[0], dict):
        if enc[0].get("type", "").startswith("image/"):
            return enc[0].get("href") or enc[0].get("url")
    # 4. content:encoded — feedparser exposes this as entry.content[0].value;
    #    a list of {value: "<html>", type: "text/html"} dicts. WordPress
    #    publishers (Saamana, Anandabazar, Punjabi Tribune, most Indic
    #    Hindi sites) embed the lead <img> here, NOT in summary.
    content_list = entry.get("content") or []
    if content_list and isinstance(content_list, list):
        for c in content_list:
            if not isinstance(c, dict):
                continue
            v = c.get("value") or ""
            if not v:
                continue
            m = _IMG_SRC_RE.search(v)
            if m:
                return m.group(1)
    # 5. <img> in summary / description (cheap fallback)
    summary = entry.get("summary") or entry.get("description") or ""
    m = _IMG_SRC_RE.search(summary)
    return m.group(1) if m else None


def _http_get(url: str) -> tuple[int, bytes, str]:
    """
    Two-stage fetcher: requests first (fast), cloudscraper second on
    SSLError / 403 / empty / non-feed response. Cloudflare-protected
    publishers (Saamana, Prajavani, Varthabharati, Rozana Spokesman)
    only succeed via cloudscraper's TLS-fingerprint impersonation.

    Returns (http_code, content, fetcher_used).
    """
    try:
        r = requests.get(
            url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
            timeout=20, allow_redirects=True,
        )
        if r.status_code == 200 and r.content and len(r.content) > 200:
            return r.status_code, r.content, "requests"
        last_code = r.status_code
    except Exception:
        last_code = 0
    # Fallback
    if not _HAS_CLOUDSCRAPER:
        return last_code, b"", "no-cloudscraper"
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows"})
        r = s.get(url, timeout=25, allow_redirects=True)
        return r.status_code, r.content, "cloudscraper"
    except Exception as e:  # noqa: BLE001
        return 0, b"", f"cs-exception:{type(e).__name__}"


def _fetch_source_json(source: Source) -> Optional[list[dict]]:
    """
    JSON ingestion path (b). Activated when source.rss_url starts with
    "json+" — strip the prefix, fetch the URL, then map JSON → article
    dicts using a per-slug config file at data/json_configs/<slug>.json:

      {
        "articles_path": "data.items",       // dot-path into JSON root
        "title": "headline",
        "link": "url",
        "summary": "subtitle",
        "image": "media.image_url",
        "published": "published_at",
        "headers": { "x-api-key": "..." }    // optional
      }

    Returns list of normalized article dicts ready for upsert, or None
    on failure (caller falls back to error path).
    """
    url = source.rss_url.removeprefix("json+")
    config_path = JSON_CONFIG_DIR / f"{source.slug}.json"
    if not config_path.exists():
        log.warning("[%s] json+ source but no config at %s", source.slug, config_path)
        return None
    try:
        cfg = json.loads(config_path.read_text(encoding="utf-8"))
        headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
        headers.update(cfg.get("headers", {}))
        r = requests.get(url, headers=headers, timeout=20, allow_redirects=True)
        r.raise_for_status()
        data = r.json()
    except Exception as e:  # noqa: BLE001
        log.warning("[%s] json fetch failed: %s", source.slug, e)
        return None

    def _dotget(obj, path):
        for key in path.split("."):
            if isinstance(obj, list):
                try:
                    obj = obj[int(key)]
                except (ValueError, IndexError):
                    return None
            elif isinstance(obj, dict):
                obj = obj.get(key)
            else:
                return None
            if obj is None:
                return None
        return obj

    items = _dotget(data, cfg.get("articles_path", "")) or data
    if not isinstance(items, list):
        log.warning("[%s] json path '%s' did not resolve to a list", source.slug, cfg.get("articles_path"))
        return None
    out = []
    for it in items[:50]:
        title = str(_dotget(it, cfg.get("title", "title")) or "").strip()
        link = str(_dotget(it, cfg.get("link", "link")) or "").strip()
        if not (title and link):
            continue
        out.append({
            "title": title[:500],
            "link": link[:900],
            "summary": (str(_dotget(it, cfg.get("summary", "summary")) or "") or None),
            "image": (str(_dotget(it, cfg.get("image", "image")) or "") or None),
            "published": str(_dotget(it, cfg.get("published", "published")) or "") or None,
        })
    return out


def fetch_source(db: Session, source: Source) -> dict:
    """Fetch one source. Returns {fetched, inserted, skipped, error}."""
    # (b) JSON path dispatch
    if source.rss_url.startswith("json+"):
        json_items = _fetch_source_json(source)
        if json_items is None:
            source.last_error = "json_fetch_failed"
            source.last_fetched_at = datetime.utcnow()
            db.commit()
            return {"slug": source.slug, "fetched": 0, "inserted": 0, "skipped": 0, "error": "json_fetch_failed"}
        return _upsert_articles(db, source, json_items, n_fetched=len(json_items))
    try:
        code, content, fetcher = _http_get(source.rss_url)
        if code != 200 or not content:
            raise RuntimeError(f"http={code} via {fetcher}")
        feed = feedparser.parse(content)
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
            # content:encoded — RSS publishers like TOI, NDTV, Indian Express ship
            # the FULL article body here. Storing it lets the speaker read the
            # entire news (Sire 2026-05-23 contract), not just the headline blurb.
            full_body_raw = ""
            content_field = entry.get("content")
            if isinstance(content_field, list) and content_field:
                full_body_raw = content_field[0].get("value", "") or ""
            elif isinstance(content_field, str):
                full_body_raw = content_field
            full_body = _strip_html(full_body_raw) if full_body_raw else ""
            published = _parse_published(entry)

            # Sire 2026-06-03 — NDTV's /business RSS feed mixes cricket,
            # politics, weather alerts and IPO news into the same firehose,
            # so trusting source.category gave us "West Indies vs Sri
            # Lanka cricket schedule" sitting in Business as the top
            # card. Re-classify every article from its title+summary
            # before we commit. The classifier is high-precision: it
            # only overrides when confidence is strong (smoking-gun
            # regex OR ≥2 distinct keyword pattern matches beating the
            # source bank). Keeps source.category as fallback.
            refined_cat = classify_article(title, summary_text, source.category)
            a = Article(
                title=title,
                title_hash=_title_hash(title),
                link=link,
                summary=(summary_text or "")[:2000],
                content=(full_body or None),
                source_slug=source.slug,
                source_name=source.display_name,
                source_url=source.homepage_url,
                image_url=(_extract_image(entry) or None),
                author=(entry.get("author") or None),
                state=source.state,
                language=source.language,
                category=refined_cat,
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


def _upsert_articles(db: Session, source: Source, items: list[dict], *, n_fetched: int) -> dict:
    """
    Shared upsert path for normalized {title, link, summary, image, published}
    dicts — used by the json+ ingestion path. RSS path inlines its own loop
    above because it has feed-specific image / content:encoded extraction.
    """
    inserted = skipped = 0
    for it in items:
        try:
            link, title = (it.get("link") or "")[:900], (it.get("title") or "")[:500]
            if not (link and title):
                skipped += 1
                continue
            if db.query(Article).filter(Article.link == link).first():
                skipped += 1
                continue
            # Parse published_at when present — accept ISO 8601 or RFC 2822
            # via stdlib only. No feedparser private APIs.
            published = None
            raw_pub = it.get("published")
            if raw_pub:
                from email.utils import parsedate_to_datetime
                for parser in (datetime.fromisoformat, parsedate_to_datetime):
                    try:
                        dt = parser(raw_pub)
                        # Normalize to naive UTC to match the existing column shape.
                        published = dt.replace(tzinfo=None) if getattr(dt, "tzinfo", None) else dt
                        break
                    except Exception:  # noqa: BLE001
                        continue
            json_summary = _strip_html(it.get("summary")) or ""
            # Same reclassification pass as the RSS path — see comment above.
            refined_cat = classify_article(title, json_summary, source.category)
            a = Article(
                title=title,
                title_hash=_title_hash(title),
                link=link,
                summary=(json_summary[:2000] or None),
                content=None,
                source_slug=source.slug,
                source_name=source.display_name,
                source_url=source.homepage_url,
                image_url=(it.get("image") or None),
                author=None,
                state=source.state,
                language=source.language,
                category=refined_cat,
                is_breaking=0,
                importance=5,
                published_at=published,
                fetched_at=datetime.utcnow(),
            )
            db.add(a); inserted += 1
        except Exception as e:  # noqa: BLE001
            log.exception("[%s] json item failed: %s", source.slug, e)
            skipped += 1
    source.last_error = None
    source.last_fetched_at = datetime.utcnow()
    db.commit()
    log.info("[%s] (json) %d new, %d skipped", source.slug, inserted, skipped)
    return {"slug": source.slug, "fetched": n_fetched,
            "inserted": inserted, "skipped": skipped, "error": None}


def fetch_all() -> dict:
    """Fetch every enabled source. Returns aggregated stats.

    Per Sire 2026-06-02 health-monitor spec: skip sources where
      - status == 'dead'  (excluded until manually revived)
      - next_retry_at > now  (in backoff cooldown after consecutive failures)
    Both columns ship via news_seed.ensure_health_columns() so this is
    safe across deployments that may not yet have the migration applied
    (getattr with safe defaults).
    """
    db = SessionLocal()
    totals = {"sources": 0, "skipped_dead": 0, "skipped_backoff": 0,
              "inserted": 0, "skipped": 0, "errors": 0}
    try:
        sources = db.query(Source).filter(Source.enabled == 1).all()
        now = datetime.utcnow()
        for s in sources:
            status = getattr(s, "status", "healthy") or "healthy"
            if status == "dead":
                totals["skipped_dead"] += 1
                continue
            next_retry = getattr(s, "next_retry_at", None)
            if next_retry and next_retry > now:
                totals["skipped_backoff"] += 1
                continue
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
