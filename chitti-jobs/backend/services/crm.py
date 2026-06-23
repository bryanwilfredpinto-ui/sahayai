"""
services/crm.py  —  BO10  (Application CRM)
-------------------------------------------
Tracks every application across the pipeline (CEOS §5 feature 9):
  found → reviewed → applied → replied → interview → offer → rejected
Nothing falls through the cracks (Constitution Art 6). Every transition
appends to a JSON audit trail on the row.
"""
from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy.orm import Session

from models.application import Application, APPLICATION_STATUSES


def _append_history(app: Application, status: str, note: str = "") -> None:
    try:
        hist = json.loads(app.history) if app.history else []
    except (ValueError, TypeError):
        hist = []
    hist.append({"status": status, "ts": datetime.utcnow().isoformat(), "note": note})
    app.history = json.dumps(hist[-50:])  # keep last 50 transitions


def upsert_application(db: Session, uid: str, job_id: int, *,
                       email_draft: str = "", cover_letter: str = "",
                       mailto_link: str = "", status: str = "found") -> Application:
    app = (
        db.query(Application)
        .filter(Application.user_id == uid, Application.job_id == job_id)
        .first()
    )
    created = False
    if app is None:
        app = Application(user_id=uid, job_id=job_id, status="found")
        db.add(app)
        created = True
    if email_draft:
        app.email_draft = email_draft
    if cover_letter:
        app.cover_letter = cover_letter
    if mailto_link:
        app.mailto_link = mailto_link
    if status and status != app.status:
        set_status(db, app, status, note="draft prepared" if status == "reviewed" else "")
    elif created:
        _append_history(app, "found", "added to pipeline")
    db.commit()
    db.refresh(app)
    return app


def set_status(db: Session, app: Application, status: str, note: str = "") -> Application:
    status = (status or "").lower().strip()
    if status not in APPLICATION_STATUSES:
        raise ValueError(f"invalid status '{status}'")
    app.status = status
    if status == "applied" and app.sent_at is None:
        app.sent_at = datetime.utcnow()
    if status in ("replied", "interview", "offer"):
        app.response_received = True
    _append_history(app, status, note)
    db.commit()
    return app


def mark_sent(db: Session, app: Application, note: str = "user sent via mail app") -> Application:
    """Called only after the USER confirms they sent the mailto: draft (Art 5)."""
    return set_status(db, app, "applied", note)


def to_dict(app: Application, job: dict | None = None) -> dict:
    try:
        hist = json.loads(app.history) if app.history else []
    except (ValueError, TypeError):
        hist = []
    return {
        "id": app.id,
        "job_id": app.job_id,
        "status": app.status,
        "sent_at": app.sent_at.isoformat() if app.sent_at else None,
        "response_received": bool(app.response_received),
        "follow_up_count": app.follow_up_count,
        "has_draft": bool(app.email_draft),
        "mailto_link": app.mailto_link,
        "history": hist,
        "job": job or {},
        "created_at": app.created_at.isoformat() if app.created_at else None,
    }
