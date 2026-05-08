"""config.py — Chitti UPI Fraud Guard settings (env-driven)."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_URL: str = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    ALLOWED_ORIGINS: str = os.environ.get("ALLOWED_ORIGINS", "")
    MAX_TOKENS: int = int(os.environ.get("UPI_MAX_TOKENS", "500"))
    TEMPERATURE: float = float(os.environ.get("UPI_TEMPERATURE", "0.2"))


settings = Settings()
