"""
services/government_pib.py
--------------------------
PIB (Press Information Bureau) RSS poller.

Why custom: PIB's `ViewRss.aspx` blocks the default python-requests UA
(returns 403). We send a real browser UA and a 12 s timeout per feed.
Feeds are XML; we parse with feedparser (pure Python, no native deps).

Filtering: an item is kept ONLY if its title or summary mentions a
scheme keyword. This keeps the announcements feed readable rather than
firehosing every PIB press release into the user's notification bell.

The poller writes to two tables:
  - pib_announcements (deduped by GUID)
  - ingest_logs       (one row per run)

It also tries to match each announcement to a curated scheme by short
code / slug substring match — when matched the alert can offer a
direct "Check eligibility" deep-link.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Iterable

import feedparser
import requests

from config import settings
from database import SessionLocal
from models.ingest_log import IngestLog
from models.pib_announcement import PIBAnnouncement
from models.scheme import Scheme

log = logging.getLogger("services.government_pib")


# ── PIB feed catalogue ──────────────────────────────────────────────
# reg=  ministry/region id; lang=  1 EN / 2 HI. URLs verified public XML.
PIB_FEEDS: list[dict] = [
    {"reg": "3",  "lang": "1", "ministry": "All-India",            "language": "en"},
    {"reg": "3",  "lang": "2", "ministry": "All-India",            "language": "hi"},
    {"reg": "1",  "lang": "1", "ministry": "PMO",                  "language": "en"},
    {"reg": "1",  "lang": "2", "ministry": "PMO",                  "language": "hi"},
    {"reg": "8",  "lang": "1", "ministry": "Agriculture & Farmers Welfare", "language": "en"},
    {"reg": "63", "lang": "1", "ministry": "Rural Development",    "language": "en"},
    {"reg": "51", "lang": "1", "ministry": "Health & Family Welfare",       "language": "en"},
    {"reg": "83", "lang": "1", "ministry": "Women & Child Development",     "language": "en"},
    {"reg": "33", "lang": "1", "ministry": "Finance",              "language": "en"},
    {"reg": "14", "lang": "1", "ministry": "Labour & Employment",  "language": "en"},
]

# Keywords that mark a PIB item as scheme-relevant. Lowercase.
SCHEME_KEYWORDS = (
    "scheme", "yojana", "yojna", "awas", "kisan", "pension", "pmjay", "ayushman",
    "nrega", "mgnrega", "scholarship", "aushadhi", "ujjwala", "ladli", "sukanya",
    "atal pension", "mudra", "svanidhi", "vishwakarma", "bima", "kvy", "saubhagya",
    "swachh bharat", "ration", "kisaan", "garib", "bpl", "sc/st", "obc",
    "skill india", "kaushal", "stand up india", "startup india",
)


def _looks_like_scheme(title: str, summary: str) -> bool:
    text = f"{title} {summary}".lower()
    return any(k in text for k in SCHEME_KEYWORDS)


def _match_scheme(db, title: str, summary: str) -> str | None:
    text = f"{title} {summary}".lower()
    for sch in db.query(Scheme).all():
        candidates = [sch.slug or "", (sch.short_code or "").lower(), (sch.name_en or "").lower()]
        for c in candidates:
            if not c or len(c) < 4:
                continue
            if c.lower() in text:
                return sch.slug
    return None


def _fetch_feed(feed: dict) -> Iterable[dict]:
    url = (
        f"https://www.pib.gov.in/ViewRss.aspx?reg={feed['reg']}&lang={feed['lang']}"
    )
    headers = {
        "User-Agent": settings.NOMINATIM_USER_AGENT,
        "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=12)
        if resp.status_code != 200 or not resp.content:
            log.warning("PIB feed %s: HTTP %s", url, resp.status_code)
            return []
        parsed = feedparser.parse(resp.content)
        return parsed.entries or []
    except requests.RequestException as e:
        log.warning("PIB feed %s failed: %s", url, e)
        return []


def _parse_published(entry) -> datetime:
    try:
        if getattr(entry, "published_parsed", None):
            return datetime(*entry.published_parsed[:6])
    except Exception:  # noqa: BLE001
        pass
    return datetime.utcnow()


def poll_all() -> dict:
    """Poll every PIB feed, save scheme-relevant items, return a summary dict."""
    db = SessionLocal()
    started = datetime.utcnow()
    rows_in = rows_new = 0
    try:
        for feed in PIB_FEEDS:
            entries = _fetch_feed(feed)
            for e in entries:
                rows_in += 1
                title = (getattr(e, "title", "") or "").strip()
                summary = (getattr(e, "summary", "") or "").strip()
                link = (getattr(e, "link", "") or "").strip()
                guid = (getattr(e, "id", "") or link).strip()
                if not (title and link and guid):
                    continue
                if not _looks_like_scheme(title, summary):
                    continue
                # Dedupe
                if db.query(PIBAnnouncement).filter(PIBAnnouncement.guid == guid).first():
                    continue
                matched = _match_scheme(db, title, summary)
                ann = PIBAnnouncement(
                    guid=guid,
                    title_en=title if feed["language"] == "en" else None,
                    title_hi=title if feed["language"] == "hi" else None,
                    summary=summary[:1500] if summary else None,
                    link=link,
                    ministry=feed["ministry"],
                    feed_id=feed["reg"],
                    language=feed["language"],
                    matched_scheme_slug=matched,
                    published_at=_parse_published(e),
                    fetched_at=datetime.utcnow(),
                )
                # If the row was a Hindi feed, fold into title_en for safe display
                if feed["language"] == "hi" and not ann.title_en:
                    ann.title_en = title
                db.add(ann)
                rows_new += 1
        db.commit()
        log.info("PIB poll: %d entries scanned, %d new scheme items", rows_in, rows_new)
        ilog = IngestLog(
            job_name="pib_poll",
            status="ok",
            rows_in=rows_in,
            rows_new=rows_new,
            started_at=started,
            finished_at=datetime.utcnow(),
        )
        db.add(ilog)
        db.commit()
        return {"ok": True, "rows_in": rows_in, "rows_new": rows_new}
    except Exception as e:  # noqa: BLE001
        db.rollback()
        log.exception("PIB poll failed: %s", e)
        ilog = IngestLog(
            job_name="pib_poll",
            status="error",
            rows_in=rows_in,
            rows_new=rows_new,
            detail=str(e)[:500],
            started_at=started,
            finished_at=datetime.utcnow(),
        )
        db.add(ilog)
        db.commit()
        return {"ok": False, "error": str(e), "rows_in": rows_in, "rows_new": rows_new}
    finally:
        db.close()


def list_recent(db, limit: int = 30) -> list[PIBAnnouncement]:
    return (
        db.query(PIBAnnouncement)
        .order_by(PIBAnnouncement.published_at.desc())
        .limit(limit)
        .all()
    )
