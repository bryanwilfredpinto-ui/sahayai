"""Supplier interface. Every supplier returns a SynthesisResult."""

from dataclasses import dataclass


@dataclass
class SynthesisResult:
    ok: bool
    supplier: str                          # 'on_device' | 'bhashini' | 'mock_bhashini' | 'ai4bharat' | 'sarvam'
    audio_url: str | None = None           # populated when supplier returns server-rendered audio
    audio_bytes_count: int | None = None   # bytes of audio produced (None if client-side directive)
    client_directive: str | None = None    # e.g. 'speech_synthesis' — tells client to render locally
    voice_lang_code: str | None = None     # BCP-47 hint for client TTS
    latency_ms: int | None = None
    disclaimer: str = ""
    error_code: str | None = None
    error_message: str | None = None


class Supplier:
    name: str = ""
    enabled: bool = True

    def supports(self, language_code: str) -> bool:
        raise NotImplementedError

    def synthesize(self, text: str, language_code: str) -> SynthesisResult:
        raise NotImplementedError
