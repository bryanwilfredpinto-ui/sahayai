"""
services/feedback_scheduler.py
------------------------------
Daily 6:00 AM IST run that:
  1. invokes feedback_db.daily_report() (which also marks junk rows in-place)
  2. caches the report payload in module memory so the admin dashboard
     can show "as of last run" without re-scoring
  3. (optional) emails the report to ADMIN_NOTIFY_EMAIL using the existing
     admin_oauth Gmail send path, if a chittinews-style product mailbox
     is connected.

Same APScheduler pattern as admin_scheduler.py — runs inside the gunicorn
web worker; idempotent under multi-worker.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from services import feedback_db

log = logging.getLogger("feedback_scheduler")

IST = ZoneInfo("Asia/Kolkata")
_scheduler: Optional[BackgroundScheduler] = None
_last_report: Optional[dict] = None
_last_run_at: Optional[datetime] = None


def last_report() -> dict:
    """Return the most recently generated report, or run one on the fly if none yet."""
    global _last_report, _last_run_at
    if _last_report is None:
        _last_report = feedback_db.daily_report(lookback_hours=24)
        _last_run_at = datetime.now(tz=timezone.utc)
    return _last_report


def run_daily_report(*, lookback_hours: int = 24) -> dict:
    """Generate a fresh report and cache it. Called by the scheduler and by the admin 'Run now' button."""
    global _last_report, _last_run_at
    report = feedback_db.daily_report(lookback_hours=lookback_hours)
    _last_report = report
    _last_run_at = datetime.now(tz=timezone.utc)

    # Best-effort email to Sire — never blocks the report cache update.
    try:
        _email_report_if_configured(report)
    except Exception as e:  # noqa: BLE001
        log.warning("daily report email skipped: %s", e)

    log.info(
        "feedback daily report: total=%s top=%s removed(1word/imp/dup)=%s/%s/%s",
        report.get("total_feedback_collected_all_time"),
        len(report.get("top_suggestions") or []),
        report.get("removed_one_word"),
        report.get("removed_impossible"),
        report.get("removed_duplicate"),
    )
    return report


def _email_report_if_configured(report: dict) -> None:
    notify = (os.environ.get("ADMIN_NOTIFY_EMAIL") or "").strip()
    if not notify:
        return
    try:
        from services import admin_oauth
        from services.admin_db import ProductGmailAccount, session
    except Exception:
        return  # admin module not available — skip silently in dev

    with session() as s:
        # Pick any connected product mailbox to send from. chittinews@gmail.com is the canonical one.
        row = (
            s.query(ProductGmailAccount)
            .filter(ProductGmailAccount.oauth_status == "connected")
            .order_by(ProductGmailAccount.id)
            .first()
        )
        pid = row.id if row else None

    if not pid:
        log.info("no connected product mailbox — daily feedback email skipped")
        return

    subject = "[Sahay AI] Daily feedback report — top 3 suggestions"
    body = _format_report_body(report)
    res = admin_oauth.send_email(pid, notify, subject, body)
    if not res.get("ok"):
        log.warning("daily report email failed: %s", res)


def _format_report_body(report: dict) -> str:
    lines = []
    lines.append(f"Daily Chitti feedback report — generated {report.get('generated_at')}")
    lines.append(f"Lookback: {report.get('lookback_hours')}h")
    lines.append(f"Total feedback (all-time): {report.get('total_feedback_collected_all_time')}")
    lines.append("")
    lines.append("=== TOP 3 SUGGESTIONS ===")
    for i, s in enumerate(report.get("top_suggestions") or [], 1):
        lines.append(
            f"{i}. [{s['page']}] score={s['score']} freq={s['frequency']} "
            f"segment={s['user_segment']}"
        )
        lines.append(f"   {s['text']}")
        if s.get("emails"):
            lines.append(f"   reply-to: {', '.join(s['emails'])}")
        lines.append("")
    lines.append("=== 👍 / 👎 BY PAGE (window) ===")
    for t in report.get("thumbs_counts_window") or []:
        lines.append(f"  {t['page']:<28} 👍 {t['thumbs_up']:<4} 👎 {t['thumbs_down']}")
    lines.append("")
    lines.append("=== JUNK FILTERED ===")
    lines.append(f"  one-word:    {report.get('removed_one_word')}")
    lines.append(f"  impossible:  {report.get('removed_impossible')}")
    lines.append(f"  duplicate:   {report.get('removed_duplicate')} (kept as frequency)")
    return "\n".join(lines)


def start() -> None:
    global _scheduler
    if os.environ.get("FEEDBACK_SCHEDULER_ENABLED", "true").lower() in ("0", "false", "no"):
        log.info("feedback scheduler disabled via env")
        return
    if _scheduler and _scheduler.running:
        return

    hour   = int(os.environ.get("FEEDBACK_REPORT_HOUR", "6"))
    minute = int(os.environ.get("FEEDBACK_REPORT_MINUTE", "0"))

    sch = BackgroundScheduler(timezone=IST)
    sch.add_job(
        run_daily_report,
        CronTrigger(hour=hour, minute=minute, timezone=IST),
        id="daily_feedback_report",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    sch.start()
    _scheduler = sch
    log.info("feedback scheduler started — daily report at IST %02d:%02d", hour, minute)


def stop() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
    _scheduler = None


def status() -> dict:
    return {
        "running": bool(_scheduler and _scheduler.running),
        "tz": "Asia/Kolkata",
        "last_run_at": _last_run_at.isoformat() if _last_run_at else None,
        "jobs": [
            {
                "id": j.id,
                "next_run": j.next_run_time.isoformat() if j.next_run_time else None,
                "trigger": str(j.trigger),
            }
            for j in (_scheduler.get_jobs() if (_scheduler and _scheduler.running) else [])
        ],
    }
