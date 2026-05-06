"""
scripts/loaders/openfda.py
--------------------------
OpenFDA enrichment — free public REST API, no key needed for basic use.

Source: https://api.fda.gov/drug/label.json?search=...&limit=100

What this does (lightweight enrichment, US-centric source):
  - For every distinct molecule in `medicines.salt_composition`
  - Queries OpenFDA for the FDA drug label
  - Captures `warnings`, `indications_and_usage`, `do_not_use` blurbs
  - Writes a JSON enrichment file to scripts/data_cache/openfda_enrichment.json

Caveat — OpenFDA is mostly US-approved drugs, not Indian retail. It is
useful for cross-referencing molecule names + pulling warning text we
can render alongside Chitti's own non-medical-advice disclaimer. We do
NOT auto-render OpenFDA text in the UI without review (FDA warnings are
US-context and may not match Indian regulatory language).

Rate limit: 240 requests/min by IP. We sleep 300 ms between calls.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

from sqlalchemy import distinct

from . import _common as C

log = logging.getLogger("loaders.openfda")

CACHE_FILE = C.CACHE_DIR / "openfda_enrichment.json"
ENDPOINT = "https://api.fda.gov/drug/label.json"


def _existing_cache() -> dict:
    if not CACHE_FILE.exists():
        return {}
    try:
        with CACHE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:  # noqa: BLE001
        return {}


def _short(text, n=600):
    if not text:
        return None
    if isinstance(text, list):
        text = " ".join(t for t in text if t)
    s = str(text).strip()
    return s[:n] + ("…" if len(s) > n else "")


def _lookup(name: str) -> Optional[dict]:
    try:
        data = C.http_get_json(
            ENDPOINT,
            params={
                "search": f'openfda.generic_name:"{name}"',
                "limit": 1,
            },
        )
    except Exception as e:  # noqa: BLE001
        log.debug("openfda error for %r: %s", name, e)
        return None
    items = data.get("results") or []
    if not items:
        return None
    r = items[0]
    return {
        "indications_and_usage": _short(r.get("indications_and_usage"), 400),
        "warnings": _short(r.get("warnings"), 600),
        "do_not_use": _short(r.get("do_not_use"), 200),
        "brand_name_us": (r.get("openfda") or {}).get("brand_name", []),
        "generic_name_us": (r.get("openfda") or {}).get("generic_name", []),
    }


def load(db, *, url: Optional[str] = None, file_path: Optional[str] = None,
         dry_run: bool = False, force: bool = False) -> dict:
    from models.medicine import Medicine

    cache = {} if force else _existing_cache()
    log.info("openfda cache primed with %d entries", len(cache))

    rows = (
        db.query(distinct(Medicine.salt_composition))
        .order_by(Medicine.salt_composition.asc())
        .all()
    )
    molecules = [C.safe_str(r[0]) for r in rows if r and r[0]]
    molecules = sorted({m for m in molecules if m})
    log.info("found %d distinct molecules in DB", len(molecules))

    found = miss = cached = 0
    for m in molecules:
        norm = C.normalize_molecule(m) or m
        # OpenFDA expects a single API ingredient; for combinations, use the first part
        primary = norm.split("+")[0].strip()
        if primary in cache:
            cached += 1
            continue
        result = _lookup(primary)
        if result:
            cache[primary] = result
            found += 1
        else:
            cache[primary] = None
            miss += 1
        C.gentle_sleep(0.3)
        if (found + miss) % 25 == 0 and not dry_run:
            CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")

    if not dry_run:
        CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")

    log.info("openfda: %d new · %d cached · %d miss → %s",
             found, cached, miss, CACHE_FILE.name)
    return {
        "source": "openfda",
        "found": found,
        "cached": cached,
        "missing": miss,
        "cache_file": str(CACHE_FILE),
    }
