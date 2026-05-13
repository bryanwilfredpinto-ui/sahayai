"""
routes/local.py
---------------
Flask Blueprint: /api/vaani/local/* — Local-Chitti-first lookup.

Endpoints:
  GET  /api/vaani/local/nearby?service=<category>
                              [&lat=<>&lng=<>] [&pincode=<>] [&radius_km=<>]
       → Returns the registered Chitti shop businesses for this service
         (preferred) and a list of external-app keys the frontend may
         use as fallback. See services/local_chitti_service.py for the
         category map and the geo / radius semantics.

  GET  /api/vaani/local/categories
       → Diagnostic: lists every supported service category and what
         it maps to (Chitti shop keys + external-app keys).

Why this lives behind /api/vaani/ rather than /api/local/: the only
caller today is the Vaani frontend's "Chitti can act for you" pro-card
group. If a second product needs the lookup later, we can promote it
to a top-level prefix without breaking Vaani.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

from flask import Blueprint, abort, jsonify, request

from services import local_chitti_service

log = logging.getLogger("routes.local")

bp = Blueprint("vaani_local", __name__, url_prefix="/api/vaani/local")


_PINCODE_RE = re.compile(r"^[1-9]\d{5}$")


def _parse_float(name: str, raw: Optional[str], lo: float, hi: float) -> Optional[float]:
    if raw is None or raw == "":
        return None
    try:
        v = float(raw)
    except (TypeError, ValueError):
        abort(400, description=f"{name} must be a number in [{lo}, {hi}]")
    if not lo <= v <= hi:
        abort(400, description=f"{name} must be in [{lo}, {hi}]")
    return v


@bp.get("/nearby")
def nearby_route():
    service = (request.args.get("service") or "").strip()
    if not service:
        abort(400, description="service is required (e.g. food, groceries, cab)")

    lat       = _parse_float("lat", request.args.get("lat"), -90.0, 90.0)
    lng       = _parse_float("lng", request.args.get("lng"), -180.0, 180.0)
    radius_km = _parse_float("radius_km", request.args.get("radius_km"), 0.1, 200.0)

    # lat+lng must be supplied together — half-set means the caller
    # didn't really capture coordinates.
    if (lat is None) != (lng is None):
        abort(400, description="lat and lng must be supplied together")

    raw_pin = (request.args.get("pincode") or "").strip()
    pincode: Optional[str] = None
    if raw_pin:
        if not _PINCODE_RE.match(raw_pin):
            abort(400, description="pincode must be a 6-digit India PIN (no leading zero)")
        pincode = raw_pin

    out = local_chitti_service.nearby(
        service,
        user_lat=lat,
        user_lng=lng,
        user_pincode=pincode,
        radius_km=radius_km,
    )
    return jsonify(out), (200 if out.get("ok") else 400)


@bp.get("/categories")
def categories_route():
    return jsonify(local_chitti_service.categories())
