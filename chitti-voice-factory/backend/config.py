"""
config.py — Chitti Voice Factory settings (env-driven).
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    ALLOWED_ORIGINS: str = os.environ.get("ALLOWED_ORIGINS", "")

    BHASHINI_USER_ID: str = os.environ.get("BHASHINI_USER_ID", "")
    BHASHINI_API_KEY: str = os.environ.get("BHASHINI_API_KEY", "")
    BHASHINI_INFERENCE_KEY: str = os.environ.get("BHASHINI_INFERENCE_KEY", "")

    SARVAM_API_KEY: str = os.environ.get("SARVAM_API_KEY", "")

    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "")
    SUPABASE_VOICE_BUCKET: str = os.environ.get("SUPABASE_VOICE_BUCKET", "chitti-voices")

    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:////tmp/chitti_voice_factory.sqlite")

    # TTS configs
    MAX_TEXT_CHARS: int = 1000
    SYNTHESIS_TIMEOUT_SEC: int = 30


settings = Settings()
