"""
routes/feedback.py
------------------
Public POST  /api/feedback/collect          ← widget posts here from every Chitti page
Admin  GET   /api/feedback/report           ← cached daily report (top 3 + thumb counts)
Admin  GET   /api/feedback/list             ← raw rows for the dashboard table
Admin  POST  /api/feedback/run-now          ← regenerate report immediately
Admin  GET   /api/feedback/health           ← scheduler + DB status
Admin  POST  /api/feedback/<id>/junk        ← manually mark a row as junk

Auth model:
  - /collect is OPEN (pre-launch, no user accounts yet)
  - everything else is gated by ADMIN_SECRET (same pattern as routes/admin.py:
    `?secret=...` or `X-Admin-Secret` header)
  - rate-limit on /collect: 1 request per IP per second, 60 per IP per hour.
    The dashboard never sees rate-limited rows because they never enter the DB.
"""
from __future__ import annotations

import hashlib
import logging
import os
import re
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Optional

from flask import Blueprint, abort, jsonify, request

from services import feedback_db, feedback_scheduler

log = logging.getLogger("routes.feedback")

bp = Blueprint("feedback", __name__, url_prefix="/api/feedback")

_PAGE_RE = re.compile(r"^[a-z][a-z0-9_]{1,63}$")
_MAX_TEXT_LEN  = 2000
_MAX_EMAIL_LEN = 256


# ── auth gate (admin endpoints) ──────────────────────────────────────────

def _require_admin() -> None:
    secret = (os.environ.get("ADMIN_SECRET") or "").strip()
    if not secret:
        abort(503, description="ADMIN_SECRET not configured on the server")
    provided = (
        request.headers.get("X-Admin-Secret")
        or request.args.get("secret")
        or ""
    ).strip()
    if provided != secret:
        abort(401, description="bad or missing admin secret")


# ── rate limiter (in-process, per-IP) ────────────────────────────────────
# Two windows: 1s burst, 1h sustained. Cheap, no Redis dependency.
_RL_LOCK = Lock()
_RL_BURST: dict[str, float] = {}                   # ip -> last_ts
_RL_HOUR:  dict[str, deque]  = defaultdict(deque)  # ip -> deque[ts]
_RL_HOUR_LIMIT  = 60
_RL_HOUR_WINDOW = 3600.0
_RL_BURST_GAP   = 1.0


def _client_ip() -> str:
    return (
        request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or request.remote_addr
        or "unknown"
    )


def _check_rate_limit(ip: str) -> bool:
    """Return True if the request should be allowed."""
    now = time.time()
    with _RL_LOCK:
        last = _RL_BURST.get(ip, 0.0)
        if now - last < _RL_BURST_GAP:
            return False
        _RL_BURST[ip] = now

        dq = _RL_HOUR[ip]
        cutoff = now - _RL_HOUR_WINDOW
        while dq and dq[0] < cutoff:
            dq.popleft()
        if len(dq) >= _RL_HOUR_LIMIT:
            return False
        dq.append(now)
    return True


def _hash_ip(ip: str) -> str:
    salt = (os.environ.get("FEEDBACK_IP_SALT") or "chitti-feedback").encode()
    return hashlib.sha256(salt + ip.encode("utf-8", errors="ignore")).hexdigest()[:32]


# ── public collect ───────────────────────────────────────────────────────

@bp.post("/collect")
def collect():
    body = request.get_json(silent=True) or {}

    page = (body.get("page") or "").strip().lower()
    if not _PAGE_RE.match(page):
        abort(400, description="invalid page key")

    type_ = (body.get("type") or "").strip().lower()
    if type_ not in feedback_db.ALLOWED_TYPES:
        abort(400, description=f"type must be one of {feedback_db.ALLOWED_TYPES}")

    text  = (body.get("text") or "").strip()[:_MAX_TEXT_LEN] or None
    if type_ == feedback_db.TYPE_SUGGESTION and (not text or len(text) < 3):
        abort(400, description="suggestion text must be at least 3 chars")

    email = (body.get("email") or "").strip()[:_MAX_EMAIL_LEN] or None
    if email and ("@" not in email or " " in email):
        abort(400, description="email looks invalid")

    seg = (body.get("user_segment") or "general").strip().lower()
    if seg not in feedback_db.ALLOWED_SEGMENTS:
        seg = "general"

    ip = _client_ip()
    if not _check_rate_limit(ip):
        return jsonify({"ok": False, "error": "rate_limited"}), 429

    new_id = feedback_db.insert_feedback(
        page=page,
        type_=type_,
        text_=text,
        email=email,
        user_segment=seg,
        user_agent=(request.headers.get("User-Agent") or "")[:512],
        ip_hash=_hash_ip(ip),
    )
    return jsonify({"ok": True, "id": new_id}), 201


# ── admin: report + listing ──────────────────────────────────────────────

@bp.get("/report")
def report():
    _require_admin()
    return jsonify(feedback_scheduler.last_report())


@bp.post("/run-now")
def run_now():
    _require_admin()
    body = request.get_json(silent=True) or {}
    try:
        hours = int(body.get("lookback_hours") or 24)
    except (TypeError, ValueError):
        hours = 24
    hours = max(1, min(24 * 30, hours))
    return jsonify(feedback_scheduler.run_daily_report(lookback_hours=hours))


@bp.get("/list")
def list_rows():
    _require_admin()
    type_ = (request.args.get("type") or "").strip().lower() or None
    page  = (request.args.get("page") or "").strip().lower() or None
    show_junk = request.args.get("show_junk") in ("1", "true", "yes")
    try:
        limit = max(1, min(500, int(request.args.get("limit") or 100)))
    except ValueError:
        limit = 100

    with feedback_db.session() as s:
        q = s.query(feedback_db.FeedbackLog)
        if type_:
            q = q.filter(feedback_db.FeedbackLog.type == type_)
        if page:
            q = q.filter(feedback_db.FeedbackLog.page == page)
        if not show_junk:
            q = q.filter((feedback_db.FeedbackLog.is_junk == 0) | (feedback_db.FeedbackLog.is_junk.is_(None)))
        rows = q.order_by(feedback_db.FeedbackLog.created_at.desc()).limit(limit).all()
        items = [{
            "id": r.id,
            "page": r.page,
            "type": r.type,
            "text": r.text,
            "email": r.email,
            "user_segment": r.user_segment,
            "is_junk": bool(r.is_junk),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        } for r in rows]
    return jsonify({"ok": True, "items": items, "count": len(items)})


@bp.post("/<int:row_id>/junk")
def mark_junk(row_id: int):
    _require_admin()
    body = request.get_json(silent=True) or {}
    is_junk = 0 if body.get("undo") else 1
    with feedback_db.session() as s:
        row = s.get(feedback_db.FeedbackLog, row_id)
        if not row:
            abort(404, description="row not found")
        row.is_junk = is_junk
    return jsonify({"ok": True, "id": row_id, "is_junk": bool(is_junk)})


@bp.get("/health")
def health():
    _require_admin()
    return jsonify({
        "ok": True,
        "scheduler": feedback_scheduler.status(),
        "total_all_time": feedback_db.total_count(),
    })
