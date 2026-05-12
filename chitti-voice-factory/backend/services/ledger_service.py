"""
services/ledger_service.py — Honest synthesis ledger + query.
"""
from __future__ import annotations

import hashlib
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from models import SynthesisLog


def log_synthesis(
    db: Session,
    language_code: str,
    supplier: str,
    text: str,
    bytes_out: Optional[int],
    latency_ms: Optional[int],
    ok: bool,
    error_code: Optional[str] = None,
) -> SynthesisLog:
    """Record a synthesis attempt."""
    text_sha = hashlib.sha256((text or "").encode("utf-8")).hexdigest()
    row = SynthesisLog(
        language_code=language_code,
        supplier=supplier,
        text_sha256=text_sha,
        text_chars=len(text or ""),
        bytes_out=bytes_out,
        latency_ms=latency_ms,
        ok=1 if ok else 0,
        error_code=error_code,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def is_language_available_honest(db: Session, language_code: str) -> tuple[bool, str]:
    """
    Check if language has proof of successful synthesis in last 24h.
    Returns (available: bool, reason: str).
    """
    cutoff = datetime.utcnow() - timedelta(hours=24)
    row = (
        db.query(SynthesisLog)
        .filter(
            SynthesisLog.language_code == language_code,
            SynthesisLog.ok == 1,
            SynthesisLog.latency_ms.isnot(None),
            SynthesisLog.created_at >= cutoff,
        )
        .order_by(SynthesisLog.created_at.desc())
        .first()
    )
    if not row:
        return False, "No successful synthesis proof in last 24 hours."
    return True, f"Last success: {row.supplier} at {row.created_at.isoformat()}"


def get_language_status(db: Session, language_code: str) -> dict:
    """Full status for one language."""
    available, reason = is_language_available_honest(db, language_code)
    latency_row = (
        db.query(SynthesisLog)
        .filter(SynthesisLog.language_code == language_code, SynthesisLog.ok == 1)
        .order_by(SynthesisLog.latency_ms)
        .first()
    )
    return {
        "language_code": language_code,
        "available": available,
        "reason": reason,
        "best_latency_ms": latency_row.latency_ms if latency_row else None,
        "best_supplier": latency_row.supplier if latency_row else None,
    }


def get_ledger_summary(db: Session) -> list[dict]:
    """Summary of all 26 languages."""
    from services.languages import LANGUAGES
    return [get_language_status(db, code) for code in LANGUAGES.keys()]
