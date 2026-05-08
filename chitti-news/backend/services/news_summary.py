"""
services/news_summary.py
------------------------
"Chitti's Take" — Anthropic-powered 3-bullet summary of an article in
the user's chosen language. Cached on the Article row's `summary`
column? No — we keep the original RSS summary there. Instead, this
returns the take live each call, but the caller can cache it themselves.

Three-bullet format (CNA-FAST inspired):
  • What happened (one factual line)
  • Why it matters (one impact line)
  • What's next (one forward-looking line)

Always returns even if Anthropic is unconfigured — falls back to a
trimmed RSS summary.
"""
from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from config import settings
from models.article import Article

log = logging.getLogger("news_summary")


def _fallback(article: Article, language: str) -> dict:
    summary = (article.summary or article.title or "").strip()
    bullets = [s.strip() for s in summary.split(".") if s.strip()][:3]
    return {
        "ok": True,
        "source": "fallback",
        "bullets": bullets or [summary[:200]],
        "language": language,
        "note_en": "Chitti's Take is unavailable (Anthropic key not configured) — showing the source's own summary instead.",
        "note_hi": "चिट्टी की टेक उपलब्ध नहीं (Anthropic कुंजी सेट नहीं) — मूल स्रोत का सारांश दिखा रहा हूँ।",
    }


def _build_prompt(article: Article, language: str) -> str:
    lang_name = {"en": "English", "hi": "Hindi", "bn": "Bangla", "te": "Telugu",
                 "ta": "Tamil", "mr": "Marathi", "kn": "Kannada", "od": "Odia"}.get(language, language)
    return (
        f"You are Chitti — a friendly Indian news assistant. Read this article and "
        f"produce a 3-bullet summary in {lang_name}, exactly:\n"
        f"  1. What happened (one factual sentence, no opinion)\n"
        f"  2. Why it matters (one impact sentence, neutral)\n"
        f"  3. What's next (one forward-looking sentence)\n\n"
        f"Rules:\n"
        f" - No commentary, no editorialising, no political tilt.\n"
        f" - Plain words. A 12-year-old should understand.\n"
        f" - Do NOT make up facts not present in the source.\n"
        f" - Output ONLY the 3 bullets — no preamble, no closing line.\n"
        f" - Each bullet should start with '• ' (U+2022 + space) and be on its own line.\n\n"
        f"Article:\n"
        f"  Title: {article.title}\n"
        f"  Source: {article.source_name or article.source_slug}\n"
        f"  Summary: {(article.summary or '')[:1500]}\n"
    )


def chittis_take(db: Session, article_id: int, language: str = "en") -> dict:
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        return {"ok": False, "error": "article not found"}

    if not settings.ANTHROPIC_API_KEY:
        return _fallback(article, language)

    try:
        from anthropic import Anthropic
    except ImportError:
        return _fallback(article, language)

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        msg = client.messages.create(
            model=settings.ANTHROPIC_MODEL or "claude-sonnet-4-6",
            max_tokens=400,
            messages=[{"role": "user", "content": _build_prompt(article, language)}],
        )
        text = "".join(part.text for part in msg.content if getattr(part, "type", None) == "text")
        bullets = [b.lstrip("•").strip() for b in text.splitlines() if b.strip().startswith("•")]
        if not bullets:
            # Fallback: split on newline / period
            bullets = [s.strip() for s in text.split("\n") if s.strip()][:3]
        return {
            "ok": True,
            "source": "anthropic",
            "bullets": bullets[:3],
            "language": language,
            "model": settings.ANTHROPIC_MODEL,
        }
    except Exception as e:  # noqa: BLE001
        log.exception("Anthropic take failed: %s", e)
        return {**_fallback(article, language), "error": str(e)[:200]}
