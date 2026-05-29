"""
🎖️ World Class Chitti Observability — Commando Discipline. Zero Excuses.

observability/jobs.py
=====================
APScheduler weekly cron — Friday 18:00 IST aggregation of feedback patterns
into the retrain queue for Sire's review.

Hooks into the existing chitti-shares APScheduler in services/scheduler.py.
Idempotent: each Friday run de-duplicates against existing pending rows for
the same (page, box_id, target_lang) tuple.
"""
from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Iterable
from zoneinfo import ZoneInfo

from sqlalchemy import func
from sqlalchemy.orm import Session

from database import SessionLocal
from observability.models import Alert, RetrainQueueItem, SlowOp

log = logging.getLogger("observability.jobs")
IST = ZoneInfo("Asia/Kolkata")


def aggregate_feedback_weekly() -> dict:
    """Run weekly (Fri 18:00 IST). Cluster 👎 patterns from the last 7 days
    into RetrainQueueItem rows for Sire's review.

    The 👍/👎 feedback itself lives in chitti-vaani's feedback table; until
    that is wired (Phase C cross-DB sync), this aggregates the observability
    alerts (Verification Agent breaches) which are a close proxy.
    """
    db: Session = SessionLocal()
    cutoff = datetime.utcnow() - timedelta(days=7)
    try:
        # Group failed alerts by (page, check_name) — these are translation
        # completeness misses, widget-attach misses, etc.
        rows = (db.query(Alert.page, Alert.check_name, func.count(Alert.id))
                .filter(Alert.ts >= cutoff, Alert.severity.in_(["degraded", "failed"]))
                .group_by(Alert.page, Alert.check_name)
                .having(func.count(Alert.id) >= 3)
                .all())
        added = 0
        for page, check_name, cnt in rows:
            # De-dupe: skip if a pending retrain row already exists for this
            # (page, box_id≈check_name) tuple.
            exists = (db.query(RetrainQueueItem)
                      .filter(RetrainQueueItem.page == page,
                              RetrainQueueItem.box_id == check_name,
                              RetrainQueueItem.status == "pending")
                      .first())
            if exists:
                exists.thumbs_down_count = (exists.thumbs_down_count or 0) + int(cnt)
                continue
            db.add(RetrainQueueItem(
                page=page,
                box_id=check_name,
                target_lang=None,
                thumbs_down_count=int(cnt),
                thumbs_up_count=0,
                sample_corrections=json.dumps([]),
                status="pending",
            ))
            added += 1
        db.commit()
        log.info("[obs.jobs] weekly aggregate: %d new retrain rows, %d updated",
                 added, len(rows) - added)
        return {"added": added, "groups": len(rows)}
    except Exception as e:
        log.exception("[obs.jobs] weekly aggregate failed: %s", e)
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def cleanup_closed_audits(max_age_hours: int = 24) -> dict:
    """Mark audits inactive after 24 h of silence. Tertiary cleanup, runs hourly."""
    db: Session = SessionLocal()
    cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
    try:
        from observability.models import AuditSession
        updated = (db.query(AuditSession)
                   .filter(AuditSession.last_seen_at < cutoff,
                           AuditSession.status == "active")
                   .update({"status": "closed"}, synchronize_session=False))
        db.commit()
        if updated:
            log.info("[obs.jobs] closed %d stale audits", updated)
        return {"closed": int(updated)}
    except Exception as e:
        log.exception("[obs.jobs] cleanup failed: %s", e)
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def register_jobs(scheduler) -> None:
    """Called from services/scheduler.py to register the observability cron jobs.

    Friday 18:00 IST = Friday 12:30 UTC. APScheduler trigger uses IST tz.
    """
    try:
        scheduler.add_job(
            aggregate_feedback_weekly,
            "cron",
            day_of_week="fri",
            hour=18,
            minute=0,
            timezone=IST,
            id="obs_weekly_aggregate",
            replace_existing=True,
        )
        scheduler.add_job(
            cleanup_closed_audits,
            "cron",
            minute=17,  # every hour at :17
            timezone=IST,
            id="obs_cleanup_audits",
            replace_existing=True,
        )
        log.info("[obs.jobs] registered weekly + hourly jobs")
    except Exception as e:
        log.exception("[obs.jobs] register failed: %s", e)
