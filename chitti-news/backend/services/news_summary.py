"""
services/news_summary.py
------------------------
"Chitti's Take" — **DeepSeek-only** 3-bullet summary of an article in
the user's chosen language. Per LOCKED decision
(`project_ai_provider_switch_to_deepseek`): Anthropic removed from
every backend; OpenAI-compatible client against api.deepseek.com.

Three-bullet format (CNA-FAST inspired):
  • What happened (one factual line)
  • Why it matters (one impact line)
  • What's next (one forward-looking line)

Neutrality contract carries through from chitti-news-politics —
opinion-free, no party labels, equal coverage. The system prompt
mirrors `news_explain.py` so both routes obey the same rules.

Always returns even if DeepSeek is unconfigured — falls back to a
trimmed RSS summary (honest stub, never fake demo).
"""
from __future__ import annotations

import logging
import os

import httpx
from sqlalchemy.orm import Session

from models.article import Article

log = logging.getLogger("news_summary")


# DeepSeek client — read at import time so env-overrides via os.environ
# work the same way as in news_explain.py (no settings dependency, so
# tests and tooling can override without rebuilding chitti-news config).
DEEPSEEK_URL = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
HTTP_TIMEOUT = float(os.environ.get("DEEPSEEK_TIMEOUT_S", "20.0"))


_LANG_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bangla",
    "te": "Telugu",
    "ta": "Tamil",
    "mr": "Marathi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "gu": "Gujarati",
    "or": "Odia",
    "pa": "Punjabi",
    "ur": "Urdu",
}


SYSTEM_PROMPT = """You are Chitti — a neutral Indian news assistant. Produce exactly 3 bullets summarising an article.

Format (each bullet on its own line, starting with "• " — U+2022 + space):
  • What happened (one factual sentence, no opinion)
  • Why it matters (one impact sentence, neutral)
  • What's next (one forward-looking sentence — only if the article itself says so)

RULES (HARD):
- No commentary, no editorialising, no political tilt, no labels for parties / religions / people.
- Plain words. A 12-year-old should understand.
- Do NOT make up facts not present in the source.
- Output ONLY the 3 bullets — no preamble, no closing line, no markdown headings.
"""


def _fallback(article: Article, language: str) -> dict:
    summary = (article.summary or article.title or "").strip()
    bullets = [s.strip() for s in summary.split(".") if s.strip()][:3]
    return {
        "ok": True,
        "source": "fallback",
        "bullets": bullets or [summary[:200]],
        "language": language,
        "note_en": "Chitti's Take is unavailable (no DEEPSEEK_API_KEY configured) — showing the source's own summary instead.",
        "note_hi": "चिट्टी की टेक उपलब्ध नहीं (DEEPSEEK कुंजी सेट नहीं) — मूल स्रोत का सारांश दिखा रहा हूँ।",
    }


def _user_msg(article: Article, language: str) -> str:
    lang_name = _LANG_NAMES.get(language, _LANG_NAMES["en"])
    return (
        f"Summarise this article in {lang_name}.\n\n"
        f"Title: {article.title}\n"
        f"Source: {article.source_name or article.source_slug}\n"
        f"Summary: {(article.summary or '')[:1500]}"
    )


def chittis_take(db: Session, article_id: int, language: str = "en") -> dict:
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        return {"ok": False, "error": "article not found"}

    if not DEEPSEEK_KEY:
        return _fallback(article, language)

    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _user_msg(article, language)},
        ],
        "max_tokens": 400,
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
        bullets = [b.lstrip("•").strip() for b in text.splitlines() if b.strip().startswith("•")]
        if not bullets:
            # Fallback: split on newline / period
            bullets = [s.strip() for s in text.split("\n") if s.strip()][:3]
        return {
            "ok": True,
            "source": "deepseek",
            "bullets": bullets[:3],
            "language": language,
            "model": DEEPSEEK_MODEL,
        }
    except httpx.HTTPStatusError as e:
        log.error("DeepSeek HTTP %s on chittis_take: %s", e.response.status_code, e.response.text[:200])
        return {**_fallback(article, language), "error": f"deepseek_http_{e.response.status_code}"}
    except (httpx.RequestError, KeyError, ValueError) as e:
        log.exception("DeepSeek chittis_take failed: %s", e)
        return {**_fallback(article, language), "error": str(e)[:200]}
