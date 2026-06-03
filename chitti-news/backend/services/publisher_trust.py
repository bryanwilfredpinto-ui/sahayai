"""
services/publisher_trust.py
---------------------------
Per-publisher trust score lookup, loaded from the most recent
scripts/publisher_trust_scores_*.json snapshot.

Methodology in scripts/compute_publisher_trust.py:
    trust_score = 50 + 0.5 * verified_pct
                     - 1.0 * disputed_pct
                     - 0.3 * unverified_pct
    bands: trusted >= 80, acceptable >= 60, questionable >= 40, reject < 40

Loaded once per process from disk; safe to call from request handlers.
Returns {} when no snapshot exists yet (frontend hides the badge).

Public API:
    get(source_name: str) -> dict | None    -- {score, band, n_articles}
    get_all() -> dict[str, dict]            -- name -> record
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Optional

log = logging.getLogger("publisher_trust")

_CACHE: Optional[dict[str, dict]] = None
_LOADED_FROM: Optional[Path] = None
_SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"


def _load() -> dict[str, dict]:
    global _CACHE, _LOADED_FROM
    if _CACHE is not None:
        return _CACHE
    snapshots = sorted(_SCRIPTS_DIR.glob("publisher_trust_scores_*.json"))
    if not snapshots:
        _CACHE = {}
        return _CACHE
    latest = snapshots[-1]
    try:
        data = json.loads(latest.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        log.warning("publisher_trust: failed to load %s: %s", latest, e)
        _CACHE = {}
        return _CACHE
    out: dict[str, dict] = {}
    for s in data.get("scores", []):
        name = s.get("source_name")
        if not name:
            continue
        out[name] = {
            "score":       s.get("score"),
            "band":        s.get("band"),
            "n_articles":  s.get("n_articles", 0),
            "computed_at": data.get("generated_at"),
        }
    _CACHE = out
    _LOADED_FROM = latest
    log.info("publisher_trust: loaded %d publishers from %s", len(out), latest.name)
    return out


def get(source_name: str) -> Optional[dict]:
    """Returns {score, band, n_articles, computed_at} or None."""
    if not source_name:
        return None
    return _load().get(source_name)


def get_all() -> dict[str, dict]:
    return _load()


def reload() -> int:
    """Force-reload from disk (call from admin cron after a new snapshot)."""
    global _CACHE, _LOADED_FROM
    _CACHE = None
    _LOADED_FROM = None
    return len(_load())
