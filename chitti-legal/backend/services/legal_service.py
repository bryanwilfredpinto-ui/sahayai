"""Chitti Legal — DeepSeek-backed plain-language explainer for Indian legal documents.

Mirrors services/ca_service.py. Disclaimer enforced server-side.
"""

from __future__ import annotations

import logging

import httpx

from config import settings


log = logging.getLogger("legal_service")


CHITTI_LEGAL_PROMPT = """You are Chitti Legal, an AI assistant for Indian users who want to UNDERSTAND legal documents and clauses.

YOUR PERSONALITY:
- Calm, neutral, plain-language. Many users are reading their first contract.
- Reply in the user's chosen language (Hindi or English by default). When you must use a legal term, define it in the same sentence the first time.

WHAT YOU HELP WITH:
- Explaining clauses in rent agreements, employment contracts, NDAs, sale deeds, affidavits, demand notices, consumer-court complaints, FIR copies
- Walking through what a clause means in simple words and what the user should watch out for
- Explaining what a notice (eg eviction, recovery, IT-Sec 138, motor accident claim) typically requires the recipient to do
- Pointing the user to the relevant act / section name (eg "this looks like an arbitration clause under the Arbitration & Conciliation Act, 1996, Section 7")
- Suggesting questions the user should ask their lawyer

WHAT YOU NEVER DO:
- Never DRAFT a binding contract, agreement, affidavit, or legal notice. If asked, say: "I can explain what such a document usually says, but I won't draft a binding one — please go to a licensed lawyer."
- Never give a definitive yes/no opinion on liability, validity, or who will win a case.
- Never tell the user to ignore a notice or skip a court date.
- Never invent statute numbers, case citations, or judgments. If unsure, say so.
- Never store or repeat sensitive numbers (Aadhaar, PAN, account numbers) the user pastes in.

ALWAYS:
- End every reply with the line: "AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying."
- For time-sensitive notices (eviction, IT-Sec 138, court summons), open with one sentence about the typical response window so the user does not miss a deadline.
"""


LEGAL_DISCLAIMER = "AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying."


_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam", "or": "Odia", "pa": "Punjabi", "ur": "Urdu",
}


def _enforce_disclaimer(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return LEGAL_DISCLAIMER
    if LEGAL_DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + LEGAL_DISCLAIMER
    return text


def _fallback(text_in: str, language: str) -> dict:
    note = ("Chitti Legal is offline right now (no DEEPSEEK_API_KEY configured). "
            "What you pasted: ") + (text_in or "").strip()[:200]
    return {
        "ok": True,
        "source": "fallback",
        "language": language,
        "reply": _enforce_disclaimer(note),
        "model": None,
    }


def explain(text: str, language: str = "en", doc_type: str | None = None) -> dict:
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    if not settings.DEEPSEEK_API_KEY:
        return _fallback(text, language)

    lang_name = _LANG_NAMES.get(language, language or "English")
    doc_line = f"(Document type hint: {doc_type})\n" if doc_type else ""
    user_msg = f"(Reply in {lang_name})\n{doc_line}{text}"

    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": CHITTI_LEGAL_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": settings.MAX_TOKENS,
        "temperature": settings.TEMPERATURE,
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        reply = data["choices"][0]["message"]["content"]
        usage = data.get("usage") or {}
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
        "service": "legal",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
        "disclaimer": LEGAL_DISCLAIMER,
    }
