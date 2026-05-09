"""Sarvam supplier (paid · last-resort · DISABLED in v1).

Spec §11.3: closed-source paid costs must be logged + rate-limited + only used
after free suppliers fail. Disabled by default. Set SARVAM_API_KEY AND
SARVAM_ENABLED=1 to activate.
"""

import os

from suppliers.base import Supplier, SynthesisResult


class SarvamSupplier(Supplier):
    name = "sarvam"

    @property
    def enabled(self) -> bool:
        return (
            os.environ.get("SARVAM_ENABLED") == "1"
            and bool(os.environ.get("SARVAM_API_KEY"))
        )

    def supports(self, language_code: str) -> bool:
        # Sarvam advertises broad Indic coverage; gate on enabled flag.
        return self.enabled

    def synthesize(self, text: str, language_code: str) -> SynthesisResult:
        if not self.enabled:
            return SynthesisResult(
                ok=False, supplier=self.name,
                error_code="disabled",
                error_message="Sarvam (paid) is disabled in v1. Set SARVAM_ENABLED=1 + SARVAM_API_KEY to activate.",
            )
        return SynthesisResult(
            ok=False, supplier=self.name,
            error_code="not_implemented",
            error_message="Phase 8 wiring pending.",
        )
