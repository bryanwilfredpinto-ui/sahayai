"""
Tag #banner on every chitti_<lang>.html (root + voice-factory mirror)
with data-chitti-response + data-chitti-section="<native: Live voice
status>" so the feedback-widget attaches its per-box 🔊 🤖 👍 👎 row.

Idempotent: skips files where the banner already has the marker.

Locked 2026-05-14 by Bryan: per-box widget must appear on EVERY response
container on EVERY page. The 26 language pages share a uniform
#banner structure so they batch cleanly here. Product pages need
per-page edits (see scripts/tag_product_pages.py / manual edits).
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
ROOT_LANG_GLOB = sorted(ROOT.glob("chitti_*.html"))
MIRROR_GLOB = sorted((ROOT / "chitti-voice-factory" / "frontend").glob("chitti_*.html"))

# Language code (filename stem after "chitti_") → native section name.
SECTION_NATIVE = {
    "en":  "Live voice status",
    "hi":  "लाइव वॉइस स्थिति",
    "bn":  "লাইভ ভয়েস স্ট্যাটাস",
    "te":  "ప్రత్యక్ష వాయిస్ స్థితి",
    "mr":  "थेट आवाज स्थिती",
    "ta":  "நேரடி குரல் நிலை",
    "gu":  "જીવંત અવાજ સ્થિતિ",
    "kn":  "ಲೈವ್ ಧ್ವನಿ ಸ್ಥಿತಿ",
    "ml":  "തത്സമയ ശബ്ദ നില",
    "or":  "ସିଧାସଳଖ ସ୍ୱର ସ୍ଥିତି",
    "pa":  "ਲਾਈਵ ਆਵਾਜ਼ ਸਥਿਤੀ",
    "ur":  "براہ راست آواز کی صورتحال",
    "as":  "প্ৰত্যক্ষ কণ্ঠ স্থিতি",
    "sa":  "जीवदशायां स्वरस्थितिः",
    "ne":  "प्रत्यक्ष आवाज स्थिति",
    "ks":  "براہ راست آواز حالات",
    "sd":  "براہ راست آواز جي حالت",
    "mai": "लाइव आवाज स्थिति",
    "mni": "ꯂꯥꯏꯚ ꯈꯣꯟꯊꯣꯛ ꯐꯤꯕꯝ",
    "kok": "थेट आवाजेची स्थिती",
    "doi": "लाइव आवाज़ हालत",
    "brx": "रादाव दिन्थि",
    "sat": "ᱨᱚᱲ ᱪᱷᱟ",
    "bho": "लाइव आवाज़ हाल",
    "hne": "लाइव आवाज़ हाल",
    "tcy": "ಲೈವ್ ಸ್ವರ ಸ್ಥಿತಿ",
    "kfa": "ಲೈವ್ ಧ್ವನಿ ಸ್ಥಿತಿ",
    "kru": "लाइव आवाज़ हालत",
}

# Only the language pages — skip product pages (they get edited individually).
LANG_CODES = set(SECTION_NATIVE.keys())

# Match the banner card declaration.
BANNER_RE = re.compile(
    r'(<div\s+class="card"\s+id="banner")(\s*>)',
    re.IGNORECASE,
)


def stem_lang(file: Path) -> str | None:
    # chitti_ta.html → "ta".  chitti_voice_factory.html → "voice_factory" → None.
    name = file.stem  # chitti_ta
    if not name.startswith("chitti_"):
        return None
    code = name[len("chitti_"):]
    return code if code in LANG_CODES else None


def process(file: Path) -> str:
    code = stem_lang(file)
    if not code:
        return "skip-not-lang"
    text = file.read_text(encoding="utf-8")
    if not BANNER_RE.search(text):
        return "skip-no-banner"
    if 'data-chitti-response' in text and 'id="banner"' in text:
        # crude but safe — if the file already has the marker AND a banner, skip
        banner_idx = text.find('id="banner"')
        marker_after = text.find('data-chitti-response', banner_idx)
        # only treat as already-tagged if marker appears within the same tag (~200 chars)
        if 0 < marker_after - banner_idx < 200:
            return "skip-already-tagged"
    native = SECTION_NATIVE[code]
    replacement = r'\1 data-chitti-response data-chitti-section="' + native + r'"\2'
    new_text = BANNER_RE.sub(replacement, text, count=1)
    if new_text == text:
        return "skip-no-change"
    file.write_text(new_text, encoding="utf-8")
    return "tagged"


def main() -> int:
    counts: dict[str, int] = {}
    for f in ROOT_LANG_GLOB:
        r = process(f)
        counts[r] = counts.get(r, 0) + 1
        if r != "skip-not-lang":
            print(f"  [{r:>20}] {f.name}")
    for f in MIRROR_GLOB:
        r = process(f)
        counts[r] = counts.get(r, 0) + 1
        if r != "skip-not-lang":
            print(f"  [{r:>20}] chitti-voice-factory/frontend/{f.name}")
    print()
    print("Summary:", counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
