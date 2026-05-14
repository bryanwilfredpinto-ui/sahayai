"""
Source-discovery cron stub. Real plan per skills/SOURCE_DISCOVERY.md:
weekly Sunday 03:00 IST, four methods, then Layer-1 verification.
"""
from __future__ import annotations

import logging

log = logging.getLogger("chitti-news-ai.discovery")


def discover() -> int:
    log.info("source discovery stub — 5-tier discovery pipeline queued.")
    return 0
