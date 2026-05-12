"""
routes/voice.py — /api/voice/* endpoints.
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request
from sqlalchemy.orm import Session

from database import SessionLocal
from services import voice_factory
from services.languages import get_all_languages, get_language

log = logging.getLogger("routes.voice")

bp = Blueprint("voice", __name__, url_prefix="/api/voice")


def get_db() -> Session:
    return SessionLocal()


@bp.get("/languages")
def languages():
    langs = get_all_languages()
    items = [
        {
            "code": lang.code,
            "name": lang.name,
            "native_name": lang.native_name,
            "tier": lang.tier,
        }
        for lang in langs.values()
    ]
    return jsonify({"items": items})


@bp.get("/status")
def status_all():
    db = get_db()
    try:
        result = voice_factory.status_all(db)
        return jsonify(result)
    finally:
        db.close()


@bp.get("/status/<language_code>")
def status_one(language_code: str):
    db = get_db()
    try:
        result = voice_factory.status_one(db, language_code)
        if "error" in result:
            abort(404, description=result["error"])
        return jsonify(result)
    finally:
        db.close()


@bp.post("/speak")
def speak():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        abort(400, description="text is required")
    language = (body.get("language") or "hi").strip().lower()

    db = get_db()
    try:
        result = voice_factory.speak(db, text, language)
        if not result["ok"]:
            return jsonify(result), 400
        # If directive is present, send to client for client-side handling (e.g., Web Speech API)
        if result.get("directive"):
            return jsonify({
                "ok": True,
                "language_code": language,
                "supplier": result["supplier"],
                "directive": result["directive"],
                "disclaimer": _disclaimer_for_language(language),
            })
        # Otherwise return audio bytes (when Sarvam / real Bhashini available)
        return result.get("audio_bytes") or b"", 200, {"Content-Type": "audio/wav"}
    finally:
        db.close()


@bp.get("/honest-banner")
def honest_banner():
    """
    The disclaimer text that should be read aloud when falling back to a degraded supplier.
    Every Chitti product calls this and reads it aloud after synthesis.
    """
    return jsonify({
        "text": "Yeh AI ki madad hai. Chitti Voice Factory se synthesise kiya gaya hai.",
        "en": "This is AI assistance. Synthesized by Chitti Voice Factory.",
    })


@bp.get("/ledger")
def ledger_report():
    """
    Full anonymized ledger (text never logged; only sha256 + stats).
    """
    db = get_db()
    try:
        summary = voice_factory.status_all(db)
        return jsonify({
            "report_time": __import__("datetime").datetime.utcnow().isoformat(),
            "languages": summary["languages"],
            "note": "All text inputs are anonymized (SHA256 hash only). No user data is retained.",
        })
    finally:
        db.close()


def _disclaimer_for_language(language_code: str) -> str:
    """Localized disclaimer for a language."""
    disclaimers = {
        "hi": "Yeh AI ki madad hai. Chitti Voice Factory se synthesise kiya gaya hai.",
        "en": "This is AI assistance. Synthesized by Chitti Voice Factory.",
        "ta": "Idhu AI unavai. Chitti Voice Factory aalam synthesise panna pattathu.",
        "te": "Idi AI sahayam. Chitti Voice Factory nundi synthesize chesina hetharam.",
        "bn": "Etar AI sahayata. Chitti Voice Factory theke synthesize kora hoyeche.",
        "mr": "Hya AI sahayyaa. Chitti Voice Factory pasun synthesize kelay gele ahe.",
        "gu": "Aa AI madad che. Chitti Voice Factory thi synthesize thay chu.",
        "kn": "Idu AI sahaya. Chitti Voice Factory ninda synthesize madittu.",
        "ml": "Ith AI sahayam. Chitti Voice Factory ninnu synthesize cheytha.",
        "or": "Ehi AI sahaya. Chitti Voice Factory ku synthesize keina.",
        "as": "Eita AI sara. Chitti Voice Factory thek synthesize kora hoisey.",
        "pa": "Yeh AI madad hai. Chitti Voice Factory ton synthesize kita gaya.",
    }
    return disclaimers.get(language_code, disclaimers["en"])
