"""
lib/feedback.py
---------------
Thumbs up/down storage + a drop-in Flask blueprint exposing /api/feedback.

Frontend widget posts:

    POST /api/feedback
    {
      "request_id": "<the request_id the response card showed>",
      "thumbs": "up" | "down",
      "comment": "<optional, max 500 chars>"
    }

Backend stores one row per (request_id, ip_hash) — re-clicks update the
existing row instead of duplicating. The IP is salted-hashed via
observability.hash_ip; raw IPs are never persisted.

Each Chitti's main.py registers the blueprint and creates the table:

    from lib.feedback import feedback_bp, ensure_feedback_table
    ensure_feedback_table(engine)
    app.register_blueprint(feedback_bp)

Founder dashboard reads from quality_feedback for the daily thumbs-up %.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, UniqueConstraint, Index,
    create_engine, select, update,
)
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

from .observability import hash_ip


log = logging.getLogger("feedback")


_FeedbackBase = declarative_base()


class QualityFeedback(_FeedbackBase):
    __tablename__ = "quality_feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chitti = Column(String(40), nullable=False, index=True)
    request_id = Column(String(32), nullable=False, index=True)
    thumbs = Column(String(8), nullable=False)     # 'up' | 'down'
    comment = Column(Text, nullable=True)
    ip_hash = Column(String(32), nullable=False)
    ts = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(),
                        onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("request_id", "ip_hash", name="uq_feedback_req_ip"),
        Index("ix_feedback_chitti_ts", "chitti", "ts"),
    )


# ---------- Engine + session (lazy, configured by ensure_feedback_table) -


_ENGINE: Any = None
_SESSION_FACTORY: Any = None
_CHITTI_SLUG: str = "unknown"


def ensure_feedback_table(engine, chitti_slug: str) -> None:
    """Create quality_feedback in the Chitti's existing DB. Call once at startup."""
    global _ENGINE, _SESSION_FACTORY, _CHITTI_SLUG
    _ENGINE = engine
    _CHITTI_SLUG = chitti_slug
    _SESSION_FACTORY = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    try:
        _FeedbackBase.metadata.create_all(bind=engine, tables=[QualityFeedback.__table__])
    except Exception as e:  # noqa: BLE001
        log.warning("Failed to create quality_feedback table: %s", e)


# ---------- Blueprint -----------------------------------------------------


feedback_bp = Blueprint("chitti_feedback", __name__)


@feedback_bp.post("/api/feedback")
def submit_feedback():
    """One-tap thumbs feedback. Idempotent per (request_id, ip_hash)."""
    if _SESSION_FACTORY is None:
        return jsonify({"ok": False, "error": "feedback_table_not_initialised"}), 500

    payload = request.get_json(silent=True) or {}
    request_id = (payload.get("request_id") or "").strip()
    thumbs = (payload.get("thumbs") or "").strip().lower()
    comment = (payload.get("comment") or "").strip()[:500]
    if not request_id or thumbs not in ("up", "down"):
        return jsonify({"ok": False, "error": "bad_request"}), 400

    ip = (request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
          or request.remote_addr or "")
    ip_h = hash_ip(ip)

    with _SESSION_FACTORY() as sess:
        # Upsert by (request_id, ip_hash). SQLite-friendly: SELECT then INSERT|UPDATE.
        existing = sess.scalar(
            select(QualityFeedback).where(
                (QualityFeedback.request_id == request_id) &
                (QualityFeedback.ip_hash == ip_h)
            )
        )
        if existing is not None:
            existing.thumbs = thumbs
            if comment:
                existing.comment = comment
            existing.updated_at = func.now()
        else:
            sess.add(QualityFeedback(
                chitti=_CHITTI_SLUG,
                request_id=request_id,
                thumbs=thumbs,
                comment=comment or None,
                ip_hash=ip_h,
            ))
        sess.commit()

    return jsonify({"ok": True, "request_id": request_id, "thumbs": thumbs})


@feedback_bp.get("/api/feedback/summary")
def feedback_summary():
    """Lightweight stats — last 24h thumbs-up % for this Chitti. Public; safe to expose."""
    if _SESSION_FACTORY is None:
        return jsonify({"ok": False, "error": "feedback_table_not_initialised"}), 500
    from sqlalchemy import case
    from datetime import datetime, timedelta, timezone

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    with _SESSION_FACTORY() as sess:
        # COUNT and FILTER work on Postgres + SQLite/libSQL alike via case-when.
        rows = sess.execute(
            select(
                func.count(QualityFeedback.id),
                func.sum(case((QualityFeedback.thumbs == "up", 1), else_=0)),
            ).where(
                (QualityFeedback.chitti == _CHITTI_SLUG) &
                (QualityFeedback.ts >= since)
            )
        ).one_or_none()

    total = int(rows[0] or 0) if rows else 0
    ups = int(rows[1] or 0) if rows else 0
    pct = round(100.0 * ups / total, 1) if total else None

    return jsonify({
        "ok": True, "chitti": _CHITTI_SLUG,
        "window": "24h", "total": total, "up": ups,
        "up_pct": pct,
    })
