"""
services/bhashini_client.py — Bhashini TTS API client (mock until ULCA creds).
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from config import settings

log = logging.getLogger("bhashini_client")

BHASHINI_API_URL = "https://api.bhashini.ai/v1/ai4bharat/tts/synthesize"


def speak(text: str, language_code: str, timeout_sec: int = 30) -> dict:
    """
    Call Bhashini TTS API. Returns {ok, directive, audio_bytes, latency_ms, error}.
    
    In v1 (before ULCA creds), returns mock_bhashini directive so client uses Web Speech API.
    """
    if not settings.BHASHINI_API_KEY:
        log.warning("BHASHINI_API_KEY not set — returning mock directive")
        return {
            "ok": True,
            "supplier": "mock_bhashini",
            "directive": "use_web_speech_api",
            "audio_bytes": None,
            "latency_ms": None,
            "error": None,
        }

    try:
        body = {
            "input": [{"source": text}],
            "controlConfig": {"language": {"sourceLanguage": language_code}},
            "audioConfig": {"audioFormat": "wav"},
        }
        headers = {
            "Authorization": f"Bearer {settings.BHASHINI_API_KEY}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=float(timeout_sec)) as client:
            r = client.post(BHASHINI_API_URL, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        audio_b64 = data.get("output", {}).get("audio", [{}])[0].get("audioContent", "")
        if not audio_b64:
            return {"ok": False, "supplier": "bhashini", "error": "no_audio", "latency_ms": None}
        import base64
        audio_bytes = base64.b64decode(audio_b64)
        return {
            "ok": True,
            "supplier": "bhashini",
            "audio_bytes": audio_bytes,
            "latency_ms": r.elapsed.total_seconds() * 1000,
            "error": None,
        }
    except httpx.HTTPStatusError as e:
        log.error("Bhashini HTTP %s: %s", e.response.status_code, e.response.text[:200])
        return {
            "ok": False,
            "supplier": "bhashini",
            "error": f"http_{e.response.status_code}",
            "latency_ms": None,
        }
    except Exception as e:
        log.exception("Bhashini call failed: %s", e)
        return {
            "ok": False,
            "supplier": "bhashini",
            "error": str(e)[:100],
            "latency_ms": None,
        }
