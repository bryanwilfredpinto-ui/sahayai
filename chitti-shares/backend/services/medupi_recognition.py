"""
services/medupi_recognition.py
------------------------------
OCR + composition extraction for Chitti MedUPI.

Pipeline:
  1. Image / PDF in (multipart upload via /api/medupi/scan)
  2. OCR via Tesseract (offline, free) or cloud OCR (Google Vision / AWS Textract for premium)
  3. LLM (Anthropic claude-sonnet-4) extracts: brand_name, salt_composition, strength, dosage_form, pack_size
  4. Returns structured response that `medupi_alternatives.find()` can consume

NEXT SESSION — wires:
  - Tesseract: pip install pytesseract; install tesseract-ocr binary on Render
  - Or: cloud-OCR fallback when Tesseract confidence is low
  - LLM extraction prompt that returns strict JSON
  - Fuzzy match against medupi_database for the salt + strength
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
        "message": "Recognition pipeline not yet wired. Tesseract OCR + Anthropic composition extractor wires next session.",
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
