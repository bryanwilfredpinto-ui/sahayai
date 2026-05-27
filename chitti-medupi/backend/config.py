"""
config.py
---------
Settings container — reads env vars at import time. No pydantic
dependency (Render free tier can't compile pydantic-core's Rust
backend, so we dropped the entire pydantic stack and went to Flask).

`.env` is loaded first via python-dotenv so local dev still works.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv

# Idempotent — load_dotenv silently no-ops if the file is missing.
load_dotenv()


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip() or default


def _env_bool(key: str, default: bool = False) -> bool:
    v = os.environ.get(key)
    if v is None:
        return default
    return v.strip().lower() in ("1", "true", "yes", "on")


class Settings:
    DATABASE_URL: str = _env("DATABASE_URL", "sqlite:///./chitti_medupi.db")

    # DeepSeek (image scan via vision-capable chat completions)
    # Locked §2 decision: DeepSeek is the sole LLM provider; Anthropic
    # was removed across every Chitti backend. See
    # project_ai_provider_switch_to_deepseek.
    DEEPSEEK_API_KEY: str = _env("DEEPSEEK_API_KEY", "")
    DEEPSEEK_URL: str = _env("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
    DEEPSEEK_MODEL: str = _env("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_VISION_MODEL: str = _env("DEEPSEEK_VISION_MODEL", "deepseek-vl-7b-chat")

    ALLOWED_ORIGINS: str = _env(
        "ALLOWED_ORIGINS",
        (
            "http://localhost:5173,http://localhost:8001,"
            "https://sahayai.in,https://www.sahayai.in,"
            "https://chitti-shares-web.onrender.com"
        ),
    )
    BACKEND_URL: str = _env("BACKEND_URL", "http://localhost:8001")

    # Twilio (phone-call reminders — optional)
    TWILIO_ACCOUNT_SID: str = _env("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = _env("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER: str = _env("TWILIO_FROM_NUMBER", "")

    # Brave Search (live pharmacy prices · free 2,000 q/mo · snippet-only)
    BRAVE_SEARCH_API_KEY: str = _env("BRAVE_SEARCH_API_KEY", "")

    # Scheduler — set to false to disable in tests / one-off scripts
    SCHEDULER_ENABLED: bool = _env_bool("SCHEDULER_ENABLED", True)

    # Optional URL overrides for the auto-update wrappers
    JAN_AUSHADHI_PRODUCT_URL: str = _env("JAN_AUSHADHI_PRODUCT_URL", "")
    NPPA_CEILING_URL: str = _env("NPPA_CEILING_URL", "")


settings = Settings()
