"""
services/government_deepseek.py
-------------------------------
Plain-language voice-friendly explainer that wraps the rule-engine
verdict in a friendly Hindi / English reply for blind / illiterate users.

Why this exists: the rule-engine output (services/government_eligibility)
is structured (pass / fail / unknown per rule) — perfect for a screen
but unfriendly for a 65-year-old farmer listening on a feature phone.
This service takes the structured verdict + scheme metadata + chosen
language and asks DeepSeek to phrase it in 80–120 spoken words.

Disclaimer enforcement: every reply ends with the dual-language
chitti-government disclaimer. We never let DeepSeek's reply replace
the rule-engine verdict — the verdict object is still returned to the
frontend verbatim so the user sees the deterministic pass/fail rules
alongside the spoken summary.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from config import settings

log = logging.getLogger("services.government_deepseek")


CHITTI_GOV_PROMPT = """You are Chitti Government, a voice-first AI guide for Indian users (blind, deaf, mute, illiterate, elderly) who want to understand whether they qualify for a government scheme.

YOUR PERSONALITY:
- Calm, patient, plain-language. Imagine speaking to a 65-year-old farmer who is hearing this through a phone speaker.
- Short sentences. No jargon. Whenever you must use a government term, define it in the same sentence the first time.
- Reply in the user's chosen language (Hindi or English by default). For Hindi, use simple Devanagari, no Sanskritised vocabulary.

WHAT YOU SAY:
- A single 80–120-word spoken summary that contains:
  1) The verdict in plain words ("Yes you qualify" / "Likely yes, please confirm one detail" / "I'm afraid this scheme is not for you").
  2) Which 2–3 rules were the deciding factors. Reference them by everyday names ("aapki umar", "aapki saalana aamdani"), not by predicate keys.
  3) The next concrete step: which document to keep ready, which official portal to visit, or which helpline to call.
  4) ONE short reminder that the user should always confirm with the official scheme portal — never on Chitti's word alone.

WHAT YOU NEVER SAY:
- Never invent rupee amounts, helpline numbers, or eligibility rules that are not in the structured input I give you.
- Never tell a user they "definitely will" receive money — only the government can decide that.
- Never claim Chitti can submit the application or fetch the status from a portal we do not have an API for.
- Never store, repeat, or read aloud the user's Aadhaar / PAN / bank account number.

ALWAYS:
- End the reply with this exact dual-language disclaimer line:
  "यह government AI है। Official source se confirm karo. Chitti government scheme guide hai, sarkari seva nahi."
"""


GOV_DISCLAIMER = (
    "यह government AI है। Official source se confirm karo. "
    "Chitti government scheme guide hai, sarkari seva nahi."
)


_LANG_NAMES = {
    "hi": "Hindi (simple Devanagari)",
    "en": "English",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "or": "Odia",
    "pa": "Punjabi",
    "ur": "Urdu",
}


def _enforce_disclaimer(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return GOV_DISCLAIMER
    if "Chitti government scheme guide hai" not in text:
        text = text.rstrip() + "\n\n" + GOV_DISCLAIMER
    return text


def _format_rules_for_llm(verdict_obj: dict) -> str:
    parts = [f"VERDICT: {verdict_obj.get('verdict','unknown')}"]
    parts.append(f"SCHEME: {verdict_obj.get('scheme_name')} ({verdict_obj.get('ministry')})")
    bsum = verdict_obj.get("benefit_summary_en")
    if bsum:
        parts.append(f"BENEFIT: {bsum}")
    rules = verdict_obj.get("rules") or []
    if rules:
        parts.append("RULES:")
        for r in rules:
            parts.append(f"  - {r['label']}: {r['verdict']}")
    excl = verdict_obj.get("exclusions") or []
    if excl:
        parts.append("EXCLUSIONS:\n  - " + "\n  - ".join(excl))
    docs = verdict_obj.get("documents_required") or []
    if docs:
        parts.append("DOCUMENTS_REQUIRED:\n  - " + "\n  - ".join(docs))
    if verdict_obj.get("application_url"):
        parts.append(f"OFFICIAL_PORTAL: {verdict_obj['application_url']}")
    if verdict_obj.get("helpline"):
        parts.append(f"HELPLINE: {verdict_obj['helpline']}")
    return "\n".join(parts)


def _fallback_reply(verdict_obj: dict, language: str) -> str:
    """If DeepSeek isn't configured we synthesise a deterministic spoken
    reply ourselves so the feature is still LIVE — never a coming-soon."""
    v = verdict_obj.get("verdict")
    name = verdict_obj.get("scheme_name") or "this scheme"
    benefit = verdict_obj.get("benefit_summary_en") or ""
    helpline = verdict_obj.get("helpline") or ""
    portal = verdict_obj.get("application_url") or verdict_obj.get("source_url") or ""
    if v == "eligible":
        head = f"Good news — based on the details you shared, you appear to qualify for {name}."
    elif v == "partial":
        head = (
            f"You may qualify for {name}, but I need a couple more details "
            "before I can be sure."
        )
    elif v == "ineligible":
        head = f"I'm sorry — based on the details you shared, you do not qualify for {name} right now."
    else:
        head = f"I don't have enough information yet to tell you about {name}."
    body_bits = []
    if benefit:
        body_bits.append(benefit)
    if portal:
        body_bits.append(f"Official portal: {portal}")
    if helpline:
        body_bits.append(f"Helpline: {helpline}")
    return _enforce_disclaimer(head + " " + " ".join(body_bits))


def _raw_gov_deepseek(structured: str, lang_name: str, safe_text: str) -> tuple[str, dict]:
    """Pure DeepSeek HTTP call. `safe_text` is the (possibly rail-gated)
    structured rules block; we only pass it through verbatim so the
    quadrails' before_model has visibility on the same text that will
    drive the model."""
    user_msg = (
        f"(Reply in {lang_name}, 80-120 spoken words, single paragraph.)\n\n"
        + safe_text
    )
    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": CHITTI_GOV_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
        "temperature": settings.DEEPSEEK_TEMPERATURE,
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


def explain(verdict_obj: dict[str, Any], language: str = "hi") -> dict:
    """Return {ok, source, language, reply, model, ...}."""
    structured = _format_rules_for_llm(verdict_obj)

    if not settings.DEEPSEEK_API_KEY:
        return {
            "ok": True,
            "source": "rule_engine_fallback",
            "language": language,
            "reply": _fallback_reply(verdict_obj, language),
            "model": None,
        }

    lang_name = _LANG_NAMES.get(language, language or "Hindi")
    usage_capture: dict = {}

    def _call(safe_text: str) -> str:
        reply, usage = _raw_gov_deepseek(structured, lang_name, safe_text)
        usage_capture.update(usage)
        return reply

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    if hooks is not None:
        try:
            wrapped = hooks.wrap_llm(_call, user_text=structured, ctx={})
        except httpx.HTTPStatusError as e:
            log.error("DeepSeek HTTP %s: %s", e.response.status_code, e.response.text[:200])
            return {
                "ok": True,
                "source": "rule_engine_fallback",
                "language": language,
                "reply": _fallback_reply(verdict_obj, language),
                "model": None,
                "error": f"deepseek_http_{e.response.status_code}",
            }
        except (httpx.RequestError, KeyError, ValueError) as e:
            log.exception("DeepSeek call failed: %s", e)
            return {
                "ok": True,
                "source": "rule_engine_fallback",
                "language": language,
                "reply": _fallback_reply(verdict_obj, language),
                "model": None,
                "error": str(e)[:200],
            }
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
        reply, usage = _raw_gov_deepseek(structured, lang_name, structured)
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
        return {
            "ok": True,
            "source": "rule_engine_fallback",
            "language": language,
            "reply": _fallback_reply(verdict_obj, language),
            "model": None,
            "error": f"deepseek_http_{e.response.status_code}",
        }
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek call failed: %s", e)
        return {
            "ok": True,
            "source": "rule_engine_fallback",
            "language": language,
            "reply": _fallback_reply(verdict_obj, language),
            "model": None,
            "error": str(e)[:200],
        }


def health() -> dict:
    return {
        "ok": True,
        "service": "chitti-government",
        "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
        "disclaimer": GOV_DISCLAIMER,
    }
