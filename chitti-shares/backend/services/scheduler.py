"""
services/scheduler.py
---------------------
In-process scheduler using APScheduler. Replaces external cron jobs.

Runs INSIDE the FastAPI web service. Whenever the web service is awake,
the scheduler is awake. When the dyno sleeps (free tier, no traffic for
15 min), the scheduler also sleeps - which is FINE because no users are
hitting the app anyway, so there's nothing to alert about.

Trade-off vs external cron:
  PRO: Zero external dependencies, zero monthly cost, zero setup work
  PRO: Same Render dyno hosts everything
  CON: If dyno is asleep at exactly the moment an alert should fire,
       it fires when the next user request wakes the dyno (could be
       a few minutes late). For retail trading alerts checking every
       5 min anyway, this is acceptable slop.
  CON: If the dyno is sleeping all day with no users, alerts won't fire.
       Can be solved later with a free uptime pinger like uptimerobot.com
       (1 line of setup) when you want guaranteed uptime.

Three jobs:
  1. Alerts checker      - every 5 min during 9:15-15:30 IST Mon-Fri
  2. Call-report tracker - every 5 min during market hours
  3. Kite re-auth ping   - daily at 5:55 AM IST (skipped if DATA_SOURCE=yahoo)
"""

import logging
from datetime import datetime, time
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from config import settings
from database import SessionLocal

log = logging.getLogger("scheduler")

IST = ZoneInfo("Asia/Kolkata")

_scheduler: BackgroundScheduler | None = None


def is_market_hours() -> bool:
    """NSE: Mon-Fri 09:15-15:30 IST."""
    now = datetime.now(IST)
    if now.weekday() >= 5:
        return False
    return time(9, 15) <= now.time() <= time(15, 30)


def _job_alerts():
    """Run alert checker (only during market hours)."""
    if not is_market_hours():
        return
    log.info("[scheduler] alerts: running")
    db = SessionLocal()
    try:
        # Late import to avoid circular-import issues on startup
        from routes.portfolio import run_alert_check
        result = run_alert_check(db)
        log.info("[scheduler] alerts: %s", result)
    except Exception as e:
        log.exception("[scheduler] alerts failed: %s", e)
    finally:
        db.close()


def _job_track_calls():
    """Refresh open call reports (only during market hours)."""
    if not is_market_hours():
        return
    log.info("[scheduler] track_calls: running")
    db = SessionLocal()
    try:
        from datetime import datetime as dt
        from models.stock import CallReport
        from services.data_source import (
            DataSourceAuthError, DataSourceError, get_quote,
        )

        open_rows = db.query(CallReport).filter(CallReport.status == "open").all()
        if not open_rows:
            return

        symbols = list({r.symbol for r in open_rows})
        try:
            quotes = get_quote(symbols, db=db)
        except (DataSourceAuthError, DataSourceError) as e:
            log.warning("[scheduler] track_calls quote fail: %s", e)
            return

        now = dt.utcnow()
        for r in open_rows:
            q = quotes.get(r.symbol) or {}
            last = q.get("last_price")
            if last is None:
                continue
            r.last_price = last
            r.last_updated_at = now
            if r.high_seen is None or last > r.high_seen:
                r.high_seen = last
            if r.low_seen is None or last < r.low_seen:
                r.low_seen = last
            if r.call_type == "BUY":
                if r.target and last >= r.target:
                    r.status = "target_hit"; r.closed_price = last; r.closed_at = now
                elif r.stop_loss and last <= r.stop_loss:
                    r.status = "sl_hit"; r.closed_price = last; r.closed_at = now
            elif r.call_type == "SELL":
                if r.target and last <= r.target:
                    r.status = "target_hit"; r.closed_price = last; r.closed_at = now
                elif r.stop_loss and last >= r.stop_loss:
                    r.status = "sl_hit"; r.closed_price = last; r.closed_at = now
        db.commit()
        log.info("[scheduler] track_calls: updated %d open calls", len(open_rows))
    except Exception as e:
        log.exception("[scheduler] track_calls failed: %s", e)
    finally:
        db.close()


def _job_kite_reauth():
    """Skip silently when DATA_SOURCE != kite. Otherwise, send Telegram nudge."""
    if (settings.DATA_SOURCE or "").lower() != "kite":
        return
    log.info("[scheduler] kite_reauth: checking")
    db = SessionLocal()
    try:
        from models.kite_token import KiteToken
        row = db.query(KiteToken).filter(KiteToken.id == 1).first()
        needs = False
        reason = ""
        if not row or not row.access_token:
            needs = True; reason = "no Kite token saved"
        else:
            age = (datetime.utcnow() - row.created_at).total_seconds() / 3600
            if age > 22:
                needs = True; reason = f"token is {age:.1f}h old"
        if not needs:
            return
        if not (settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID):
            log.warning("[scheduler] kite_reauth needed but Telegram not configured: %s", reason)
            return
        import httpx
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        msg = (
            f"🔔 Chitti Shares: Kite re-auth needed.\n"
            f"Reason: {reason}\n"
            f"Visit https://chitti-shares-api-production.up.railway.app/api/market/auth-url"
        )
        with httpx.Client(timeout=10.0) as c:
            c.post(url, json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": msg})
        log.info("[scheduler] kite_reauth Telegram sent")
    except Exception as e:
        log.exception("[scheduler] kite_reauth failed: %s", e)
    finally:
        db.close()


def start():
    """Start the scheduler. Idempotent - safe to call repeatedly."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        log.info("[scheduler] already running")
        return
    sch = BackgroundScheduler(timezone=IST, daemon=True)

    # Every 5 min, all the time. Job itself checks market hours.
    sch.add_job(
        _job_alerts,
        CronTrigger(minute="*/5", timezone=IST),
        id="alerts", replace_existing=True, max_instances=1,
    )
    sch.add_job(
        _job_track_calls,
        CronTrigger(minute="*/5", timezone=IST),
        id="track_calls", replace_existing=True, max_instances=1,
    )
    # Daily 5:55 AM IST
    sch.add_job(
        _job_kite_reauth,
        CronTrigger(hour=5, minute=55, timezone=IST),
        id="kite_reauth", replace_existing=True, max_instances=1,
    )

    sch.start()
    _scheduler = sch
    log.info("[scheduler] started: 3 jobs registered")


def stop():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        log.info("[scheduler] stopped")
