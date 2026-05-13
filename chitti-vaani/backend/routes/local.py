"""
routes/local.py
---------------
Flask Blueprint: /api/vaani/local/* — Local-Chitti-first lookup.

Endpoints:
  GET  /api/vaani/local/nearby?service=<category>
       → Returns the registered Chitti shop businesses for this service
         (preferred) and a list of external-app keys the frontend may
         use as fallback. See services/local_chitti_service.py for the
         category map.

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

from flask import Blueprint, abort, jsonify, request

from services import local_chitti_service

log = logging.getLogger("routes.local")

bp = Blueprint("vaani_local", __name__, url_prefix="/api/vaani/local")


@bp.get("/nearby")
def nearby_route():
    service = (request.args.get("service") or "").strip()
    if not service:
        abort(400, description="service is required (e.g. food, groceries, cab)")
    out = local_chitti_service.nearby(service)
    return jsonify(out), (200 if out.get("ok") else 400)


@bp.get("/categories")
def categories_route():
    return jsonify(local_chitti_service.categories())
