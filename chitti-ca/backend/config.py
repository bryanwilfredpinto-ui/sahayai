"""Chitti CA — env-driven settings (same shape as Vaani)."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_URL: str = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    ALLOWED_ORIGINS: str = os.environ.get(
        "ALLOWED_ORIGINS",
        "https://sahayai.in,https://www.sahayai.in,http://localhost:5500,http://127.0.0.1:5500",
    )
    MAX_TOKENS: int = int(os.environ.get("CA_MAX_TOKENS", "700"))
    TEMPERATURE: float = float(os.environ.get("CA_TEMPERATURE", "0.3"))


settings = Settings()
