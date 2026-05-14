"""
chitti-4wheeler / backend / services / deepseek_client.py
---------------------------------------------------------
Single DeepSeek call helper for Chitti 4-Wheeler. Mirrors
chitti-2wheeler/backend/services/deepseek_client.py — only the persona
prompt and skill-file resolution differ.

Server-enforced disclaimer on every reply (SAHAYAI_MASTER §6).
Honest fallback if DEEPSEEK_API_KEY is unset.
"""
from __future__ import annotations

import logging
import textwrap
from pathlib import Path
from typing import Any

import httpx

from config import settings

log = logging.getLogger("services.deepseek_client")

DISCLAIMER = (
    "\n\n— Main mechanic nahi hoon. Yeh information guide ke liye hai. "
    "Major problems ke liye trained mechanic se milein. Emergency mein "
    "family ko call kiya jayega, cops ko nahi."
)


SKILLS_DIR = Path(__file__).resolve().parent.parent.parent / "skills"


def _load_skill_files() -> str:
    pieces: list[str] = []
    for name in ("SKILL.md", "MECHANIC_KNOWLEDGE.md"):
        p = SKILLS_DIR / name
        try:
            if p.exists():
                pieces.append(f"# === {name} ===\n" + p.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            log.warning("skill load %s failed: %s", name, e)
    return "\n\n".join(pieces) if pieces else ""


_SKILLS_TEXT = _load_skill_files()


SYSTEM_PROMPT = textwrap.dedent(
    """
    You are **Chitti 4-Wheeler** — Bharat's voice-first agent for car
    owners. Speak simple Hinglish by default. You are *a guardian, a
    commando, a coach* — not a polite assistant.

    Hard rules:
    - You are NOT a mechanic. Every answer is guidance.
    - Quote price BANDS (₹6 000–10 000), never a single final number.
    - Translate every DTC into a class-5-grade Hinglish sentence + a
      possible-cause list + a repair price band.
    - Emergency = family cascade. NEVER tell the user to dial
      100 / 108 / 112.
    - Honest stubs over fake demos — if you do not know, say so.
    - Reply in 60–180 words for chat; longer only if explicitly asked.

    The skill files (SKILL.md + MECHANIC_KNOWLEDGE.md) below are your
    knowledge base. Ground every answer in them; do NOT invent
    intervals, codes, or prices outside this corpus.
    """
).strip() + "\n\n" + _SKILLS_TEXT


def _raw_4w_deepseek(profile_blurb: str, safe_text: str) -> tuple[str, dict, int]:
    payload = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": profile_blurb + safe_text},
        ],
        "temperature": settings.DEEPSEEK_TEMPERATURE,
        "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
    }
    headers = {"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    with httpx.Client(timeout=45.0) as client:
        r = client.post(settings.DEEPSEEK_URL, json=payload, headers=headers)
    if r.status_code != 200:
        log.warning("deepseek http %s: %s", r.status_code, r.text[:200])
        return "", {}, r.status_code
    data = r.json()
    ans = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
    return ans, (data.get("usage") or {}), 200


def ask(question: str, profile: dict | None = None, lang_hint: str = "hinglish") -> dict[str, Any]:
    """Send a single-turn question to DeepSeek, wrapped by HookRegistry."""
    if not settings.DEEPSEEK_API_KEY:
        return {
            "answer": (
                "DeepSeek abhi configured nahi hai backend pe. Maintenance schedule + "
                "breakdown coach + DTC lookup + RSA numbers without DeepSeek bhi chalte hain — "
                "un tabs pe jao. Founder ko bata diya jayega ke key add karen."
                + DISCLAIMER
            ),
            "error": "deepseek_not_configured",
            "cost": {"input_tokens": 0, "output_tokens": 0, "inr": 0.0},
        }

    profile_blurb = ""
    if profile and isinstance(profile, dict):
        bits = []
        for k in ("brand", "model", "year", "fuel", "tx", "odo", "reg"):
            v = profile.get(k)
            if v:
                bits.append(f"{k}={v}")
        if bits:
            profile_blurb = "User's car: " + ", ".join(bits) + ".\n\n"

    user_text = question.strip()
    usage_capture: dict = {}
    http_status_capture = {"code": 200}

    def _call(safe_text: str) -> str:
        ans, usage, status = _raw_4w_deepseek(profile_blurb, safe_text)
        usage_capture.update(usage)
        http_status_capture["code"] = status
        return ans

    try:
        from flask import current_app
        hooks = current_app.config.get("CHITTI_HOOKS")
    except Exception:  # noqa: BLE001
        hooks = None

    def _enforce_disclaimer(ans: str) -> str:
        if not ans:
            ans = "Jawab nahi mila."
        if "mechanic nahi hoon" not in ans.lower():
            ans = ans.rstrip() + DISCLAIMER
        return ans

    def _ok_response(ans: str, request_id=None) -> dict:
        usage = usage_capture
        out = {
            "answer": _enforce_disclaimer(ans),
            "error": None,
            "cost": {
                "input_tokens": usage.get("prompt_tokens", 0),
                "output_tokens": usage.get("completion_tokens", 0),
                "inr": 0.0,
            },
        }
        if request_id is not None:
            out["request_id"] = request_id
        return out

    if hooks is not None:
        try:
            wrapped = hooks.wrap_llm(_call, user_text=user_text, ctx={})
        except Exception as e:  # noqa: BLE001
            log.exception("deepseek call failed: %s", e)
            return {
                "answer": "Network problem. Phir try karo." + DISCLAIMER,
                "error": "network",
                "cost": {"input_tokens": 0, "output_tokens": 0, "inr": 0.0},
            }
        if wrapped.get("blocked"):
            return {
                "answer": wrapped["reply"],
                "error": f"blocked_{wrapped.get('rail')}",
                "cost": {"input_tokens": 0, "output_tokens": 0, "inr": 0.0},
                "request_id": wrapped.get("request_id"),
            }
        if http_status_capture["code"] != 200:
            return {
                "answer": "Backend hiccup hua. Phir try karo." + DISCLAIMER,
                "error": f"http_{http_status_capture['code']}",
                "cost": {"input_tokens": 0, "output_tokens": 0, "inr": 0.0},
            }
        return _ok_response(wrapped.get("reply") or "", request_id=wrapped.get("request_id"))

    try:
        ans, usage, status = _raw_4w_deepseek(profile_blurb, user_text)
        usage_capture.update(usage)
        if status != 200:
            return {
                "answer": "Backend hiccup hua. Phir try karo." + DISCLAIMER,
                "error": f"http_{status}",
                "cost": {"input_tokens": 0, "output_tokens": 0, "inr": 0.0},
            }
        return _ok_response(ans)
    except Exception as e:  # noqa: BLE001
        log.exception("deepseek call failed: %s", e)
        return {
            "answer": "Network problem. Phir try karo." + DISCLAIMER,
            "error": "network",
            "cost": {"input_tokens": 0, "output_tokens": 0, "inr": 0.0},
        }
