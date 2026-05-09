"""MOCK Bhashini supplier — active until real ULCA credentials are issued.

Returns a `client_directive: speech_synthesis` so the client uses its built-in
Web Speech API to actually produce audio. The supplier name in every response
is `mock_bhashini` (NOT `bhashini`) so the ledger and the user-facing
disclaimer never lie about provenance.

This satisfies spec §11.1: "the mock supplier is named mock_bhashini
everywhere — never silently labelled bhashini."

When real Bhashini comes online (env VOICE_FACTORY_USE_MOCK_BHASHINI=0 + creds),
the cascade prefers the real supplier and this one is skipped.
"""

import time

import languages
from suppliers.base import Supplier, SynthesisResult


_DISCLAIMER = (
    "MOCK supplier — replaces real Bhashini once NLTM credentials are issued. "
    "Voice is your device's built-in TTS. Not a real person."
)


class MockBhashiniSupplier(Supplier):
    name = "mock_bhashini"
    enabled = True

    def supports(self, language_code: str) -> bool:
        # Mock covers Tier A + B (everything Bhashini will eventually serve).
        # Tier C (Tulu, Kodava) deliberately not covered — we will not pretend.
        lang = languages.get(language_code)
        return lang is not None and lang.tier in {"A", "B"}

    def synthesize(self, text: str, language_code: str) -> SynthesisResult:
        t0 = time.perf_counter()
        lang = languages.get(language_code)
        if lang is None:
            return SynthesisResult(
                ok=False, supplier=self.name,
                error_code="unknown_language",
                error_message=f"Language code '{language_code}' not in registry.",
            )
        if not self.supports(language_code):
            return SynthesisResult(
                ok=False, supplier=self.name,
                error_code="tier_c_not_supported",
                error_message=f"{lang.name_en} (Tier C) requires donor program. No silent fallback.",
            )
        latency_ms = int((time.perf_counter() - t0) * 1000)
        return SynthesisResult(
            ok=True,
            supplier=self.name,
            audio_url=None,
            audio_bytes_count=0,                    # client renders the audio
            client_directive="speech_synthesis",
            voice_lang_code=lang.web_speech_code,
            latency_ms=latency_ms,
            disclaimer=_DISCLAIMER,
        )
