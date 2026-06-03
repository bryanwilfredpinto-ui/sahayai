"""
services/news_scheduler.py
--------------------------
APScheduler for chitti-news-ai. Rewritten 2026-05-23 per Sire's final spec:

  - rss_poll: every RSS_POLL_MINUTES (default 120 = 2 h)
  - trigger_now(): async enqueue via job.modify(next_run_time=now). NEVER
    runs the job inline in the request thread — gunicorn would SIGKILL the
    worker at --timeout 120 because fetching 8 sources can take 60-90 s
    (one source can be slow). Proven on chitti-news 2026-05-23.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import settings

log = logging.getLogger("news_scheduler")

IST = ZoneInfo("Asia/Kolkata")
_scheduler: Optional[BackgroundScheduler] = None


def _job_rss_poll() -> dict:
    """Fetch all sources, then IMMEDIATELY force-sync to Turso so articles
    survive Railway's per-deploy /tmp wipe. The default 60 s background
    sync is not fast enough — if a git push hits Railway within that window,
    every freshly-fetched article is lost (the local SQLite file goes
    away and the next boot re-syncs an article-less Turso). Sire incident
    2026-05-23: 3 consecutive deploys lost the feed; this is the fix."""
    from services import rss_fetcher
    from database import sync_now
    result = rss_fetcher.fetch_all()
    try:
        sync_now()
        log.info("[scheduler] forced Turso sync after fetch_all")
    except Exception as e:  # noqa: BLE001
        log.warning("[scheduler] forced Turso sync failed: %s", e)
    return result


def _job_streams_refresh() -> dict:
    """Re-ingest the 5 aggregator streams (cert / tool / job / scheme /
    roadmap) every 6 h. RemoteOK + HF Spaces + GitHub Trending refresh
    on this cadence; static manifests are upserted (idempotent) without
    duplicates. Always followed by a classification pass so new items
    surface in /api/news-ai/feed/<stream> immediately."""
    from services.streams_ingestor import ingest_all
    from services.profession_classifier import classify_unlabeled_stream_items
    ing = ingest_all()
    clf = classify_unlabeled_stream_items(limit=2000)
    return {"ingest": ing.get("total_landed"), "classify": clf.get("labels_persisted")}


def _job_classify_sweep() -> dict:
    """Hourly sweep: classify anything that landed via rss_poll or the
    streams_refresh but wasn't tagged yet (e.g. because the rule version
    changed). Rules-only — no LLM calls."""
    from services.profession_classifier import (
        classify_unlabeled_articles, classify_unlabeled_courses,
        classify_unlabeled_stream_items,
    )
    return {
        "articles": classify_unlabeled_articles(limit=2000).get("labels_persisted"),
        "courses":  classify_unlabeled_courses(limit=2000).get("labels_persisted"),
        "streams":  classify_unlabeled_stream_items(limit=2000).get("labels_persisted"),
    }


def _wrap(name, fn):
    def runner():
        log.info("[scheduler] %s START", name)
        try:
            res = fn() or {}
            log.info("[scheduler] %s OK %s", name, res)
        except Exception as e:  # noqa: BLE001
            log.exception("[scheduler] %s FAILED: %s", name, e)
    runner.__name__ = f"job_{name}"
    return runner


def start() -> None:
    global _scheduler
    if not settings.scheduler_enabled:
        log.info("scheduler disabled via SCHEDULER_ENABLED=false")
        return
    if _scheduler and _scheduler.running:
        return
    sch = BackgroundScheduler(timezone=IST)
    sch.add_job(
        _wrap("rss_poll", _job_rss_poll),
        IntervalTrigger(minutes=max(5, int(settings.rss_poll_minutes))),
        id="rss_poll",
        replace_existing=True,
        misfire_grace_time=600,
    )
    sch.add_job(
        _wrap("streams_refresh", _job_streams_refresh),
        IntervalTrigger(hours=6),
        id="streams_refresh",
        replace_existing=True,
        misfire_grace_time=1800,
    )
    sch.add_job(
        _wrap("classify_sweep", _job_classify_sweep),
        IntervalTrigger(hours=1),
        id="classify_sweep",
        replace_existing=True,
        misfire_grace_time=600,
    )
    sch.start()
    _scheduler = sch
    log.info("scheduler started — interval=%dm, jobs=%s",
             settings.rss_poll_minutes, [j.id for j in sch.get_jobs()])


def stop() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
    _scheduler = None


def status() -> dict:
    if not _scheduler or not _scheduler.running:
        return {"running": False, "jobs": []}
    return {
        "running": True,
        "tz": "Asia/Kolkata",
        "jobs": [
            {
                "id": j.id,
                "next_run": j.next_run_time.isoformat() if j.next_run_time else None,
                "trigger": str(j.trigger),
            }
            for j in _scheduler.get_jobs()
        ],
    }


def trigger_now(job_id: str) -> dict:
    """Enqueue the job to fire ASAP on the APScheduler background thread.
    Does NOT run inline in the request thread (gunicorn --timeout would
    SIGKILL a long fetch). Returns immediately."""
    if not _scheduler or not _scheduler.running:
        return {"ok": False, "error": "scheduler not running"}
    job = _scheduler.get_job(job_id)
    if not job:
        return {"ok": False, "error": f"unknown job: {job_id}"}
    try:
        job.modify(next_run_time=datetime.now(IST))
        return {"ok": True, "job_id": job_id, "enqueued": True}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "job_id": job_id, "error": str(e)}
