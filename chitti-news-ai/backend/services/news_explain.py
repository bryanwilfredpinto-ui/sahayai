"""
services/news_explain.py
------------------------
Single contract: take ONE article (title + summary + content) and explain
ONLY what's in that article, in the user's chosen language, in simple
words. Nothing else added.

LOCKED 2026-05-23 per Sire's spec (revised end-of-day):
  - NO profiling. No profession lens. Everyone sees the same explanation.
  - NO opinions
  - NO speculation
  - NO "this means X for you" framing
  - NO information not in the article
  - End every explanation with the sentence "Bas itna hi is khabar mein
    likha hai." (Hindi) / "That's all the article says." (English) — to
    reinforce the honest boundary to the user.

The `profession` argument is kept on the function signature for backward
compatibility with older callers but is IGNORED.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

import httpx

log = logging.getLogger("news_explain")

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_URL = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")

# Vaani's 26-language list. Display names + closing-line tag in each lang.
LANG_NAMES = {
    "en": "English", "hi": "Hindi", "bn": "Bangla", "te": "Telugu",
    "ta": "Tamil", "mr": "Marathi", "kn": "Kannada", "ml": "Malayalam",
    "gu": "Gujarati", "pa": "Punjabi", "or": "Odia", "as": "Assamese",
    "ur": "Urdu", "bho": "Bhojpuri", "hne": "Chhattisgarhi", "mai": "Maithili",
    "kok": "Konkani", "doi": "Dogri", "sd": "Sindhi", "ks": "Kashmiri",
    "mni": "Manipuri", "brx": "Bodo", "sat": "Santali", "sa": "Sanskrit",
    "tcy": "Tulu", "kfa": "Kodava", "kru": "Kurukh",
}

CLOSING_LINE = {
    "en": "That's all the article says.",
    "hi": "Bas itna hi is khabar mein likha hai.",
    # For other languages DeepSeek translates the English closing line as part
    # of the response body — the SYSTEM prompt instructs it explicitly.
}

def _system_prompt(language_code: str) -> str:
    lang_name = LANG_NAMES.get(language_code, "English")
    closing = CLOSING_LINE.get(language_code) or f"(End the explanation with: 'That's all the article says.' translated into {lang_name}.)"
    return (
        "You are Chitti, explaining ONE specific AI-news article to the user. "
        "Your job is to make this exact article understandable in simple words. "
        "ABSOLUTE RULES (LOCKED — never break these):\n"
        "1. Use ONLY the facts written in the article below. Do not add anything that is not in the article.\n"
        "2. NO opinions. NO speculation. NO 'this is good/bad for you'. NO 'this means X'.\n"
        "3. NO predictions about the future.\n"
        "4. NO suggestions about what the user should do.\n"
        "5. NO comparisons to other products unless the article itself compares them.\n"
        "6. Write 3-5 short sentences. Plain words. No jargon. No marketing words. If a technical term is in the article (context window, fine-tuning, RAG, multimodal, agents, embeddings), give the simplest one-clause everyday analogy so anyone can follow — without inventing applications.\n"
        f"7. Write in {lang_name} ({language_code}). The ENTIRE response must be in {lang_name}. Zero English unless the language is English.\n"
        f"8. End your response with this exact closing sentence (in {lang_name}): \"{closing}\"\n"
        "If the article body is empty or only a headline, say so honestly in one sentence and then add the closing line."
    )


def _user_prompt(article: dict) -> str:
    title = (article.get("title") or "").strip()
    summary = (article.get("summary") or "").strip()
    content = (article.get("content") or "").strip()
    source = (article.get("source_name") or "").strip()
    parts = [f"SOURCE: {source}"] if source else []
    parts.append(f"HEADLINE: {title}")
    if content:
        parts.append("FULL BODY:")
        parts.append(content[:6000])
    elif summary:
        parts.append("SUMMARY (the publisher did not ship a full body — this is all we have):")
        parts.append(summary[:2000])
    else:
        parts.append("(The publisher's RSS shipped only the headline.)")
    return "\n\n".join(parts)


def explain(article: dict, language: str = "en", profession: Optional[str] = None) -> dict:
    """Return {ok, text, language, model, source}.
    `profession` is accepted for backward compatibility with older callers
    but is IGNORED (Sire 2026-05-23 — no profiling)."""
    if not DEEPSEEK_API_KEY:
        return {
            "ok": False,
            "error": "DEEPSEEK_API_KEY missing on server",
            "text": "",
            "language": language,
        }
    lang = (language or "en").lower()
    sys_prompt = _system_prompt(lang)
    usr_prompt = _user_prompt(article)
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": usr_prompt},
        ],
        "temperature": 0.2,   # tight — zero spice
        "max_tokens": 600,
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=httpx.Timeout(50.0, connect=8.0)) as cl:
            r = cl.post(DEEPSEEK_URL, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
        return {
            "ok": True,
            "text": text,
            "language": lang,
            "model": data.get("model") or DEEPSEEK_MODEL,
            "source": "deepseek",
        }
    except Exception as e:  # noqa: BLE001
        log.exception("DeepSeek explain failed: %s", e)
        return {
            "ok": False,
            "error": str(e)[:300],
            "text": "",
            "language": lang,
            "source": "deepseek_error",
        }


def translate_headline(title: str, language: str = "en") -> dict:
    """Translate a headline into the user's language. Used when the feed is
    rendered in a non-English language so the user sees vernacular headlines."""
    if not DEEPSEEK_API_KEY:
        return {"ok": False, "text": title, "language": language, "source": "no-key"}
    lang = (language or "en").lower()
    if lang == "en":
        return {"ok": True, "text": title, "language": "en", "source": "passthrough"}
    lang_name = LANG_NAMES.get(lang, "English")
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": (
                f"You translate news headlines into {lang_name}. Translate the user's input "
                f"into {lang_name} only. No commentary, no quotation marks. Return only the translated headline."
            )},
            {"role": "user", "content": title.strip()},
        ],
        "temperature": 0.1,
        "max_tokens": 200,
    }
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    try:
        with httpx.Client(timeout=httpx.Timeout(20.0, connect=5.0)) as cl:
            r = cl.post(DEEPSEEK_URL, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip().strip('"')
        return {"ok": True, "text": text or title, "language": lang, "source": "deepseek"}
    except Exception as e:  # noqa: BLE001
        log.warning("DeepSeek translate failed for %s: %s", lang, e)
        return {"ok": False, "text": title, "language": lang, "source": "deepseek_error", "error": str(e)[:200]}
