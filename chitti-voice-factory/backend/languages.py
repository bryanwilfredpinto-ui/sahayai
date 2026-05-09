"""24-language registry for Chitti Voice Factory.

Source of truth for which languages exist in the cascade. Per-language tier and
supplier readiness; the runtime ledger turns these into honest available/unavailable.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Language:
    code: str            # ISO 639 code we use across Chitti
    name_en: str         # English name for UI
    name_native: str     # Native script name
    web_speech_code: str # BCP-47 code for browser SpeechSynthesis (best-effort)
    tier: str            # 'A' Tier-A primary, 'B' Tier-B cousin, 'C' donor-required cousin
    family: str          # 'primary' | 'cousin'
    bhashini_supported: bool
    ai4bharat_supported: bool


PRIMARY_12 = [
    Language("hi",  "Hindi",     "हिन्दी",        "hi-IN",  "A", "primary", True,  True),
    Language("bn",  "Bangla",    "বাংলা",         "bn-IN",  "A", "primary", True,  True),
    Language("te",  "Telugu",    "తెలుగు",        "te-IN",  "A", "primary", True,  True),
    Language("ta",  "Tamil",     "தமிழ்",         "ta-IN",  "A", "primary", True,  True),
    Language("kn",  "Kannada",   "ಕನ್ನಡ",         "kn-IN",  "A", "primary", True,  True),
    Language("ml",  "Malayalam", "മലയാളം",        "ml-IN",  "A", "primary", True,  True),
    Language("mr",  "Marathi",   "मराठी",         "mr-IN",  "A", "primary", True,  True),
    Language("gu",  "Gujarati",  "ગુજરાતી",        "gu-IN",  "A", "primary", True,  True),
    Language("or",  "Odia",      "ଓଡ଼ିଆ",         "or-IN",  "A", "primary", True,  True),
    Language("as",  "Assamese",  "অসমীয়া",        "as-IN",  "A", "primary", True,  True),
    Language("pa",  "Punjabi",   "ਪੰਜਾਬੀ",         "pa-IN",  "A", "primary", True,  True),
    Language("ur",  "Urdu",      "اُردُو",         "ur-IN",  "A", "primary", True,  False),
]

COUSIN_12 = [
    Language("bho", "Bhojpuri",     "भोजपुरी",       "hi-IN",  "B", "cousin", False, True),
    Language("hne", "Chhattisgarhi","छत्तीसगढ़ी",     "hi-IN",  "B", "cousin", False, False),
    Language("mai", "Maithili",     "मैथिली",        "hi-IN",  "B", "cousin", True,  False),
    Language("kok", "Konkani",      "कोंकणी",        "mr-IN",  "B", "cousin", True,  False),
    Language("doi", "Dogri",        "डोगरी",         "hi-IN",  "B", "cousin", True,  False),
    Language("sd",  "Sindhi",       "सिन्धी",        "hi-IN",  "B", "cousin", True,  False),
    Language("ks",  "Kashmiri",     "كٲشُر",          "ur-IN",  "B", "cousin", True,  False),
    Language("mni", "Manipuri",     "ꯃꯩꯇꯩꯂꯣꯟ",       "bn-IN",  "B", "cousin", True,  True),
    Language("brx", "Bodo",         "बड़ो",          "hi-IN",  "B", "cousin", False, True),
    Language("sat", "Santhali",     "ᱥᱟᱱᱛᱟᱲᱤ",        "hi-IN",  "B", "cousin", False, False),
    # Sanskrit — scheduled-22; Bhashini + AI4Bharat both have partial coverage; Web Speech rarely.
    Language("sa",  "Sanskrit",     "संस्कृतम्",       "sa-IN",  "B", "cousin", True,  True),
    # Tier C — no production model. Page renders donor banner instead of speak button.
    Language("tcy", "Tulu",         "ತುಳು",          "kn-IN",  "C", "cousin", False, False),
    Language("kfa", "Kodava",       "ಕೊಡವ",          "kn-IN",  "C", "cousin", False, False),
    Language("kru", "Oraon",        "कुड़ुख़",         "hi-IN",  "C", "cousin", False, False),
]

ALL_LANGUAGES = PRIMARY_12 + COUSIN_12
ALL_CODES = [lang.code for lang in ALL_LANGUAGES]
BY_CODE = {lang.code: lang for lang in ALL_LANGUAGES}


def get(code: str) -> Language | None:
    return BY_CODE.get(code)


def is_tier_c(code: str) -> bool:
    lang = BY_CODE.get(code)
    return lang is not None and lang.tier == "C"
