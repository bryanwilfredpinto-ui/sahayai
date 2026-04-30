"""
config.py
---------
Loads all environment variables into a single Settings object.
Anywhere in the app you can do: `from config import settings`
and then use `settings.JWT_SECRET`, etc.

Why pydantic-settings? It auto-validates types and gives clear
errors at startup if something is missing.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # JWT signing
    JWT_SECRET: str
    ACCESS_TOKEN_MINUTES: int = 15
    REFRESH_TOKEN_DAYS: int = 30

    # Database
    DATABASE_URL: str = "sqlite:///./chitti_shares.db"

    # SMS provider (Fast2SMS)
    FAST2SMS_API_KEY: str = ""

    # OTP behaviour
    OTP_LENGTH: int = 6
    OTP_EXPIRY_MINUTES: int = 5

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    # Dev mode flag
    DEV_MODE_FAKE_OTP: bool = False

    # ---------- Phase 2: Market data ----------

    # Zerodha Kite Connect credentials.
    # Get these by creating an app at https://developers.kite.trade
    KITE_API_KEY: str = ""
    KITE_API_SECRET: str = ""
    ANGEL_API_KEY: str = ""
    ANGEL_CLIENT_CODE: str = ""
    ANGEL_PIN: str = ""
    ANGEL_TOTP_SECRET: str = ""

    # The redirect URL you registered in the Kite developer console.
    # Must match EXACTLY (case + slash). Defaults to BACKEND_URL + path.
    KITE_REDIRECT_URL: str = ""

    # DeepSeek API key (for "Chitti Market View" AI summary).
    # Already present in your Render env from earlier Chitti work.
    DEEPSEEK_API_KEY: str = ""

    # Admin gate for Kite OAuth routes.
    # Mobile number (10 digits, no +91). Only this user can run
    # /api/market/auth-url and /api/market/auth-callback.
    ADMIN_MOBILE: str = ""

    # ---------- Phase 3-5: Data source + features ----------

    # Active market-data provider. "yahoo" (free, default) or "kite".
    # Kite still works for indices via Phase 2 routes; this switch
    # controls everything else (stocks, fundamentals, history).
    DATA_SOURCE: str = "yahoo"

    # Alerts polling interval in minutes (during market hours)
    ALERTS_POLL_MINUTES: int = 5

    # Max watchlist + alerts per user (sane caps for free tier)
    MAX_WATCHLIST_ITEMS: int = 50
    MAX_ALERTS_PER_USER: int = 30

    # ---------- Quota / budget caps ----------
    # Soft cap: warning logged. Hard cap: metered API calls return 503.
    # Yahoo Finance (free) is never blocked. Resets at 00:00 IST.
    DAILY_BUDGET_INR: int = 50
    HARD_CAP_INR: int = 100

    # ---------- Telegram (optional, for Kite re-auth reminders) ----------
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # ---------- Cron secret (for Render Cron Jobs) ----------
    # Cron URLs include ?secret=... so the public hook can't be abused.
    CRON_SECRET: str = ""

    # Tells pydantic-settings where to find the .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# One global settings instance the whole app shares
settings = Settings()
