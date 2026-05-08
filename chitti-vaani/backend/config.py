"""
config.py — Chitti Vaani settings (env-driven).

Why a tiny dataclass instead of pydantic-settings: Render's slim image
lacks Rust + cmake, so pydantic-core can't build. Same workaround we
used for MedUPI / News.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_URL: str = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    ALLOWED_ORIGINS: str = os.environ.get("ALLOWED_ORIGINS", "")
    MAX_TOKENS: int = int(os.environ.get("VAANI_MAX_TOKENS", "600"))
    TEMPERATURE: float = float(os.environ.get("VAANI_TEMPERATURE", "0.4"))


settings = Settings()
