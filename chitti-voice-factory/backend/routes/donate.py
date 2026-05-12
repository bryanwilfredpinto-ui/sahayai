"""
routes/donate.py — /api/voice/donate* endpoints (placeholder in v1).
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify

log = logging.getLogger("routes.donate")

bp = Blueprint("donate", __name__, url_prefix="/api/voice")


@bp.get("/donations")
def donations_list():
    """Public list of donors (v1: empty stub)."""
    return jsonify({
        "donors": [],
        "note": "Donor program launches in Phase 3. Volunteer to donate your voice: chitti@sahayai.in",
    })


@bp.post("/donate")
def donate():
    """Volunteer voice donation endpoint (v1: returns instructions)."""
    return jsonify({
        "ok": False,
        "message": "Voice donation program is under development. Thank you for your interest! Contact chitti@sahayai.in to express interest.",
    }), 202
