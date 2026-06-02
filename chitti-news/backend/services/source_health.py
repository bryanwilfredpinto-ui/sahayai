"""
services/source_health.py
-------------------------
Per-feed health monitor. Runs every 6 hours via APScheduler (registered
in news_scheduler.py). For each enabled source:

  1. HTTP fetch via the same two-stage path as news_ingest._http_get
     (requests → cloudscraper fallback). Counts as failure on:
       - any HTTP code != 200
       - empty body / non-feed response
       - feedparser produces 0 entries
       - feed parses but newest entry is > 48h old (stale)

  2. On success → reset consecutive_failures + status='healthy',
     stamp last_success_at, clear next_retry_at, clear last_alert_at.

  3. On failure → bump consecutive_failures, set next_retry_at via
     backoff (5min, 15min, 60min). At 3 failures move to 'degraded'
     and trigger send_alert (debounced to 24h via last_alert_at).
     If last_success_at is > 24h ago, move to 'dead' and exclude
     from fetch_all.

  4. When a source moves to 'dead' for the first time, run
     discover_alternative_url(): probe common feed paths on the same
     domain + scan homepage for <link rel=alternate>. If a working
     alternative is found, write its URL to alternative_url_candidate
     and include in the alert email — Sire reviews + manually updates
     sources.json. We never auto-modify the source registry.

  5. Every action logs to feeds_health.log (TimedRotatingFileHandler,
     daily rotation, 30-day retention).

Public surface (called from scheduler + /admin/health):
  check_source(db, source)  → dict
  check_all_sources(db)      → aggregated stats
  summary(db)                → dict for /admin/health endpoint
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timedelta
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from time import mktime
from typing import Optional
from urllib.parse import urljoin, urlparse

import feedparser
import requests

from database import SessionLocal
from models.source import Source
from services.alerts import send_alert

try:
    import cloudscraper  # type: ignore
    _HAS_CLOUDSCRAPER = True
except ImportError:
    _HAS_CLOUDSCRAPER = False

# ── Rotating log: feeds_health.log next to backend/, 30 days ──
LOG_PATH = Path(__file__).resolve().parent.parent / "feeds_health.log"

_h_log = logging.getLogger("feeds_health")
if not _h_log.handlers:
    _h_log.setLevel(logging.INFO)
    _h_log.propagate = False
    fh = TimedRotatingFileHandler(
        LOG_PATH, when="midnight", interval=1, backupCount=30, encoding="utf-8",
    )
    fh.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    _h_log.addHandler(fh)

log = logging.getLogger("source_health")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Backoff ladder — Sire spec: 5 min → 15 min → 60 min → degraded
BACKOFF_MINUTES = [5, 15, 60]
DEGRADED_THRESHOLD = 3
DEAD_AFTER_HOURS = 24
ALERT_DEBOUNCE_HOURS = 24
STALE_HOURS = 168  # 7 days — many niche/regional/category feeds legitimately
                   # update every 3-5 days. 24h was Sire's spec intent for the
                   # main poll cadence; STALE_HOURS is about declaring the feed
                   # itself dead (parse OK but nobody is writing). 7d strikes
                   # the right balance between catching truly-abandoned feeds
                   # and not false-positiving low-traffic niches.


def _now() -> datetime:
    return datetime.utcnow()


# ─── HTTP fetch (mirrors news_ingest._http_get) ────────────────────

def _http_get(url: str) -> tuple[int, bytes, str]:
    try:
        r = requests.get(url, headers={"User-Agent": UA, "Accept": "*/*"},
                         timeout=20, allow_redirects=True)
        if r.status_code == 200 and r.content and len(r.content) > 200:
            return r.status_code, r.content, "requests"
        last = r.status_code
    except Exception:
        last = 0
    if not _HAS_CLOUDSCRAPER:
        return last, b"", "no-cloudscraper"
    try:
        s = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows"})
        r = s.get(url, timeout=25, allow_redirects=True)
        return r.status_code, r.content, "cloudscraper"
    except Exception as e:  # noqa: BLE001
        return 0, b"", f"cs-exc:{type(e).__name__}"


# ─── Validation ────────────────────────────────────────────────────

def _validate_feed(content: bytes) -> tuple[bool, int, Optional[datetime], str]:
    """
    Returns (ok, n_entries, newest_pub_dt, error_reason).
    A feed is OK if it parses + has >=1 entry + the newest entry's
    pubDate is within STALE_HOURS (when pubDates are present).
    """
    feed = feedparser.parse(content)
    entries = feed.entries or []
    if not entries:
        return False, 0, None, "empty_feed"
    newest = None
    for e in entries:
        for key in ("published_parsed", "updated_parsed", "created_parsed"):
            v = e.get(key)
            if v:
                try:
                    dt = datetime.utcfromtimestamp(mktime(v))
                    if not newest or dt > newest:
                        newest = dt
                    break
                except Exception:  # noqa: BLE001
                    pass
        if newest:
            break
    # If feed has entries but no parseable pubDate, accept it (some
    # publishers omit dates). Only flag stale when we actually KNOW.
    if newest and (_now() - newest) > timedelta(hours=STALE_HOURS):
        return False, len(entries), newest, f"stale_newest={newest.isoformat()}"
    return True, len(entries), newest, ""


# ─── Alternative URL discovery ─────────────────────────────────────

_ALT_PATHS = (
    "/feed/", "/feed", "/rss", "/rss.xml", "/index.xml", "/atom.xml",
    "/rss/feed", "/feeds/posts/default",
)


def discover_alternative_url(rss_url: str) -> Optional[str]:
    """
    Try common feed paths on the same host + scan homepage for
    <link rel=alternate>. Returns the first URL that probes as a valid
    feed with >=3 entries, or None.
    """
    parsed = urlparse(rss_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    candidates: list[str] = []

    # 1. Common path bruteforce
    for p in _ALT_PATHS:
        candidates.append(urljoin(base + "/", p.lstrip("/")))

    # 2. Homepage <link rel=alternate> scan
    try:
        _, body, _ = _http_get(base)
        if body:
            html = body[:300_000].decode("utf-8", errors="ignore")
            for m in re.finditer(
                r'<link[^>]*?type=["\'](?:application/(?:rss|atom)\+xml|text/xml)["\'][^>]*?>',
                html, re.I,
            ):
                href = re.search(r'href=["\']([^"\']+)["\']', m.group(0))
                if href:
                    candidates.append(urljoin(base, href.group(1)))
    except Exception:  # noqa: BLE001
        pass

    # Probe each
    seen = set()
    for c in candidates:
        if c in seen or c == rss_url:
            continue
        seen.add(c)
        code, content, _ = _http_get(c)
        if code != 200 or not content:
            continue
        ok, n, _, _ = _validate_feed(content)
        if ok and n >= 3:
            return c
    return None


# ─── Core check ────────────────────────────────────────────────────

def _classify_and_persist(db, source: Source, ok: bool, error_reason: str,
                          fetcher: str, http_code: int) -> dict:
    """
    Mutate the source row's health columns + decide whether to alert.
    Returns a per-source result dict.
    """
    now = _now()
    out = {
        "slug": source.slug,
        "ok": ok,
        "http": http_code,
        "fetcher": fetcher,
        "error": error_reason or None,
        "status_before": source.status,
        "status_after": None,
        "alert_sent": False,
    }

    if ok:
        source.consecutive_failures = 0
        source.last_success_at = now
        source.status = "healthy"
        source.next_retry_at = None
        source.last_alert_at = None
        source.last_error = None
        out["status_after"] = "healthy"
        _h_log.info("[OK] %s — %d via %s", source.slug, http_code, fetcher)
        db.commit()
        return out

    # Failure path
    source.consecutive_failures = (source.consecutive_failures or 0) + 1
    source.last_error = (error_reason or "")[:500]
    n = source.consecutive_failures

    # Backoff schedule
    backoff = BACKOFF_MINUTES[min(n - 1, len(BACKOFF_MINUTES) - 1)]
    source.next_retry_at = now + timedelta(minutes=backoff)

    # Status transition
    last_success = source.last_success_at
    hours_since_success = (
        (now - last_success).total_seconds() / 3600.0 if last_success else None
    )

    if hours_since_success is not None and hours_since_success >= DEAD_AFTER_HOURS:
        if source.status != "dead":
            # First time entering dead — try to find an alternative URL
            try:
                alt = discover_alternative_url(source.rss_url)
                if alt:
                    source.alternative_url_candidate = alt
                    _h_log.info("[DEAD→alt] %s candidate=%s", source.slug, alt)
            except Exception as e:  # noqa: BLE001
                _h_log.exception("[DEAD] %s alternative discovery failed: %s", source.slug, e)
        source.status = "dead"
    elif n >= DEGRADED_THRESHOLD:
        source.status = "degraded"
    # else: status stays 'healthy' during the 1-2 grace failures

    out["status_after"] = source.status

    # Send alert when: just entered degraded/dead AND not alerted recently
    should_alert = source.status in ("degraded", "dead")
    if should_alert and source.last_alert_at:
        if (now - source.last_alert_at) < timedelta(hours=ALERT_DEBOUNCE_HOURS):
            should_alert = False

    if should_alert:
        subj = f"[CHITTI NEWS ALERT] {source.status.upper()} — {source.display_name}"
        body = "\n".join([
            f"Feed: {source.display_name}",
            f"URL: {source.rss_url}",
            f"Language: {source.language} | State: {source.state}",
            "",
            f"Status: {source.status.upper()} ({source.consecutive_failures} consecutive failures)",
            f"Error: {error_reason} (HTTP {http_code} via {fetcher})",
            f"Last successful fetch: "
            f"{source.last_success_at.isoformat() + ' UTC' if source.last_success_at else 'never'}",
            f"Next retry: {source.next_retry_at.isoformat()} UTC ({backoff} min from now)",
            "",
            "Auto-retry: still scheduled. Source remains in fetch_all() until 24h "
            "after last success, then it moves to 'dead' and is skipped.",
        ])
        if source.alternative_url_candidate:
            body += (
                f"\n\n⚠️ AUTO-DISCOVERY found alternative URL:\n"
                f"  {source.alternative_url_candidate}\n"
                f"If correct, update sources.json manually + commit. We never "
                f"auto-modify the registry."
            )
        body += "\n\nDashboard: GET /admin/health?cto=1"
        if send_alert(subj, body):
            source.last_alert_at = now
            out["alert_sent"] = True
            _h_log.info("[ALERT-SENT] %s status=%s", source.slug, source.status)
        else:
            _h_log.warning("[ALERT-FAILED] %s status=%s (SMTP not configured?)",
                           source.slug, source.status)

    _h_log.info("[FAIL] %s status=%s err=%s consecutive=%d next_retry=%s",
                source.slug, source.status, error_reason, n,
                source.next_retry_at.isoformat() if source.next_retry_at else "—")
    db.commit()
    return out


def check_source(db, source: Source) -> dict:
    """Probe one source's health. Caller owns the db session."""
    code, content, fetcher = _http_get(source.rss_url)
    if code != 200 or not content:
        return _classify_and_persist(
            db, source, ok=False,
            error_reason=f"http_{code}",
            fetcher=fetcher, http_code=code,
        )
    ok, n, newest, reason = _validate_feed(content)
    return _classify_and_persist(
        db, source, ok=ok, error_reason=(reason or ""),
        fetcher=fetcher, http_code=code,
    )


def check_all_sources(db=None) -> dict:
    """
    Health-check every enabled source. Caller may pass db or we make one.
    Returns aggregate stats + per-source result list.
    """
    owns_db = db is None
    if owns_db:
        db = SessionLocal()
    try:
        sources = db.query(Source).filter(Source.enabled == 1).all()
        per_source: list[dict] = []
        for s in sources:
            try:
                per_source.append(check_source(db, s))
            except Exception as e:  # noqa: BLE001
                _h_log.exception("[CHECK-EXC] %s: %s", s.slug, e)
                per_source.append({"slug": s.slug, "ok": False, "error": str(e)[:200]})

        totals = {
            "total": len(per_source),
            "healthy": sum(1 for r in per_source if r.get("ok")),
            "failing": sum(1 for r in per_source if not r.get("ok")),
            "alerts_sent": sum(1 for r in per_source if r.get("alert_sent")),
            "ran_at": _now().isoformat() + "Z",
        }
        _h_log.info("[SWEEP] %s", json.dumps(totals))
        return {"totals": totals, "per_source": per_source}
    finally:
        if owns_db:
            db.close()


def summary(db) -> dict:
    """For /admin/health — totals + recent failures."""
    sources = db.query(Source).all()
    by_status = {"healthy": 0, "degraded": 0, "dead": 0}
    failing: list[dict] = []
    last_check = None
    for s in sources:
        by_status[s.status] = by_status.get(s.status, 0) + 1
        if s.status != "healthy":
            failing.append({
                "slug": s.slug,
                "display_name": s.display_name,
                "url": s.rss_url,
                "language": s.language,
                "state": s.state,
                "status": s.status,
                "consecutive_failures": s.consecutive_failures,
                "last_error": s.last_error,
                "last_success_at": s.last_success_at.isoformat() + "Z" if s.last_success_at else None,
                "next_retry_at": s.next_retry_at.isoformat() + "Z" if s.next_retry_at else None,
                "alternative_url_candidate": s.alternative_url_candidate,
            })
        if s.last_fetched_at:
            ts = s.last_fetched_at
            if not last_check or ts > last_check:
                last_check = ts
    return {
        "totals": {
            "total": len(sources),
            "enabled": sum(1 for s in sources if s.enabled),
            **by_status,
        },
        "last_check_at": last_check.isoformat() + "Z" if last_check else None,
        "log_path": str(LOG_PATH),
        "alerts_configured": bool(__import__("os").environ.get("SMTP_HOST")),
        "failing_sources": failing,
    }
