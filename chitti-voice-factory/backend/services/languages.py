"""
services/languages.py — 26-language registry + per-language metadata.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class Language:
    code: str
    name: str
    native_name: str
    tier: str  # A, B, C
    has_bhashini: bool
    has_ai4bharat: bool
    has_web_speech: bool
    honest_banner: Optional[str]


LANGUAGES = {
    # Tier A — 12 Primary (constitutional)
    "hi": Language("hi", "Hindi", "हिन्दी", "A", True, True, True, None),
    "bn": Language("bn", "Bengali", "বাংলা", "A", True, True, True, None),
    "te": Language("te", "Telugu", "తెలుగు", "A", True, True, True, None),
    "ta": Language("ta", "Tamil", "தமிழ்", "A", True, True, True, None),
    "kn": Language("kn", "Kannada", "ಕನ್ನಡ", "A", True, True, True, None),
    "ml": Language("ml", "Malayalam", "മലയാളം", "A", True, True, True, None),
    "mr": Language("mr", "Marathi", "मराठी", "A", True, True, True, None),
    "gu": Language("gu", "Gujarati", "ગુજરાતી", "A", True, True, True, None),
    "or": Language("or", "Odia", "ଓଡ଼ିଆ", "A", True, True, False, None),
    "as": Language("as", "Assamese", "অসমীয়া", "A", True, True, False, None),
    "pa": Language("pa", "Punjabi", "ਪੰਜਾਬੀ", "A", True, False, True, None),
    "ur": Language("ur", "Urdu", "اردو", "A", True, False, True, None),

    # Tier B — 11 Cousins (quality varies)
    "bho": Language("bho", "Bhojpuri", "भोजपुरी", "B", False, True, False,
                    "Bhojpuri voice in BETA — corpus-based synthesis."),
    "hne": Language("hne", "Chhattisgarhi", "छत्तीसगढ़ी", "B", False, False, False,
                    "Chhattisgarhi voice in LIMITED BETA. Donor program underway."),
    "mai": Language("mai", "Maithili", "मैथिली", "B", True, False, False,
                    "Maithili voice in BETA — coverage improving."),
    "kok": Language("kok", "Konkani", "कोंकणी", "B", True, False, False,
                    "Konkani voice in BETA. Dialects vary."),
    "doi": Language("doi", "Dogri", "डोगरी", "B", True, False, False,
                    "Dogri voice in LIMITED BETA."),
    "sd": Language("sd", "Sindhi", "سِندھی", "B", True, False, False,
                   "Sindhi voice in LIMITED BETA. Arabic script supported."),
    "ks": Language("ks", "Kashmiri", "کأشُر", "B", False, False, False,
                   "Kashmiri voice in ALPHA — coverage limited."),
    "mni": Language("mni", "Manipuri", "মণিপুরী", "B", True, True, False, None),
    "brx": Language("brx", "Bodo", "बड़ो", "B", False, True, False,
                    "Bodo voice in BETA."),
    "sat": Language("sat", "Santhali", "ᱥᱟᱱᱛᱟᱞᱤ", "B", False, False, False,
                    "Santhali voice in ALPHA — Ol Chiki script. Donor program planned."),
    "sa": Language("sa", "Sanskrit", "संस्कृतम्", "B", True, False, False,
                   "Sanskrit voice in LIMITED BETA."),

    # Tier C — 3 Cousins (no production model)
    "tcy": Language("tcy", "Tulu", "ತುಳು", "C", False, False, False,
                    "🔔 Tulu voice is not yet available. Help us by donating voice recordings."),
    "kfa": Language("kfa", "Kodava", "ಕೋಡವ", "C", False, False, False,
                    "🔔 Kodava voice is not yet available. Help us by donating voice recordings."),
    "kru": Language("kru", "Oraon (Kurukh)", "कुड़ुख़", "C", False, False, False,
                    "🔔 Oraon (Kurukh) voice is not yet available. Help us by donating voice recordings."),
}


def get_language(code: str) -> Optional[Language]:
    return LANGUAGES.get(code)


def get_all_languages() -> dict[str, Language]:
    return LANGUAGES


def list_languages_by_tier(tier: str) -> list[Language]:
    return [lang for lang in LANGUAGES.values() if lang.tier == tier]
