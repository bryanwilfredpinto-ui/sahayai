"""
config.py
---------
Settings container for the Chitti Jobs backend.

Reads env vars at import time. No pydantic dependency (Railway/Render
free tier can't compile pydantic-core's Rust backend) — mirrors the
plain-os.environ pattern used by chitti-government / chitti-medupi.

LLM provider is DeepSeek ONLY (sahay_master.md §2 lock). If the key is
missing every LLM feature falls back to a deterministic reply — never a
"coming soon", never an invented answer.
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
    # ── Database (per-Chitti Turso DB; sqlite fallback for local dev) ──
    DATABASE_URL: str = _env("DATABASE_URL", "sqlite:///./chitti_jobs.db")

    # ── DeepSeek (BO7 application drafter + interview coach) ──
    # DeepSeek is the SOLE LLM provider (sahay_master.md §2). Missing key
    # → deterministic fallback drafter, never an invented reply.
    DEEPSEEK_API_KEY: str = _env("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = _env("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_URL: str = _env("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    DEEPSEEK_MAX_TOKENS: int = _env_int("DEEPSEEK_MAX_TOKENS", 900)
    DEEPSEEK_TEMPERATURE: float = float(_env("DEEPSEEK_TEMPERATURE", "0.3"))

    # ── Memory OS bridge (BO2). Optional. When set, Chitti Jobs reads/writes
    # the user's job profile to the central Memory OS (mem_fact) at this URL.
    # When unset, the profile lives only in the chitti-jobs `users` table
    # (still keyed by the same X-User-Token uid). Best-effort, never blocks. ──
    CHITTI_MEMORY_URL: str = _env("CHITTI_MEMORY_URL", "")

    # ── Job-source RSS poll cadence (the daily 07:00 IST scrape, BO4) ──
    SOURCE_POLL_HOUR_IST: int = _env_int("SOURCE_POLL_HOUR_IST", 7)
    SCHEDULER_ENABLED: bool = _env_bool("SCHEDULER_ENABLED", True)

    # User-Agent for RSS fetches (polite, identifies the bot honestly).
    HTTP_USER_AGENT: str = _env(
        "HTTP_USER_AGENT",
        "ChittiJobs/1.0 (+https://sahayai.in/chitti_jobs.html)",
    )

    # ── CORS ──
    ALLOWED_ORIGINS: str = _env(
        "ALLOWED_ORIGINS",
        (
            "http://localhost:5173,http://localhost:8010,"
            "http://127.0.0.1:5500,http://localhost:5500,"
            "https://sahayai.in,https://www.sahayai.in"
        ),
    )
    BACKEND_URL: str = _env("BACKEND_URL", "http://localhost:8010")


settings = Settings()
