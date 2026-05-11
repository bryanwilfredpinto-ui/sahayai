"""
services/admin_scheduler.py
---------------------------
Monthly keep-alive scheduler for product Gmail accounts.

Why a keep-alive: Google revokes refresh_tokens that haven't been used
for ~6 months (and OAuth-test-mode tokens are revoked at 7 days). A
once-a-month send-self email exercises the refresh path AND the send
scope, keeping the grant warm.

Pattern mirrors chitti-medupi/services/medupi_scheduler.py:
APScheduler BackgroundScheduler running INSIDE the gunicorn web worker
— no separate Render cron service ($1/mo each, free-tier-hostile).

Idempotency under multi-worker gunicorn:
  We DO NOT run a leader election. With `--workers 2`, both workers
  start the scheduler. The job body itself is idempotent: each account
  is skipped if its `last_keep_alive_at` is in the current calendar
  month. Worst case: two near-simultaneous sends in the rare race
  window — Gmail accepts the duplicate, no harm done.

Schedule (configurable):
  ADMIN_KEEPALIVE_DAY    = 1     (1st of month)
  ADMIN_KEEPALIVE_HOUR   = 6     (06:00 IST)
  ADMIN_KEEPALIVE_MINUTE = 0
  ADMIN_NOTIFY_EMAIL     = sire@gmail.com   (recipient of every keep-alive)
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from services import admin_oauth
from services.admin_db import ProductGmailAccount, log_action, session

log = logging.getLogger("admin_scheduler")

IST = ZoneInfo("Asia/Kolkata")
_scheduler: Optional[BackgroundScheduler] = None


def _notify_email() -> str:
    return (os.environ.get("ADMIN_NOTIFY_EMAIL") or "sire@gmail.com").strip()


def _is_same_calendar_month(a: Optional[datetime], b: datetime) -> bool:
    if not a:
        return False
    a = a if a.tzinfo else a.replace(tzinfo=timezone.utc)
    return a.year == b.year and a.month == b.month


def _keep_alive_one(product_id: int, *, force: bool = False) -> dict:
    """Send the keep-alive for one product. Idempotent unless force=True."""
    notify = _notify_email()
    now_utc = datetime.now(tz=timezone.utc)

    with session() as s:
        row = s.get(ProductGmailAccount, product_id)
        if not row:
            return {"ok": False, "error": "product_not_found"}
        if row.oauth_status != "connected":
            log_action(product_id, "keepalive_fail", "fail",
                       f"skipped: oauth_status={row.oauth_status}")
            return {"ok": False, "error": f"oauth_{row.oauth_status}", "skipped": True}
        if not force and _is_same_calendar_month(row.last_keep_alive_at, now_utc):
            return {"ok": True, "skipped": True, "reason": "already_sent_this_month"}
        product_name  = row.product_name
        gmail_address = row.gmail_address

    subject = f"[Sahay AI] Keep-alive ping — {product_name}"
    body = (
        f"This is the monthly keep-alive ping for {product_name} ({gmail_address}).\n\n"
        f"Sent automatically by the Sahay AI admin scheduler at "
        f"{now_utc.isoformat(timespec='seconds')} UTC to keep Google's OAuth refresh "
        f"token warm. No action required.\n\n"
        f"— Sahay AI admin"
    )

    res = admin_oauth.send_email(product_id, notify, subject, body)
    ok = bool(res.get("ok"))

    with session() as s2:
        row2 = s2.get(ProductGmailAccount, product_id)
        if row2:
            row2.last_keep_alive_at  = now_utc
            row2.last_keep_alive_ok  = 1 if ok else 0
            row2.last_keep_alive_msg = (
                f"sent message_id={res.get('message_id')}" if ok
                else f"FAIL: {res.get('error')}: {res.get('detail') or ''}"
            )[:500]

    log_action(
        product_id,
        "keepalive_ok" if ok else "keepalive_fail",
        "ok" if ok else "fail",
        f"to={notify} from={gmail_address} message_id={res.get('message_id')}" if ok
        else f"error={res.get('error')} detail={res.get('detail')}",
    )
    return res


def run_keep_alive_all(*, force: bool = False) -> dict:
    """Iterate every product and try the keep-alive. Used by both the cron job and the manual 'run-all' button."""
    started = datetime.now(tz=timezone.utc)
    summary = {"started_at": started.isoformat(), "ok": 0, "fail": 0, "skipped": 0, "results": []}

    with session() as s:
        ids = [r.id for r in s.query(ProductGmailAccount).order_by(ProductGmailAccount.id).all()]

    for pid in ids:
        try:
            r = _keep_alive_one(pid, force=force)
        except Exception as e:  # noqa: BLE001
            log.exception("keep-alive crashed for product %s", pid)
            r = {"ok": False, "error": str(e)[:200]}
            log_action(pid, "keepalive_fail", "fail", f"exception: {e}")

        if r.get("skipped"):
            summary["skipped"] += 1
        elif r.get("ok"):
            summary["ok"] += 1
        else:
            summary["fail"] += 1
        summary["results"].append({"product_id": pid, **r})

    summary["finished_at"] = datetime.now(tz=timezone.utc).isoformat()
    log.info("keep-alive run: %s", {k: v for k, v in summary.items() if k != "results"})
    return summary


def run_keep_alive_one(product_id: int, *, force: bool = True) -> dict:
    """Single-product trigger — the dashboard's [Test Keep-Alive] button calls this. Default force=True."""
    return _keep_alive_one(product_id, force=force)


def start() -> None:
    """Idempotent. Safe to call from main.py at boot."""
    global _scheduler
    if os.environ.get("ADMIN_SCHEDULER_ENABLED", "true").lower() in ("0", "false", "no"):
        log.info("admin scheduler disabled via ADMIN_SCHEDULER_ENABLED=false")
        return
    if _scheduler and _scheduler.running:
        return

    day    = int(os.environ.get("ADMIN_KEEPALIVE_DAY", "1"))
    hour   = int(os.environ.get("ADMIN_KEEPALIVE_HOUR", "6"))
    minute = int(os.environ.get("ADMIN_KEEPALIVE_MINUTE", "0"))

    sch = BackgroundScheduler(timezone=IST)
    sch.add_job(
        run_keep_alive_all,
        CronTrigger(day=day, hour=hour, minute=minute, timezone=IST),
        id="monthly_keepalive_all",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    sch.start()
    _scheduler = sch
    log.info("admin scheduler started — monthly keep-alive at IST day=%s %02d:%02d", day, hour, minute)


def stop() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        log.info("admin scheduler stopped")
    _scheduler = None


def status() -> dict:
    """Diagnostic payload — used by the dashboard to show 'Next scheduled run'."""
    if not _scheduler or not _scheduler.running:
        return {"running": False, "jobs": []}
    return {
        "running": True,
        "tz": "Asia/Kolkata",
        "notify_email": _notify_email(),
        "jobs": [
            {
                "id": j.id,
                "next_run": j.next_run_time.isoformat() if j.next_run_time else None,
                "trigger": str(j.trigger),
            }
            for j in _scheduler.get_jobs()
        ],
    }