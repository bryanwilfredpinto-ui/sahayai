#!/usr/bin/env python3
"""
scripts/discover_ncert_urls.py — Bulk HEAD-check candidate NCERT URLs.

NCERT publishes direct PDFs at https://ncert.nic.in/textbook/pdf/<bookcode>.pdf
The bookcode follows a deterministic pattern:

    <class-letter><lang-letter><subject-abbrev><part><chapter>.pdf
        a-l = Class 1-12       (a=1, b=2, ..., k=11, l=12)
        e=English, h=Hindi, u=Urdu, s=Sanskrit (h-Sanskrit prefix uses 'h' as Hindi)
        Subjects: math=mh/em, science=sc/es, social=ss/es, hindi=vs/ks/sp,
                  english=mr/hc/bb, sanskrit=sk

NCERT also publishes regional-language translations of core textbooks. The
URL pattern for translations inserts a language indicator. We don't have a
documented map of all permutations, so this script ENUMERATES candidates and
HEAD-checks each. Survivors are written to ncert_urls_discovered.json with
the language code we attribute (best-guess from the URL pattern).

Run this BEFORE ingest_textbooks.py to expand the seed URL list. The result
is merged into the source registry at next ingest run.
"""
from __future__ import annotations

import concurrent.futures
import json
import logging
import sys
import time
from pathlib import Path

import requests

THIS = Path(__file__).resolve()
BACKEND = THIS.parent.parent
OUT_PATH = BACKEND / "data" / "ncert_urls_discovered.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("discover_ncert")

BASE = "https://ncert.nic.in/textbook/pdf/"
UA = {"User-Agent": "ChittiFluencyDiscover/1.0"}

# Class letters: a..l for Class 1..12
CLASS_LETTERS = "abcdefghijkl"

# ── Book code suffixes by language ──
# Format: <class-letter><suffix> per chapter index 1-20.
# We try multiple part numbers (1-3) and chapter numbers (01-20) for each suffix.
# Suffixes are derived from NCERT's bookcode convention.
HINDI_SUFFIXES = [
    # Class 1
    ("ahsm", "Sarangi (Hindi)"),       # Class 1
    # Class 2
    ("bhsm", "Sarangi 2 (Hindi)"),
    # Class 3
    ("chsm", "Hindi"),
    # Class 5
    ("ehht", "Rimjhim Class 5"),
    # Class 6
    ("fhvs", "Vasant Class 6"),
    ("fhdu", "Durva Class 6"),
    ("fhbk", "Bal Ram Katha Class 6"),
    # Class 7
    ("ghvs", "Vasant Class 7"),
    ("ghdu", "Durva Class 7"),
    # Class 8
    ("hhvs", "Vasant Class 8"),
    ("hhbk", "Bharat ki Khoj Class 8"),
    # Class 9
    ("ihks", "Kshitij Class 9"),
    ("ihkr", "Kritika Class 9"),
    ("ihsp", "Sparsh Class 9"),
    ("ihsn", "Sanchayan Class 9"),
    # Class 10
    ("jhkz", "Kshitij Class 10"),
    ("jhkt", "Kritika Class 10"),
    ("jhsp", "Sparsh Class 10"),
    ("jhsn", "Sanchayan Class 10"),
    # Class 11
    ("khar", "Aroh Class 11"),
    ("khvi", "Vitan Class 11"),
    ("khan", "Antra Class 11"),
    ("khal", "Antral Class 11"),
    # Class 12
    ("lhar", "Aroh Class 12"),
    ("lhvi", "Vitan Class 12"),
    ("lhan", "Antra Class 12"),
    ("lhal", "Antral Class 12"),
]

URDU_SUFFIXES = [
    ("aurd", "Urdu Class 1"),
    ("burd", "Urdu Class 2"),
    ("curd", "Urdu Class 3"),
    ("durd", "Urdu Class 4"),
    ("eurd", "Urdu Class 5"),
    ("furd", "Urdu Class 6"),
    ("gurd", "Urdu Class 7"),
    ("hurd", "Urdu Class 8"),
    ("iurd", "Urdu Class 9"),
    ("jurd", "Urdu Class 10"),
    ("kurd", "Urdu Class 11"),
    ("lurd", "Urdu Class 12"),
]

SANSKRIT_SUFFIXES = [
    ("fhsk", "Ruchira Class 6"),
    ("ghsk", "Ruchira Class 7"),
    ("hhsk", "Ruchira Class 8"),
    ("ihsk", "Ruchira Class 9"),
    ("jhsk", "Ruchira Class 10"),
    ("khsh", "Sanskrit Class 11 Bhasvati"),
    ("lhsh", "Sanskrit Class 12 Bhasvati"),
]

# NCERT regional translations: these are core subjects (Math, Science, Social Science)
# translated to regional languages. The 4th letter encodes language:
#   m=Marathi(?), t=Tamil(?), b=Bengali(?), etc. - patterns are inconsistent.
# We enumerate broadly and let the HEAD check filter.
ENGLISH_CORE_SUFFIXES = [
    # Class 9 core
    ("iesc", "Science Class 9 English"),     # known: jesc=Class10 Sci Eng
    ("iemh", "Math Class 9 English"),
    ("iess", "Social Science Class 9 English"),
    ("iebe", "Beehive English Class 9"),
    ("iemt", "Moments English Class 9"),
    # Class 10 core
    ("jesc", "Science Class 10 English"),
    ("jemh", "Math Class 10 English"),
    ("jess", "Social Science Class 10 English"),
    ("jefl", "First Flight English Class 10"),
    ("jeff", "Footprints English Class 10"),
    # Class 11 Math/Phys/Chem/Bio English
    ("kemh", "Math Class 11 English"),
    ("keph", "Physics Class 11 English"),
    ("kech", "Chemistry Class 11 English"),
    ("kebo", "Biology Class 11 English"),
    # Class 12 Math/Phys/Chem/Bio English
    ("lemh", "Math Class 12 English"),
    ("leph", "Physics Class 12 English"),
    ("lech", "Chemistry Class 12 English"),
    ("lebo", "Biology Class 12 English"),
]

# Regional core translations — speculative URL letters per language.
# We try the third letter as language code (e=English fallback), keeping
# class+book consistent. HEAD checks decide what's real.
LANG_REGIONALS = {
    # ISO → NCERT 3rd-letter code (best guesses; many may 404 and we record honestly)
    "bn": ["b"],            # Bengali
    "te": ["v"],            # Telugu
    "ta": ["t"],            # Tamil
    "kn": ["k"],            # Kannada
    "ml": ["m"],            # Malayalam
    "mr": ["r"],            # Marathi
    "gu": ["g"],            # Gujarati
    "or": ["o"],            # Odia
    "as": ["a"],            # Assamese (clashes with class-1 letter; skip if conflict)
    "pa": ["p"],            # Punjabi
}


def candidate_urls() -> dict[str, list[tuple[str, str]]]:
    """
    Returns dict: lang -> list of (url, label) candidates.

    Narrowed scope: only Hindi/Urdu/Sanskrit (NCERT publishes these natively
    with documented URL conventions). Regional-language URL guessing was
    proven speculative and wasteful — those languages are sourced from state
    boards / Wikipedia instead.
    """
    out: dict[str, list[tuple[str, str]]] = {lang: [] for lang in ["hi", "ur", "sa"]}

    def emit(lang: str, suffix: str, label: str) -> None:
        for part in [1, 2]:
            for ch in range(1, 16):
                url = f"{BASE}{suffix}{part}{ch:02d}.pdf"
                out[lang].append((url, f"{label} part {part} ch {ch}"))

    for suffix, label in HINDI_SUFFIXES:
        emit("hi", suffix, label)
    for suffix, label in URDU_SUFFIXES:
        emit("ur", suffix, label)
    for suffix, label in SANSKRIT_SUFFIXES:
        emit("sa", suffix, label)

    return out


def head_check(url: str, timeout: int = 15) -> tuple[str, int, int]:
    """HEAD check a URL. Returns (url, status, content_length)."""
    try:
        r = requests.head(url, allow_redirects=True, timeout=timeout, headers=UA)
        return url, r.status_code, int(r.headers.get("Content-Length", 0))
    except Exception:  # noqa: BLE001
        return url, 0, 0


def main() -> int:
    cands = candidate_urls()
    total = sum(len(v) for v in cands.values())
    log.info("Will HEAD-check %d candidate URLs across %d languages", total, len(cands))

    discovered: dict[str, list[dict]] = {lang: [] for lang in cands}

    # Flatten with language tag
    flat = [(lang, url, label) for lang, items in cands.items() for url, label in items]

    started = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
        futs = {ex.submit(head_check, url): (lang, url, label) for lang, url, label in flat}
        done = 0
        for fut in concurrent.futures.as_completed(futs):
            lang, url, label = futs[fut]
            try:
                u, status, size = fut.result()
            except Exception:  # noqa: BLE001
                status, size = 0, 0
            done += 1
            if status == 200 and size > 1000:
                discovered[lang].append({"url": url, "label": label, "size_bytes": size})
                log.info("[%s] 200 %s (%d KB) %s", lang, url, size // 1024, label)
            if done % 200 == 0:
                log.info("Progress: %d/%d  elapsed %.0fs", done, total, time.time() - started)

    # Summary
    log.info("=" * 80)
    log.info("DISCOVERY COMPLETE in %.0fs", time.time() - started)
    for lang, items in sorted(discovered.items()):
        log.info("  %s: %d PDFs discovered", lang, len(items))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(discovered, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Wrote: %s", OUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
