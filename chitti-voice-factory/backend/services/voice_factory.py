"""
services/voice_factory.py — Main TTS orchestrator (cascade + ledger).
"""
from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from config import settings
from services import bhashini_client, ledger_service
from services.languages import get_language

log = logging.getLogger("voice_factory")


def speak(db: Session, text: str, language_code: str) -> dict:
    """
    Main entry point. Cascade: on_device → mock_bhashini → ai4bharat → sarvam.
    Records every attempt in ledger.
    """
    text = (text or "").strip()
    if not text:
        return {"ok": False, "error": "text_required", "language_code": language_code}

    if len(text) > settings.MAX_TEXT_CHARS:
        return {
            "ok": False,
            "error": f"text_too_long_max_{settings.MAX_TEXT_CHARS}",
            "language_code": language_code,
        }

    lang = get_language(language_code)
    if not lang:
        return {"ok": False, "error": f"language_not_found", "language_code": language_code}

    # Try Bhashini (v1: mock)
    result = bhashini_client.speak(text, language_code, settings.SYNTHESIS_TIMEOUT_SEC)
    ledger_service.log_synthesis(
        db,
        language_code=language_code,
        supplier=result["supplier"],
        text=text,
        bytes_out=len(result.get("audio_bytes") or b""),
        latency_ms=result.get("latency_ms"),
        ok=result["ok"],
        error_code=result.get("error"),
    )
    return {
        "ok": result["ok"],
        "language_code": language_code,
        "supplier": result["supplier"],
        "directive": result.get("directive"),
        "audio_bytes": result.get("audio_bytes"),
        "latency_ms": result.get("latency_ms"),
        "error": result.get("error"),
    }


def status_one(db: Session, language_code: str) -> dict:
    """Status for one language."""
    lang = get_language(language_code)
    if not lang:
        return {"error": "language_not_found"}
    status = ledger_service.get_language_status(db, language_code)
    status.update({
        "name": lang.name,
        "native_name": lang.native_name,
        "tier": lang.tier,
        "honest_banner": lang.honest_banner,
    })
    return status


def status_all(db: Session) -> dict:
    """Status for all 26 languages."""
    summary = ledger_service.get_ledger_summary(db)
    from services.languages import LANGUAGES
    for item in summary:
        lang = LANGUAGES.get(item["language_code"])
        if lang:
            item["name"] = lang.name
            item["native_name"] = lang.native_name
            item["tier"] = lang.tier
            item["honest_banner"] = lang.honest_banner
    return {"languages": summary}
