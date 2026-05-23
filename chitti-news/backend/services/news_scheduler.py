"""
services/news_scheduler.py
--------------------------
APScheduler — same pattern as chitti-medupi/services/medupi_scheduler.py.

Jobs (Asia/Kolkata):
  rss_poll           — every RSS_POLL_MINUTES (default 30) → fetch all sources
  daily_breaking     — every day, 06:00 IST → recompute breaking-news ribbon
  daily_prune        — every day, 03:00 IST → drop articles older than 90 days
                        (already done inside fetch_all, but a safety net)
  factcheck_sweep    — every 15 min → score un-factchecked recent articles
                        so the feed card always carries a verdict badge
                        (P0 2026-05-13)
"""
from __future__ import annotations

import logging
from typing import Optional
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from config import settings

log = logging.getLogger("news_scheduler")

IST = ZoneInfo("Asia/Kolkata")
_scheduler: Optional[BackgroundScheduler] = None


def _job_rss_poll() -> dict:
    from services import news_ingest
    return news_ingest.fetch_all()


def _job_factcheck_sweep() -> dict:
    """
    P0 2026-05-13 — guarantee every visible article has a verdict badge.
    Walks recent articles missing a FactCheck row and computes one.
    Cheap (in-DB title similarity, no LLM, no network).
    """
    from database import SessionLocal
    from services import news_factcheck
    db = SessionLocal()
    try:
        return news_factcheck.sweep_unchecked(db, limit=80, lookback_hours=24)
    finally:
        db.close()


def _job_breaking() -> dict:
    """Recompute the breaking-news ribbon from the last 4 hours of articles."""
    from datetime import datetime, timedelta
    from sqlalchemy import desc
    from rapidfuzz import fuzz
    from database import SessionLocal
    from models.article import Article
    from models.breaking_alert import BreakingAlert

    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=4)
        recent = (
            db.query(Article)
            .filter(Article.fetched_at >= cutoff)
            .order_by(desc(Article.fetched_at))
            .limit(200).all()
        )
        # Group by similar title; ≥3 distinct sources = breaking
        clusters: dict[str, dict] = {}
        for a in recent:
            placed = False
            for key in list(clusters):
                if fuzz.token_set_ratio((key or "").lower(), (a.title or "").lower()) >= 75:
                    clusters[key]["sources"].add(a.source_slug)
                    clusters[key]["articles"].append(a)
                    placed = True
                    break
            if not placed:
                clusters[a.title] = {"sources": {a.source_slug}, "articles": [a]}

        # Insert alerts that don't already exist within the active window
        now = datetime.utcnow()
        expires = now + timedelta(hours=4)
        # Clear stale
        db.query(BreakingAlert).filter(BreakingAlert.expires_at <= now).delete()
        inserted = 0
        for headline, c in clusters.items():
            if len(c["sources"]) < 3:
                continue
            existing = (
                db.query(BreakingAlert)
                .filter(
                    BreakingAlert.headline == headline,
                    BreakingAlert.expires_at > now,
                )
                .first()
            )
            if existing:
                existing.sources_count = len(c["sources"])
                continue
            article = c["articles"][0]
            alert = BreakingAlert(
                headline=headline[:400],
                article_id=article.id,
                state=article.state,
                language=article.language,
                sources_count=len(c["sources"]),
                expires_at=expires,
            )
            db.add(alert); inserted += 1
        db.commit()
        return {"clusters_examined": len(clusters), "alerts_inserted": inserted}
    finally:
        db.close()


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
    if not settings.SCHEDULER_ENABLED:
        log.info("scheduler disabled via SCHEDULER_ENABLED=false")
        return
    if _scheduler and _scheduler.running:
        return
    sch = BackgroundScheduler(timezone=IST)
    sch.add_job(
        _wrap("rss_poll", _job_rss_poll),
        IntervalTrigger(minutes=max(5, int(settings.RSS_POLL_MINUTES))),
        id="rss_poll",
        replace_existing=True,
        misfire_grace_time=600,
    )
    sch.add_job(
        _wrap("daily_breaking", _job_breaking),
        CronTrigger(hour=6, minute=0, timezone=IST),
        id="daily_breaking",
        replace_existing=True,
        misfire_grace_time=1800,
    )
    sch.add_job(
        _wrap("factcheck_sweep", _job_factcheck_sweep),
        IntervalTrigger(minutes=15),
        id="factcheck_sweep",
        replace_existing=True,
        misfire_grace_time=600,
    )
    sch.start()
    _scheduler = sch
    log.info("scheduler started — jobs: %s", [j.id for j in sch.get_jobs()])


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
    Does NOT run inline in the request thread — gunicorn's 30 s default
    timeout would otherwise SIGKILL a long-running job like rss_poll
    (99 RSS sources × ~5 s = ~8 min). After this returns, poll
    `/scheduler/status` for the updated next_run, or hit the feed
    endpoint to see new articles appear.
    """
    from datetime import datetime
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
