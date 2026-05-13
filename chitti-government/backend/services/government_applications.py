"""
services/government_applications.py
-----------------------------------
P1 (2026-05-13) — per-user application status tracker.

Operations:
  add(user_token, scheme_slug, ...)   — upsert by (user_token, scheme_slug)
  list(user_token, status_filter)     — list a user's applications
  get(user_token, app_id)             — one row
  update(user_token, app_id, fields)  — patch status + audit-log the change
  delete(user_token, app_id)          — drop a row

The audit trail (Application.history) is a JSON list — most-recent
transition at the tail. Status updates that don't change status (only
note / portal_url) DO NOT add a history row, so the log stays signal.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models.application import Application, VALID_STATUSES
from models.scheme import Scheme

log = logging.getLogger("government_applications")


def _to_dict(row: Application) -> dict:
    return {
        "id": row.id,
        "user_token": row.user_token,
        "scheme_slug": row.scheme_slug,
        "status": row.status,
        "application_id": row.application_id,
        "portal_url": row.portal_url,
        "state_code": row.state_code,
        "note": row.note,
        "reminder_days": row.reminder_days,
        "history": _parse_history(row.history),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "last_checked_at": row.last_checked_at.isoformat() if row.last_checked_at else None,
    }


def _parse_history(raw: Optional[str]) -> list[dict]:
    if not raw:
        return []
    try:
        v = json.loads(raw)
        return v if isinstance(v, list) else []
    except (TypeError, ValueError):
        return []


def _append_history(row: Application, transition: dict) -> None:
    hist = _parse_history(row.history)
    hist.append(transition)
    row.history = json.dumps(hist[-50:])  # cap


def _validate_status(s: str) -> str:
    s = (s or "").strip().lower()
    if s not in VALID_STATUSES:
        raise ValueError(
            f"status must be one of: {', '.join(VALID_STATUSES)}"
        )
    return s


def _enrich_with_scheme(db: Session, payload: dict) -> dict:
    """Attach scheme name + helpline so the frontend can render in one call."""
    sch = db.query(Scheme).filter(Scheme.slug == payload["scheme_slug"]).first()
    payload["scheme_name_en"] = sch.name_en if sch else None
    payload["scheme_name_hi"] = (sch.name_hi if sch else None) or (sch.name_en if sch else None)
    payload["scheme_application_url"] = sch.application_url if sch else None
    payload["scheme_status_url"] = sch.status_check_url if sch else None
    payload["scheme_helpline"] = sch.helpline if sch else None
    return payload


# ───── CRUD ────────────────────────────────────────────────

def add(
    db: Session,
    user_token: str,
    scheme_slug: str,
    *,
    status: str = "draft",
    application_id: Optional[str] = None,
    portal_url: Optional[str] = None,
    state_code: Optional[str] = None,
    note: Optional[str] = None,
    reminder_days: Optional[int] = None,
) -> dict:
    if not user_token or len(user_token) < 8:
        raise ValueError("user_token required")
    slug = (scheme_slug or "").strip()
    if not slug:
        raise ValueError("scheme_slug required")
    sch = db.query(Scheme).filter(Scheme.slug == slug).first()
    if not sch:
        raise ValueError(f"scheme not found: {slug}")
    status = _validate_status(status)

    row = (
        db.query(Application)
        .filter(Application.user_token == user_token, Application.scheme_slug == slug)
        .first()
    )
    now = datetime.utcnow()
    if row:
        old_status = row.status
        if status != old_status:
            _append_history(row, {
                "at": now.isoformat(),
                "from": old_status,
                "to": status,
                "source": "user",
            })
        row.status = status
        if application_id is not None: row.application_id = application_id or None
        if portal_url is not None:     row.portal_url = portal_url or None
        if state_code is not None:     row.state_code = (state_code or "").upper() or None
        if note is not None:           row.note = note or None
        if reminder_days is not None:
            try:
                row.reminder_days = max(0, min(int(reminder_days), 90)) or None
            except (TypeError, ValueError):
                pass
        db.commit()
        db.refresh(row)
        return _enrich_with_scheme(db, _to_dict(row))

    row = Application(
        user_token=user_token,
        scheme_slug=slug,
        status=status,
        application_id=application_id or None,
        portal_url=portal_url or None,
        state_code=(state_code or "").upper() or None,
        note=note or None,
        reminder_days=reminder_days,
    )
    _append_history(row, {
        "at": now.isoformat(),
        "from": None,
        "to": status,
        "source": "user",
    })
    db.add(row)
    db.commit()
    db.refresh(row)
    return _enrich_with_scheme(db, _to_dict(row))


def list_for_user(
    db: Session, user_token: str, *, status: Optional[str] = None, limit: int = 100
) -> list[dict]:
    q = db.query(Application).filter(Application.user_token == user_token)
    if status:
        q = q.filter(Application.status == _validate_status(status))
    rows = q.order_by(Application.updated_at.desc()).limit(limit).all()
    return [_enrich_with_scheme(db, _to_dict(r)) for r in rows]


def get(db: Session, user_token: str, app_id: int) -> Optional[dict]:
    row = (
        db.query(Application)
        .filter(Application.user_token == user_token, Application.id == app_id)
        .first()
    )
    return _enrich_with_scheme(db, _to_dict(row)) if row else None


def patch(
    db: Session,
    user_token: str,
    app_id: int,
    *,
    status: Optional[str] = None,
    application_id: Optional[str] = None,
    portal_url: Optional[str] = None,
    note: Optional[str] = None,
    reminder_days: Optional[int] = None,
    state_code: Optional[str] = None,
    record_check: bool = False,
) -> Optional[dict]:
    row = (
        db.query(Application)
        .filter(Application.user_token == user_token, Application.id == app_id)
        .first()
    )
    if not row:
        return None
    now = datetime.utcnow()
    if status is not None:
        new_status = _validate_status(status)
        if new_status != row.status:
            _append_history(row, {
                "at": now.isoformat(),
                "from": row.status,
                "to": new_status,
                "source": "user",
            })
        row.status = new_status
    if application_id is not None: row.application_id = application_id or None
    if portal_url is not None:     row.portal_url = portal_url or None
    if note is not None:           row.note = note or None
    if state_code is not None:     row.state_code = (state_code or "").upper() or None
    if reminder_days is not None:
        try:
            row.reminder_days = max(0, min(int(reminder_days), 90)) or None
        except (TypeError, ValueError):
            pass
    if record_check:
        row.last_checked_at = now
    db.commit()
    db.refresh(row)
    return _enrich_with_scheme(db, _to_dict(row))


def delete(db: Session, user_token: str, app_id: int) -> bool:
    row = (
        db.query(Application)
        .filter(Application.user_token == user_token, Application.id == app_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True
