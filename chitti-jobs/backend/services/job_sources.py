"""
services/job_sources.py  —  BO4  (no scraping)
----------------------------------------------
Founder-approved sourcing (2026-06-23). NO Playwright, NO HTML scraping
(Naukri / Indeed / LinkedIn ToS). LinkedIn scraping is permanently out of
scope. Sources:

  (a) Naukri RSS feed   — naukri.com category RSS
  (b) Indeed RSS feed   — indeed.com RSS query
  (c) Manual paste      — user pastes a job URL + JD text; Chitti scores it.
                          This is the PRIMARY v1 path (RSS is best-effort:
                          if a publisher's feed is empty/blocked we say so
                          honestly and never fabricate listings).

Each ingested listing is written to jobs_raw PER USER (confirmed schema),
deduplicated on a normalised (title|company|location) key.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime
from urllib.parse import quote_plus

import requests
from sqlalchemy.orm import Session

from config import settings
from models.job_raw import JobRaw

log = logging.getLogger("services.job_sources")

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(s: str) -> str:
    return _TAG_RE.sub(" ", s or "").replace("&nbsp;", " ").strip()


def normalise_dedup_key(title: str, company: str, location: str) -> str:
    base = " ".join(x for x in (title, company, location) if x).lower()
    base = re.sub(r"[^a-z0-9 ]", "", base)
    base = re.sub(r"\s+", " ", base).strip()
    return base[:380]


def naukri_rss_url(query: str, location: str = "") -> str:
    q = quote_plus(query or "jobs")
    loc = quote_plus(location or "")
    # Naukri exposes RSS on its rss endpoint; query terms via path/qs.
    return f"https://www.naukri.com/rss/{q}-jobs" + (f"-in-{loc}" if loc else "")


def indeed_rss_url(query: str, location: str = "") -> str:
    q = quote_plus(query or "")
    loc = quote_plus(location or "")
    return f"https://in.indeed.com/rss?q={q}&l={loc}"


def fetch_rss(url: str, source: str, limit: int = 25) -> dict:
    """Best-effort RSS fetch. Returns {items[], error|None}. Never raises."""
    try:
        import feedparser  # lazy — keeps unit tests dependency-free
    except Exception as e:  # noqa: BLE001
        return {"items": [], "error": f"feedparser unavailable: {e}"}
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": settings.HTTP_USER_AGENT, "Accept": "*/*"},
            timeout=20,
            allow_redirects=True,
        )
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
    except Exception as e:  # noqa: BLE001 — honest per-source failure
        log.info("RSS fetch failed (%s): %s", source, e)
        return {"items": [], "error": str(e)[:160]}

    items = []
    for entry in (feed.entries or [])[:limit]:
        title = _strip_html(entry.get("title", ""))
        if not title:
            continue
        # Naukri/Indeed pack "Company - Location" patterns into title/author.
        company = _strip_html(entry.get("author", "")) or _company_from_title(title)
        summary = _strip_html(entry.get("summary", "") or entry.get("description", ""))
        posted = _parse_published(entry)
        items.append({
            "title": title,
            "company": company,
            "location": _location_from_summary(summary),
            "url": entry.get("link", ""),
            "jd_text": summary,
            "posted_at": posted,
            "source": source,
            "platform": source.replace("_rss", ""),
        })
    return {"items": items, "error": None}


def _company_from_title(title: str) -> str:
    # "Senior Engineer at Acme" / "Senior Engineer - Acme"
    m = re.search(r"\b(?:at|@|-)\s+([A-Z][\w&.,'’\- ]{2,60})$", title)
    return m.group(1).strip() if m else ""


def _location_from_summary(summary: str) -> str:
    m = re.search(r"(?:location|based in)[:\s]+([A-Za-z ,/]{2,40})", summary or "", re.I)
    return m.group(1).strip() if m else ""


def _parse_published(entry) -> datetime | None:
    for key in ("published_parsed", "updated_parsed"):
        t = entry.get(key)
        if t:
            try:
                return datetime(*t[:6])
            except (TypeError, ValueError):
                pass
    return None


def parse_manual(*, jd_text: str = "", url: str = "", title: str = "",
                 company: str = "", location: str = "") -> dict:
    """Manual-paste path (primary v1). The user pastes a JD (and optionally
    a URL/title). We never fetch the page (no scraping) — the JD text the
    user pasted is the source of truth for scoring + ATS."""
    jd_text = (jd_text or "").strip()
    if not title and jd_text:
        # first non-empty line is usually the role title
        first = next((l.strip() for l in jd_text.splitlines() if l.strip()), "")
        title = first[:200]
    if not title and url:
        title = re.sub(r"https?://(www\.)?", "", url)[:120]
    return {
        "title": title or "Pasted job",
        "company": company.strip(),
        "location": location.strip(),
        "url": url.strip(),
        "jd_text": jd_text,
        "posted_at": None,
        "source": "manual_paste",
        "platform": "manual",
    }


def ingest_items(db: Session, uid: str, items: list[dict]) -> int:
    """Insert listings into jobs_raw for a user, deduped per (uid, key)."""
    inserted = 0
    for it in items:
        key = normalise_dedup_key(it.get("title", ""), it.get("company", ""), it.get("location", ""))
        if not key:
            continue
        exists = (
            db.query(JobRaw)
            .filter(JobRaw.user_id == uid, JobRaw.dedup_key == key)
            .first()
        )
        if exists:
            continue
        db.add(JobRaw(
            user_id=uid,
            platform=it.get("platform"),
            title=it.get("title", "")[:300],
            company=(it.get("company") or "")[:240],
            location=(it.get("location") or "")[:200],
            url=(it.get("url") or "")[:800],
            jd_text=it.get("jd_text"),
            posted_at=it.get("posted_at"),
            dedup_key=key,
            source=it.get("source"),
            status="new",
        ))
        inserted += 1
    if inserted:
        db.commit()
    return inserted
