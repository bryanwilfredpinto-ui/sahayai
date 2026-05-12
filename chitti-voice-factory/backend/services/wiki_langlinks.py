"""
services/wiki_langlinks.py — Resolve English Wikipedia topics → native-language titles.

Why this exists
---------------
Naively requesting `https://ta.wikipedia.org/api/rest_v1/page/html/Cricket`
returns 404 because the Tamil Wikipedia has the article under "கிரிக்கெட்",
not under the English redirect. We hit this 30-40% of the time across our
60-topic seed list — too lossy.

Solution: one batched call to the English Wikipedia langlinks API per topic
gives us the native title in every Wikipedia that has the article. Cache
the result so the resolver is amortised.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable, Optional

import requests

log = logging.getLogger("wiki_langlinks")

USER_AGENT = "ChittiFluencyIngester/1.0 (+https://github.com/sahayai/sahayai)"
LANGLINKS_API = "https://en.wikipedia.org/w/api.php"

CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "wiki_langlinks_cache.json"


def _load_cache() -> dict[str, dict[str, str]]:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            return {}
    return {}


def _save_cache(cache: dict[str, dict[str, str]]) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch_langlinks(en_title: str) -> dict[str, str]:
    """
    Return mapping lang_code -> native_title for `en_title`.
    Uses the action=query&prop=langlinks endpoint with lllimit=500.
    """
    try:
        resp = requests.get(
            LANGLINKS_API,
            params={
                "action": "query",
                "format": "json",
                "prop": "langlinks",
                "titles": en_title,
                "lllimit": 500,
                "llprop": "langname",
            },
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:  # noqa: BLE001
        log.info("langlinks fetch failed %s: %s", en_title, e)
        return {}

    pages = data.get("query", {}).get("pages", {})
    out: dict[str, str] = {"en": en_title}
    for _, page in pages.items():
        for link in page.get("langlinks", []):
            lang = link.get("lang")
            title = link.get("*")  # MediaWiki returns the title under "*"
            if lang and title:
                out[lang] = title
    return out


def build_cache(topics: Iterable[str], force: bool = False) -> dict[str, dict[str, str]]:
    """Build / refresh the cache for a list of English topics."""
    cache = _load_cache()
    for topic in topics:
        if not force and topic in cache and cache[topic]:
            continue
        log.info("langlinks for %s ...", topic)
        cache[topic] = fetch_langlinks(topic)
        _save_cache(cache)
    return cache


def title_for(en_title: str, target_lang: str) -> Optional[str]:
    """
    Return the native title in `target_lang` for `en_title`, using the cache.
    Falls back to en_title (so English Wikipedia redirects can still work).
    """
    cache = _load_cache()
    entry = cache.get(en_title) or {}
    return entry.get(target_lang) or (en_title if target_lang == "en" else None)
