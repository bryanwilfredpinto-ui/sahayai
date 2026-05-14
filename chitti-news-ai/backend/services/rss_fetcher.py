"""
RSS poller. Stub. Real implementation queued — see skills/FEATURES.md N2.

When wired, this module will:
  1. Read backend/data/sources.json + DB sources table.
  2. feedparser-parse each active RSS URL.
  3. Skip sources where Layer 2 monitoring marked ai_crawl_blocked=True.
  4. Insert new articles + run topic extraction + importance scoring.

The honest stub returns 0 fetched so the boot path stays green without
inventing fake articles. Matches §3 "Honest stubs over fake demos".
"""
from __future__ import annotations

import logging

log = logging.getLogger("chitti-news-ai.rss")


def poll_all() -> int:
    log.info("rss poll stub — feedparser pipeline queued. See FEATURES.md N2.")
    return 0
