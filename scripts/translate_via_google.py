#!/usr/bin/env python3
"""Translate scripts/i18n_corpus.json into all 25 non-English target languages
via Google Translate's free unofficial `dict-chrome-ex` client (batch capable,
no API key, no payment required). Resumable — re-running picks up where the
last invocation left off.

Output: scripts/i18n_translations.json with shape:
  {
    "<english source>": {
      "hi": "...", "bn": "...", ..., 25 lang codes total
    }
  }
"""
from __future__ import annotations

import html
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CORPUS = REPO / "scripts" / "i18n_corpus.json"
TRANSLATIONS = REPO / "scripts" / "i18n_translations.json"

# Mirrors LANGS array in chitti_a11y.js (minus 'en').
# Google Translate language codes: most match Indian standard codes; a few
# differ. We send Google the codes it understands, then store under our code.
LANGS = [
    ("hi",  "hi",     "Hindi"),
    ("bn",  "bn",     "Bangla"),
    ("te",  "te",     "Telugu"),
    ("ta",  "ta",     "Tamil"),
    ("mr",  "mr",     "Marathi"),
    ("gu",  "gu",     "Gujarati"),
    ("kn",  "kn",     "Kannada"),
    ("ml",  "ml",     "Malayalam"),
    ("pa",  "pa",     "Punjabi"),
    ("or",  "or",     "Odia"),
    ("as",  "as",     "Assamese"),
    ("ur",  "ur",     "Urdu"),
    ("sa",  "sa",     "Sanskrit"),
    ("mai", "mai",    "Maithili"),
    ("kok", "gom",    "Konkani"),       # Google uses gom for Konkani
    ("doi", "doi",    "Dogri"),
    ("ks",  "kas",    "Kashmiri"),       # Google uses kas (3-letter ISO)
    ("ne",  "ne",     "Nepali"),
    ("sd",  "sd",     "Sindhi"),
    ("mni", "mni-Mtei", "Manipuri"),    # Google uses mni-Mtei (Meitei script)
    ("sat", "sat",    "Santali"),
    ("bho", "bho",    "Bhojpuri"),
    ("raj", "hi",     "Rajasthani"),    # Google has no raj; use hi as nearest
    ("kru", "hi",     "Kurukh"),        # Google has no kru; use hi as nearest
    ("hoc", "hi",     "Ho"),            # Google has no hoc; use hi as nearest
]

BATCH_SIZE = 30        # q= params per request
THROTTLE_S = 0.5       # seconds between requests (be polite)
ENDPOINT = "https://clients5.google.com/translate_a/t"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) sahayai-build/1.0"


def load_existing() -> dict:
    if TRANSLATIONS.exists():
        try:
            return json.loads(TRANSLATIONS.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def save_progress(data: dict) -> None:
    TRANSLATIONS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def google_translate_batch(target_lang: str, items: list[str], retries: int = 4) -> list[str] | None:
    qs = [("client", "dict-chrome-ex"), ("sl", "en"), ("tl", target_lang)]
    for s in items:
        qs.append(("q", s))
    url = ENDPOINT + "?" + urllib.parse.urlencode(qs, doseq=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read().decode("utf-8")
            data = json.loads(body)
            # Response: ["t1","t2","t3"] OR for single q: nested arrays
            if isinstance(data, list) and len(data) == len(items) and all(isinstance(x, str) for x in data):
                return [html.unescape(x) for x in data]
            # Handle single-string-batch case where Google returns nested
            if len(items) == 1 and isinstance(data, list) and data and isinstance(data[0], list):
                # [[["translation","src",...]]]
                try:
                    return [html.unescape(data[0][0][0])]
                except (IndexError, TypeError):
                    pass
            print(f"   shape-mismatch retry {attempt+1}: got {type(data).__name__} len={len(data) if hasattr(data,'__len__') else '?'} for {len(items)} items", flush=True)
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
            print(f"   retry {attempt+1}/{retries}: {type(e).__name__}: {e}", flush=True)
        time.sleep(2 ** attempt)
    return None


def main() -> int:
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    strings = [row["text"] for row in corpus["strings"]]
    print(f"Corpus: {len(strings)} unique strings", flush=True)

    data = load_existing()
    print(f"Resume: {sum(1 for s in strings if s in data and len(data[s]) >= len(LANGS))}/{len(strings)} fully translated already", flush=True)

    t0 = time.time()

    for our_code, google_code, label in LANGS:
        missing = [s for s in strings if data.get(s, {}).get(our_code) is None]
        if not missing:
            print(f"  {our_code:4s} {label:14s} ({google_code:7s})  already complete", flush=True)
            continue
        print(f"  {our_code:4s} {label:14s} ({google_code:7s})  translating {len(missing)} missing strings...", flush=True)

        for batch_start in range(0, len(missing), BATCH_SIZE):
            batch = missing[batch_start:batch_start + BATCH_SIZE]
            tr = google_translate_batch(google_code, batch)
            if tr is None:
                print(f"     batch {batch_start//BATCH_SIZE + 1} FAILED", flush=True)
                continue
            for src, dst in zip(batch, tr):
                if src not in data:
                    data[src] = {}
                # If Google fell back to Hindi for raj/kru/hoc, that's intentional per LANGS map
                data[src][our_code] = dst.strip() or src
            save_progress(data)
            print(f"     batch {batch_start//BATCH_SIZE + 1}/{(len(missing)+BATCH_SIZE-1)//BATCH_SIZE} ok ({len(batch)} strings, {time.time()-t0:.0f}s total)", flush=True)
            time.sleep(THROTTLE_S)

    fully = sum(1 for s in strings if all(s in data and lc in data[s] for lc, _, _ in LANGS))
    print(f"\nDONE — {fully}/{len(strings)} strings fully translated across all {len(LANGS)} languages.", flush=True)
    return 0 if fully == len(strings) else 1


if __name__ == "__main__":
    sys.exit(main())
