"""Config — frozen dataclass driven by environment variables."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # OAuth admin gate
    ADMIN_OAUTH_PROVIDER: str  # github | google
    ADMIN_OAUTH_ID: str
    ADMIN_OAUTH_SECRET: str
    ADMIN_EMAILS: list[str]  # comma-separated, who can access /admin/*

    # Audio storage
    STORAGE_PROVIDER: str  # terabox | mega
    TERABOX_API_KEY: str | None = None
    MEGA_EMAIL: str | None = None
    MEGA_PASSWORD: str | None = None

    # Voice synthesis defaults
    USE_WINNER_VOICES: bool = True
    DEFAULT_WINNER_AUDIO_CACHE_MINUTES: int = 60

    @classmethod
    def from_env(cls) -> "Settings":
        admin_emails_raw = os.environ.get("ADMIN_EMAILS", "")
        admin_emails = [e.strip() for e in admin_emails_raw.split(",") if e.strip()]

        return cls(
            ADMIN_OAUTH_PROVIDER=os.environ.get("ADMIN_OAUTH_PROVIDER", "github").lower(),
            ADMIN_OAUTH_ID=os.environ.get("ADMIN_OAUTH_ID", ""),
            ADMIN_OAUTH_SECRET=os.environ.get("ADMIN_OAUTH_SECRET", ""),
            ADMIN_EMAILS=admin_emails,
            STORAGE_PROVIDER=os.environ.get("STORAGE_PROVIDER", "terabox").lower(),
            TERABOX_API_KEY=os.environ.get("TERABOX_API_KEY"),
            MEGA_EMAIL=os.environ.get("MEGA_EMAIL"),
            MEGA_PASSWORD=os.environ.get("MEGA_PASSWORD"),
            USE_WINNER_VOICES=os.environ.get("USE_WINNER_VOICES", "1") == "1",
            DEFAULT_WINNER_AUDIO_CACHE_MINUTES=int(
                os.environ.get("DEFAULT_WINNER_AUDIO_CACHE_MINUTES", "60")
            ),
        )


settings = Settings.from_env()
