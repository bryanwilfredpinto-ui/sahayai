"""Chitti Logo & Video — env-driven settings.

Stubs by default. When Bryan provides API keys, set REPLICATE_API_TOKEN
(image gen) and any video provider key, then services pick them up.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    REPLICATE_API_TOKEN: str = os.environ.get("REPLICATE_API_TOKEN", "")
    REPLICATE_LOGO_MODEL: str = os.environ.get("REPLICATE_LOGO_MODEL", "")
    VIDEO_PROVIDER: str = os.environ.get("VIDEO_PROVIDER", "")     # eg 'remotion-render' / 'pika' / ''
    VIDEO_PROVIDER_KEY: str = os.environ.get("VIDEO_PROVIDER_KEY", "")
    ALLOWED_ORIGINS: str = os.environ.get(
        "ALLOWED_ORIGINS",
        "https://sahayai.in,https://www.sahayai.in,http://localhost:5500,http://127.0.0.1:5500",
    )


settings = Settings()
