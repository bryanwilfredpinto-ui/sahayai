"""config.py — Chitti Product Scanner settings (env-driven)."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_URL: str = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    # Optional — only needed if image analysis is enabled. v1 is text-fallback only,
    # so this is unused but kept for forwards-compat.
    DEEPSEEK_VISION_MODEL: str = os.environ.get("DEEPSEEK_VISION_MODEL", "deepseek-vl-chat")
    ALLOWED_ORIGINS: str = os.environ.get("ALLOWED_ORIGINS", "")
    MAX_TOKENS: int = int(os.environ.get("SCANNER_MAX_TOKENS", "700"))
    TEMPERATURE: float = float(os.environ.get("SCANNER_TEMPERATURE", "0.2"))
    # Cross-product link to the MedUPI backend (for Jan-Aushadhi lookups when
    # a medicine is detected). The frontend may call MedUPI directly too.
    MEDUPI_API_BASE: str = os.environ.get("MEDUPI_API_BASE", "https://chitti-medupi-api.up.railway.app")


settings = Settings()
