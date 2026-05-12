#!/usr/bin/env python3
"""
scripts/discover_archive_org.py — Find state-board / NCERT-translation textbooks
mirrored on archive.org for regional languages.

Many state-board and NCERT regional-language textbooks are uploaded by
educators/archivists to archive.org under permissive licenses (NCERT books
themselves are CC-BY 4.0 since 2018). We search archive.org's catalogue and
collect direct PDF URLs.

Output: data/archive_urls_discovered.json
"""
from __future__ import annotations

import json
import logging
import sys
import time
from pathlib import Path

import requests

THIS = Path(__file__).resolve()
BACKEND = THIS.parent.parent
OUT_PATH = BACKEND / "data" / "archive_urls_discovered.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("discover_archive")

SEARCH_API = "https://archive.org/advancedsearch.php"
DOWNLOAD_BASE = "https://archive.org/download"
UA = {"User-Agent": "ChittiFluencyDiscover/1.0"}

# Per-language search queries — each tuple is (label, q-string).
# Quoting is important because we use Lucene-style search syntax.
QUERIES: dict[str, list[tuple[str, str]]] = {
    "bn": [
        ("WBBSE Bengali textbook", 'WBBSE AND Bengali AND mediatype:texts'),
        ("NCERT Bengali", 'NCERT AND Bengali AND mediatype:texts'),
        ("Class textbook Bengali", '("West Bengal Board") AND mediatype:texts'),
    ],
    "ta": [
        ("TN Board Tamil textbook", '"Tamil Nadu" AND textbook AND mediatype:texts'),
        ("NCERT Tamil", 'NCERT AND Tamil AND mediatype:texts'),
    ],
    "te": [
        ("Telugu textbook", 'Telugu AND textbook AND mediatype:texts'),
        ("NCERT Telugu", 'NCERT AND Telugu AND mediatype:texts'),
    ],
    "kn": [
        ("Karnataka Kannada textbook", 'Karnataka AND Kannada AND textbook AND mediatype:texts'),
    ],
    "ml": [
        ("Kerala Malayalam textbook", 'Kerala AND Malayalam AND textbook AND mediatype:texts'),
        ("SCERT Kerala", '"SCERT Kerala" AND mediatype:texts'),
    ],
    "mr": [
        ("Maharashtra Marathi textbook", 'Maharashtra AND Marathi AND textbook AND mediatype:texts'),
        ("Balbharati", 'Balbharati AND mediatype:texts'),
    ],
    "gu": [
        ("Gujarat Gujarati textbook", 'Gujarat AND Gujarati AND textbook AND mediatype:texts'),
        ("GSEB", 'GSEB AND mediatype:texts'),
    ],
    "or": [
        ("Odisha Odia textbook", 'Odisha AND textbook AND mediatype:texts'),
        ("BSE Odisha", '"BSE Odisha" AND mediatype:texts'),
    ],
    "as": [
        ("Assam Assamese textbook", 'Assam AND Assamese AND textbook AND mediatype:texts'),
        ("SEBA", 'SEBA AND Assam AND mediatype:texts'),
    ],
    "pa": [
        ("Punjab Punjabi textbook", 'Punjab AND Punjabi AND textbook AND mediatype:texts'),
        ("PSEB", 'PSEB AND mediatype:texts'),
    ],
}


def search_archive(query: str, rows: int = 25) -> list[dict]:
    """Run a search on archive.org and return list of items."""
    try:
        resp = requests.get(
            SEARCH_API,
            params={
                "q": query,
                "fl[]": ["identifier", "title", "language", "year", "creator"],
                "rows": rows,
                "page": 1,
                "output": "json",
                "sort[]": "downloads desc",
            },
            headers=UA,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get("response", {}).get("docs", [])
    except Exception as e:  # noqa: BLE001
        log.warning("Search failed for %r: %s", query, e)
        return []


def get_item_pdfs(identifier: str) -> list[str]:
    """Return direct PDF download URLs for an archive.org item."""
    try:
        resp = requests.get(
            f"https://archive.org/metadata/{identifier}",
            headers=UA,
            timeout=30,
        )
        resp.raise_for_status()
        files = resp.json().get("files", [])
        out = []
        for f in files:
            name = f.get("name", "")
            if name.lower().endswith(".pdf"):
                size_str = f.get("size", "0")
                try:
                    size = int(size_str)
                except (ValueError, TypeError):
                    size = 0
                if size > 50_000:  # >50KB (real textbooks)
                    out.append(f"{DOWNLOAD_BASE}/{identifier}/{name}")
        return out
    except Exception as e:  # noqa: BLE001
        log.info("Metadata fetch failed for %s: %s", identifier, e)
        return []


def main() -> int:
    out: dict[str, list[dict]] = {lang: [] for lang in QUERIES}
    for lang, queries in QUERIES.items():
        for label, q in queries:
            log.info("[%s] searching: %s", lang, label)
            docs = search_archive(q, rows=15)
            log.info("[%s]   %d items found", lang, len(docs))
            for doc in docs[:5]:  # Top 5 per query to keep volume manageable
                identifier = doc.get("identifier")
                title = doc.get("title", "")
                if not identifier:
                    continue
                pdfs = get_item_pdfs(identifier)
                if pdfs:
                    out[lang].append({
                        "identifier": identifier,
                        "title": title,
                        "search_query": label,
                        "pdf_urls": pdfs[:3],  # max 3 PDFs per item
                    })
                    log.info("[%s]   + %s — %d PDFs", lang, identifier, len(pdfs))
                time.sleep(0.5)  # polite between metadata calls

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    total_items = sum(len(v) for v in out.values())
    total_pdfs = sum(len(item.get("pdf_urls", [])) for v in out.values() for item in v)
    log.info("=" * 80)
    log.info("ARCHIVE.ORG DISCOVERY: %d items, %d PDFs across %d languages",
             total_items, total_pdfs, len(out))
    for lang, items in sorted(out.items()):
        n_pdfs = sum(len(i["pdf_urls"]) for i in items)
        log.info("  %s: %d items, %d PDFs", lang, len(items), n_pdfs)
    log.info("Wrote: %s", OUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
