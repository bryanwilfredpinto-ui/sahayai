"""
services/government_scheduler.py
--------------------------------
APScheduler kicks off three recurring jobs:

  - pib_poll               every PIB_POLL_HOURS (default 6 h)
  - cleanup_old_pib        daily 03:00 IST — drop announcements older than 90 days
  - log_heartbeat          daily 04:00 IST — write a heartbeat ingest_log row

Why in-process: Render free tier doesn't include a managed cron, and
chitti-medupi already proved this pattern works under gunicorn (one
instance per worker — APScheduler's MemoryJobStore is per-process,
which is fine here because every job is idempotent).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from config import settings
from database import SessionLocal
from models.ingest_log import IngestLog
from models.pib_announcement import PIBAnnouncement
from services import government_pib

log = logging.getLogger("services.government_scheduler")

_scheduler: BackgroundScheduler | None = None


def _job_pib_poll():
    log.info("scheduler: running pib_poll")
    government_pib.poll_all()


def _job_cleanup_old_pib():
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=90)
        n = (
            db.query(PIBAnnouncement)
            .filter(PIBAnnouncement.published_at < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        log.info("scheduler: cleanup_old_pib deleted %d rows", n)
        db.add(IngestLog(
            job_name="cleanup_old_pib",
            status="ok",
            rows_in=n,
            rows_new=0,
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
        ))
        db.commit()
    except Exception as e:  # noqa: BLE001
        db.rollback()
        log.exception("cleanup_old_pib failed: %s", e)
    finally:
        db.close()


def _job_heartbeat():
    db = SessionLocal()
    try:
        db.add(IngestLog(
            job_name="heartbeat",
            status="ok",
            rows_in=0,
            rows_new=0,
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
        ))
        db.commit()
    finally:
        db.close()


def start():
    global _scheduler
    if not settings.SCHEDULER_ENABLED:
        log.info("scheduler disabled via SCHEDULER_ENABLED=false")
        return
    if _scheduler is not None:
        return
    sch = BackgroundScheduler(timezone="Asia/Kolkata")
    sch.add_job(
        _job_pib_poll,
        IntervalTrigger(hours=settings.PIB_POLL_HOURS),
        id="pib_poll",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        next_run_time=datetime.utcnow() + timedelta(seconds=45),
    )
    sch.add_job(
        _job_cleanup_old_pib,
        CronTrigger(hour=3, minute=0),
        id="cleanup_old_pib",
        replace_existing=True,
    )
    sch.add_job(
        _job_heartbeat,
        CronTrigger(hour=4, minute=0),
        id="heartbeat",
        replace_existing=True,
    )
    sch.start()
    _scheduler = sch
    log.info(
        "scheduler started: pib_poll every %d h, cleanup 03:00 IST, heartbeat 04:00 IST",
        settings.PIB_POLL_HOURS,
    )


def status() -> dict:
    if _scheduler is None:
        return {"running": False, "jobs": []}
    jobs = []
    for j in _scheduler.get_jobs():
        jobs.append({
            "id": j.id,
            "next_run_time": j.next_run_time.isoformat() if j.next_run_time else None,
            "trigger": str(j.trigger),
        })
    return {"running": True, "jobs": jobs}
