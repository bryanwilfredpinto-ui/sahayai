"""
services/scorer.py
------------------

Deterministic classifier — sets is_launch / is_pricing_change /
is_free_tier_change on an Article from its title + summary alone.

Honest design — these flags are NOT importance. They are factual category
labels (was this a launch? a pricing change?) derived from keywords. The
full 0–100 importance score (skills/IMPORTANCE_SCORING.md) needs DeepSeek
+ multi-source corroboration; that LLM scorer is queued as a follow-up.

Why keep classifier separate from importance:
  - Classifier is deterministic + reproducible (no LLM cost, no LLM lies).
  - Importance needs cross-source corroboration which only exists AFTER
    the corpus has been seeded for ≥ 24 h.
  - Ship the classifier first → the "New Launches" tab works honestly even
    while the LLM scorer is still being wired.
"""
from __future__ import annotations

import logging
import re

log = logging.getLogger("chitti-news-ai.scorer")


_LAUNCH_RE = re.compile(
    r"\b("
    r"launch(es|ing|ed)?|"
    r"introduc(es|ing|ed)|"
    r"announc(es|ing|ed)|"
    r"releas(es|ing|ed)|"
    r"debut(s|ing|ed)?|"
    r"unveil(s|ing|ed)?|"
    r"available\s+now|"
    r"new\s+model|"
    r"new\s+tool|"
    r"now\s+open|"
    r"trending\s+repo"
    r")\b",
    re.I,
)

_PRICING_RE = re.compile(
    r"\b("
    r"pric(ing|e)|"
    r"price\s+(cut|drop|hike)|"
    r"subscription|"
    r"paywall|"
    r"plan(s)?\s+(change|update|new)|"
    r"tier(s)?\s+(change|update|new)|"
    r"cost(s)?\s+(less|more)|"
    r"per\s+(token|request|month|seat)|"
    r"adds?\s+ads?|"
    r"introduces?\s+ads?"
    r")\b",
    re.I,
)

_FREE_TIER_RE = re.compile(
    r"\b("
    r"free\s+(tier|plan|trial|quota|access|forever)|"
    r"free\s+for\s+\w+|"
    r"now\s+free|"
    r"made\s+free|"
    r"open[- ]source(d|ing)?|"
    r"limit\s+(raised|reduced|cut|increased)|"
    r"quota\s+(raised|reduced|cut|increased)|"
    r"requests?\s+per\s+day"
    r")\b",
    re.I,
)


def classify_article(article) -> None:
    """Mutates the article in place. Safe to call before commit."""
    blob = " ".join(filter(None, [
        getattr(article, "title", ""),
        getattr(article, "summary", ""),
    ]))
    if not blob.strip():
        return
    article.is_launch = 1 if _LAUNCH_RE.search(blob) else 0
    article.is_pricing_change = 1 if _PRICING_RE.search(blob) else 0
    article.is_free_tier_change = 1 if _FREE_TIER_RE.search(blob) else 0


def importance_for_article(article) -> float:
    """LLM importance scorer is queued. Honest stub: returns 0.0 so the
    DB row reflects 'scored: no, awaiting LLM' rather than a fabricated
    number. The frontend renders 'importance pending' until this lands."""
    return 0.0
