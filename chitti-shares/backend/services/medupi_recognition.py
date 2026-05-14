"""
services/medupi_recognition.py
------------------------------
Stale stub. The canonical MedUPI recognition pipeline lives in the
dedicated chitti-medupi backend at
[chitti-medupi/backend/services/medupi_recognition.py] and ships via the
`chitti-medupi-api` service on Render. This stub remains so the legacy
`/api/medupi/*` endpoints on chitti-shares-api don't 500 — they return
an honest Coming-Soon and point the user at the real backend.

If you reach this file looking to wire OCR, edit
[chitti-medupi/backend/services/medupi_recognition.py] instead. It uses
DeepSeek vision (OpenAI-compatible /chat/completions with image_url
data-URL) per the LOCKED §2 decision — Anthropic was removed across
every Chitti backend. See project_ai_provider_switch_to_deepseek.
"""
from __future__ import annotations

import logging

log = logging.getLogger("medupi_recognition")


def recognise_image(image_bytes: bytes, mime: str = "image/jpeg") -> dict:
    """
    Stub. Returns an unrecognised response with a friendly Coming-Soon
    message. Wires next session.
    """
    log.info("medupi.recognise_image called (stub) — %s, %d bytes", mime, len(image_bytes or b""))
    return {
        "ok": False,
        "stub": True,
        "message": "Use chitti-medupi-api for medicine recognition. The DeepSeek vision pipeline lives there per the §2 lock.",
        "extracted": {
            "brand_name": None,
            "salt_composition": None,
            "strength": None,
            "dosage_form": None,
            "pack_size": None,
        },
    }


def recognise_text(text: str) -> dict:
    """
    Stub. Given a plain text medicine name (typed or spoken), look up the
    master DB. Wires next session via medupi_database.search_by_brand().
    """
    log.info("medupi.recognise_text called (stub) — %r", text)
    return {
        "ok": False,
        "stub": True,
        "message": "Database lookup not yet wired. Fuzzy brand-name search wires next session.",
        "query": text,
        "extracted": {
            "brand_name": text,
            "salt_composition": None,
            "strength": None,
            "dosage_form": None,
        },
    }
