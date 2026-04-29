"""
services/cache.py
-----------------
Tiny TTL cache. Key -> (value, expires_at).
Lives in process memory (resets on Render redeploy/restart, that's fine).

Why not Redis? Phase 2 cache is just to avoid hitting Kite/DeepSeek
for every page-view. Single-worker FastAPI on Render free tier is
fine for an in-memory dict.
"""

import time
from typing import Any


class TTLCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        item = self._store.get(key)
        if not item:
            return None
        expires_at, value = item
        if time.time() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        self._store[key] = (time.time() + ttl_seconds, value)

    def invalidate(self, key: str) -> None:
        self._store.pop(key, None)


cache = TTLCache()
