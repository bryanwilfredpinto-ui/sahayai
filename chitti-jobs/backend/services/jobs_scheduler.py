"""
services/jobs_scheduler.py
--------------------------
APScheduler in-process cron (same proven pattern as chitti-government).

  daily_source_poll  — 07:00 IST: for every consenting user, run the
                       CEOS daily cycle (source → score → ATS). BO4 auto path.
  log_heartbeat      — 04:00 IST: heartbeat ingest_log row.

Idempotent (per-user dedup on jobs_raw), safe under a single Railway
replica. Disabled when SCHEDULER_ENABLED is false (e.g. unit tests).
"""
from __future__ import annotations

import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from config import settings
from database import SessionLocal
from models.ingest_log import IngestLog
from models.user import UserProfile
from services import memory_client, pipeline

log = logging.getLogger("services.jobs_scheduler")

_scheduler: BackgroundScheduler | None = None


def _job_daily_source_poll():
    db = SessionLocal()
    started = datetime.utcnow()
    total_new = users_done = 0
    try:
        users = db.query(UserProfile).filter(UserProfile.consent_basic == True).all()  # noqa: E712
        for u in users:
            try:
                profile = memory_client.get_profile(db, u.uid)
                if not profile.get("target_roles") and not profile.get("current_role"):
                    continue
                res = pipeline.run_daily_for_user(db, u.uid, profile)
                total_new += res["source"]["inserted"]
                users_done += 1
            except Exception as e:  # noqa: BLE001 — one user must not break the batch
                log.warning("daily poll failed for %s: %s", u.uid, e)
        db.add(IngestLog(
            job_name="daily_source_poll", status="ok",
            rows_in=users_done, rows_new=total_new,
            detail=f"{users_done} users, {total_new} new jobs",
            started_at=started, finished_at=datetime.utcnow(),
        ))
        db.commit()
        log.info("daily_source_poll: %d users, %d new jobs", users_done, total_new)
    except Exception as e:  # noqa: BLE001
        log.exception("daily_source_poll crashed: %s", e)
    finally:
        db.close()


def _job_heartbeat():
    db = SessionLocal()
    try:
        db.add(IngestLog(job_name="heartbeat", status="ok",
                         started_at=datetime.utcnow(), finished_at=datetime.utcnow()))
        db.commit()
    except Exception as e:  # noqa: BLE001
        log.warning("heartbeat failed: %s", e)
    finally:
        db.close()


def start() -> None:
    global _scheduler
    if not settings.SCHEDULER_ENABLED:
        log.info("scheduler disabled (SCHEDULER_ENABLED=false)")
        return
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    _scheduler.add_job(
        _job_daily_source_poll,
        CronTrigger(hour=settings.SOURCE_POLL_HOUR_IST, minute=0, timezone="Asia/Kolkata"),
        id="daily_source_poll", replace_existing=True,
    )
    _scheduler.add_job(
        _job_heartbeat,
        CronTrigger(hour=4, minute=0, timezone="Asia/Kolkata"),
        id="heartbeat", replace_existing=True,
    )
    _scheduler.start()
    log.info("scheduler started: daily poll at %02d:00 IST", settings.SOURCE_POLL_HOUR_IST)


def status() -> dict:
    if _scheduler is None:
        return {"running": False, "jobs": []}
    return {
        "running": _scheduler.running,
        "jobs": [{"id": j.id, "next_run": str(j.next_run_time)} for j in _scheduler.get_jobs()],
    }
