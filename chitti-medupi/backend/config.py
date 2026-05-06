"""
config.py
---------
Central settings for the Chitti MedUPI backend. Loads env vars via
pydantic-settings; same pattern as chitti-shares/backend.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


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
    # daily 2 AM IST top-100 refresh. We only parse SEARCH SNIPPETS, never
    # visit pharmacy URLs (zero-scrape policy).
    BRAVE_SEARCH_API_KEY: str = ""

    # Scheduler — set to false to disable in tests / one-off scripts
    SCHEDULER_ENABLED: bool = True

    # Optional URL overrides for the auto-update wrappers (so Bryan can
    # repoint to a new govt CSV path without code changes).
    JAN_AUSHADHI_PRODUCT_URL: str = ""
    NPPA_CEILING_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
