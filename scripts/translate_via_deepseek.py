#!/usr/bin/env python3
"""Translate scripts/i18n_corpus.json into all 25 non-English Indian languages
via DeepSeek's OpenAI-compatible chat endpoint. Resumable — re-running picks
up where the last invocation left off.

Output: scripts/i18n_translations.json with shape:
  {
    "<english source>": {
      "hi": "...", "bn": "...", "te": "...", ..., 25 lang codes total
    }
  }

Reads DEEPSEEK_API_KEY from one of the railway-env/*.env files.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CORPUS = REPO / "scripts" / "i18n_corpus.json"
TRANSLATIONS = REPO / "scripts" / "i18n_translations.json"

# Target languages — mirrors LANGS array in chitti_a11y.js (minus 'en').
LANG_LABELS = [
    ("hi", "Hindi"),
    ("bn", "Bangla (Bengali)"),
    ("te", "Telugu"),
    ("ta", "Tamil"),
    ("mr", "Marathi"),
    ("gu", "Gujarati"),
    ("kn", "Kannada"),
    ("ml", "Malayalam"),
    ("pa", "Punjabi (Gurmukhi)"),
    ("or", "Odia"),
    ("as", "Assamese"),
    ("ur", "Urdu"),
    ("sa", "Sanskrit (Devanagari)"),
    ("mai", "Maithili (Devanagari)"),
    ("kok", "Konkani (Devanagari)"),
    ("doi", "Dogri (Devanagari)"),
    ("ks", "Kashmiri (Perso-Arabic)"),
    ("ne", "Nepali (Devanagari)"),
    ("sd", "Sindhi (Perso-Arabic)"),
    ("mni", "Manipuri (Bengali script)"),
    ("sat", "Santali (Ol Chiki)"),
    ("bho", "Bhojpuri (Devanagari)"),
    ("raj", "Rajasthani (Devanagari)"),
    ("kru", "Kurukh (Devanagari)"),
    ("hoc", "Ho (Devanagari)"),
]

BATCH_SIZE = 60  # strings per DeepSeek call


def find_api_key() -> str:
    env = os.environ.get("DEEPSEEK_API_KEY")
    if env:
        return env
    for env_file in (REPO / "railway-env").glob("*.env"):
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("DEEPSEEK_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("DEEPSEEK_API_KEY not found")


def load_existing() -> dict:
    if TRANSLATIONS.exists():
        try:
            return json.loads(TRANSLATIONS.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def save_progress(data: dict) -> None:
    TRANSLATIONS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def deepseek_translate(api_key: str, source_lang_label: str, items: list[str], retries: int = 3) -> list[str] | None:
    """Translate a batch of English strings into one target language.
    Returns a list of translations parallel to items, or None on hard failure."""
    numbered = "\n".join(f"{i}. {s}" for i, s in enumerate(items))
    system = (
        "You are an Indian language localisation expert for an accessibility-first "
        "UI used by elderly, blind, deaf, mute, and illiterate Indian users. "
        "Translate concisely. Preserve emojis (🔊 🗑️ 📜 💬 📞 📖 etc.) and arrow glyphs "
        "(➜ → ←) and numbers exactly as in the source. Match the casual, helpful "
        "tone of Indian apps like PhonePe, Paytm, and BHIM. Use script as instructed."
    )
    user = (
        f"Translate the following UI labels from English to {source_lang_label}. "
        f"Return ONLY a JSON object mapping each number to its translation, like "
        f'{{"0": "...", "1": "...", ...}}. Do not add commentary. '
        f"Preserve emojis exactly. Keep translations short.\n\n{numbered}"
    )
    body = json.dumps(
        {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
            "max_tokens": 4000,
            "response_format": {"type": "json_object"},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                payload = json.loads(r.read().decode("utf-8"))
            content = payload["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            out: list[str] = []
            for i in range(len(items)):
                v = parsed.get(str(i)) or parsed.get(i)
                if not isinstance(v, str) or not v.strip():
                    return None
                out.append(v.strip())
            return out
        except (urllib.error.URLError, json.JSONDecodeError, KeyError, TimeoutError) as e:
            print(f"   retry {attempt+1}/{retries}: {type(e).__name__}: {e}", flush=True)
            time.sleep(2 ** attempt)
    return None


def main() -> int:
    api_key = find_api_key()
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    strings = [row["text"] for row in corpus["strings"]]
    print(f"Corpus: {len(strings)} unique strings")

    data = load_existing()
    print(f"Resume: {sum(1 for s in strings if s in data and len(data[s]) >= len(LANG_LABELS))}/{len(strings)} fully translated already")

    total_batches = ((len(strings) + BATCH_SIZE - 1) // BATCH_SIZE) * len(LANG_LABELS)
    done_batches = 0
    t0 = time.time()

    for lang_code, lang_label in LANG_LABELS:
        # Build batches of strings still missing this language
        missing = [s for s in strings if data.get(s, {}).get(lang_code) is None]
        if not missing:
            print(f"  {lang_code:4s} {lang_label:35s}  already complete ({len(strings)} strings)")
            done_batches += (len(strings) + BATCH_SIZE - 1) // BATCH_SIZE
            continue
        print(f"  {lang_code:4s} {lang_label:35s}  translating {len(missing)} missing strings...")

        for batch_start in range(0, len(missing), BATCH_SIZE):
            batch = missing[batch_start:batch_start + BATCH_SIZE]
            tr = deepseek_translate(api_key, lang_label, batch)
            done_batches += 1
            if tr is None:
                print(f"     batch {batch_start//BATCH_SIZE + 1} FAILED — leaving for next run")
                continue
            for src, dst in zip(batch, tr):
                if src not in data:
                    data[src] = {}
                data[src][lang_code] = dst
            save_progress(data)
            elapsed = time.time() - t0
            print(f"     batch {batch_start//BATCH_SIZE + 1} ({len(batch)} strings) ok | overall {done_batches}/{total_batches} ({elapsed:.0f}s)")

    # Final summary
    fully = sum(1 for s in strings if all(s in data and lc in data[s] for lc, _ in LANG_LABELS))
    print(f"\nDONE — {fully}/{len(strings)} strings fully translated across all {len(LANG_LABELS)} languages.")
    print(f"Translations file: {TRANSLATIONS}")
    return 0 if fully == len(strings) else 1


if __name__ == "__main__":
    sys.exit(main())
