"""
routes/health.py
----------------
/admin/health endpoint per Sire's 2026-06-02 spec.

CTO/admin only — gated by ?cto=1 query OR ADMIN_TOKEN header. Without
either, returns a public summary with totals but no per-feed detail.

Endpoints:
  GET  /admin/health           summary (totals + failing-source detail when CTO)
  POST /admin/health/run-now   trigger an immediate health sweep
"""
from __future__ import annotations

import logging
import os

from flask import Blueprint, abort, jsonify, request

from database import SessionLocal
from services import source_health

log = logging.getLogger("routes.health")

bp = Blueprint("admin_health", __name__, url_prefix="/admin/health")


def _is_admin() -> bool:
    if (request.args.get("cto") or "").strip() == "1":
        return True
    admin_token = (os.environ.get("ADMIN_TOKEN") or "").strip()
    if admin_token:
        sent = (request.headers.get("X-Admin-Token") or "").strip()
        if sent and sent == admin_token:
            return True
    return False


@bp.get("")
@bp.get("/")
def health_summary():
    db = SessionLocal()
    try:
        s = source_health.summary(db)
        if not _is_admin():
            # Public view — totals only, no per-feed detail
            return jsonify({
                "ok": True,
                "totals": s["totals"],
                "last_check_at": s["last_check_at"],
                "alerts_configured": s["alerts_configured"],
                "view": "public — pass ?cto=1 for per-feed detail",
            })
        return jsonify({"ok": True, **s, "view": "cto"})
    finally:
        db.close()


@bp.post("/run-now")
def health_run_now():
    if not _is_admin():
        abort(403, description="admin only — pass ?cto=1 or X-Admin-Token header")
    # Inline run (small fleet — completes in <2 min for ~180 sources).
    # If this grows past gunicorn's timeout we'll move to scheduler.trigger_now.
    return jsonify({"ok": True, **source_health.check_all_sources()})
