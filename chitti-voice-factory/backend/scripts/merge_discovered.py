#!/usr/bin/env python3
"""
scripts/merge_discovered.py — Merge URLs discovered by discover_ncert_urls.py
and discover_archive_org.py into a single per-language source plan that the
ingester reads at runtime.

Output: data/discovered_textbook_urls.json
Layout:
  {
    "hi": {"ncert": ["url1", "url2", ...], "archive": []},
    "bn": {"ncert": [], "archive": ["url1", ...]},
    ...
  }
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

THIS = Path(__file__).resolve()
BACKEND = THIS.parent.parent
DATA = BACKEND / "data"
NCERT_PATH = DATA / "ncert_urls_discovered.json"
ARCHIVE_PATH = DATA / "archive_urls_discovered.json"
OUT_PATH = DATA / "discovered_textbook_urls.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("merge_discovered")


def main() -> int:
    ncert: dict = {}
    archive: dict = {}
    if NCERT_PATH.exists():
        ncert = json.loads(NCERT_PATH.read_text(encoding="utf-8"))
        log.info("Loaded NCERT discoveries: %d languages",
                 sum(1 for v in ncert.values() if v))
    if ARCHIVE_PATH.exists():
        archive = json.loads(ARCHIVE_PATH.read_text(encoding="utf-8"))
        log.info("Loaded archive.org discoveries: %d languages",
                 sum(1 for v in archive.values() if v))

    out: dict[str, dict[str, list[str]]] = {}

    for lang, items in (ncert or {}).items():
        urls = [item["url"] for item in items if "url" in item]
        out.setdefault(lang, {"ncert": [], "archive": []})
        out[lang]["ncert"] = urls

    for lang, items in (archive or {}).items():
        urls = []
        for item in items:
            urls.extend(item.get("pdf_urls", []))
        out.setdefault(lang, {"ncert": [], "archive": []})
        out[lang]["archive"] = urls

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    total_ncert = sum(len(v["ncert"]) for v in out.values())
    total_archive = sum(len(v["archive"]) for v in out.values())
    log.info("Wrote: %s — %d NCERT URLs + %d archive.org URLs", OUT_PATH, total_ncert, total_archive)
    for lang, plan in sorted(out.items()):
        log.info("  %s: ncert=%d archive=%d", lang, len(plan["ncert"]), len(plan["archive"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
