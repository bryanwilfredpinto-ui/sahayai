"""
services/health_file_insurance_reason.py
----------------------------------------
Phase B-2 — Insurance reasoning over a parsed policy.

The user asks "Kya wife ki surgery covered hai?" in Hindi / English /
regional. We pull the InsurancePolicy row (already parsed at upload-time
by health_file_extract.py), pass the structured fields + the user's
question to DeepSeek, and return a plain-language answer in the user's
language with a server-enforced disclaimer.

Hard rules (matches SAHAYAI_MASTER.md §6 + §2 LOCKED):
  - DeepSeek is the sole LLM provider.
  - Server-enforced disclaimer rides on every response — "Yeh ek
    information sahayak hai, legal/insurance advice nahi. Final word
    is with the insurer + your TPA."
  - HIGH-risk → never silently elevate. If the model is uncertain, the
    answer surfaces the uncertainty rather than coercing a yes/no.
  - Wrap_llm rails + observability via app.config["CHITTI_HOOKS"] +
    app.config["CHITTI_OBS"] (already wired by main.py).
"""
from __future__ import annotations

import json
import logging
from typing import Optional

import httpx

from config import settings

log = logging.getLogger("health_file_insurance_reason")


# Server-enforced disclaimer — appended to EVERY response, never
# client-controlled. Matches the CA / Legal Chitti pattern.
_DISCLAIMER_EN = (
    "This is an information helper, not legal or insurance advice. "
    "Final coverage is decided by the insurer's TPA on actual claim. "
    "Always confirm with your policy schedule and insurer helpline before deciding."
)
_DISCLAIMER_HI = (
    "Yeh sirf jaankari ke liye hai — koi legal ya insurance salah nahi. "
    "Final coverage insurer ke TPA par claim ke samay nirbhar karta hai. "
    "Niyam ya policy schedule aur insurer ki helpline se confirm zaroor karein."
)


def _policy_to_prompt_block(policy: dict) -> str:
    """Render a compact JSON-ish block of the policy that the LLM can reason over."""
    keys = [
        "policy_kind", "company", "policy_number", "sum_assured",
        "coverage_inr", "premium_inr", "premium_mode",
        "start_date", "due_date", "renewal_date", "maturity_date",
        "network_hospitals", "exclusions", "sub_limits", "nominee",
        "raw_summary",
    ]
    block = {k: policy.get(k) for k in keys if policy.get(k) not in (None, "", [], {})}
    return json.dumps(block, ensure_ascii=False, indent=2)


def _build_prompt(policy: dict, question: str, lang: str) -> list[dict]:
    lang_name = {
        "hi": "Hindi (Devanagari)", "en": "English",
        "bn": "Bengali", "ta": "Tamil", "te": "Telugu",
        "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
        "ml": "Malayalam", "pa": "Punjabi", "or": "Odia",
        "as": "Assamese", "ur": "Urdu",
    }.get((lang or "hi").lower(), "Hindi")

    policy_block = _policy_to_prompt_block(policy)

    system = (
        "You are Chitti, an Indian-family insurance helper. You read the user's policy "
        "schedule (parsed at upload time) and answer their question in plain "
        f"{lang_name}. "
        "RULES:\n"
        "1. NEVER invent coverage. If the policy block is silent on a question, say so honestly: "
        "   'Policy mein iske baare mein clear nahi likha hai — TPA se poochhna padega.'\n"
        "2. NEVER give legal advice. You are a reading helper, not a lawyer.\n"
        "3. Quote the policy verbatim when you cite a sub-limit, waiting period, or exclusion. "
        "   Don't paraphrase the number — show the source line.\n"
        "4. If the question is about a hospital, check `network_hospitals`. Empty list = unknown, NOT "
        "   'not in network'.\n"
        "5. Reply in 4–8 short sentences. Family-friendly. Plain. No legalese.\n"
        "6. ALWAYS end with one sentence about confirming with the insurer's TPA helpline."
    )

    user = (
        f"POLICY (parsed from the uploaded document):\n```json\n{policy_block}\n```\n\n"
        f"USER QUESTION (in their language):\n{question.strip()}\n\n"
        f"Answer in {lang_name}. Plain language. Quote the policy where relevant."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def reason_over_policy(policy: dict, question: str, lang: str = "hi") -> dict:
    """Call DeepSeek chat with the policy block + the user's question.

    Returns:
      {
        "answer": "plain-language string in user's lang",
        "lang": "hi",
        "policy_id": <int> | None,
        "policy_company": str,
        "disclaimer": <localised server-enforced disclaimer>,
        "_status": "ok" | "deepseek_unset" | "model_error" | "policy_missing"
      }
    """
    if not policy:
        return {
            "_status": "policy_missing",
            "answer": "Pehle policy upload karein. Phir Chitti uske baare mein bata sakti hai.",
            "disclaimer": _DISCLAIMER_HI if (lang or "hi") == "hi" else _DISCLAIMER_EN,
            "lang": lang or "hi",
        }
    if not settings.DEEPSEEK_API_KEY:
        return {
            "_status": "deepseek_unset",
            "answer": "DeepSeek API key abhi server par set nahi hai. Sire ko boliye configure karne ko.",
            "disclaimer": _DISCLAIMER_HI if (lang or "hi") == "hi" else _DISCLAIMER_EN,
            "lang": lang or "hi",
        }

    messages = _build_prompt(policy, question, lang)
    body = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 700,
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post("https://api.deepseek.com/chat/completions", headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        answer = (data["choices"][0]["message"]["content"] or "").strip()
    except (httpx.HTTPError, KeyError, ValueError) as e:
        log.exception("DeepSeek insurance reason failed: %s", e)
        return {
            "_status": "model_error",
            "answer": "Chitti abhi answer nahi nikal pa rahi. Thodi der mein dobara try karein, ya insurer ko 1800 number par call karein.",
            "disclaimer": _DISCLAIMER_HI if (lang or "hi") == "hi" else _DISCLAIMER_EN,
            "lang": lang or "hi",
        }

    return {
        "_status": "ok",
        "answer": answer,
        "lang": lang or "hi",
        "policy_id": policy.get("id"),
        "policy_company": policy.get("company"),
        "disclaimer": _DISCLAIMER_HI if (lang or "hi") == "hi" else _DISCLAIMER_EN,
    }
