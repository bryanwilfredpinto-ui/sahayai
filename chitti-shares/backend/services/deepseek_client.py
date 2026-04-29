"""
services/deepseek_client.py
---------------------------
DeepSeek chat completions wrapper. Now quota-tracked.

Two public functions:
  - chat(system, user, ...) -> str
      Returns just the reply text. Logged with token counts.
  - chat_with_tokens(system, user, ...) -> {"text": str, "_meta": {...}}
      Internal version that returns tokens for accounting.

The @tracked decorator handles:
  - Hard-cap pre-check (raises CapExceeded if breached)
  - Cost calculation from token counts
  - Logging success/failure to usage_log
"""

import logging
import httpx

from config import settings
from services.usage_tracker import CapExceeded, tracked

log = logging.getLogger("deepseek")

DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
MODEL = "deepseek-chat"


class DeepSeekError(Exception):
    pass


@tracked(provider="deepseek", operation="chat")
async def chat_with_tokens(system: str, user: str, *,
                           max_tokens: int = 200,
                           temperature: float = 0.7) -> dict:
    """
    Returns {"text": "<reply>", "_meta": {"input_tokens": N, "output_tokens": M}}.
    The _meta key is consumed by the @tracked decorator; caller sees it stripped.
    """
    if not settings.DEEPSEEK_API_KEY:
        raise DeepSeekError("DEEPSEEK_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
        raise DeepSeekError(f"DeepSeek HTTP {e.response.status_code}")
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.error("DeepSeek error: %s", e)
        raise DeepSeekError(str(e))

    text = data["choices"][0]["message"]["content"].strip()
    usage = data.get("usage") or {}
    return {
        "text": text,
        "_meta": {
            "input_tokens": usage.get("prompt_tokens"),
            "output_tokens": usage.get("completion_tokens"),
        },
    }


async def chat(system: str, user: str, *, max_tokens: int = 200,
               temperature: float = 0.7,
               user_id: int | None = None) -> str:
    """Convenience wrapper. Returns just the reply text."""
    res = await chat_with_tokens(
        system, user,
        max_tokens=max_tokens, temperature=temperature,
        _track_user_id=user_id,
    )
    return res["text"] if isinstance(res, dict) else res


# Re-export so callers can catch CapExceeded
__all__ = ["chat", "chat_with_tokens", "DeepSeekError", "CapExceeded"]
