"""
Configuration for chitti-news-ai-api.

Pulls env vars with sane defaults. Production values come from
chitti-news-ai/render.yaml.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


def _bool(v: str | None, default: bool = False) -> bool:
    if v is None:
        return default
    return v.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    service_name: str = "chitti-news-ai-api"
    version: str = "0.1.0"
    chitti_slug: str = "chitti-news-ai"

    database_url: str = os.getenv("DATABASE_URL", "sqlite:///chitti_news_ai.db")
    turso_auth_token: str | None = os.getenv("TURSO_AUTH_TOKEN")

    deepseek_api_key: str | None = os.getenv("DEEPSEEK_API_KEY")
    deepseek_model: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    deepseek_url: str = os.getenv("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")

    claude_api_key: str | None = os.getenv("CLAUDE_API_KEY")     # §2e Layer 5 fallback
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")     # §2e Layer 5 fallback

    allowed_origins: tuple[str, ...] = tuple(
        s.strip() for s in os.getenv(
            "ALLOWED_ORIGINS",
            "https://sahayai.in,https://www.sahayai.in,http://localhost:8080",
        ).split(",") if s.strip()
    )
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:8080")

    scheduler_enabled: bool = _bool(os.getenv("SCHEDULER_ENABLED"), True)
    rss_poll_minutes: int = int(os.getenv("RSS_POLL_MINUTES", "360"))
    trust_recompute_day: str = os.getenv("TRUST_RECOMPUTE_DAY", "sun")
    trust_recompute_hour_ist: int = int(os.getenv("TRUST_RECOMPUTE_HOUR_IST", "4"))
    daily_briefing_hour_ist: int = int(os.getenv("DAILY_BRIEFING_HOUR_IST", "7"))
    source_discovery_day: str = os.getenv("SOURCE_DISCOVERY_DAY", "sun")
    source_discovery_hour_ist: int = int(os.getenv("SOURCE_DISCOVERY_HOUR_IST", "3"))

    # AI Daily Tip pre-warmer — 15 min before Chitti PA's 07:00 IST brief
    # (CHITTI_NEWS_AI_MASTER_SPEC.md §10a LOCKED 2026-05-15).
    daily_tip_hour_ist: int = int(os.getenv("DAILY_TIP_HOUR_IST", "6"))
    daily_tip_minute_ist: int = int(os.getenv("DAILY_TIP_MINUTE_IST", "45"))
    daily_tip_prewarm_lang: str = os.getenv("DAILY_TIP_PREWARM_LANG", "hi")

    metrics_token: str | None = os.getenv("METRICS_TOKEN")


settings = Settings()
