"""
services/news_explain.py
------------------------
"Explain Simply" — class-5 plain-language re-prompt of a news article.

P0 from the 2026-05-13 founder wave. Shared substrate hook (matches the
homepage P0 in SAHAYAI_MASTER §8): every article carries a button that
re-prompts DeepSeek to explain the story in language a 10-year-old can
follow. Voice-out is the primary affordance — the response is short and
read-aloud-friendly.

Locked decision: DeepSeek-only LLM provider
(`project_ai_provider_switch_to_deepseek`). No Anthropic.

Locked decision: news sub-agent neutrality applies — politics-adjacent
stories must stay opinion-free, no labels, equal coverage. The system
prompt mirrors `chitti-news-politics/SKILL.md`.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from models.article import Article

log = logging.getLogger("news_explain")


DEEPSEEK_URL = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
HTTP_TIMEOUT = float(os.environ.get("DEEPSEEK_TIMEOUT_S", "20.0"))


_LANG_NAMES = {
    "hi": "Hindi (use simple Hindi, no English jargon)",
    "en": "very simple English (class-5 / 10-year-old reading level)",
    "bn": "simple Bengali",
    "te": "simple Telugu",
    "ta": "simple Tamil",
    "mr": "simple Marathi",
    "kn": "simple Kannada",
    "ml": "simple Malayalam",
    "gu": "simple Gujarati",
    "or": "simple Odia",
    "pa": "simple Punjabi",
    "ur": "simple Urdu (Nastaliq / Roman is fine)",
}


SYSTEM_PROMPT = """You are Chitti — explaining a news article to a 10-year-old who lives in India.

RULES (HARD):
1. Use very simple, everyday words. No jargon. If a hard word is unavoidable, define it in the same sentence.
2. 3 to 5 short sentences. No bullet points unless the user asked for them. This is for reading aloud.
3. Stay neutral. No opinions. No labels for political parties, religions, or people. Equal coverage when more than one side exists.
4. Do NOT add facts that are not in the article.
5. Do NOT moralise, lecture, or end with "what we should do". Just explain.
6. End with one sentence that says what may happen next — only if the article itself says so. Otherwise leave it out.
"""


def explain_simply(db: Session, article_id: int, language: str = "en") -> dict:
    """
    Return a 3–5-sentence plain-language explanation of the article.

    Shape:
      { ok, source: "deepseek" | "fallback", language, model,
        explanation, spoken (alias for explanation, frontend hands to
        Chitti.speak), disclaimer_en, disclaimer_hi }
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        return {"ok": False, "error": "article not found"}

    if not DEEPSEEK_KEY:
        return _fallback(article, language)

    lang_phrase = _LANG_NAMES.get(language, _LANG_NAMES["en"])
    user_msg = (
        f"Please explain this news article in {lang_phrase}.\n\n"
        f"Title: {article.title}\n"
        f"Source: {article.source_name or article.source_slug}\n"
        f"Summary: {(article.summary or '')[:1500]}"
    )
    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": 350,
        "temperature": 0.3,
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_KEY}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=HTTP_TIMEOUT) as client:
            r = client.post(DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        text = (data["choices"][0]["message"]["content"] or "").strip()
        if not text:
            return _fallback(article, language)
        return {
            "ok": True,
            "source": "deepseek",
            "language": language,
            "model": DEEPSEEK_MODEL,
            "article_id": article.id,
            "explanation": text,
            "spoken": text,
            "disclaimer_en": _DISCLAIMER_EN,
            "disclaimer_hi": _DISCLAIMER_HI,
        }
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s on explain_simply: %s", e.response.status_code, e.response.text[:200])
        return {**_fallback(article, language), "error": f"deepseek_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek explain_simply failed: %s", e)
        return {**_fallback(article, language), "error": str(e)[:200]}


_DISCLAIMER_EN = (
    "This is a plain-language explanation by Chitti. It does not add facts. "
    "Open the source link before sharing."
)
_DISCLAIMER_HI = (
    "यह चिट्टी की सरल भाषा में व्याख्या है। इसमें नए तथ्य नहीं जोड़े गए हैं। "
    "साझा करने से पहले मूल स्रोत खोलें।"
)


def _fallback(article: Article, language: str) -> dict:
    """Honest stub when DeepSeek isn't configured — returns the source's own summary trimmed."""
    summary = (article.summary or article.title or "").strip()
    note_en = "Chitti's Explain Simply is offline right now (no DEEPSEEK_API_KEY). Showing the source summary instead."
    note_hi = "अभी सरल भाषा सुविधा ऑफ़लाइन है (DEEPSEEK कुंजी नहीं)। मूल सारांश दिखा रहा हूँ।"
    return {
        "ok": True,
        "source": "fallback",
        "language": language,
        "model": None,
        "article_id": article.id,
        "explanation": summary[:600] or article.title,
        "spoken": summary[:600] or article.title,
        "note_en": note_en,
        "note_hi": note_hi,
        "disclaimer_en": _DISCLAIMER_EN,
        "disclaimer_hi": _DISCLAIMER_HI,
    }
