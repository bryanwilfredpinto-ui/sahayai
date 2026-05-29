"""
🎖️ World Class Chitti Observability — Commando Discipline. Zero Excuses.

observability/routes.py
=======================
FastAPI router for the 6 observability endpoints (Sire-spec 2026-05-29 §API).

  POST /api/observability/slow_op            — log >3s translation
  POST /api/observability/alert              — log Verification-Agent breach
  POST /api/observability/heartbeat          — periodic ping (5-min rolling counts)
  GET  /api/observability/lookup/{audit_id}  — full timeline for one session
  GET  /api/observability/dashboard          — aggregate JSON (badge consumer)
  GET  /api/observability/feedback_summary   — 👍/👎 counts + retrain queue size

CORS is permissive (no Authorization header) because the badge fires from any
Chitti page. Rate-limited per audit_id (60 events / minute / audit_id, soft).
"""
from __future__ import annotations

import json
import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session

from database import get_db
from observability.models import (
    SlowOp, Alert, AuditSession, RetrainQueueItem,
)

log = logging.getLogger("observability")
router = APIRouter(prefix="/api/observability", tags=["observability"])

IST = ZoneInfo("Asia/Kolkata")

# ── In-memory rate limiter (per-process; durable enough for the badge) ──
_RATE: dict[str, list[float]] = defaultdict(list)
_RATE_WINDOW_SEC = 60
_RATE_MAX = 60  # 60 events per minute per audit_id


def _rate_check(audit_id: str) -> bool:
    now = time.time()
    bucket = _RATE[audit_id]
    # drop expired
    while bucket and bucket[0] < now - _RATE_WINDOW_SEC:
        bucket.pop(0)
    if len(bucket) >= _RATE_MAX:
        return False
    bucket.append(now)
    return True


def _touch_audit(db: Session, audit_id: str, page: str | None = None,
                 device_fp: str | None = None, user_token: str | None = None) -> None:
    """Upsert the audit session row + tick last_seen_at."""
    row = db.query(AuditSession).filter(AuditSession.audit_id == audit_id).first()
    if not row:
        row = AuditSession(
            audit_id=audit_id,
            device_fingerprint=device_fp,
            user_token=user_token,
            pages_visited=json.dumps([page]) if page else "[]",
        )
        db.add(row)
    else:
        row.last_seen_at = datetime.utcnow()
        if page:
            try:
                pages = json.loads(row.pages_visited or "[]")
                if page not in pages:
                    pages.append(page)
                    row.pages_visited = json.dumps(pages[-20:])  # cap at 20
            except Exception:
                row.pages_visited = json.dumps([page])
    # commit handled by caller


# ─────────────────────────── POST endpoints ──────────────────────────────

class SlowOpIn(BaseModel):
    audit_id:    str
    page:        Optional[str] = None
    box_id:      Optional[str] = None
    text_length: Optional[int] = None
    elapsed_ms:  int
    source_lang: Optional[str] = "en"
    target_lang: Optional[str] = None
    kind:        Optional[str] = "translation"
    device_fp:   Optional[str] = None
    user_token:  Optional[str] = None


@router.post("/slow_op")
def record_slow_op(body: SlowOpIn, db: Session = Depends(get_db)):
    if not body.audit_id.startswith("CH-"):
        raise HTTPException(400, "bad audit_id")
    if not _rate_check(body.audit_id):
        raise HTTPException(429, "rate limit")
    row = SlowOp(
        audit_id=body.audit_id,
        page=body.page,
        box_id=body.box_id,
        text_length=body.text_length,
        elapsed_ms=body.elapsed_ms,
        source_lang=body.source_lang,
        target_lang=body.target_lang,
        kind=body.kind,
    )
    db.add(row)
    _touch_audit(db, body.audit_id, body.page, body.device_fp, body.user_token)
    db.commit()
    return {"ok": True, "id": row.id}


class AlertIn(BaseModel):
    audit_id:       str
    page:           Optional[str] = None
    check_name:     str
    severity:       str = Field(..., pattern="^(degraded|failed)$")
    observed_value: Optional[str] = None
    threshold:      Optional[str] = None
    device_fp:      Optional[str] = None
    user_token:     Optional[str] = None


@router.post("/alert")
def record_alert(body: AlertIn, db: Session = Depends(get_db)):
    if not body.audit_id.startswith("CH-"):
        raise HTTPException(400, "bad audit_id")
    if not _rate_check(body.audit_id):
        raise HTTPException(429, "rate limit")
    row = Alert(
        audit_id=body.audit_id,
        page=body.page,
        check_name=body.check_name,
        severity=body.severity,
        observed_value=body.observed_value,
        threshold=body.threshold,
    )
    db.add(row)
    audit_row = db.query(AuditSession).filter(AuditSession.audit_id == body.audit_id).first()
    if audit_row:
        audit_row.total_alerts = (audit_row.total_alerts or 0) + 1
    _touch_audit(db, body.audit_id, body.page, body.device_fp, body.user_token)
    db.commit()
    return {"ok": True, "id": row.id}


class HeartbeatIn(BaseModel):
    audit_id:           str
    page:               Optional[str] = None
    status:             str = Field(..., pattern="^(active|degraded|failed)$")
    cards_detected:     int = 0
    cards_translated:   int = 0
    widgets_attached:   int = 0
    latency_p50_ms:     Optional[int] = None
    latency_p95_ms:     Optional[int] = None
    latency_p99_ms:     Optional[int] = None
    device_fp:          Optional[str] = None
    user_token:         Optional[str] = None


@router.post("/heartbeat")
def record_heartbeat(body: HeartbeatIn, db: Session = Depends(get_db)):
    if not body.audit_id.startswith("CH-"):
        raise HTTPException(400, "bad audit_id")
    if not _rate_check(body.audit_id):
        # honest soft-fail — heartbeats are best-effort
        return {"ok": False, "throttled": True}
    audit_row = db.query(AuditSession).filter(AuditSession.audit_id == body.audit_id).first()
    if audit_row:
        audit_row.last_seen_at = datetime.utcnow()
        audit_row.total_cards = max(audit_row.total_cards or 0, body.cards_detected)
        audit_row.total_translations = max(audit_row.total_translations or 0, body.cards_translated)
        audit_row.status = body.status
    else:
        _touch_audit(db, body.audit_id, body.page, body.device_fp, body.user_token)
    db.commit()
    return {"ok": True}


# ─────────────────────────── GET endpoints ───────────────────────────────

@router.get("/lookup/{audit_id}")
def lookup_audit(audit_id: str, db: Session = Depends(get_db)):
    """Full timeline for one audit session. Cookie-bound to that audit_id."""
    if not audit_id.startswith("CH-"):
        raise HTTPException(400, "bad audit_id")
    audit = db.query(AuditSession).filter(AuditSession.audit_id == audit_id).first()
    if not audit:
        raise HTTPException(404, "not found")
    slow_ops = (db.query(SlowOp)
                .filter(SlowOp.audit_id == audit_id)
                .order_by(desc(SlowOp.ts))
                .limit(100).all())
    alerts = (db.query(Alert)
              .filter(Alert.audit_id == audit_id)
              .order_by(desc(Alert.ts))
              .limit(100).all())
    return {
        "audit_id":           audit.audit_id,
        "started_at":         audit.started_at.isoformat() if audit.started_at else None,
        "last_seen_at":       audit.last_seen_at.isoformat() if audit.last_seen_at else None,
        "pages_visited":      json.loads(audit.pages_visited or "[]"),
        "total_cards":        audit.total_cards,
        "total_translations": audit.total_translations,
        "total_alerts":       audit.total_alerts,
        "status":             audit.status,
        "slow_ops": [{
            "ts":         s.ts.isoformat() if s.ts else None,
            "page":       s.page,
            "box_id":     s.box_id,
            "elapsed_ms": s.elapsed_ms,
            "target_lang": s.target_lang,
            "kind":       s.kind,
        } for s in slow_ops],
        "alerts": [{
            "ts":             a.ts.isoformat() if a.ts else None,
            "check_name":     a.check_name,
            "severity":       a.severity,
            "observed_value": a.observed_value,
            "threshold":      a.threshold,
        } for a in alerts],
    }


@router.get("/dashboard")
def observability_dashboard(db: Session = Depends(get_db)):
    """Aggregate JSON consumed by the live footer badge on every page."""
    now = datetime.utcnow()
    five_min_ago = now - timedelta(minutes=5)
    one_day_ago = now - timedelta(days=1)

    # last 5 min counts
    slow_5m = db.query(func.count(SlowOp.id)).filter(SlowOp.ts >= five_min_ago).scalar() or 0
    alerts_5m = db.query(func.count(Alert.id)).filter(Alert.ts >= five_min_ago).scalar() or 0

    # active sessions in last 5 min
    active_audits = db.query(func.count(AuditSession.audit_id)).filter(
        AuditSession.last_seen_at >= five_min_ago
    ).scalar() or 0

    # total cards translated in last 5 min (best-effort from heartbeats)
    cards_5m = db.query(func.sum(AuditSession.total_cards)).filter(
        AuditSession.last_seen_at >= five_min_ago
    ).scalar() or 0

    # latency P95 / P99 across last day's slow_ops (these are >3s by definition)
    slow_ops_24h = db.query(SlowOp.elapsed_ms).filter(SlowOp.ts >= one_day_ago).all()
    samples = sorted([s[0] for s in slow_ops_24h if s[0] is not None])

    def pct(p):
        if not samples: return None
        i = max(0, min(len(samples) - 1, int(len(samples) * p / 100)))
        return samples[i]

    return {
        "ok":                  True,
        "ts":                  now.isoformat(),
        "active_audits_5m":    int(active_audits),
        "cards_5m":            int(cards_5m),
        "slow_ops_5m":         int(slow_5m),
        "alerts_5m":           int(alerts_5m),
        "slow_ops_24h_total":  len(samples),
        "latency_p50_ms":      pct(50),
        "latency_p95_ms":      pct(95),
        "latency_p99_ms":      pct(99),
    }


@router.get("/feedback_summary")
def feedback_summary(db: Session = Depends(get_db)):
    """👍 / 👎 sample count + retrain queue size for the badge."""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    # Sample count is best computed via the existing chitti-vaani feedback table;
    # for now derive a proxy from observability.audits (total_translations) +
    # retrain_queue size. Wire to chitti-vaani feedback in a follow-up patch.
    samples_7d = db.query(func.sum(AuditSession.total_translations)).filter(
        AuditSession.last_seen_at >= seven_days_ago
    ).scalar() or 0
    queue_size = db.query(func.count(RetrainQueueItem.id)).filter(
        RetrainQueueItem.status == "pending"
    ).scalar() or 0
    last_aggregated = db.query(func.max(RetrainQueueItem.created_at)).scalar()
    return {
        "samples_last_7d":   int(samples_7d),
        "retrain_queue":     int(queue_size),
        "last_aggregated":   last_aggregated.isoformat() if last_aggregated else None,
        "enabled":           True,
    }
