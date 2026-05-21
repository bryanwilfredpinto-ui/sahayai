#!/usr/bin/env python3
"""Translate scripts/vaani_corpus.json into 25 non-English target languages
via Google Translate's free unofficial `dict-chrome-ex` batch endpoint.

Output: scripts/vaani_translations.json — shape:
  { "<english>": { "hi": "...", "bn": "...", ..., 25 lang codes } }

Resumable. Re-running picks up where it left off.
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
CORPUS = REPO / "scripts" / "vaani_corpus.json"
TRANSLATIONS = REPO / "scripts" / "vaani_translations.json"

# Our 25 target langs (en is source). Map: our_code -> google_code, label.
LANGS = [
    ("hi",  "hi",       "Hindi"),
    ("bn",  "bn",       "Bangla"),
    ("te",  "te",       "Telugu"),
    ("ta",  "ta",       "Tamil"),
    ("mr",  "mr",       "Marathi"),
    ("gu",  "gu",       "Gujarati"),
    ("kn",  "kn",       "Kannada"),
    ("ml",  "ml",       "Malayalam"),
    ("pa",  "pa",       "Punjabi"),
    ("or",  "or",       "Odia"),
    ("as",  "as",       "Assamese"),
    ("ur",  "ur",       "Urdu"),
    ("sa",  "sa",       "Sanskrit"),
    ("mai", "mai",      "Maithili"),
    ("kok", "gom",      "Konkani"),
    ("doi", "doi",      "Dogri"),
    ("ks",  "kas",      "Kashmiri (3-letter ISO)"),
    ("ne",  "ne",       "Nepali"),
    ("sd",  "sd",       "Sindhi"),
    ("mni", "mni-Mtei", "Manipuri (Meitei)"),
    ("sat", "sat",      "Santali"),
    ("bho", "bho",      "Bhojpuri"),
    ("raj", "hi",       "Rajasthani→Hindi (no Google support)"),
    ("kru", "hi",       "Kurukh→Hindi (no Google support)"),
    ("hoc", "hi",       "Ho→Hindi (no Google support)"),
]
BATCH_SIZE = 30
THROTTLE_S = 0.4
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) sahayai-build/2.0"
ENDPOINT = "https://clients5.google.com/translate_a/t"


def load_existing() -> dict:
    if TRANSLATIONS.exists():
        try:
            return json.loads(TRANSLATIONS.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def save(data: dict) -> None:
    TRANSLATIONS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def google_batch(target_lang: str, items: list[str], retries: int = 4) -> list[str] | None:
    qs = [("client", "dict-chrome-ex"), ("sl", "en"), ("tl", target_lang)]
    for s in items:
        qs.append(("q", s))
    url = ENDPOINT + "?" + urllib.parse.urlencode(qs, doseq=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.loads(r.read().decode("utf-8"))
            if isinstance(data, list) and len(data) == len(items) and all(isinstance(x, str) for x in data):
                return [html.unescape(x) for x in data]
            # Single-string batch returns nested
            if len(items) == 1 and isinstance(data, list) and data and isinstance(data[0], list):
                try:
                    return [html.unescape(data[0][0][0])]
                except (IndexError, TypeError):
                    pass
            print(f"   shape-mismatch retry {attempt+1}", flush=True)
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
            print(f"   retry {attempt+1}/{retries}: {type(e).__name__}: {e}", flush=True)
        time.sleep(2 ** attempt)
    return None


def main() -> int:
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    strings = list(corpus)
    print(f"Corpus: {len(strings)} unique English strings", flush=True)
    data = load_existing()
    t0 = time.time()
    for our_code, google_code, label in LANGS:
        missing = [s for s in strings if data.get(s, {}).get(our_code) is None]
        if not missing:
            print(f"  {our_code:4s} {label:30s} ({google_code:8s})  already complete", flush=True)
            continue
        print(f"  {our_code:4s} {label:30s} ({google_code:8s})  {len(missing)} missing...", flush=True)
        for i in range(0, len(missing), BATCH_SIZE):
            batch = missing[i:i + BATCH_SIZE]
            tr = google_batch(google_code, batch)
            if tr is None:
                print(f"     batch {i//BATCH_SIZE + 1} FAILED", flush=True)
                continue
            for src, dst in zip(batch, tr):
                if src not in data:
                    data[src] = {}
                data[src][our_code] = (dst or src).strip()
            save(data)
            print(f"     batch {i//BATCH_SIZE + 1}/{(len(missing) + BATCH_SIZE - 1) // BATCH_SIZE} ok ({time.time() - t0:.0f}s)", flush=True)
            time.sleep(THROTTLE_S)
    fully = sum(1 for s in strings if all(s in data and lc in data[s] for lc, _, _ in LANGS))
    print(f"\nDONE — {fully}/{len(strings)} strings fully translated.", flush=True)
    return 0 if fully == len(strings) else 1


if __name__ == "__main__":
    sys.exit(main())
