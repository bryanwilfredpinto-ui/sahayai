"""
APScheduler crons for chitti-news-ai-api.

Cadence (locked):
  - RSS poll: every RSS_POLL_MINUTES (default 360 = 6h)
  - Trust recompute: Sunday TRUST_RECOMPUTE_HOUR_IST (default 04:00 IST)
  - Source discovery: Sunday SOURCE_DISCOVERY_HOUR_IST (default 03:00 IST)
  - Daily briefing crystallise: DAILY_BRIEFING_HOUR_IST (default 07:00 IST)
"""
from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from config import settings
from services import rss_fetcher, source_discovery, trust_scorer

log = logging.getLogger("chitti-news-ai.sched")

_scheduler: BackgroundScheduler | None = None


def start() -> None:
    global _scheduler
    if not settings.scheduler_enabled:
        log.info("scheduler disabled via SCHEDULER_ENABLED=false")
        return
    _scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    _scheduler.add_job(
        rss_fetcher.poll_all,
        "interval",
        minutes=settings.rss_poll_minutes,
        id="rss_poll",
        replace_existing=True,
    )
    _scheduler.add_job(
        source_discovery.discover,
        "cron",
        day_of_week=settings.source_discovery_day,
        hour=settings.source_discovery_hour_ist,
        minute=0,
        id="source_discovery",
        replace_existing=True,
    )
    _scheduler.add_job(
        _trust_recompute_all,
        "cron",
        day_of_week=settings.trust_recompute_day,
        hour=settings.trust_recompute_hour_ist,
        minute=0,
        id="trust_recompute",
        replace_existing=True,
    )
    _scheduler.start()
    log.info(
        "scheduler started: rss every %dm, discovery %s %02d:00, trust %s %02d:00",
        settings.rss_poll_minutes,
        settings.source_discovery_day, settings.source_discovery_hour_ist,
        settings.trust_recompute_day, settings.trust_recompute_hour_ist,
    )


def _trust_recompute_all() -> None:
    log.info("weekly trust recompute stub — see skills/TRUST_VERIFICATION.md")
