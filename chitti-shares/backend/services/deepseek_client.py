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


def _get_hooks():
    """Pull the chitti-shares HookRegistry from app.state.

    The FastAPI app instance is created in main.py before any service
    is imported; we use a late binding so the import order doesn't matter.
    Returns None if hooks aren't installed (CLI / tests).
    """
    try:
        from main import app  # type: ignore  # noqa: PLC0415
        return getattr(app.state, "chitti_hooks", None)
    except Exception:  # noqa: BLE001
        return None


@tracked(provider="deepseek", operation="chat")
async def chat_with_tokens(system: str, user: str, *,
                           max_tokens: int = 200,
                           temperature: float = 0.7) -> dict:
    """
    Returns {"text": "<reply>", "_meta": {"input_tokens": N, "output_tokens": M}}.
    The _meta key is consumed by the @tracked decorator; caller sees it stripped.

    Goes through HookRegistry.before_model + after_model when the FastAPI
    app is up (production path) so every call is gated by the four rails
    and audit-logged. wrap_llm itself is sync; we call its constituent
    methods manually around the async httpx call.
    """
    if not settings.DEEPSEEK_API_KEY:
        raise DeepSeekError("DEEPSEEK_API_KEY not configured")

    hooks = _get_hooks()
    ctx: dict = {}

    if hooks is not None:
        gated = hooks.before_model(user, ctx)
        # A RefusalResponse means a rail said BLOCK — return its message
        # as the "text" so the caller surface stays JSON-shaped.
        from lib.hooks import RefusalResponse  # noqa: PLC0415
        if isinstance(gated, RefusalResponse):
            return {
                "text": gated.user_facing,
                "blocked": True,
                "rail": gated.rail,
                "reason": gated.reason,
                "request_id": gated.request_id,
                "_meta": {"input_tokens": 0, "output_tokens": 0},
            }
        user_safe = gated
    else:
        user_safe = user

    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_safe},
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

    if hooks is not None:
        text = hooks.after_model(user_safe, text, ctx)

    return {
        "text": text,
        "request_id": ctx.get("request_id"),
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


@tracked(provider="deepseek", operation="chat_tools")
async def chat_with_tools(messages: list[dict], tools: list[dict] | None = None,
                          *, max_tokens: int = 800,
                          temperature: float = 0.3,
                          tool_choice: str = "auto") -> dict:
    """
    OpenAI-style messages + tools call. Returns the FULL assistant message
    (so the caller can inspect tool_calls) plus token meta.

    messages: full chat history (system + user + assistant + tool turns).
    tools:    optional list of {type:"function", function:{name, description,
              parameters: <jsonschema>}}.
    Returns:  {"message": <openai-style message dict>,
               "_meta": {"input_tokens": N, "output_tokens": M}}.
    """
    if not settings.DEEPSEEK_API_KEY:
        raise DeepSeekError("DEEPSEEK_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    body: dict = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if tools:
        body["tools"] = tools
        body["tool_choice"] = tool_choice

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek tools HTTP %s: %s", e.response.status_code, e.response.text[:200])
        raise DeepSeekError(f"DeepSeek HTTP {e.response.status_code}: {e.response.text[:200]}")
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.error("DeepSeek tools error: %s", e)
        raise DeepSeekError(str(e))

    msg = data["choices"][0]["message"]
    usage = data.get("usage") or {}
    return {
        "message": msg,
        # Visible to the caller (the @tracked decorator only strips _meta).
        # Lets agent_runtime sum tokens across loop steps and surface the
        # cost in the API response.
        "tokens_used": {
            "input":  usage.get("prompt_tokens"),
            "output": usage.get("completion_tokens"),
        },
        "_meta": {
            "input_tokens": usage.get("prompt_tokens"),
            "output_tokens": usage.get("completion_tokens"),
        },
    }


# Re-export so callers can catch CapExceeded
__all__ = ["chat", "chat_with_tokens", "chat_with_tools",
           "DeepSeekError", "CapExceeded"]
