"""Cascade router: tries suppliers in priority order.

Order (per spec §3): on_device → bhashini → ai4bharat → sarvam.
mock_bhashini sits between bhashini and ai4bharat — used only when real Bhashini
is not configured.

Every attempt (success OR failure) is logged to the ledger so /api/voice/status
reports the truth.
"""

import ledger
from suppliers.ai4bharat import AI4BharatSupplier
from suppliers.base import Supplier, SynthesisResult
from suppliers.bhashini import BhashiniSupplier
from suppliers.mock_bhashini import MockBhashiniSupplier
from suppliers.on_device import OnDeviceSupplier
from suppliers.sarvam import SarvamSupplier


_SUPPLIER_ORDER: list[Supplier] = [
    OnDeviceSupplier(),
    BhashiniSupplier(),
    MockBhashiniSupplier(),
    AI4BharatSupplier(),
    SarvamSupplier(),
]


def list_suppliers() -> list[dict]:
    out = []
    for s in _SUPPLIER_ORDER:
        out.append({"name": s.name, "enabled": bool(getattr(s, "enabled", True))})
    return out


def synthesize(text: str, language_code: str) -> SynthesisResult:
    """Walk the cascade; return the first ok=True result. Log every attempt."""
    last_failure: SynthesisResult | None = None
    for supplier in _SUPPLIER_ORDER:
        if not getattr(supplier, "enabled", True):
            continue
        if not supplier.supports(language_code):
            continue
        result = supplier.synthesize(text, language_code)
        ledger.log_synthesis(
            language_code=language_code,
            supplier=result.supplier,
            text=text,
            bytes_out=result.audio_bytes_count,
            latency_ms=result.latency_ms if result.latency_ms is not None else None,
            ok=result.ok,
            error_code=result.error_code,
        )
        if result.ok:
            return result
        last_failure = result

    if last_failure is None:
        # Nothing in the cascade even claimed to support this language — likely Tier C.
        last_failure = SynthesisResult(
            ok=False,
            supplier="none",
            error_code="no_supplier_supports_language",
            error_message=(
                "No enabled supplier supports this language. "
                "Tier C languages (Tulu, Kodava) require the donor program."
            ),
        )
        ledger.log_synthesis(
            language_code=language_code,
            supplier="none",
            text=text,
            bytes_out=None,
            latency_ms=None,
            ok=False,
            error_code=last_failure.error_code,
        )
    return last_failure
