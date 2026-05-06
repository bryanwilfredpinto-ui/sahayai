"""
services/medupi_scheduler.py
----------------------------
In-process price-update scheduler. APScheduler in BackgroundScheduler
mode — runs INSIDE the FastAPI web service. Mirrors the chitti-shares
scheduler pattern (no external cron dependency).

Jobs:
  1. monthly_jan_aushadhi   — 1st of every month, 03:00 IST
  2. weekly_nppa            — Mondays, 04:00 IST
  3. daily_top100_brave     — every day, 02:00 IST
  4. cache_evict            — every day, 02:55 IST (cleans expired Brave cache)

Each job:
  - Logs start + end + outcome
  - Writes a row to `loader_runs` for the audit trail
  - Catches every exception so a single failure doesn't silence future runs

Toggle: SCHEDULER_ENABLED env var (default true). Set to "false" to skip
when running unit tests / tooling.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Callable, Optional
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from config import settings
from database import SessionLocal

log = logging.getLogger("medupi_scheduler")

IST = ZoneInfo("Asia/Kolkata")

_scheduler: Optional[BackgroundScheduler] = None


# ───── Audit trail helper ─────

def _record_run(source: str, status: str, *, upserted=0, skipped=0, errors=0,
                note: Optional[str] = None, started_at: Optional[datetime] = None) -> None:
    db = SessionLocal()
    try:
        from models.loader_run import LoaderRun
        row = LoaderRun(
            source=source,
            status=status,
            rows_upserted=int(upserted or 0),
            rows_skipped=int(skipped or 0),
            rows_errors=int(errors or 0),
            note=(note or "")[:2000],
            started_at=started_at or datetime.utcnow(),
            finished_at=datetime.utcnow(),
        )
        db.add(row)
        db.commit()
    except Exception as e:  # noqa: BLE001
        log.warning("loader_runs write failed: %s", e)
        try:
            db.rollback()
        except Exception:  # noqa: BLE001
            pass
    finally:
        db.close()


def _wrap(name: str, fn: Callable) -> Callable:
    """Wrap a job function: log start/end + write audit row + swallow exceptions."""
    def runner():
        started = datetime.utcnow()
        log.info("[scheduler] %s START", name)
        try:
            result = fn() or {}
            up = result.get("upserted") or result.get("matched") or 0
            sk = result.get("skipped") or 0
            er = result.get("errors") or 0
            note = result.get("note") or str(result)
            _record_run(name, "ok", upserted=up, skipped=sk, errors=er,
                        note=note, started_at=started)
            log.info("[scheduler] %s OK %s", name, result)
        except Exception as e:  # noqa: BLE001
            log.exception("[scheduler] %s FAILED: %s", name, e)
            _record_run(name, "failed", note=str(e)[:2000], started_at=started)
    runner.__name__ = f"job_{name}"
    return runner


# ───── Job bodies (lazy-import inside so import-cycle is impossible) ─────

def _job_jan_aushadhi_monthly() -> dict:
    """Download the BPPI monthly product list + upsert rows."""
    from scripts.auto_update import auto_jan_aushadhi
    return auto_jan_aushadhi()


def _job_nppa_weekly() -> dict:
    """Check NPPA for new ceiling-price notifications."""
    from scripts.auto_update import auto_nppa
    return auto_nppa()


def _job_top100_daily() -> dict:
    """Refresh top-100 most-searched medicines via Brave Search."""
    from services import medupi_brave_search, medupi_search_log
    db = SessionLocal()
    try:
        if not medupi_brave_search.is_configured():
            return {"note": "BRAVE_SEARCH_API_KEY missing — top100 refresh skipped"}
        top = medupi_search_log.top_n(db, 100)
        if not top:
            return {"note": "search_log empty — nothing to refresh"}
        upserted = 0
        errors = 0
        for entry in top:
            try:
                r = medupi_brave_search.fetch_live(db, entry["query"], refresh=True, limit=4)
                upserted += len(r.get("items") or [])
            except Exception as e:  # noqa: BLE001
                log.debug("top100 fetch failed for %s: %s", entry["query"], e)
                errors += 1
        return {"upserted": upserted, "errors": errors,
                "note": f"refreshed {len(top)} top-searched queries via Brave"}
    finally:
        db.close()


def _job_cache_evict() -> dict:
    """Drop expired Brave cache rows."""
    from services import medupi_brave_search
    db = SessionLocal()
    try:
        n = medupi_brave_search.evict_expired(db)
        return {"upserted": 0, "skipped": n, "note": f"evicted {n} expired cache rows"}
    finally:
        db.close()


# ───── Public API ─────

def start() -> None:
    """Idempotent start. Safe to call from FastAPI startup."""
    global _scheduler
    if not settings.SCHEDULER_ENABLED:
        log.info("scheduler disabled via SCHEDULER_ENABLED=false")
        return
    if _scheduler and _scheduler.running:
        log.info("scheduler already running")
        return

    sch = BackgroundScheduler(timezone=IST)

    sch.add_job(
        _wrap("monthly_jan_aushadhi", _job_jan_aushadhi_monthly),
        CronTrigger(day=1, hour=3, minute=0, timezone=IST),
        id="monthly_jan_aushadhi",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    sch.add_job(
        _wrap("weekly_nppa", _job_nppa_weekly),
        CronTrigger(day_of_week="mon", hour=4, minute=0, timezone=IST),
        id="weekly_nppa",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    sch.add_job(
        _wrap("daily_top100_brave", _job_top100_daily),
        CronTrigger(hour=2, minute=0, timezone=IST),
        id="daily_top100_brave",
        replace_existing=True,
        misfire_grace_time=1800,
    )
    sch.add_job(
        _wrap("cache_evict", _job_cache_evict),
        CronTrigger(hour=2, minute=55, timezone=IST),
        id="cache_evict",
        replace_existing=True,
        misfire_grace_time=600,
    )

    sch.start()
    _scheduler = sch
    jobs = [j.id for j in sch.get_jobs()]
    log.info("scheduler started — jobs: %s", jobs)


def stop() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        log.info("scheduler stopped")
    _scheduler = None


def status() -> dict:
    """Diagnostic endpoint payload — what's scheduled and when."""
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
    """
    Force a job to run immediately (operations panel use). Returns the
    job's audit row after completion.
    """
    if not _scheduler or not _scheduler.running:
        return {"ok": False, "error": "scheduler not running"}
    job = _scheduler.get_job(job_id)
    if not job:
        return {"ok": False, "error": f"unknown job: {job_id}"}
    try:
        job.func()
        return {"ok": True, "job_id": job_id}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "job_id": job_id, "error": str(e)}
