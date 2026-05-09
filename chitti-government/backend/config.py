"""
config.py
---------
Settings container for the Chitti Government backend.

Reads env vars at import time. No pydantic dependency — Render's free
tier can't compile pydantic-core's Rust backend, so we mirror the same
plain-os.environ pattern used by chitti-medupi and chitti-legal.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip() or default


def _env_bool(key: str, default: bool = False) -> bool:
    v = os.environ.get(key)
    if v is None:
        return default
    return v.strip().lower() in ("1", "true", "yes", "on")


def _env_int(key: str, default: int) -> int:
    raw = os.environ.get(key)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


class Settings:
    # ── Database ──
    # Reuses the shared Supabase Postgres (same instance as chitti-medupi
    # and chitti-shares) with all our tables isolated under the
    # `government` schema. See models/_schema.py.
    DATABASE_URL: str = _env("DATABASE_URL", "sqlite:///./chitti_government.db")

    # ── DeepSeek (eligibility coach + plain-language scheme explainer) ──
    # We use DeepSeek (not Anthropic) per the 2026-05-09 provider switch.
    # If the key is missing the service falls back to the rule-engine
    # answer — never invents an LLM reply.
    DEEPSEEK_API_KEY: str = _env("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = _env("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_URL: str = _env("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    DEEPSEEK_MAX_TOKENS: int = _env_int("DEEPSEEK_MAX_TOKENS", 700)
    DEEPSEEK_TEMPERATURE: float = float(_env("DEEPSEEK_TEMPERATURE", "0.2"))

    # ── CORS ──
    ALLOWED_ORIGINS: str = _env(
        "ALLOWED_ORIGINS",
        (
            "http://localhost:5173,http://localhost:8003,"
            "http://127.0.0.1:5500,http://localhost:5500,"
            "https://sahayai.in,https://www.sahayai.in"
        ),
    )
    BACKEND_URL: str = _env("BACKEND_URL", "http://localhost:8003")

    # ── Geocoder (Nominatim — 1 req/s policy, valid UA + email required) ──
    NOMINATIM_URL: str = _env("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    NOMINATIM_CONTACT_EMAIL: str = _env(
        "NOMINATIM_CONTACT_EMAIL", "chittigovernment@gmail.com"
    )
    NOMINATIM_USER_AGENT: str = _env(
        "NOMINATIM_USER_AGENT",
        "ChittiGovernment/1.0 (https://sahayai.in/chitti_government.html)",
    )

    # ── PIB RSS poller cadence (hours) ──
    PIB_POLL_HOURS: int = _env_int("PIB_POLL_HOURS", 6)
    SCHEDULER_ENABLED: bool = _env_bool("SCHEDULER_ENABLED", True)


settings = Settings()
