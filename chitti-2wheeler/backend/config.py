"""
chitti-2wheeler / backend / config.py
-------------------------------------
Settings via env vars. Mirror of chitti-news/backend/config.py for the
Turso wiring (DATABASE_URL accepts libsql:// for prod, sqlite:/// for
local dev).

DeepSeek key optional — if unset, the backend returns an honest fallback
reply (no fake answers). Per [Honest stubs over fake demos].
"""
from __future__ import annotations

import os
from dataclasses import dataclass


def _env(key: str, default: str = "") -> str:
    v = os.getenv(key)
    return v if v is not None else default


@dataclass(frozen=True)
class Settings:
    # ── Database ── one DB per Chitti (SAHAYAI_MASTER §2 row 2)
    # Prod: libsql://chitti-2wheeler-<org>.turso.io?authToken=<token>
    # Dev:  sqlite:///./chitti_2wheeler.db
    DATABASE_URL: str = _env("DATABASE_URL", "sqlite:///./chitti_2wheeler.db")

    # ── DeepSeek ── sole LLM provider (§2 row 1)
    DEEPSEEK_API_KEY: str = _env("DEEPSEEK_API_KEY", "")
    DEEPSEEK_URL: str = _env("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    DEEPSEEK_MODEL: str = _env("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_MAX_TOKENS: int = int(_env("DEEPSEEK_MAX_TOKENS", "700"))
    DEEPSEEK_TEMPERATURE: float = float(_env("DEEPSEEK_TEMPERATURE", "0.2"))

    # ── CORS ──
    ALLOWED_ORIGINS: str = _env("ALLOWED_ORIGINS", "https://sahayai.in,https://www.sahayai.in")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
