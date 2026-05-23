"""
services/health_file_service.py
-------------------------------
Business logic for Chitti Health File — upload, list, fetch (decrypt),
extract, share, vitals log, reminders, insurance.

Talks to SQLAlchemy models in `models/health_file.py`, AES-256-GCM in
`services/health_file_crypto.py`, DeepSeek vision in
`services/health_file_extract.py`. Routes layer
(`routes/health_file.py`) just translates HTTP <-> these functions.
"""
from __future__ import annotations

import json
import logging
import secrets
import time
import uuid
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import and_, select, update

from database import SessionLocal
from models.health_file import (
    HealthDocument,
    HealthFact,
    HealthReminder,
    HealthVital,
    InsurancePolicy,
)
from models.family import FamilyProfile
from services import health_file_crypto as crypto
from services import health_file_extract as extractor

log = logging.getLogger("health_file_service")


# ── Family profile helpers ───────────────────────────────────────

def list_profiles(user_token: str) -> list[dict]:
    if not user_token:
        return []
    with SessionLocal() as s:
        rows = s.execute(
            select(FamilyProfile).where(FamilyProfile.user_token == user_token).order_by(FamilyProfile.id.asc())
        ).scalars().all()
    return [_profile_dict(p) for p in rows]


def create_profile(user_token: str, name: str, relation: str, dob: Optional[str] = None) -> dict:
    if not user_token or not name:
        raise ValueError("user_token + name required")
    relation = (relation or "self").strip().lower()
    with SessionLocal() as s:
        p = FamilyProfile(
            user_token=user_token, name=name.strip()[:120],
            relation=relation[:40], dob=(dob or None),
        )
        s.add(p); s.commit(); s.refresh(p)
    return _profile_dict(p)


def _require_profile(s, user_token: str, profile_id: int) -> FamilyProfile:
    p = s.execute(
        select(FamilyProfile).where(
            and_(FamilyProfile.user_token == user_token, FamilyProfile.id == profile_id)
        )
    ).scalar_one_or_none()
    if not p:
        raise ValueError("profile_not_found_or_not_yours")
    return p


def _profile_dict(p: FamilyProfile) -> dict:
    return {
        "id": p.id, "name": p.name, "relation": p.relation,
        "dob": p.dob, "conditions": _parse_json_list(p.conditions),
        "created_at": (p.created_at.isoformat() if p.created_at else None),
    }


def _parse_json_list(raw: Optional[str]) -> list:
    if not raw: return []
    try: return json.loads(raw) or []
    except (ValueError, TypeError): return []


# ── Document upload + extract ───────────────────────────────────

def upload_document(
    *, user_token: str, profile_id: int,
    doc_type: str, display_name: str,
    blob_bytes: bytes, blob_mime: str,
    doc_date: Optional[str] = None,
    doctor_name: Optional[str] = None,
    hospital_name: Optional[str] = None,
    auto_extract: bool = True,
) -> dict:
    if not user_token:
        raise ValueError("user_token required")
    if not blob_bytes:
        raise ValueError("empty blob")
    if len(blob_bytes) > 15 * 1024 * 1024:
        raise ValueError("file_too_large (>15MB)")

    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        _require_profile(s, user_token, profile_id)

    ct, nonce, tag = crypto.encrypt(user_token, blob_bytes)
    doc_id = uuid.uuid4().hex

    with SessionLocal() as s:
        row = HealthDocument(
            id=doc_id,
            user_token_hash=u_hash,
            profile_id=profile_id,
            blob_ct=ct, blob_nonce=nonce, blob_tag=tag,
            blob_mime=blob_mime or "application/octet-stream",
            blob_size=len(blob_bytes),
            doc_type=(doc_type or "other"),
            display_name=(display_name or "Document")[:200],
            doc_date=doc_date,
            doctor_name=doctor_name,
            hospital_name=hospital_name,
            extract_status="pending",
        )
        s.add(row); s.commit()

    if auto_extract:
        # Synchronous extract for v1 — DeepSeek vision call usually
        # completes within 5-10 s. Async APScheduler path is Phase B.
        _run_extract(user_token, doc_id, blob_bytes, blob_mime, doc_type)

    return get_document_meta(user_token, doc_id)


def _run_extract(user_token: str, doc_id: str, image_bytes: bytes, mime: str, doc_type: str) -> None:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        s.execute(update(HealthDocument).where(
            and_(HealthDocument.id == doc_id, HealthDocument.user_token_hash == u_hash)
        ).values(extract_status="running"))
        s.commit()

    try:
        result = extractor.extract(doc_type, image_bytes, mime)
    except Exception as e:  # noqa: BLE001
        log.exception("extract crash for doc %s: %s", doc_id, e)
        result = {"_extract_status": "failed", "_error": str(e)[:200]}

    status = result.get("_extract_status", "failed")
    summary = _summary_from_extracted(doc_type, result)
    error = result.get("_error") or result.get("_reason")

    with SessionLocal() as s:
        s.execute(update(HealthDocument).where(
            and_(HealthDocument.id == doc_id, HealthDocument.user_token_hash == u_hash)
        ).values(
            extract_status=status,
            extract_summary=summary,
            extract_json=json.dumps(result, ensure_ascii=False),
            extract_error=error,
        ))
        s.commit()

    if status == "done":
        # Insert HealthFact rows from the extracted projection.
        facts = extractor.facts_from_extracted(doc_type, result)
        with SessionLocal() as s:
            doc = s.execute(select(HealthDocument).where(HealthDocument.id == doc_id)).scalar_one_or_none()
            if doc:
                for f in facts:
                    s.add(HealthFact(
                        document_id=doc_id,
                        user_token_hash=u_hash,
                        profile_id=doc.profile_id,
                        kind=f["kind"],
                        label=f["label"],
                        value=f.get("value"),
                        unit=f.get("unit"),
                        normal_low=f.get("normal_low"),
                        normal_high=f.get("normal_high"),
                        out_of_range=f.get("out_of_range") or 0,
                        fact_date=f.get("fact_date"),
                        notes=f.get("notes"),
                    ))
                s.commit()
        # Auto-create reminders for medicine + follow-up + premium-due
        # extracted facts. The user can disable per-row from the frontend.
        _auto_create_reminders_from_extract(user_token, doc_id, result)


def _summary_from_extracted(doc_type: str, extracted: dict) -> str:
    status = extracted.get("_extract_status")
    if status == "coming_soon":
        return f"Auto-extraction for {doc_type} is coming soon. Document stored encrypted."
    if status == "failed":
        return f"Auto-extraction failed: {extracted.get('_error') or extracted.get('_reason') or 'unknown'}"
    if doc_type == "prescription":
        meds = extracted.get("medicines") or []
        names = [m.get("name") or m.get("composition") or "?" for m in meds][:5]
        s = f"{len(meds)} medicine(s): " + ", ".join(names) if names else "Prescription saved."
        if extracted.get("followup_date"):
            s += f" Follow-up on {extracted['followup_date']}."
        return s[:500]
    if doc_type == "blood_report":
        labs = extracted.get("labs") or []
        oor = sum(1 for l in labs if l.get("out_of_range"))
        return f"Blood report saved · {len(labs)} value(s), {oor} out of normal range."[:500]
    return f"{doc_type} saved · extracted."


def _auto_create_reminders_from_extract(user_token: str, doc_id: str, extracted: dict) -> None:
    """Phase A: medicine reminders default to 8am+8pm with the user able
    to edit; follow-up reminders 9am on the followup_date. Both can be
    deleted from the UI."""
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        doc = s.execute(select(HealthDocument).where(HealthDocument.id == doc_id)).scalar_one_or_none()
        if not doc:
            return
        # Medicine reminders
        for med in (extracted.get("medicines") or []):
            name = (med.get("name") or med.get("composition") or "").strip()
            if not name:
                continue
            freq = (med.get("frequency") or "").lower()
            byhour = _parse_freq_to_hours(freq) or [8, 20]  # default twice daily
            label = f"Take {name}"
            next_at = _next_at_hour(byhour[0])
            s.add(HealthReminder(
                user_token_hash=u_hash, profile_id=doc.profile_id,
                kind="medicine", label=label[:240],
                detail=_pack_med_detail(med),
                document_id=doc_id,
                rrule=f"FREQ=DAILY;BYHOUR={','.join(map(str, byhour))}",
                next_fire_at=next_at,
                channels="browser,whatsapp",
            ))
        # Follow-up reminder
        if extracted.get("followup_date"):
            try:
                d = datetime.fromisoformat(extracted["followup_date"] + "T09:00:00")
                s.add(HealthReminder(
                    user_token_hash=u_hash, profile_id=doc.profile_id,
                    kind="followup",
                    label=(extracted.get("followup_notes") or "Doctor follow-up")[:240],
                    document_id=doc_id,
                    rrule=None,
                    next_fire_at=d,
                    channels="browser,whatsapp",
                ))
            except ValueError:
                pass
        s.commit()


def _parse_freq_to_hours(freq: str) -> list[int] | None:
    if not freq:
        return None
    f = freq.lower()
    if "morning" in f and ("evening" in f or "night" in f):
        return [8, 20]
    if "morning" in f and "afternoon" in f and ("evening" in f or "night" in f):
        return [8, 14, 20]
    if "morning" in f:
        return [8]
    if "night" in f or "bedtime" in f:
        return [21]
    if "sos" in f or "as needed" in f:
        return None
    return None


def _next_at_hour(hour: int) -> datetime:
    now = datetime.now()
    n = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    if n <= now:
        n = n + timedelta(days=1)
    return n


def _pack_med_detail(med: dict) -> str:
    bits = []
    for k in ("composition", "dose", "frequency", "duration", "notes"):
        v = (med.get(k) or "").strip()
        if v:
            bits.append(f"{k}: {v}")
    return " · ".join(bits)[:500]


# ── Document list / fetch / delete ───────────────────────────────

def list_documents(user_token: str, profile_id: Optional[int] = None,
                   doc_type: Optional[str] = None, limit: int = 100) -> list[dict]:
    if not user_token:
        return []
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        stmt = select(HealthDocument).where(
            and_(HealthDocument.user_token_hash == u_hash, HealthDocument.forget_at.is_(None))
        )
        if profile_id is not None:
            stmt = stmt.where(HealthDocument.profile_id == profile_id)
        if doc_type:
            stmt = stmt.where(HealthDocument.doc_type == doc_type)
        stmt = stmt.order_by(HealthDocument.created_at.desc()).limit(max(1, min(limit, 500)))
        rows = s.execute(stmt).scalars().all()
    return [_doc_meta_dict(r) for r in rows]


def get_document_meta(user_token: str, doc_id: str) -> dict:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        row = s.execute(select(HealthDocument).where(
            and_(HealthDocument.id == doc_id, HealthDocument.user_token_hash == u_hash)
        )).scalar_one_or_none()
        if not row:
            raise ValueError("not_found")
        return _doc_meta_dict(row)


def get_document_blob(user_token: str, doc_id: str) -> tuple[bytes, str, str]:
    """Decrypt + return (bytes, mime, display_name) for the user."""
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        row = s.execute(select(HealthDocument).where(
            and_(HealthDocument.id == doc_id, HealthDocument.user_token_hash == u_hash,
                 HealthDocument.forget_at.is_(None))
        )).scalar_one_or_none()
        if not row:
            raise ValueError("not_found")
    plaintext = crypto.decrypt(user_token, row.blob_ct, row.blob_nonce, row.blob_tag)
    return plaintext, (row.blob_mime or "application/octet-stream"), row.display_name


def forget_document(user_token: str, doc_id: str) -> bool:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        row = s.execute(select(HealthDocument).where(
            and_(HealthDocument.id == doc_id, HealthDocument.user_token_hash == u_hash)
        )).scalar_one_or_none()
        if not row:
            return False
        row.forget_at = datetime.utcnow()
        # Drop the encrypted blob bytes too — tombstone the row but lose
        # the ciphertext so even a future pepper leak can't recover it.
        row.blob_ct = b""
        row.blob_nonce = b""
        row.blob_tag = b""
        # Cascade: forget the structured facts too.
        s.query(HealthFact).filter(HealthFact.document_id == doc_id).delete()
        s.commit()
    return True


def _doc_meta_dict(r: HealthDocument) -> dict:
    return {
        "id": r.id,
        "profile_id": r.profile_id,
        "doc_type": r.doc_type,
        "display_name": r.display_name,
        "doc_date": r.doc_date,
        "doctor_name": r.doctor_name,
        "hospital_name": r.hospital_name,
        "blob_mime": r.blob_mime,
        "blob_size": r.blob_size,
        "extract_status": r.extract_status,
        "extract_summary": r.extract_summary,
        "extract_error": r.extract_error,
        "created_at": (r.created_at.isoformat() if r.created_at else None),
    }


# ── Facts / Timeline / Search ────────────────────────────────────

def list_facts(user_token: str, profile_id: Optional[int] = None,
               kind: Optional[str] = None, search: Optional[str] = None,
               limit: int = 200) -> list[dict]:
    if not user_token:
        return []
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        stmt = select(HealthFact).where(HealthFact.user_token_hash == u_hash)
        if profile_id is not None:
            stmt = stmt.where(HealthFact.profile_id == profile_id)
        if kind:
            stmt = stmt.where(HealthFact.kind == kind)
        if search:
            from sqlalchemy import or_
            like = f"%{search}%"
            stmt = stmt.where(or_(HealthFact.label.ilike(like), HealthFact.value.ilike(like), HealthFact.notes.ilike(like)))
        stmt = stmt.order_by(HealthFact.fact_date.desc().nullslast(), HealthFact.created_at.desc()).limit(max(1, min(limit, 500)))
        rows = s.execute(stmt).scalars().all()
    return [_fact_dict(r) for r in rows]


def _fact_dict(r: HealthFact) -> dict:
    return {
        "id": r.id, "document_id": r.document_id, "profile_id": r.profile_id,
        "kind": r.kind, "label": r.label, "value": r.value, "unit": r.unit,
        "normal_low": r.normal_low, "normal_high": r.normal_high,
        "out_of_range": bool(r.out_of_range),
        "fact_date": r.fact_date, "notes": r.notes,
        "created_at": (r.created_at.isoformat() if r.created_at else None),
    }


# ── Vitals log ───────────────────────────────────────────────────

def log_vital(*, user_token: str, profile_id: int, kind: str,
              value: float, value2: Optional[float] = None,
              unit: Optional[str] = None, note: Optional[str] = None,
              reading_at: Optional[str] = None) -> dict:
    if not user_token: raise ValueError("user_token required")
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        _require_profile(s, user_token, profile_id)
        when = datetime.utcnow()
        if reading_at:
            try: when = datetime.fromisoformat(reading_at.replace("Z", "+00:00"))
            except ValueError: pass
        oor = _is_vital_out_of_range(kind, value, value2)
        row = HealthVital(
            user_token_hash=u_hash, profile_id=profile_id,
            kind=kind, value=float(value), value2=(None if value2 is None else float(value2)),
            unit=unit, note=note, out_of_range=1 if oor else 0,
            reading_at=when,
        )
        s.add(row); s.commit(); s.refresh(row)
        return _vital_dict(row)


def list_vitals(user_token: str, profile_id: int, kind: Optional[str] = None,
                limit: int = 200) -> list[dict]:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        stmt = select(HealthVital).where(
            and_(HealthVital.user_token_hash == u_hash, HealthVital.profile_id == profile_id)
        )
        if kind:
            stmt = stmt.where(HealthVital.kind == kind)
        stmt = stmt.order_by(HealthVital.reading_at.desc()).limit(max(1, min(limit, 500)))
        rows = s.execute(stmt).scalars().all()
    return [_vital_dict(r) for r in rows]


def _vital_dict(r: HealthVital) -> dict:
    return {
        "id": r.id, "kind": r.kind, "value": r.value, "value2": r.value2,
        "unit": r.unit, "note": r.note, "out_of_range": bool(r.out_of_range),
        "reading_at": (r.reading_at.isoformat() if r.reading_at else None),
    }


def _is_vital_out_of_range(kind: str, value: float, value2: Optional[float]) -> bool:
    k = (kind or "").lower()
    # Simple safe ranges — clinician overrides Phase B
    if k == "bp" and value2 is not None:
        return value > 140 or value < 90 or value2 > 90 or value2 < 60
    if k == "bp_systolic":  return value > 140 or value < 90
    if k == "bp_diastolic": return value > 90  or value < 60
    if k == "sugar_fasting":return value > 126 or value < 70
    if k == "sugar_post":   return value > 200 or value < 70
    if k == "hba1c":        return value > 6.5  # diabetic threshold per ADA
    if k == "spo2":         return value < 95
    if k == "temp":         return value > 38.0 or value < 35.0
    if k == "pulse":        return value > 100  or value < 50
    return False


# ── Reminders ────────────────────────────────────────────────────

def list_reminders(user_token: str, profile_id: Optional[int] = None,
                   limit: int = 200) -> list[dict]:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        stmt = select(HealthReminder).where(HealthReminder.user_token_hash == u_hash)
        if profile_id is not None:
            stmt = stmt.where(HealthReminder.profile_id == profile_id)
        stmt = stmt.order_by(HealthReminder.next_fire_at.asc()).limit(max(1, min(limit, 500)))
        rows = s.execute(stmt).scalars().all()
    return [_reminder_dict(r) for r in rows]


def create_reminder(*, user_token: str, profile_id: int, kind: str, label: str,
                    next_fire_at: str, rrule: Optional[str] = None,
                    detail: Optional[str] = None,
                    channels: str = "browser,whatsapp",
                    advance_alerts: Optional[str] = None) -> dict:
    u_hash = crypto.user_token_hash(user_token)
    when = datetime.fromisoformat(next_fire_at.replace("Z", "+00:00"))
    with SessionLocal() as s:
        _require_profile(s, user_token, profile_id)
        row = HealthReminder(
            user_token_hash=u_hash, profile_id=profile_id,
            kind=kind, label=label[:240], detail=detail,
            rrule=rrule, next_fire_at=when,
            channels=channels[:80], advance_alerts=advance_alerts,
        )
        s.add(row); s.commit(); s.refresh(row)
        return _reminder_dict(row)


def toggle_reminder(user_token: str, reminder_id: int, enabled: bool) -> bool:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        r = s.query(HealthReminder).filter(
            HealthReminder.id == reminder_id,
            HealthReminder.user_token_hash == u_hash,
        ).one_or_none()
        if not r:
            return False
        r.enabled = 1 if enabled else 0
        s.commit()
    return True


def delete_reminder(user_token: str, reminder_id: int) -> bool:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        n = s.query(HealthReminder).filter(
            HealthReminder.id == reminder_id,
            HealthReminder.user_token_hash == u_hash,
        ).delete()
        s.commit()
    return n > 0


def _reminder_dict(r: HealthReminder) -> dict:
    return {
        "id": r.id, "profile_id": r.profile_id,
        "kind": r.kind, "label": r.label, "detail": r.detail,
        "document_id": r.document_id,
        "rrule": r.rrule,
        "next_fire_at": (r.next_fire_at.isoformat() if r.next_fire_at else None),
        "last_fired_at": (r.last_fired_at.isoformat() if r.last_fired_at else None),
        "enabled": bool(r.enabled),
        "channels": r.channels, "advance_alerts": r.advance_alerts,
    }


# ── Insurance ────────────────────────────────────────────────────

def list_insurance(user_token: str, profile_id: Optional[int] = None) -> list[dict]:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        stmt = select(InsurancePolicy).where(
            and_(InsurancePolicy.user_token_hash == u_hash, InsurancePolicy.forget_at.is_(None))
        )
        if profile_id is not None:
            stmt = stmt.where(InsurancePolicy.profile_id == profile_id)
        rows = s.execute(stmt.order_by(InsurancePolicy.due_date.asc().nullslast())).scalars().all()
    return [_ins_dict(r) for r in rows]


def create_insurance(*, user_token: str, profile_id: int,
                     policy_kind: str, company: str, policy_number: str,
                     **fields) -> dict:
    u_hash = crypto.user_token_hash(user_token)
    with SessionLocal() as s:
        _require_profile(s, user_token, profile_id)
        row = InsurancePolicy(
            user_token_hash=u_hash, profile_id=profile_id,
            policy_kind=policy_kind, company=company[:200], policy_number=policy_number[:80],
            **{k: v for k, v in fields.items() if v is not None},
        )
        s.add(row); s.commit(); s.refresh(row)
        # Auto-create premium-due reminder if due_date present.
        if row.due_date:
            try:
                d = datetime.fromisoformat(row.due_date + "T09:00:00")
                s.add(HealthReminder(
                    user_token_hash=u_hash, profile_id=profile_id,
                    kind="premium_due",
                    label=f"{row.company} {policy_kind} premium ₹{row.premium_inr or '?'}",
                    document_id=row.document_id,
                    rrule=None,
                    next_fire_at=d,
                    advance_alerts="30,7,1",
                    channels="browser,whatsapp",
                ))
                s.commit()
            except ValueError:
                pass
        return _ins_dict(row)


def _ins_dict(r: InsurancePolicy) -> dict:
    return {
        "id": r.id, "profile_id": r.profile_id, "policy_kind": r.policy_kind,
        "company": r.company, "policy_number": r.policy_number,
        "sum_assured": r.sum_assured, "coverage_inr": r.coverage_inr,
        "premium_inr": r.premium_inr, "premium_mode": r.premium_mode,
        "start_date": r.start_date, "due_date": r.due_date,
        "renewal_date": r.renewal_date, "maturity_date": r.maturity_date,
        "network_hospitals": _parse_json_list(r.network_hospitals),
        "exclusions": _parse_json_list(r.exclusions),
        "sub_limits": (json.loads(r.sub_limits) if r.sub_limits else {}),
        "nominee": r.nominee, "raw_summary": r.raw_summary,
        "created_at": (r.created_at.isoformat() if r.created_at else None),
    }


# ── Share with doctor (per-use voice consent — gated on the frontend) ──

def issue_share_token(user_token: str, doc_id: str, ttl_minutes: int = 30) -> str:
    """Issue a one-shot, time-bound share token. The frontend has
    already passed the user through chittiConfirmAndDo() per the
    Golden Rule before calling this."""
    u_hash = crypto.user_token_hash(user_token)
    # Verify doc ownership before minting the token.
    with SessionLocal() as s:
        row = s.execute(select(HealthDocument).where(
            and_(HealthDocument.id == doc_id, HealthDocument.user_token_hash == u_hash,
                 HealthDocument.forget_at.is_(None))
        )).scalar_one_or_none()
        if not row:
            raise ValueError("not_found")
    # In-memory token store keyed off the same DB row id.
    token = secrets.token_urlsafe(24)
    expiry = int(time.time()) + max(60, ttl_minutes * 60)
    _SHARE_TOKENS[token] = {"doc_id": doc_id, "u_hash": u_hash, "expires_at": expiry}
    return token


_SHARE_TOKENS: dict[str, dict] = {}


def consume_share_token(token: str) -> tuple[bytes, str, str]:
    info = _SHARE_TOKENS.get(token)
    if not info:
        raise ValueError("invalid_or_used")
    if time.time() > info["expires_at"]:
        _SHARE_TOKENS.pop(token, None)
        raise ValueError("expired")
    # One-shot — pop now so a second hit fails.
    _SHARE_TOKENS.pop(token, None)
    with SessionLocal() as s:
        row = s.execute(select(HealthDocument).where(
            and_(HealthDocument.id == info["doc_id"], HealthDocument.user_token_hash == info["u_hash"],
                 HealthDocument.forget_at.is_(None))
        )).scalar_one_or_none()
        if not row:
            raise ValueError("not_found")
        # We need the user_token to decrypt, but the share path is by
        # token only — no user_token in the request. So we store an
        # ephemeral decrypted copy at token-mint time, in memory only.
        cached = _SHARE_PLAINTEXT.pop(token, None)
        if cached is None:
            raise ValueError("decryption_not_cached")
        bytes_, mime, name = cached
    return bytes_, mime, name


_SHARE_PLAINTEXT: dict[str, tuple[bytes, str, str]] = {}


def issue_share_token_with_plaintext(user_token: str, doc_id: str, ttl_minutes: int = 30) -> str:
    """Mint the share token AND cache the decrypted plaintext in memory
    so /share/file?token=... can serve it without re-needing the
    user_token. The cache TTL matches the token TTL."""
    token = issue_share_token(user_token, doc_id, ttl_minutes)
    plaintext, mime, name = get_document_blob(user_token, doc_id)
    _SHARE_PLAINTEXT[token] = (plaintext, mime, name)
    return token
