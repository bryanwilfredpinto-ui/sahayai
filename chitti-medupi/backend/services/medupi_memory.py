"""
services/medupi_memory.py
-------------------------
CHITTI MEMORY OS — BO1 store/retrieve layer (graceful, never-throw).

Per MEMORY_ARCHITECTURE.md the memory subsystem is **best-effort**: a
Turso read-block, a missing table, or any DB hiccup must NEVER break a
scan or a response. Every public function is wrapped so it returns a safe
default instead of raising.

Public API (BO1):
  save_message(db, device_uuid, chitti, role, text)      -> bool
  upsert_fact(db, device_uuid, fact_type, value, source) -> bool
  get_facts(db, device_uuid, chitti=None, limit=5)        -> list[dict]
  build_memory_context(facts)                             -> str   (system-prompt block)

Identity = device_uuid (frontend localStorage `sahay_device_id`,
sent as `X-User-Token`). No PII.
"""
from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import func

from models.memory import UserSession, UserFact

log = logging.getLogger("services.medupi_memory")

_MAX_TEXT = 4000


def save_message(db, device_uuid: str, chitti: str, role: str, text: str) -> bool:
    """Append one turn to the session log. Best-effort."""
    try:
        if not device_uuid or len(device_uuid) < 8:
            return False
        row = UserSession(
            device_uuid=device_uuid.strip(),
            chitti_name=(chitti or "medupi")[:40],
            message_role=(role or "user")[:16],
            message_text=(text or "")[:_MAX_TEXT],
            timestamp=datetime.utcnow(),
        )
        db.add(row)
        db.commit()
        return True
    except Exception as e:                       # noqa: BLE001 — memory never throws
        log.warning("save_message skipped: %s", e)
        try:
            db.rollback()
        except Exception:
            pass
        return False


def upsert_fact(db, device_uuid: str, fact_type: str, value: str,
                source: str = "medupi") -> bool:
    """Insert a durable fact, or bump last_seen if it already exists. Best-effort."""
    try:
        if not device_uuid or len(device_uuid) < 8 or not value:
            return False
        value = str(value)[:240]
        existing = (
            db.query(UserFact)
            .filter(
                UserFact.device_uuid == device_uuid.strip(),
                UserFact.fact_type == fact_type[:40],
                UserFact.fact_value == value,
            )
            .first()
        )
        if existing:
            existing.last_seen = datetime.utcnow()
            existing.source_chitti = (source or existing.source_chitti)[:40]
        else:
            db.add(UserFact(
                device_uuid=device_uuid.strip(),
                fact_type=fact_type[:40],
                fact_value=value,
                source_chitti=(source or "medupi")[:40],
                created_at=datetime.utcnow(),
                last_seen=datetime.utcnow(),
            ))
        db.commit()
        return True
    except Exception as e:                       # noqa: BLE001
        log.warning("upsert_fact skipped: %s", e)
        try:
            db.rollback()
        except Exception:
            pass
        return False


def get_facts(db, device_uuid: str, chitti: str | None = None,
              limit: int = 5) -> list[dict]:
    """Top-N most-recent facts for a user (optionally scoped to one Chitti).
    BO1 ranking = recency (last_seen desc); decay/similarity arrive in BO3.
    Best-effort → [] on any error or no consent/uuid."""
    try:
        if not device_uuid or len(device_uuid) < 8:
            return []
        q = db.query(UserFact).filter(UserFact.device_uuid == device_uuid.strip())
        if chitti:
            q = q.filter(UserFact.source_chitti == chitti)
        rows = q.order_by(UserFact.last_seen.desc()).limit(int(limit) or 5).all()
        return [
            {"fact_type": r.fact_type, "fact_value": r.fact_value,
             "source_chitti": r.source_chitti,
             "last_seen": r.last_seen.isoformat() if r.last_seen else None}
            for r in rows
        ]
    except Exception as e:                       # noqa: BLE001
        log.warning("get_facts skipped: %s", e)
        return []


def build_memory_context(facts: list[dict]) -> str:
    """Render top facts into a compact system-prompt block. Empty string when
    there is nothing to inject (→ caller adds no system message → behaviour
    is byte-identical to no-memory)."""
    if not facts:
        return ""
    lines = []
    for f in facts[:5]:
        ft = (f.get("fact_type") or "").replace("_", " ")
        lines.append(f"- {ft}: {f.get('fact_value')}")
    return (
        "[CHITTI MEMORY — context about this returning user, consented. "
        "Use ONLY as background; do not recite it. Still follow your task "
        "instructions exactly.]\n" + "\n".join(lines)
    )
