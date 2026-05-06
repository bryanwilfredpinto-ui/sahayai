"""
scripts/loaders/rxnorm.py
-------------------------
RxNorm enrichment via NIH's free public REST API.

Source: https://rxnav.nlm.nih.gov/REST/  (no key needed)

What this does:
  - Walks every distinct molecule in `medicines.salt_composition`
  - For each: hits /REST/drugs.json?name=<molecule>
  - Captures the canonical RxNorm name + RxCUI
  - Writes the enrichment to scripts/data_cache/rxnorm_enrichment.json

Why JSON-out instead of writing back to DB?
  Adding an `rxcui` column would change the schema, which is out of scope
  for this loader. The JSON is durable enrichment Bryan can fold into the
  schema next session — and it's cheap to re-run because RxNorm responses
  cache locally.

Polite call cadence: 200 ms between requests. ~2,000 molecules ≈ 7 min.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

from sqlalchemy import distinct

from . import _common as C

log = logging.getLogger("loaders.rxnorm")

CACHE_FILE = C.CACHE_DIR / "rxnorm_enrichment.json"
RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST"


def _existing_cache() -> dict:
    if not CACHE_FILE.exists():
        return {}
    try:
        with CACHE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:  # noqa: BLE001
        return {}


def _lookup(name: str) -> Optional[dict]:
    """Return {rxcui, canonical_name, synonyms} or None when not found."""
    try:
        data = C.http_get_json(f"{RXNAV_BASE}/drugs.json", params={"name": name})
    except Exception as e:  # noqa: BLE001
        log.debug("rxnorm error for %r: %s", name, e)
        return None
    groups = (data.get("drugGroup") or {}).get("conceptGroup") or []
    for g in groups:
        cps = g.get("conceptProperties") or []
        if cps:
            cp = cps[0]
            return {
                "rxcui": cp.get("rxcui"),
                "canonical_name": cp.get("name"),
                "synonyms": [c.get("name") for c in cps if c.get("name")][:5],
                "tty": cp.get("tty"),
            }
    return None


def load(db, *, url: Optional[str] = None, file_path: Optional[str] = None,
         dry_run: bool = False, force: bool = False) -> dict:
    """
    `url`/`file_path`/`force` ignored — this loader walks the existing DB.
    """
    from models.medicine import Medicine

    cache = {} if force else _existing_cache()
    log.info("rxnorm cache primed with %d entries", len(cache))

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
        if norm in cache:
            cached += 1
            continue
        result = _lookup(norm)
        if result:
            cache[norm] = result
            found += 1
        else:
            cache[norm] = None
            miss += 1
        C.gentle_sleep(0.2)
        # Persist incrementally so an interruption doesn't lose progress
        if (found + miss) % 50 == 0 and not dry_run:
            CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")

    if not dry_run:
        CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")

    log.info("rxnorm: %d new lookups · %d cached · %d misses → %s",
             found, cached, miss, CACHE_FILE.name)
    return {
        "source": "rxnorm",
        "found": found,
        "cached": cached,
        "missing": miss,
        "cache_file": str(CACHE_FILE),
    }
