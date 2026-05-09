"""AI4Bharat supplier (IndicTTS / IndicParler-TTS · IIT Madras · open weights).

Stubbed for Phase 7. Returns 'not_configured' so the cascade falls through.
When wired, this will either (a) call a self-hosted IndicTTS endpoint or
(b) call HuggingFace Inference Endpoints with a free tier API key.
"""

import os

import languages
from suppliers.base import Supplier, SynthesisResult


class AI4BharatSupplier(Supplier):
    name = "ai4bharat"

    @property
    def enabled(self) -> bool:
        return bool(os.environ.get("AI4BHARAT_ENDPOINT"))

    def supports(self, language_code: str) -> bool:
        lang = languages.get(language_code)
        return lang is not None and lang.ai4bharat_supported

    def synthesize(self, text: str, language_code: str) -> SynthesisResult:
        if not self.enabled:
            return SynthesisResult(
                ok=False, supplier=self.name,
                error_code="not_configured",
                error_message="AI4BHARAT_ENDPOINT not set; Phase 7 not wired.",
            )
        return SynthesisResult(
            ok=False, supplier=self.name,
            error_code="not_implemented",
            error_message="Phase 7 wiring pending.",
        )
