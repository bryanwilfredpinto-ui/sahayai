"""
chitti-4wheeler / backend / config.py
-------------------------------------
Settings via env vars. Mirror of chitti-2wheeler/backend/config.py.

DeepSeek key optional — if unset, the backend returns an honest fallback
reply (no fake answers). Per [Honest stubs over fake demos].
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_URL: str = os.getenv("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_MAX_TOKENS: int = int(os.getenv("DEEPSEEK_MAX_TOKENS", "700"))
    DEEPSEEK_TEMPERATURE: float = float(os.getenv("DEEPSEEK_TEMPERATURE", "0.2"))

    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "https://sahayai.in,https://www.sahayai.in")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
