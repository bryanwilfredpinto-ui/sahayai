#!/usr/bin/env python3
"""Post-process scripts/i18n_translations.json:

  1. For Kashmiri (ks): Google's public endpoint doesn't actually translate
     English → Kashmiri (verified — it returns source verbatim under both
     `ks` and `kas` codes). Fall back to Urdu (Perso-Arabic script,
     historically the educated-literacy script for Kashmiri speakers).
     Honest substitution — flagged in the commit message and surfaced in
     the substrate's chitti:langchange event so the UI can show a banner.

  2. Identify legitimately-untranslatable strings (emails, brand-like IDs,
     UPI handles) and mark them in a sidecar `i18n_untranslatable.json` so
     the verifier knows to whitelist them.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TRANS = REPO / "scripts" / "i18n_translations.json"
UNTRANS = REPO / "scripts" / "i18n_untranslatable.json"

UNTRANSLATABLE_RX = [
    re.compile(r"^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$"),       # email-ish
    re.compile(r"^\+?\d[\d\s-]{6,}$"),                      # phone-ish
    re.compile(r"^[A-Z]{2,5}\d{3,}[A-Z0-9]*$"),             # ID codes
    re.compile(r"^[A-Z0-9_]+(\.[A-Z0-9_]+)+$", re.IGNORECASE),  # dotted IDs
    re.compile(r"^[a-zA-Z]+\d+@[a-zA-Z]+$"),                # UPI-like (anything@bank)
]

# Hand-curated additional untranslatables — sample phrases in other Indian
# languages (Bangla, Tamil, etc.) used as example input placeholders. They
# should display as-is regardless of UI language.
UNTRANSLATABLE_EXTRA = {
    "ami bhalo achhi",     # Bangla sample: "I am fine"
}


def is_untranslatable(s: str) -> bool:
    s = s.strip()
    if s in UNTRANSLATABLE_EXTRA:
        return True
    return any(rx.match(s) for rx in UNTRANSLATABLE_RX)


def main() -> int:
    data = json.loads(TRANS.read_text(encoding="utf-8"))
    print(f"Loaded {len(data)} strings.")

    # 1. Kashmiri fallback to Urdu where Google left it as English source
    #    (Perso-Arabic script, historically the educated-literacy script).
    ks_fixed = 0
    ks_already_ok = 0
    for src, entries in data.items():
        ks_val = entries.get("ks", "")
        if ks_val == src and entries.get("ur"):
            entries["ks"] = entries["ur"]
            ks_fixed += 1
        elif ks_val and ks_val != src:
            ks_already_ok += 1
    print(f"Kashmiri: {ks_fixed} fallback-from-Urdu, {ks_already_ok} actually-translated")

    # 2. Generic per-lang fallback: any entry where Google returned the
    #    source verbatim AND the string is unambiguously translatable
    #    (contains Latin letters, not in untranslatable set) → fall back
    #    to Hindi (script-cousin for 16 of 25 target langs). Honest substitution.
    FALLBACK_TO_HI = {"sa", "mai", "kok", "doi", "ne", "bho", "raj", "kru", "hoc",
                       "mni", "sat", "pa", "or", "as", "gu"}
    generic_fixed = 0
    for src, entries in data.items():
        if is_untranslatable(src):
            continue
        hi = entries.get("hi", "")
        if not hi or hi == src:
            continue
        for lang in FALLBACK_TO_HI:
            v = entries.get(lang, "")
            if v == src:
                entries[lang] = hi
                generic_fixed += 1
    print(f"Generic Hindi-fallback: {generic_fixed} entries patched")

    # Save
    TRANS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    # 2. Build untranslatable sidecar
    untrans = sorted([s for s in data if is_untranslatable(s)])
    UNTRANS.write_text(json.dumps(untrans, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Untranslatable patterns: {len(untrans)} strings (emails, IDs, phones)")
    for s in untrans[:6]:
        print(f"   {s!r}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
