"""
services/enhancement.py
-----------------------
LLM enhancement layer (CHITTI_NEWS_AI_MASTER_SPEC v0.3 §4.3).

This module sits OUTSIDE the classification critical path. It produces
user-facing enrichments — short summaries, on-demand "Chitti explains",
career-impact bullets — and is allowed to call an LLM when one is
configured. **Critically**, every enhancement has an extractive fallback
that works with zero LLM dependencies, honoring the v0.3 fail-open
contract.

Public API:

  summarise(title, summary, content=None, *, max_sentences=3)
      Returns: {"text": str, "source": "extractive"|"llm",
                "rule_version": str}
      Always returns a real string. Never empty. Never invents content —
      extractive mode pulls existing sentences from the provided text.

  explain(article_dict, *, language="en", profession=None)
      Returns: {"text": str, "ok": bool, "source": "llm"|"extractive",
                "language": str, "fallback_reason": Optional[str]}
      Delegates to the existing news_explain.explain() when LLM is
      reachable; falls back to extractive summarise() when offline.

  career_insight(item_dict, profession_slug, *, language="en")
      Returns: {"bullets": [str, ...], "source": "extractive"|"llm",
                "honest_note": Optional[str]}
      Extracts up to 3 sentences from the item's title+summary that
      reference profession-relevant keywords. LLM is OPTIONAL and only
      used to translate / re-phrase, never to invent claims.

Failure model:
  - LLM unreachable → extractive fallback path activates, response carries
    `source: "extractive"` so the UI can show the honesty marker.
  - Network error → caught, extractive fallback.
  - Empty input → returns the title as a single "sentence" (honest minimum).
"""
from __future__ import annotations

import logging
import os
import re
from typing import Optional

log = logging.getLogger("enhancement")

RULE_VERSION = "v0.3-enhancement-2026-05-29"
MAX_SUMMARY_SENTENCES = int(os.environ.get("ENHANCEMENT_MAX_SENTENCES", "3"))


# ────────────────────────────────────────────────────────────────────────
# Extractive primitives (no LLM)
# ────────────────────────────────────────────────────────────────────────

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")


def _split_sentences(text: str) -> list[str]:
    """Cheap sentence splitter. Good enough for short summaries."""
    if not text:
        return []
    # Clean common HTML / whitespace noise.
    s = re.sub(r"\s+", " ", text).strip()
    s = re.sub(r"<[^>]+>", "", s)
    parts = _SENTENCE_SPLIT.split(s)
    return [p.strip() for p in parts if p.strip()]


def _extractive_summary(title: str, summary: Optional[str], content: Optional[str],
                         max_sentences: int) -> str:
    """Pull up to N sentences from summary > content > title, in that order.

    Never invents text. If only a title is available, returns it verbatim.
    """
    body = (summary or "").strip() or (content or "").strip()
    if body:
        sents = _split_sentences(body)
        if sents:
            return " ".join(sents[:max_sentences])
    # Honest minimum: return title.
    return (title or "").strip() or "(no content available)"


def summarise(title: str, summary: Optional[str] = None, content: Optional[str] = None,
              *, max_sentences: int = MAX_SUMMARY_SENTENCES) -> dict:
    """Extractive summary — never invents content. LLM is NOT used here
    (LLM polish lives in `explain()` / `career_insight()`).
    """
    text = _extractive_summary(title, summary, content, max_sentences)
    return {"text": text, "source": "extractive", "rule_version": RULE_VERSION}


# ────────────────────────────────────────────────────────────────────────
# On-demand explain (delegates to news_explain when LLM is up)
# ────────────────────────────────────────────────────────────────────────

def explain(article_dict: dict, *, language: str = "en",
            profession: Optional[str] = None) -> dict:
    """Long-form explanation in the user's language.

    Path 1 (LLM up):    delegate to services.news_explain.explain()
                        which talks to DeepSeek/Gemini per the env hijack.
    Path 2 (LLM down):  extractive 3-sentence summary in the source's own
                        language, with an honest "translation unavailable"
                        note when the source language != requested.
    """
    # Try LLM path first
    try:
        from services import news_explain
        if (os.environ.get("DEEPSEEK_API_KEY") or "").strip():
            result = news_explain.explain(article_dict, language=language)
            if result.get("ok"):
                return {
                    "text": result.get("explanation_text") or result.get("text", ""),
                    "ok": True, "source": "llm", "language": language,
                    "fallback_reason": None,
                }
            fallback_reason = f"llm_returned_not_ok: {result.get('error') or 'unknown'}"
        else:
            fallback_reason = "llm_key_unset"
    except Exception as e:  # noqa: BLE001
        fallback_reason = f"llm_error: {type(e).__name__}"

    # Extractive fallback
    s = summarise(
        article_dict.get("title", ""),
        article_dict.get("summary"),
        article_dict.get("content"),
        max_sentences=4,
    )
    src_lang = (article_dict.get("language") or "en").lower()
    honest = None
    if src_lang and src_lang != language:
        honest = f"Translation to {language} unavailable right now; showing source-language excerpt ({src_lang})."
    return {
        "text": s["text"],
        "ok": True, "source": "extractive", "language": src_lang,
        "fallback_reason": fallback_reason,
        "honest_note": honest,
    }


# ────────────────────────────────────────────────────────────────────────
# Career insight — extractive bullets per profession
# ────────────────────────────────────────────────────────────────────────

def _profession_keywords(profession_slug: str) -> list[str]:
    """Pull a profession's keyword list from the registry for relevance highlighting."""
    try:
        from services.profession_classifier import _REGISTRY
        prof = _REGISTRY.get(profession_slug)
        if not prof:
            return []
        return list(set(
            prof.get("strong_keywords", []) +
            prof.get("aliases", []) +
            prof.get("intent_keywords", [])
        ))
    except Exception:  # noqa: BLE001
        return []


def career_insight(item_dict: dict, profession_slug: str,
                   *, language: str = "en") -> dict:
    """Up to 3 bullets explaining why this item matters to the chosen
    profession. Bullets are EXTRACTED from the item's own text — sentences
    that contain at least one profession-relevant keyword are surfaced
    verbatim. If no such sentences exist, returns an honest empty state.

    LLM is intentionally NOT called for career insight in v0.3 — bullets
    are deterministic and traceable. Optional LLM translation may be added
    in a future version with explicit honest-note markers.
    """
    title = item_dict.get("title", "") or ""
    summary = item_dict.get("summary", "") or ""
    topics = item_dict.get("topics", "") or ""
    if isinstance(topics, list):
        topics = ", ".join(topics)
    full_text = " ".join([title, summary, topics])

    kws = [k.lower() for k in _profession_keywords(profession_slug)]
    sentences = _split_sentences(full_text)
    if not sentences:
        return {"bullets": [], "source": "extractive",
                "honest_note": "Source provides no text to extract from."}

    # Score each sentence by # of profession-keyword hits
    scored: list[tuple[int, str]] = []
    for s in sentences:
        s_lc = s.lower()
        hits = sum(1 for k in kws if k and k in s_lc)
        if hits > 0:
            scored.append((hits, s))

    bullets: list[str]
    honest: Optional[str]
    if scored:
        scored.sort(key=lambda t: -t[0])
        bullets = [s for _, s in scored[:3]]
        honest = None
    else:
        # Honest empty state — no profession-specific sentence available.
        bullets = []
        honest = (f"This item carries no sentence explicitly mentioning "
                  f"{profession_slug.replace('-', ' ')} terms. "
                  f"Treat the title + summary as the source of truth.")

    return {
        "bullets": bullets,
        "source": "extractive",
        "rule_version": RULE_VERSION,
        "honest_note": honest,
    }
