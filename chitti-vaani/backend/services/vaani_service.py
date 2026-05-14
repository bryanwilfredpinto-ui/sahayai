"""
services/vaani_service.py
-------------------------
Chitti Vaani — voice-first phone/desktop assistant powered by DeepSeek.

Public surface (sync wrapper around DeepSeek's HTTP API):
  - ask(text, language, mode) -> dict
      Send a user utterance / question / call-summary text and get back
      Chitti's spoken-style reply, plus the canonical legal disclaimer
      that the frontend MUST read aloud after every response.

Why sync httpx and not async: Flask blueprint handlers are sync. Keeping
the service sync avoids the async-bridge boilerplate and matches the
shape of medupi_recognition / news_summary.

System prompt (CHITTI_VAANI_PROMPT) is loaded from a single CONSTANT
below so it can be replaced verbatim by the prompt approved in the
Master Spec doc without touching any other file.
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from config import settings

log = logging.getLogger("vaani_service")


# ─────────────────────────────────────────────────────
# Canonical system prompt (CHITTI_VAANI_PROMPT)
# ─────────────────────────────────────────────────────
# IMPORTANT: This is the prompt rendered to DeepSeek for every Vaani
# turn. Replace this block verbatim with the text approved in the
# Chitti Vaani Master Product Specification when the doc is shared.
# Do NOT paraphrase from inside helpers — keep it here, single source.

CHITTI_VAANI_PROMPT = """You are Chitti Vaani -- a warm, calm, and capable AI assistant built for Indians who may be blind, deaf, mute, illiterate, elderly, or living in rural areas. You are built by Bryan Wilfred Pinto at Sahayai.

YOUR PERSONALITY:
You are like a trusted family member who handles difficult tasks for people who cannot do them alone
You are calm, never rushed, never condescending, always reassuring
You always say I am Chitti, an AI assistant when making calls on behalf of the user -- never pretend to be the user
You automatically match the user language: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, or English

WHEN MAKING A CALL FOR A MUTE USER:
Always start with: Namaste, main Chitti hun, ek AI assistant. Main [user name] ki taraf se baat kar raha hun.
Speak clearly and slowly. Confirm key information. Ask for confirmation before ending the call.
If the other party refuses to speak to an AI, say: Kya aap [user name] ke liye ek message le sakte hain?

FOR ELDERLY USERS IN SLOW MODE:
Use shorter sentences. Add a pause between instructions.
Repeat important information twice. Confirm understanding by asking: Kya aapko samajh aaya?
Never use English words when a Hindi equivalent exists

FOR SOS EMERGENCY:
Immediately call the emergency contacts and dial 112
Say: Emergency. [Name] ko madad chahiye. Location: [GPS coordinates]. Blood group: [X]. Please send help now.
Do not wait for any confirmation. Act immediately. Log the exact time and list of contacts called.

LEGAL COMPLIANCE -- mandatory in every interaction:
Always identify yourself as Chitti AI -- never claim to be the user
Never store voice data without explicit user consent
For any medical or legal task, add at the end: Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.
"""

LEGAL_DISCLAIMER = "Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo."


# Modes the frontend can ask for. The system prompt does most of the
# heavy lifting — the mode just nudges the user-side framing.
MODE_FRAMING = {
    "ask":      "User asked: ",
    "call":     "Summarise this call for me. Call notes:\n",
    "read":     "Read this back to me clearly:\n",
    "translate": "Translate this for me into the user's language:\n",
}


_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam",
}


def _enforce_disclaimer(text: str) -> str:
    """Always end with the legal line — even if the model forgot."""
    text = (text or "").strip()
    if not text:
        return LEGAL_DISCLAIMER
    if LEGAL_DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + LEGAL_DISCLAIMER
    return text


def _fallback(text_in: str, language: str) -> dict:
    """When DeepSeek is unconfigured / unreachable, never break the UI."""
    note = ("Chitti is offline right now (no DEEPSEEK_API_KEY set). "
            "What you said: ") + (text_in or "").strip()[:200]
    return {
        "ok": True,
        "source": "fallback",
        "language": language,
        "reply": _enforce_disclaimer(note),
        "model": None,
    }


def _raw_deepseek(framing: str, lang_name: str, safe_text: str) -> tuple[str, dict]:
    """Pure DeepSeek HTTP call — returns (reply, usage_dict). Raises on error.

    Kept private so `ask()` (the wrapped variant) and any future async/batch
    caller share one source of truth for the request body + auth header.
    """
    user_msg = f"(Reply in {lang_name})\n{framing}{safe_text}"
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": CHITTI_VAANI_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        "max_tokens": settings.MAX_TOKENS,
        "temperature": settings.TEMPERATURE,
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=30.0) as client:
        r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"], (data.get("usage") or {})


def ask(text: str, language: str = "hi", mode: str = "ask") -> dict:
    """One-shot synchronous DeepSeek call, wrapped by HookRegistry.

    Goes through `hooks.wrap_llm` when running inside a Flask app context
    (the production path) so every call is gated by the four rails and
    audit-logged. Falls back to the raw call when called outside a Flask
    request (CLI, tests).

    Returns:
        {
          "ok": True | False,
          "source": "deepseek" | "fallback" | "blocked",
          "language": "hi",
          "reply": "<text — frontend MUST read this aloud>",
          "model": "deepseek-chat" | None,
          "request_id": "<12-hex>" (when ok via deepseek),
          "latency_ms": int (when ok via deepseek),
          "rail" / "reason": present iff blocked,
          "tokens": {"input": int, "output": int} | None,
        }
    """
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    if not settings.DEEPSEEK_API_KEY:
        return _fallback(text, language)

    framing = MODE_FRAMING.get(mode, MODE_FRAMING["ask"])
    lang_name = _LANG_NAMES.get(language, language or "Hindi")
    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        reply, usage = _raw_deepseek(framing, lang_name, safe_text)
        usage_capture.update(usage)
        return reply

    # Pull the per-app HookRegistry. Outside a Flask request (CLI / tests)
    # current_app raises — we degrade to the raw call so unit tests stay simple.
    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    if hooks is not None:
        try:
            wrapped = hooks.wrap_llm(_call, user_text=text, ctx={})
        except httpx.HTTPStatusError as e:
            log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
            return {**_fallback(text, language), "error": f"deepseek_http_{e.response.status_code}"}
        except (httpx.RequestError, KeyError, ValueError) as e:
            log.exception("DeepSeek call failed: %s", e)
            return {**_fallback(text, language), "error": str(e)[:200]}
        if wrapped.get("blocked"):
            return {
                "ok": False,
                "source": "blocked",
                "language": language,
                "reply": wrapped["reply"],
                "rail": wrapped.get("rail"),
                "reason": wrapped.get("reason"),
                "request_id": wrapped.get("request_id"),
            }
        return {
            "ok": True,
            "source": "deepseek",
            "language": language,
            "reply": _enforce_disclaimer(wrapped["reply"]),
            "model": settings.DEEPSEEK_MODEL,
            "request_id": wrapped.get("request_id"),
            "latency_ms": wrapped.get("latency_ms"),
            "tokens": {
                "input":  usage_capture.get("prompt_tokens"),
                "output": usage_capture.get("completion_tokens"),
            },
        }

    # Fallback path (no Flask context) — preserves prior behavior.
    try:
        reply, usage = _raw_deepseek(framing, lang_name, text)
        return {
            "ok": True,
            "source": "deepseek",
            "language": language,
            "reply": _enforce_disclaimer(reply),
            "model": settings.DEEPSEEK_MODEL,
            "tokens": {
                "input":  usage.get("prompt_tokens"),
                "output": usage.get("completion_tokens"),
            },
        }
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return {**_fallback(text, language), "error": f"deepseek_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek call failed: %s", e)
        return {**_fallback(text, language), "error": str(e)[:200]}


def health() -> dict:
    return {
        "ok": True,
        "service": "vaani",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
    }
