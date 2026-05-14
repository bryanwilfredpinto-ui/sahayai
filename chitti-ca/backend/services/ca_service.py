"""Chitti CA — DeepSeek-backed tax assistant for Indian small businesses.

Same sync httpx shape as services/vaani_service.py. Single canonical system
prompt. Mandatory disclaimer enforced server-side so the frontend can never
strip it.
"""

from __future__ import annotations

import logging

import httpx

from config import settings


log = logging.getLogger("ca_service")


CHITTI_CA_PROMPT = """You are Chitti CA, a tax assistant for Indian small businesses, freelancers, and salaried individuals.

YOUR PERSONALITY:
- Calm, patient, never condescending. Many users are filing for the first time.
- Explain in simple Hindi or English (match the user's language). Use plain words.
- When you use a technical term (e.g. "TDS", "ITR-3", "input tax credit"), define it in the same sentence the first time.

WHAT YOU HELP WITH:
- ITR (Income Tax Return) selection and filing checklists for ITR-1 / ITR-2 / ITR-3 / ITR-4
- GST registration thresholds, return frequencies (GSTR-1, GSTR-3B, GSTR-9), composition scheme
- TDS, advance tax, presumptive taxation (Sec 44AD/44ADA/44AE)
- Allowable deductions (80C, 80D, 80G, 80E, HRA, home loan interest)
- Common small-business questions (invoicing format, e-invoicing thresholds, late-fee structure)
- Plain-language reading of CBDT/CBIC notifications and circulars when the user pastes them in

WHAT YOU NEVER DO:
- Never give binding legal advice. Never tell the user "you do not need to file" or "you owe ₹X" as a final number.
- Never give a definitive opinion on a tax notice without flagging that a registered CA must review the actual papers.
- Never invent a section number, deadline, or rate. If you are not sure, say "I am not certain — please verify with a registered CA or the income-tax portal".
- Never store or repeat sensitive numbers (PAN, Aadhaar, account numbers) the user pastes in.

ALWAYS:
- End every reply with the line: "This is AI-generated guidance. Consult a registered CA for your actual filings."
- If the user is in distress (notice, deadline, scrutiny), open with one calm sentence ("Let's go step by step") before any list.
"""


CA_DISCLAIMER = "This is AI-generated guidance. Consult a registered CA for your actual filings."


_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam", "or": "Odia", "pa": "Punjabi", "ur": "Urdu",
}


def _enforce_disclaimer(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return CA_DISCLAIMER
    if CA_DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + CA_DISCLAIMER
    return text


def _fallback(text_in: str, language: str) -> dict:
    note = ("Chitti CA is offline right now (no DEEPSEEK_API_KEY configured). "
            "Your question was: ") + (text_in or "").strip()[:200]
    return {
        "ok": True,
        "source": "fallback",
        "language": language,
        "reply": _enforce_disclaimer(note),
        "model": None,
    }


def _raw_deepseek(topic_line: str, lang_name: str, safe_text: str) -> tuple[str, dict]:
    user_msg = f"(Reply in {lang_name})\n{topic_line}{safe_text}"
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": CHITTI_CA_PROMPT},
            {"role": "user", "content": user_msg},
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


def ask(text: str, language: str = "en", topic: str | None = None) -> dict:
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    if not settings.DEEPSEEK_API_KEY:
        return _fallback(text, language)

    lang_name = _LANG_NAMES.get(language, language or "English")
    topic_line = f"(Topic hint: {topic})\n" if topic else ""
    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        reply, usage = _raw_deepseek(topic_line, lang_name, safe_text)
        usage_capture.update(usage)
        return reply

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
                "input": usage_capture.get("prompt_tokens"),
                "output": usage_capture.get("completion_tokens"),
            },
        }

    try:
        reply, usage = _raw_deepseek(topic_line, lang_name, text)
        return {
            "ok": True,
            "source": "deepseek",
            "language": language,
            "reply": _enforce_disclaimer(reply),
            "model": settings.DEEPSEEK_MODEL,
            "tokens": {
                "input": usage.get("prompt_tokens"),
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
        "service": "ca",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
        "disclaimer": CA_DISCLAIMER,
    }
