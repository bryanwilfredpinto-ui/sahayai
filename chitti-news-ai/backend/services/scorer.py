"""
Importance scorer. Stub. Real implementation per skills/IMPORTANCE_SCORING.md.
"""
from __future__ import annotations

import logging

log = logging.getLogger("chitti-news-ai.scorer")


def importance_for_article(article: dict) -> float:
    log.debug("importance stub for %s", article.get("url"))
    return 0.0
