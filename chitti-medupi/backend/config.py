"""
config.py
---------
Central settings for the Chitti MedUPI backend.

Pydantic v1 syntax: `BaseSettings` lives inside pydantic itself (in v2
it was moved to a separate pydantic-settings package). Settings config
is declared on an inner `Config` class (v2's `model_config =
SettingsConfigDict(...)` doesn't exist in v1).

Why v1: Render's free-tier image lacks the Rust toolchain, so
pydantic-core (the v2 backend) can't compile from source and there's
no wheel for every arch combination. v1 is pure Python and just works.
"""
from __future__ import annotations

from pydantic import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./chitti_medupi.db"

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"

    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,http://localhost:8001,"
        "https://sahayai.in,https://www.sahayai.in,"
        "https://chitti-shares-web.onrender.com"
    )
    BACKEND_URL: str = "http://localhost:8001"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # Brave Search API — free tier 2,000 queries/month.
    # Used for the on-demand "live pharmacy price" snippet fetch + the
    # daily 2 AM IST top-100 refresh. Snippet-only — never scrapes.
    BRAVE_SEARCH_API_KEY: str = ""

    # Scheduler — set to false to disable in tests / one-off scripts
    SCHEDULER_ENABLED: bool = True

    # Optional URL overrides for the auto-update wrappers (so Bryan can
    # repoint to a new govt CSV path without code changes).
    JAN_AUSHADHI_PRODUCT_URL: str = ""
    NPPA_CEILING_URL: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
