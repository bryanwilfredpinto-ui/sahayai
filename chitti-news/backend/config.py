"""
config.py
---------
Settings container for the Chitti News backend. No pydantic dependency
(matches the chitti-medupi pattern after the pydantic-core build saga).
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip() or default


def _env_bool(key: str, default: bool = False) -> bool:
    v = os.environ.get(key)
    if v is None:
        return default
    return v.strip().lower() in ("1", "true", "yes", "on")


def _env_int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, "").strip() or default)
    except ValueError:
        return default


class Settings:
    DATABASE_URL: str = _env("DATABASE_URL", "sqlite:///./chitti_news.db")

    # DeepSeek-only LLM (project_ai_provider_switch_to_deepseek).
    # news_summary.py and news_explain.py also read these straight off
    # os.environ so tests / tooling can override without rebuilding
    # config; this class is for tooling that wants typed access.
    DEEPSEEK_API_KEY: str = _env("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = _env("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_URL: str = _env("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")

    ALLOWED_ORIGINS: str = _env(
        "ALLOWED_ORIGINS",
        (
            "http://localhost:5173,http://localhost:8002,"
            "https://sahayai.in,https://www.sahayai.in"
        ),
    )
    BACKEND_URL: str = _env("BACKEND_URL", "http://localhost:8002")

    SCHEDULER_ENABLED: bool = _env_bool("SCHEDULER_ENABLED", True)
    RSS_POLL_MINUTES: int = _env_int("RSS_POLL_MINUTES", 30)

    BRAVE_SEARCH_API_KEY: str = _env("BRAVE_SEARCH_API_KEY", "")


settings = Settings()
