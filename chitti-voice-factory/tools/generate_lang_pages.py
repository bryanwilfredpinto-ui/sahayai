"""Generate the 24 chitti_<lang>.html front doors from one template + i18n bundle.

Run:    python chitti-voice-factory/tools/generate_lang_pages.py
Output: 24 files at the workspace root: chitti_<code>.html
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]                       # workspace root
TOOLS = Path(__file__).resolve().parent                          # chitti-voice-factory/tools
BACKEND = ROOT / "chitti-voice-factory" / "backend"
sys.path.insert(0, str(BACKEND))

import languages as L                                            # noqa: E402

TEMPLATE = (TOOLS / "template.html").read_text(encoding="utf-8")
I18N = json.loads((TOOLS / "i18n.json").read_text(encoding="utf-8"))

RTL_CODES = {"ur", "ks", "sd"}

# Per-tier UI behavior. Tier C: NO speak button (donor banner instead).
SPEAK_BLOCK_TPL = """
    <div class="card">
      <label for="speak-text" lang="{LANG_CODE}">{SPEAK_LABEL}</label>
      <textarea id="speak-text" placeholder="{SPEAK_LABEL}"></textarea>
      <div class="row" style="margin-top:8px">
        <button id="speak-btn" class="primary" aria-label="{SPEAK_BUTTON_ARIA}">🔊 <span lang="{LANG_CODE}">{SPEAK_BUTTON}</span></button>
        <span class="muted">{TIER_HINT}</span>
      </div>
    </div>
"""

DONOR_BLOCK_TPL = """
    <div class="card donor">
      <strong>🎙️ Voice donors needed for {LANG_NAME_EN}.</strong>
      <p style="margin:8px 0 0">
        Chitti does not yet have a production voice model for {LANG_NAME_EN}.
        We will not silently use a related language and pretend it's {LANG_NAME_EN} — that would be insulting.
        Instead, please consider donating 30 minutes of your voice. CC-BY-4.0, opt-in attribution, revocable.
      </p>
      <p style="margin:8px 0 0"><a href="voice_donor.html?lang={LANG_CODE}">Donate your voice →</a></p>
    </div>
"""

ENGLISH_FALLBACK = {
    "tagline": "Your mother tongue, spoken back to you.",
    "speak_label": "Type something for Chitti to speak",
    "speak_button": "Speak",
    "donate_button": "Donate my voice",
    "download_button": "Download voice model",
    "status_loading": "Checking honest status…",
    "checking": "checking…",
}

TIER_HINT_BY_TIER = {
    "A": "Tier A · Bhashini + AI4Bharat support this language.",
    "B": "Tier B · supplier coverage exists but quality varies. Status pill above is the truth.",
    "C": "",  # not used; Tier C has no speak block
}


def render_one(lang) -> str:
    strings = {**ENGLISH_FALLBACK, **(I18N.get(lang.code, {}))}
    tier = lang.tier
    is_tier_c = tier == "C"

    speak_block = "" if is_tier_c else SPEAK_BLOCK_TPL.format(
        LANG_CODE=lang.code,
        SPEAK_LABEL=strings["speak_label"],
        SPEAK_BUTTON=strings["speak_button"],
        SPEAK_BUTTON_ARIA=f"Speak in {lang.name_en}",
        TIER_HINT=TIER_HINT_BY_TIER.get(tier, ""),
    )

    donor_block = DONOR_BLOCK_TPL.format(
        LANG_CODE=lang.code,
        LANG_NAME_EN=lang.name_en,
    ) if is_tier_c else ""

    direction = "rtl" if lang.code in RTL_CODES else "ltr"

    out = TEMPLATE
    replacements = {
        "{{LANG_CODE}}": lang.code,
        "{{LANG_NAME_EN}}": lang.name_en,
        "{{LANG_NAME_NATIVE}}": lang.name_native,
        "{{TAGLINE}}": strings["tagline"],
        "{{WEB_SPEECH_CODE}}": lang.web_speech_code,
        "{{TIER}}": tier,
        "{{DIR}}": direction,
        "{{STATUS_LOADING}}": strings["status_loading"],
        "{{CHECKING}}": strings["checking"],
        "{{SPEAK_BLOCK}}": speak_block,
        "{{TIER_C_DONOR_BLOCK}}": donor_block,
        "{{DONATE_BUTTON}}": strings["donate_button"],
        "{{DONATE_BUTTON_ARIA}}": f"Donate your voice for {lang.name_en}",
        "{{DOWNLOAD_BUTTON}}": strings["download_button"],
        "{{DOWNLOAD_BUTTON_ARIA}}": f"Download {lang.name_en} voice model",
    }
    for k, v in replacements.items():
        out = out.replace(k, v)
    return out


def main() -> None:
    written = []
    for lang in L.ALL_LANGUAGES:
        target = ROOT / f"chitti_{lang.code}.html"
        target.write_text(render_one(lang), encoding="utf-8")
        written.append(target.name)
    print(f"Wrote {len(written)} files:")
    for name in written:
        print(" ", name)


if __name__ == "__main__":
    main()
