"""
lib/devmode.py  —  Sahay AI shared DEV-mode guard (2026-06-23 Turso incident)
-----------------------------------------------------------------------------
Permanent rule: local development must NEVER hit real Turso or real LLM
providers. This is the chokepoint that enforces it.

  ENV=production   → real services (Railway sets this on every live Chitti).
  ENV=development  → skip Turso (force local sqlite), skip DeepSeek/Gemini
                     (return a mock), so no real read/write/LLM call fires.

IMPORTANT — fail-safe default: when ENV is UNSET we default to **production**,
NOT development. A live server that forgot to set ENV must keep working, not
silently start returning mock data. (This intentionally differs from the
incident note's `getenv('ENV','development')` snippet: defaulting to dev on a
prod box would brick production. Local .env files set ENV=development
explicitly; deploy_to_railway.sh / railway-env/*.env set ENV=production.)

Usage:
    from lib.devmode import DEV_MODE, guard_database_url, llm_mock_or
    engine_url = guard_database_url(settings.DATABASE_URL)   # in database.py
    reply = llm_mock_or(lambda: real_deepseek_call(prompt))  # in *_deepseek.py
"""
from __future__ import annotations

import logging
import os

log = logging.getLogger("devmode")

ENV = (os.getenv("ENV") or "production").strip().lower()
DEV_MODE = ENV in ("development", "dev", "local", "test")

_DEV_SQLITE = "sqlite:///./dev_local.db"


def guard_database_url(url: str) -> str:
    """In DEV, refuse to connect to a remote Turso (libsql) DB — force a local
    sqlite file so development can never read/write the production database."""
    if DEV_MODE and (url or "").startswith("libsql://"):
        log.warning("DEV_MODE: refusing Turso/libsql URL — using %s instead. "
                    "Set ENV=production to use the real DB.", _DEV_SQLITE)
        return _DEV_SQLITE
    return url


def llm_disabled() -> bool:
    return DEV_MODE


def llm_mock_or(call, mock: str = "DEV MODE — mock LLM response (no real call fired)."):
    """Run `call()` in production; return a mock string in development."""
    if DEV_MODE:
        return mock
    return call()


def status() -> dict:
    return {"env": ENV, "dev_mode": DEV_MODE}
