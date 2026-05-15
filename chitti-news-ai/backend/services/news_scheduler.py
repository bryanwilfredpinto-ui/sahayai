"""
APScheduler crons for chitti-news-ai-api.

Cadence (locked):
  - RSS poll: every RSS_POLL_MINUTES (default 360 = 6h)
  - Trust recompute: Sunday TRUST_RECOMPUTE_HOUR_IST (default 04:00 IST)
  - Source discovery: Sunday SOURCE_DISCOVERY_HOUR_IST (default 03:00 IST)
  - Daily briefing crystallise: DAILY_BRIEFING_HOUR_IST (default 07:00 IST)
  - AI Daily Tip pre-warm: DAILY_TIP_HOUR_IST:DAILY_TIP_MINUTE_IST
    (default 06:45 IST) — feeds Chitti PA 07:00 IST morning brief
    (CHITTI_NEWS_AI_MASTER_SPEC.md §10a LOCKED 2026-05-15)
"""
from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from config import settings
from services import daily_tip, rss_fetcher, source_discovery, trust_scorer

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
    _scheduler.add_job(
        _prewarm_daily_tips,
        "cron",
        hour=settings.daily_tip_hour_ist,
        minute=settings.daily_tip_minute_ist,
        id="daily_tip_prewarm",
        replace_existing=True,
    )
    _scheduler.start()
    log.info(
        "scheduler started: rss every %dm, discovery %s %02d:00, trust %s %02d:00, "
        "daily_tip %02d:%02d (lang=%s)",
        settings.rss_poll_minutes,
        settings.source_discovery_day, settings.source_discovery_hour_ist,
        settings.trust_recompute_day, settings.trust_recompute_hour_ist,
        settings.daily_tip_hour_ist, settings.daily_tip_minute_ist,
        settings.daily_tip_prewarm_lang,
    )


def _trust_recompute_all() -> None:
    log.info("weekly trust recompute stub — see skills/TRUST_VERIFICATION.md")


def _prewarm_daily_tips() -> None:
    """06:45 IST — pre-generate AI Daily Tips for common professions in the
    configured pre-warm language so Chitti PA's 07:00 IST brief hits cache.
    Per CHITTI_NEWS_AI_MASTER_SPEC.md §10a, free-form professions still
    generate on-demand at request time."""
    try:
        stats = daily_tip.prewarm_common(lang=settings.daily_tip_prewarm_lang)
        log.info("daily_tip prewarm done: %s", stats)
    except Exception as e:  # noqa: BLE001
        log.warning("daily_tip prewarm failed: %s", e)
