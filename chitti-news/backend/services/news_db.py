"""
services/news_db.py
-------------------
Read paths for the article feed.

  feed(state, language, category, limit)         → card list with EN/HI captions
  list_breaking(state, language, limit)          → currently-active alerts
  get_article(article_id)                        → single row
  list_sources(state, language)                  → source registry slice
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models.article import Article
from models.breaking_alert import BreakingAlert
from models.source import Source

log = logging.getLogger("news_db")


def _row_to_dict(a: Article) -> dict:
    return {
        "id": a.id,
        "title": a.title,
        "link": a.link,
        "summary": a.summary,
        "source_slug": a.source_slug,
        "source_name": a.source_name,
        "image_url": a.image_url,
        "state": a.state,
        "language": a.language,
        "category": a.category,
        "is_breaking": bool(a.is_breaking),
        "importance": a.importance,
        "published_at": a.published_at.isoformat() if a.published_at else None,
        "fetched_at": a.fetched_at.isoformat() if a.fetched_at else None,
    }


def feed(
    db: Session,
    *,
    state: str = "india",
    language: str = "en",
    category: str = "national",
    limit: int = 30,
) -> dict:
    """
    Returns:
      { items, count, state, language, category,
        speak_en, speak_hi, caption_en, caption_hi, disclaimer_en/hi }
    """
    q = db.query(Article).filter(
        Article.state.in_([state, "india"]),  # state-specific OR national fallback
        Article.language == language,
    )
    if category and category != "all":
        q = q.filter(Article.category == category)

    rows = q.order_by(
        desc(Article.is_breaking),
        desc(Article.importance),
        desc(Article.published_at),
        desc(Article.fetched_at),
    ).limit(max(1, min(limit, 100))).all()

    items = [_row_to_dict(r) for r in rows]

    return {
        "items": items,
        "count": len(items),
        "state": state,
        "language": language,
        "category": category,
        "speak_en": (
            f"{len(items)} {category} stories from {state.title()}."
            if items else f"No {category} stories yet for {state}. Pull to refresh in a minute."
        ),
        "speak_hi": (
            f"{state} से {len(items)} {category} खबरें।"
            if items else f"{state} के लिए अभी कोई {category} खबर नहीं। एक मिनट में नई खबरें आएँगी।"
        ),
        "caption_en": f"{state} · {language} · {category} · {len(items)} stories",
        "caption_hi": f"{state} · {language} · {category} · {len(items)} खबरें",
        "disclaimer_en": (
            "Chitti News aggregates headlines from public RSS feeds. "
            "We do not write the news — we deliver it. Verify with the source link before sharing."
        ),
        "disclaimer_hi": (
            "चिट्टी न्यूज़ सार्वजनिक RSS फ़ीड से शीर्षक एकत्र करता है। "
            "हम खबरें नहीं लिखते — हम पहुँचाते हैं। शेयर करने से पहले मूल स्रोत पर पुष्टि करें।"
        ),
    }


def list_breaking(db: Session, *, state: str = "india", language: str = "en", limit: int = 10) -> list[dict]:
    now = datetime.utcnow()
    rows = (
        db.query(BreakingAlert)
        .filter(
            BreakingAlert.expires_at > now,
            BreakingAlert.state.in_([state, "india"]),
            BreakingAlert.language == language,
        )
        .order_by(desc(BreakingAlert.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "headline": r.headline,
            "article_id": r.article_id,
            "sources_count": r.sources_count,
            "expires_at": r.expires_at.isoformat() if r.expires_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


def get_article(db: Session, article_id: int) -> Optional[dict]:
    a = db.query(Article).filter(Article.id == article_id).first()
    return _row_to_dict(a) if a else None


def list_sources(
    db: Session, *, state: Optional[str] = None, language: Optional[str] = None
) -> list[dict]:
    q = db.query(Source).filter(Source.enabled == 1)
    if state:
        q = q.filter(Source.state.in_([state, "india"]))
    if language:
        q = q.filter(Source.language == language)
    rows = q.order_by(Source.state, Source.language, Source.category, Source.slug).all()
    return [
        {
            "slug": r.slug,
            "display_name": r.display_name,
            "homepage_url": r.homepage_url,
            "state": r.state,
            "language": r.language,
            "category": r.category,
            "last_fetched_at": r.last_fetched_at.isoformat() if r.last_fetched_at else None,
            "last_error": (r.last_error or "")[:160] or None,
        }
        for r in rows
    ]
