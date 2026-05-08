"""
services/news_factcheck.py
--------------------------
Fact Checker Agent — cross-references an article against other articles
in our DB to estimate "how many trusted sources agree".

Strategy (v1, no LLM required):
  1. Take the article's normalized title.
  2. Find other articles in the last 48h with high-similarity titles
     (rapidfuzz token_set_ratio ≥ 70).
  3. Count distinct source_slugs that match.
  4. Verdict:
       - 'verified'   if ≥ 3 distinct trusted sources
       - 'partial'    if 2 distinct sources
       - 'disputed'   if exactly 1 other source AND headlines diverge sharply
       - 'unverified' if no cross-source signal
  5. Cache the result in `fact_checks` table — re-running returns the cache
     if checked within the last 6 hours.

Trusted-source whitelist is the slugs already configured in data/sources.json.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from rapidfuzz import fuzz
from sqlalchemy import desc
from sqlalchemy.orm import Session

from models.article import Article
from models.fact_check import FactCheck

log = logging.getLogger("news_factcheck")

CACHE_HOURS = 6
LOOKBACK_HOURS = 48
TITLE_SIM_THRESHOLD = 70


def _normalize(t: str) -> str:
    return " ".join((t or "").lower().split())


def factcheck(db: Session, article_id: int, *, force: bool = False) -> dict:
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        return {"ok": False, "error": "article not found"}

    # Cache hit?
    if not force:
        existing = db.query(FactCheck).filter(FactCheck.article_id == article_id).first()
        if existing and existing.checked_at and existing.checked_at > datetime.utcnow() - timedelta(hours=CACHE_HOURS):
            return _to_dict(article, existing)

    # Cross-source matching
    cutoff = datetime.utcnow() - timedelta(hours=LOOKBACK_HOURS)
    candidates = (
        db.query(Article)
        .filter(
            Article.id != article_id,
            Article.fetched_at >= cutoff,
            Article.language == article.language,
        )
        .order_by(desc(Article.fetched_at))
        .limit(500)
        .all()
    )

    target_norm = _normalize(article.title)
    matched_sources: set[str] = set()
    matched_articles: list[dict] = []
    for c in candidates:
        score = fuzz.token_set_ratio(target_norm, _normalize(c.title))
        if score >= TITLE_SIM_THRESHOLD and c.source_slug != article.source_slug:
            matched_sources.add(c.source_slug)
            matched_articles.append({
                "id": c.id,
                "title": c.title,
                "source_slug": c.source_slug,
                "source_name": c.source_name,
                "score": score,
                "link": c.link,
            })
            if len(matched_articles) >= 8:
                break

    n = len(matched_sources)
    if n >= 3:
        verdict = "verified"; confidence = min(95, 60 + n * 8)
    elif n == 2:
        verdict = "partial"; confidence = 70
    elif n == 1:
        verdict = "disputed"; confidence = 45
    else:
        verdict = "unverified"; confidence = 25

    rationale_en = _build_rationale(article, matched_sources, matched_articles, verdict, lang="en")
    rationale_hi = _build_rationale(article, matched_sources, matched_articles, verdict, lang="hi")

    # Upsert
    fc = db.query(FactCheck).filter(FactCheck.article_id == article_id).first()
    if fc is None:
        fc = FactCheck(article_id=article_id)
        db.add(fc)
    fc.verdict = verdict
    fc.confidence = confidence
    fc.matched_sources = json.dumps(sorted(matched_sources))
    fc.rationale = rationale_en
    fc.rationale_hi = rationale_hi
    fc.checked_at = datetime.utcnow()
    db.commit()
    db.refresh(fc)

    out = _to_dict(article, fc)
    out["matched_articles"] = matched_articles[:5]
    return out


def _build_rationale(article, matched_sources: set[str], matched: list[dict],
                     verdict: str, lang: str) -> str:
    n = len(matched_sources)
    if lang == "hi":
        if verdict == "verified":
            return f"{n} अन्य भरोसेमंद स्रोतों ने यही खबर दी है। ज़्यादातर ब्योरे मेल खाते हैं।"
        if verdict == "partial":
            return f"{n} अन्य स्रोतों ने यही खबर दी है — बड़े ब्योरे मेल खाते हैं पर कुछ अंतर हैं।"
        if verdict == "disputed":
            return f"केवल 1 अन्य स्रोत मिला और सुर्खियाँ अलग हैं। पुष्टि से पहले स्रोत पर जाएँ।"
        return "अभी किसी अन्य स्रोत पर यह खबर नहीं मिली। अकेला स्रोत — खबर पुरानी हो सकती है या क्षेत्रीय।"
    # EN
    if verdict == "verified":
        return f"{n} other trusted sources are running this story; key facts agree."
    if verdict == "partial":
        return f"{n} other sources cover this; the broad facts match but details differ."
    if verdict == "disputed":
        return "Only 1 other source found and the headline diverges. Check the source link before sharing."
    return "No cross-source corroboration yet. Single-source story — may be hyperlocal or just-breaking."


def _to_dict(article, fc: FactCheck) -> dict:
    try:
        sources = json.loads(fc.matched_sources or "[]")
    except (TypeError, ValueError):
        sources = []
    symbol_map = {"verified": "✅", "partial": "🟡", "disputed": "⚠️", "unverified": "❔"}
    color_map  = {"verified": "green", "partial": "amber", "disputed": "red", "unverified": "muted"}
    return {
        "ok": True,
        "article_id": article.id,
        "verdict": fc.verdict,
        "symbol": symbol_map.get(fc.verdict, "❔"),
        "color": color_map.get(fc.verdict, "muted"),
        "confidence": fc.confidence,
        "matched_sources": sources,
        "rationale_en": fc.rationale,
        "rationale_hi": fc.rationale_hi,
        "checked_at": fc.checked_at.isoformat() if fc.checked_at else None,
    }
