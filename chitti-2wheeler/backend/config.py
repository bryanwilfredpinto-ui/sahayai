"""
chitti-2wheeler / backend / config.py
-------------------------------------
Settings via env vars. Same shape as chitti-government/config.py to keep
the surface familiar across Chittis.

All DeepSeek vars are optional — if `DEEPSEEK_API_KEY` is unset the
backend falls back to a deterministic honest reply (no fake answers).
Per [SAHAYAI_MASTER §3 — Honest stubs over fake demos].
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # DeepSeek (sole LLM provider — SAHAYAI_MASTER §2 row 1)
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_URL: str = os.getenv("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_MAX_TOKENS: int = int(os.getenv("DEEPSEEK_MAX_TOKENS", "700"))
    DEEPSEEK_TEMPERATURE: float = float(os.getenv("DEEPSEEK_TEMPERATURE", "0.2"))

    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "https://sahayai.in,https://www.sahayai.in")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
