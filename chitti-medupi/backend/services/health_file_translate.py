"""
services/health_file_translate.py
---------------------------------
Phase B — cross-language translation for the Health File.

Use cases (per Sire's brief 2026-05-24):
  - Translate Hindi BP reminders into Bengali for the mother-in-law
  - Translate a Telugu prescription summary into Tamil for the cousin
  - Voice in (recorded on chitti_vaani.html via Voice Factory) → Hindi
    text → this endpoint translates → frontend speaks via Voice Factory.

LLM provider: DeepSeek (per §2 LOCKED). No third-party translator.
"""
from __future__ import annotations

import logging

import httpx

from config import settings

log = logging.getLogger("health_file_translate")


# Friendly names for the 13 Indian languages the language-selector ships with.
_LANG_NAMES = {
    "en": "English",
    "hi": "Hindi (Devanagari)",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi (Gurmukhi)",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
    "ne": "Nepali",
    "sa": "Sanskrit",
    "kok": "Konkani",
    "mai": "Maithili",
    "doi": "Dogri",
    "ks": "Kashmiri",
    "sd": "Sindhi",
    "mni": "Manipuri",
    "sat": "Santhali",
    "bho": "Bhojpuri",
    "raj": "Rajasthani",
}


def translate(*, text: str, source_lang: str = "auto", target_lang: str = "hi") -> dict:
    """Translate `text` from `source_lang` → `target_lang` via DeepSeek.

    Returns:
      {
        "translated": "string in target language",
        "source_lang": "<resolved>" (echoes input or 'auto'),
        "target_lang": "<input>",
        "_status": "ok" | "deepseek_unset" | "model_error" | "same_lang_noop"
      }
    """
    text = (text or "").strip()
    if not text:
        return {
            "translated": "", "source_lang": source_lang, "target_lang": target_lang,
            "_status": "empty_input",
        }
    if source_lang and source_lang == target_lang:
        return {
            "translated": text, "source_lang": source_lang, "target_lang": target_lang,
            "_status": "same_lang_noop",
        }
    if not settings.DEEPSEEK_API_KEY:
        return {
            "translated": text, "source_lang": source_lang, "target_lang": target_lang,
            "_status": "deepseek_unset",
        }

    tgt_name = _LANG_NAMES.get(target_lang.lower(), target_lang)
    src_clause = (
        "Auto-detect the source language."
        if source_lang in (None, "", "auto")
        else f"The source language is {_LANG_NAMES.get(source_lang.lower(), source_lang)}."
    )

    system = (
        "You are Chitti, an Indian-language translator. Translate the user's input EXACTLY into "
        f"{tgt_name}. {src_clause} Rules: "
        "1) Preserve every medical / numeric detail (doses, dates, mg, mmHg, ₹). "
        "2) Keep proper nouns / brand names verbatim — never localise 'Apollo' or 'Metformin'. "
        "3) Output the translated text ONLY — no preface, no quotes, no 'Translation:' label. "
        "4) Use the native script of the target language (Devanagari for Hindi/Marathi, Bengali for Bangla, etc.)."
    )

    body = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": text},
        ],
        "temperature": 0.1,
        "max_tokens": 1200,
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post(settings.DEEPSEEK_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        translated = (data["choices"][0]["message"]["content"] or "").strip()
    except (httpx.HTTPError, KeyError, ValueError) as e:
        log.exception("DeepSeek translate failed: %s", e)
        return {
            "translated": text,
            "source_lang": source_lang, "target_lang": target_lang,
            "_status": "model_error",
        }

    return {
        "translated": translated,
        "source_lang": source_lang or "auto",
        "target_lang": target_lang,
        "_status": "ok",
    }
