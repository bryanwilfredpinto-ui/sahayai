"""
Ranker. Stub. Implements the formula in skills/RANKING_FORMULA.md:
  Relevance = (KW × 0.4) + (Community × 0.3) + (Freshness × 0.2) + (FreeGen × 0.1)
"""
from __future__ import annotations

import logging

log = logging.getLogger("chitti-news-ai.ranker")


def rank_tools_for_topics(topics: list[str], tools: list[dict]) -> list[dict]:
    log.debug("ranker stub — returning empty list per honest-stub rule.")
    return []
