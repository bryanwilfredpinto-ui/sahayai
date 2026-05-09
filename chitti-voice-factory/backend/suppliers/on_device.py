"""On-device supplier (highest priority in cascade).

Honest placeholder: until quantised ONNX models are packaged and shipped via
IndexedDB, this supplier reports unavailable for every language. The cascade
falls through to Bhashini (mock or real). When we ship Phase 10, this file
becomes a registry that responds to client cache hits.
"""

from suppliers.base import Supplier, SynthesisResult


class OnDeviceSupplier(Supplier):
    name = "on_device"
    enabled = True

    def supports(self, language_code: str) -> bool:
        return False  # nothing packaged yet — be honest about it

    def synthesize(self, text: str, language_code: str) -> SynthesisResult:
        return SynthesisResult(
            ok=False,
            supplier=self.name,
            error_code="model_not_downloaded",
            error_message="No on-device voice model packaged for this language yet. Phase 10.",
        )
