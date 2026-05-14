"""
services/rss_fetcher.py
-----------------------

Wires the 17 Layer-1 pre-approved sources seeded from
backend/data/sources.json into the articles table. Polled every
RSS_POLL_MINUTES (default 360 = 6h) by news_scheduler.poll_all_job, and
triggered manually via POST /api/news-ai/admin/rss/poll-now.

Contract (per chitti-news-ai/skills/CONTEXT.md §6 + TRUST_VERIFICATION.md
Layer 2):

  - Skip sources marked ai_crawl_blocked=True. We respect robots.txt /
    licensing blocks (some outlets explicitly disallow AI crawling).
  - Identify ourselves honestly via User-Agent.
  - One source failure does not poison the others — log + continue.
  - Insert ONLY new articles (URL uniqueness).
  - Cap each feed at FETCH_PER_SOURCE_CAP articles per poll so a 500-item
    feed cannot stall the worker.
  - last_fetched_utc updated regardless of new-count (so the source
    directory shows recency honestly).
  - is_launch / is_pricing_change / is_free_tier_change set by the
    deterministic keyword classifier in services.scorer. The LLM
    importance score remains 0.0 until the DeepSeek scorer ships
    (per Honest stubs over fake demos, SAHAYAI_MASTER.md §3).

Returns a stats dict suitable for /admin/rss/poll-now JSON.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from time import mktime
from typing import Optional

import feedparser
import requests
from bs4 import BeautifulSoup

from config import settings
from database import SessionLocal
from models.articles import Article
from models.sources import Source
from services import scorer

log = logging.getLogger("chitti-news-ai.rss")

USER_AGENT = f"ChittiNewsAI/{settings.version} (+{settings.backend_url}; news-ai@sahayai.in)"
REQUEST_TIMEOUT = 20
FETCH_PER_SOURCE_CAP = 50


# Lightweight keyword filter for the two community-firehose feeds where
# only a slice of items are AI-relevant. Applied at ingest time so the DB
# stays focused; deliberately conservative (high precision, lower recall).
_AI_KW = re.compile(
    r"\b(ai|llm|slm|gpt|gemini|claude|llama|mistral|"
    r"deepseek|qwen|phi|grok|huggingface|hugging\s+face|stable\s+diffusion|"
    r"midjourney|openai|anthropic|deepmind|nvidia|copilot|cursor|groq|"
    r"perplexity|machine\s+learning|neural|transformer|rag|moe|lora|rlhf|"
    r"model[- ]?context|generative|agentic)\b",
    re.I,
)


def poll_all() -> dict:
    """Poll every active source. Returns stats."""
    stats: dict = {
        "started_utc": datetime.utcnow().isoformat() + "Z",
        "sources_polled": 0,
        "sources_skipped_blocked": 0,
        "sources_failed": 0,
        "new_articles": 0,
        "errors": [],
    }
    with SessionLocal() as db:
        sources = (
            db.query(Source)
            .filter(Source.active == True)  # noqa: E712
            .all()
        )
        for src in sources:
            if src.ai_crawl_blocked:
                stats["sources_skipped_blocked"] += 1
                log.info("skip ai_crawl_blocked source: %s", src.name)
                continue
            try:
                if src.kind == "rss":
                    n = _poll_rss(db, src)
                elif src.kind == "scrape":
                    n = _poll_scrape(db, src)
                else:
                    log.warning("unknown source kind %r for %s", src.kind, src.name)
                    continue
                src.last_fetched_utc = datetime.utcnow()
                db.commit()
                stats["sources_polled"] += 1
                stats["new_articles"] += n
                log.info("polled %s: %d new", src.name, n)
            except Exception as e:  # noqa: BLE001
                db.rollback()
                stats["sources_failed"] += 1
                stats["errors"].append({"source": src.name, "error": str(e)[:200]})
                log.warning("poll failed for %s: %s", src.name, e)
    stats["finished_utc"] = datetime.utcnow().isoformat() + "Z"
    return stats


# ---------------------------------------------------------------- RSS ----

def _poll_rss(db, src: Source) -> int:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/rss+xml,application/atom+xml,application/xml;q=0.9,*/*;q=0.8"}
    resp = requests.get(src.url, headers=headers, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    parsed = feedparser.parse(resp.content)
    if parsed.bozo and not parsed.entries:
        raise RuntimeError(f"malformed feed: {parsed.bozo_exception!r}")

    is_community_firehose = src.category == "community" and "ycombinator" in (src.url or "")
    is_reddit = "reddit.com" in (src.url or "")
    needs_ai_filter = is_community_firehose or is_reddit

    count = 0
    for entry in parsed.entries[:FETCH_PER_SOURCE_CAP]:
        url = (entry.get("link") or "").strip()
        if not url:
            continue
        if db.query(Article.id).filter(Article.url == url).first():
            continue

        title = (entry.get("title") or "").strip()[:500]
        summary = _clean_summary(entry)
        blob = f"{title} {summary}"

        if needs_ai_filter and not _AI_KW.search(blob):
            continue

        article = Article(
            source_id=src.id,
            url=url,
            title=title,
            summary=summary,
            published_utc=_parse_published(entry),
            language=src.language,
            importance_score=0.0,  # LLM scorer pending — see Honest-stubs rule
        )
        scorer.classify_article(article)
        db.add(article)
        count += 1
    return count


def _clean_summary(entry) -> Optional[str]:
    """Strip HTML from a feed entry summary; cap at 600 chars."""
    raw = entry.get("summary") or entry.get("description") or ""
    if not raw:
        return None
    try:
        text = BeautifulSoup(raw, "html.parser").get_text(" ", strip=True)
    except Exception:
        text = raw
    text = re.sub(r"\s+", " ", text).strip()
    return text[:600] or None


def _parse_published(entry) -> Optional[datetime]:
    for key in ("published_parsed", "updated_parsed"):
        tm = entry.get(key)
        if tm:
            try:
                return datetime.fromtimestamp(mktime(tm), tz=timezone.utc).replace(tzinfo=None)
            except Exception:
                pass
    return None


# ------------------------------------------------------------- SCRAPE ----

def _poll_scrape(db, src: Source) -> int:
    """Two scrape paths today — Hugging Face new-models and GitHub Trending."""
    host = src.url
    if "huggingface.co/models" in host:
        return _scrape_hf_new_models(db, src)
    if "github.com/trending" in host:
        return _scrape_github_trending(db, src)
    log.warning("no scrape adapter wired for %s", src.url)
    return 0


def _scrape_hf_new_models(db, src: Source) -> int:
    """Hugging Face has a public JSON API — no HTML scrape needed.
    Endpoint: https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=20"""
    api = "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=20"
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(api, headers=headers, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    payload = resp.json()
    count = 0
    for m in payload[:FETCH_PER_SOURCE_CAP]:
        model_id = m.get("modelId") or m.get("id")
        if not model_id:
            continue
        url = f"https://huggingface.co/{model_id}"
        if db.query(Article.id).filter(Article.url == url).first():
            continue
        title = f"New model: {model_id}"
        summary_parts = []
        if m.get("pipeline_tag"):
            summary_parts.append(f"Task: {m['pipeline_tag']}")
        if m.get("downloads") is not None:
            summary_parts.append(f"Downloads: {m['downloads']}")
        if m.get("likes") is not None:
            summary_parts.append(f"Likes: {m['likes']}")
        summary = " · ".join(summary_parts) if summary_parts else "Newly published Hugging Face model."

        published = None
        for key in ("createdAt", "lastModified"):
            if m.get(key):
                try:
                    published = datetime.fromisoformat(m[key].replace("Z", "+00:00")).replace(tzinfo=None)
                    break
                except Exception:
                    pass

        article = Article(
            source_id=src.id,
            url=url,
            title=title[:500],
            summary=summary[:600],
            published_utc=published,
            language=src.language,
            importance_score=0.0,
            is_launch=1,  # every new model is a launch by construction
        )
        scorer.classify_article(article)
        article.is_launch = 1  # re-assert after classifier
        db.add(article)
        count += 1
    return count


def _scrape_github_trending(db, src: Source) -> int:
    """GitHub Trending has no JSON API. Parse the HTML page and keep only
    AI-keyword matches so we don't pollute the corpus with unrelated repos."""
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    resp = requests.get(src.url, headers=headers, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    count = 0
    for art in soup.select("article.Box-row")[:FETCH_PER_SOURCE_CAP]:
        a = art.select_one("h2 a")
        if not a:
            continue
        href = a.get("href", "").strip()
        if not href:
            continue
        repo_slug = href.lstrip("/")
        url = "https://github.com/" + repo_slug
        if db.query(Article.id).filter(Article.url == url).first():
            continue

        title_text = f"Trending repo: {repo_slug}"
        desc_el = art.select_one("p")
        desc_text = (desc_el.get_text(" ", strip=True) if desc_el else "")[:600]
        blob = f"{title_text} {desc_text}"
        if not _AI_KW.search(blob):
            continue  # not AI-relevant — skip

        article = Article(
            source_id=src.id,
            url=url,
            title=title_text[:500],
            summary=desc_text or None,
            published_utc=None,  # GitHub Trending doesn't expose a publish ts
            language=src.language,
            importance_score=0.0,
            is_launch=1,  # trending = noteworthy launch / release surface
        )
        scorer.classify_article(article)
        article.is_launch = 1
        db.add(article)
        count += 1
    return count
