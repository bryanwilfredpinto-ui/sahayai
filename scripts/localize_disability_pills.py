"""
scripts/localize_disability_pills.py
------------------------------------
Quality-pass fix 2026-05-14 — replace the English-only `<div class="card
four-user">` block on every 26-language root page with bilingual pills
(native-language word + English in brackets, emoji stays universal).

Each language page already loads `chitti_a11y.js` + `feedback-widget.js`
and a Tier-A/B/C language tag. This script ONLY rewrites the four-user
block; nothing else on the page is touched.

The English fallback in parentheses is intentional — keeps the page
readable for multilingual users and for screen-readers that don't
support the native script.

Run with: python scripts/localize_disability_pills.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Best-available translations. Approximate where indicated — better
# bilingual than wrong-only. Cousin languages (kfa Kodava, kru Kurukh,
# kok Konkani, sat Santali in Roman, etc.) use the closest standard
# script equivalent. Each tuple is (blind, deaf, mute, illiterate).
PILL_LABELS: dict[str, tuple[str, str, str, str]] = {
    "hi":  ("अंधे",        "बहरे",        "गूंगे",       "निरक्षर"),
    "bn":  ("অন্ধ",         "বধির",        "বোবা",        "নিরক্ষর"),
    "te":  ("అంధ",         "చెవిటి",       "మూగ",         "నిరక్షరాస్యులు"),
    "ta":  ("பார்வையற்ற",   "காது கேளாதவர்","வாயற்றவர்",  "எழுத்தறியாதவர்"),
    "kn":  ("ಕುರುಡು",      "ಕಿವುಡು",       "ಮೂಕ",         "ಅನಕ್ಷರಸ್ಥ"),
    "ml":  ("അന്ധ",         "ബധിര",         "മൂക",         "നിരക്ഷര"),
    "mr":  ("अंध",          "बहिरा",       "मुका",         "निरक्षर"),
    "gu":  ("અંધ",          "બહેરા",       "મૂંગા",        "નિરક્ષર"),
    "or":  ("ଅନ୍ଧ",         "ବଧିର",        "ମୂକ",          "ନିରକ୍ଷର"),
    "as":  ("অন্ধ",         "বধির",        "বোবা",        "নিৰক্ষৰ"),
    "pa":  ("ਅੰਨ੍ਹਾ",       "ਬੋਲ਼ਾ",        "ਗੁੰਗਾ",       "ਅਨਪੜ੍ਹ"),
    "ur":  ("اندھا",        "بہرا",        "گونگا",       "ناخواندہ"),
    "bho": ("अन्हार",       "बहिर",        "गूंग",         "निरक्षर"),
    "hne": ("अन्धा",        "बहिरा",       "मुक",          "निरक्षर"),
    "mai": ("अन्हर",        "बहिर",        "गुम्म",        "निरक्षर"),
    "kok": ("कुडे",         "बेरें",       "मुके",         "निरक्षर"),
    "doi": ("अन्धा",        "बैरा",        "गूंगा",        "अनपढ़"),
    "sd":  ("انڌو",         "ٻوڙو",        "گونگو",       "اڻ پڙهيل"),
    "ks":  ("اَنٛد",         "کوٚٹ",        "لَنٛٹ",        "اَنپَڑ"),
    "mni": ("মিৎ অমিত্বদে","কুনৃদ্বদে",  "নুৎসা ফংদে","ইশৈ মিল্লদা"),
    "brx": ("मेगन गेथे",   "खुगा गिनै",  "बुङा गिनै",  "अनुपोढ़"),
    "sat": ("ᱢᱮᱫ ᱵᱟᱝ",       "ᱞᱩᱛᱩᱨ ᱵᱟᱝ",   "ᱟᱲᱟᱝ ᱵᱟᱝ",    "ᱢᱮᱱ ᱵᱟᱝ"),
    "sa":  ("अन्धः",       "बधिरः",       "मूकः",        "निरक्षरः"),
    "tcy": ("ಕುರ್ಲ",       "ಕಿವುಡ",       "ಮೂಗ",         "ನಿರಕ್ಷರಸ್ಥ"),
    "kfa": ("ಕಣ್ ಇಲ್ಲದ",   "ಕಿವಿ ಇಲ್ಲದ",  "ಮಾತಿಲ್ಲದ",   "ಬರೆಯಲು ಬಾರದ"),
    "kru": ("अन्धा",        "बहिरा",       "गूंगा",        "अनपढ़"),
}


# Match the existing four-user block. The pages were generated from a
# common template so the markup is uniform: a single <div class="card
# four-user" ...> containing exactly four <span> children. We rewrite
# only the four spans; the aria-label + outer div stay intact.
BLOCK_RX = re.compile(
    r'(<div\s+class="card four-user"[^>]*>)'      # 1 opening div
    r'(\s*<span>👁️‍🗨️[^<]*</span>'                # blind span (emoji literal)
    r'\s*<span>🦻[^<]*</span>'                    # deaf span
    r'\s*<span>🤫[^<]*</span>'                    # mute span
    r'\s*<span>📖[^<]*</span>\s*)'                # illiterate span
    r'(</div>)',                                  # 3 closing div
    re.MULTILINE,
)


def make_block(open_div: str, close_div: str, lang: str) -> str:
    blind, deaf, mute, illit = PILL_LABELS[lang]
    return (
        f'{open_div}\n'
        f'      <span>👁️‍🗨️ {blind} <small style="opacity:.65">(blind)</small></span>\n'
        f'      <span>🦻 {deaf} <small style="opacity:.65">(deaf)</small></span>\n'
        f'      <span>🤫 {mute} <small style="opacity:.65">(mute)</small></span>\n'
        f'      <span>📖 {illit} <small style="opacity:.65">(illiterate)</small></span>\n'
        f'    {close_div}'
    )


def patch_file(path: Path, lang: str) -> bool:
    text = path.read_text(encoding="utf-8")
    new = BLOCK_RX.sub(
        lambda m: make_block(m.group(1), m.group(3), lang),
        text,
        count=1,
    )
    if new == text:
        return False
    path.write_text(new, encoding="utf-8")
    return True


def main() -> int:
    changed: list[str] = []
    missing: list[str] = []
    for code in sorted(PILL_LABELS):
        page = ROOT / f"chitti_{code}.html"
        if not page.exists():
            missing.append(code)
            continue
        if patch_file(page, code):
            changed.append(code)
        else:
            print(f"  skipped (no four-user block matched): {page.name}")
    print(f"\nupdated {len(changed)} pages: {' '.join(changed) or '(none)'}")
    if missing:
        print(f"missing files: {' '.join(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
