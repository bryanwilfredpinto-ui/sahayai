"""
backend/scripts/merge_discovered_sources.py
-------------------------------------------
SHIP gate row #9 — merge probe-discovered RSS feeds into data/sources.json.

Reads every publisher_discovery_<lang>_<date>.json in this directory,
takes each row that has `found=true`, dedupes against data/sources.json
by rss_url + slug, and writes the merged file in-place.

Idempotent: safe to re-run after additional probes land.
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data" / "sources.json"


def main() -> int:
    sources = json.loads(DATA.read_text(encoding="utf-8"))
    by_url = {s["rss_url"]: s for s in sources}
    by_slug = {s["slug"]: s for s in sources}

    added: list[dict] = []
    skipped_dup: list[str] = []

    for probe in sorted(HERE.glob("publisher_discovery_*.json")):
        try:
            payload = json.loads(probe.read_text(encoding="utf-8"))
        except Exception:
            continue
        for r in payload.get("results", []):
            if not r.get("found"):
                continue
            seed = r.get("suggested_seed_row")
            if not seed:
                continue
            if seed["rss_url"] in by_url:
                skipped_dup.append(f'{probe.name}::{seed["slug"]} (dup rss_url)')
                continue
            if seed["slug"] in by_slug:
                seed["slug"] = f'{seed["slug"]}-{seed["language"]}'
            sources.append(seed)
            by_url[seed["rss_url"]] = seed
            by_slug[seed["slug"]] = seed
            added.append(seed)

    DATA.write_text(json.dumps(sources, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Merged {len(added)} new sources into {DATA}")
    for a in added:
        print(f"  + {a['language']:>2} {a['slug']:35s} {a['rss_url']}")
    if skipped_dup:
        print(f"\nSkipped {len(skipped_dup)} duplicates:")
        for s in skipped_dup:
            print(f"  - {s}")

    from collections import Counter
    langs = Counter(s.get("language") for s in sources)
    print(f"\nPer-language depth after merge:")
    for lang in ("en", "hi", "mr", "or", "bn", "kn", "ml", "ta", "te", "gu", "pa", "ur"):
        count = langs.get(lang, 0)
        flag = "OK" if count >= 10 else f"short by {10-count}"
        print(f"  {lang}: {count:3d}  [{flag}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
