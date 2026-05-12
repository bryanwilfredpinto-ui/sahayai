#!/usr/bin/env python3
"""
scripts/build_langlinks.py — One-shot: warm the Wikipedia langlinks cache for
every WIKI_TOPICS entry. Run BEFORE scripts/ingest_textbooks.py.

Why: requesting `https://<lang>.wikipedia.org/.../Cricket` 404s in most
non-English Wikipedias. Calling action=query&prop=langlinks once per topic
on English Wikipedia returns the native title in every edition. Cache lives
at data/wiki_langlinks_cache.json. Subsequent ingestion runs read from it.
"""
from __future__ import annotations

import logging
import sys
import time
from pathlib import Path

THIS = Path(__file__).resolve()
BACKEND = THIS.parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services import wiki_langlinks  # noqa: E402
from services.textbook_sources import WIKI_TOPICS  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("build_langlinks")


def main() -> int:
    started = time.time()
    log.info("Warming langlinks cache for %d topics...", len(WIKI_TOPICS))
    cache = wiki_langlinks.build_cache(WIKI_TOPICS, force=False)
    elapsed = time.time() - started
    # Coverage report
    hits_per_lang: dict[str, int] = {}
    for topic, mapping in cache.items():
        for lang in mapping.keys():
            hits_per_lang[lang] = hits_per_lang.get(lang, 0) + 1
    log.info("Cached titles for %d topics in %.1fs", len(cache), elapsed)
    log.info("Top language coverage:")
    for lang, n in sorted(hits_per_lang.items(), key=lambda kv: -kv[1])[:30]:
        log.info("  %s: %d/%d", lang, n, len(WIKI_TOPICS))
    chitti_langs = ["hi", "bn", "te", "ta", "kn", "ml", "mr", "gu", "or", "as",
                    "pa", "ur", "bh", "mai", "kok", "sd", "ks", "mni", "sat",
                    "sa", "tcy"]
    log.info("Chitti-language coverage:")
    for lang in chitti_langs:
        log.info("  %s: %d/%d", lang, hits_per_lang.get(lang, 0), len(WIKI_TOPICS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
