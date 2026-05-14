"""
Topic extractor. Stub. DeepSeek-backed in production; no hardcoded
profession list. Per skills/RANKING_FORMULA.md.
"""
from __future__ import annotations

import logging

log = logging.getLogger("chitti-news-ai.topics")


def extract_topics_from_profession(text: str, language: str) -> list[str]:
    log.debug("topic extraction stub for lang=%s", language)
    return []
