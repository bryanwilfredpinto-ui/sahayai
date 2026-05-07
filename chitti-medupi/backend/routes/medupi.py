"""
routes/medupi.py
----------------
Flask Blueprint covering the full /api/medupi/* surface.

No pydantic — body validation is hand-rolled (lightweight, since the
shapes are simple). Light auth on family-wallet / reminder routes via
the `X-User-Token` request header.

Route map (all prefix /api/medupi):

  Recognition + lookup
    POST  /scan                     → image upload, vision extraction, alternatives
    GET   /medicine/<name>          → fuzzy brand-name search + alternatives
    GET   /alternatives             → strict same-composition matcher
    GET   /risk/<molecule>          → HIGH/MEDIUM/LOW classification

  Jan Aushadhi
    GET   /jan_aushadhi             → ?lat=&lng=&radius_km=5  nearest stores
    GET   /jan_aushadhi/state       → ?state=MP fallback when no geolocation

  Insurance
    GET   /insurance/schemes        → all schemes (Ayushman / CGHS / ESI)
    GET   /insurance/<molecule>     → ?scheme=ayushman whether covered

  Family wallet (X-User-Token)
    GET   /family/profiles          → list profiles for the user_token
    POST  /family/profile           → add a profile
    DELETE /family/profile/<id>     → delete a profile
    GET   /family/wallet            → ?profile_id= monthly + annual report
    POST  /family/wallet            → log a wallet entry

  Reminders (X-User-Token)
    GET    /reminder                → ?profile_id=&status=active list
    POST   /reminder                → schedule a refill / expiry / dose / appointment
    PATCH  /reminder/<id>           → update status (done / dismissed)
    DELETE /reminder/<id>           → delete a reminder

  Real-time pharmacy prices (Brave Search · snippet-only)
    GET   /price/live/<name>        → 24h-cached snippet prices

  Community-reported prices
    GET   /community/price          → ?medicine_name=&city=
    POST  /community/price          → user reports a price

  Scheduler ops
    GET   /scheduler/status         → diagnostic
    POST  /scheduler/trigger/<job>  → force-run a job (X-User-Token)
"""
from __future__ import annotations

import logging
from datetime import datetime
from functools import wraps
from typing import Optional

from flask import Blueprint, abort, jsonify, request

from database import SessionLocal
from services import (
    medupi_alternatives,
    medupi_brave_search,
    medupi_community,
    medupi_family,
    medupi_insurance,
    medupi_jan_aushadhi,
    medupi_recognition,
    medupi_reminders,
    medupi_risk,
    medupi_scheduler,
    medupi_search_log,
)

log = logging.getLogger("routes.medupi")

bp = Blueprint("medupi", __name__, url_prefix="/api/medupi")


# ─────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────

def with_db(fn):
    """Open a SessionLocal for the route's lifetime and close after."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        db = SessionLocal()
        try:
            return fn(db, *args, **kwargs)
        finally:
            db.close()
    return wrapper


def _user_token_or_400() -> str:
    token = (request.headers.get("X-User-Token") or "").strip()
    if not token or len(token) < 8:
        abort(400, description=(
            "Missing X-User-Token header. Frontend should generate a UUID and store it."
        ))
    return token


def _json_body() -> dict:
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        abort(400, description="JSON body required")
    return body


def _int_arg(name: str, default=None, min_val=None, max_val=None):
    raw = request.args.get(name)
    if raw is None or raw == "":
        return default
    try:
        v = int(raw)
    except (TypeError, ValueError):
        abort(400, description=f"{name} must be an integer")
    if min_val is not None and v < min_val:
        abort(400, description=f"{name} must be >= {min_val}")
    if max_val is not None and v > max_val:
        abort(400, description=f"{name} must be <= {max_val}")
    return v


def _float_arg(name: str, default=None, min_val=None, max_val=None):
    raw = request.args.get(name)
    if raw is None or raw == "":
        return default
    try:
        v = float(raw)
    except (TypeError, ValueError):
        abort(400, description=f"{name} must be a number")
    if min_val is not None and v < min_val:
        abort(400, description=f"{name} must be >= {min_val}")
    if max_val is not None and v > max_val:
        abort(400, description=f"{name} must be <= {max_val}")
    return v


def _bool_arg(name: str, default: bool = False) -> bool:
    raw = request.args.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "y")


def _to_float_or_none(v) -> Optional[float]:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _parse_iso_dt(s: str) -> datetime:
    if not s:
        abort(400, description="datetime string required")
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        abort(400, description="datetime must be ISO-8601")


# ─────────────────────────────────────────────────────
# Recognition + lookup
# ─────────────────────────────────────────────────────

@bp.post("/scan")
@with_db
def scan(db):
    """Multipart image upload → vision extraction + DB lookup."""
    f = request.files.get("image")
    if f is None:
        abort(400, description="image upload required (multipart field 'image')")
    if f.content_type and not f.content_type.startswith("image/"):
        abort(415, description="Only image uploads are accepted (jpg/png/webp).")
    image_bytes = f.read()
    if len(image_bytes) == 0:
        abort(400, description="empty image upload")
    if len(image_bytes) > 8 * 1024 * 1024:
        abort(413, description="Image too large (max 8 MB).")
    return jsonify(medupi_recognition.recognise_image(
        db, image_bytes, f.content_type or "image/jpeg"
    ))


@bp.get("/medicine/<path:name>")
@with_db
def medicine_by_name(db, name):
    """Fuzzy search + alternatives + risk + EN/HI speak text.

    Side effect: bumps `search_log.count` for this query (drives the
    daily 02:00 IST top-100 Brave refresh job).
    """
    medupi_search_log.record(db, name)
    return jsonify(medupi_recognition.recognise_text(db, name))


@bp.get("/alternatives")
@with_db
def alternatives(db):
    molecule = (request.args.get("molecule") or "").strip()
    if not molecule:
        abort(400, description="molecule query parameter is required")
    strength = (request.args.get("strength") or "").strip()
    dosage_form = (request.args.get("dosage_form") or "").strip()
    current_brand = (request.args.get("current_brand") or "").strip()
    return jsonify(medupi_alternatives.find(
        db, molecule, strength, dosage_form, current_brand
    ))


@bp.get("/risk/<path:molecule>")
def risk(molecule):
    return jsonify(medupi_risk.classify(molecule))


# ─────────────────────────────────────────────────────
# Jan Aushadhi
# ─────────────────────────────────────────────────────

@bp.get("/jan_aushadhi")
@with_db
def jan_aushadhi_nearby(db):
    lat = _float_arg("lat")
    lng = _float_arg("lng")
    if lat is None or lng is None:
        abort(400, description="lat and lng query params are required")
    radius_km = _float_arg("radius_km", default=5.0, min_val=0.1, max_val=50.0)
    limit = _int_arg("limit", default=10, min_val=1, max_val=50)
    items = medupi_jan_aushadhi.find_nearby(db, lat, lng, radius_km, limit)
    return jsonify({
        "items": items,
        "count": len(items),
        "centre": {"lat": lat, "lng": lng},
        "radius_km": radius_km,
        "speak_en": (
            f"{len(items)} Jan Aushadhi stores within {radius_km} kilometres."
            if items else f"No Jan Aushadhi stores within {radius_km} kilometres."
        ),
        "speak_hi": (
            f"{int(radius_km)} किलोमीटर के अंदर {len(items)} जन औषधि स्टोर मिले।"
            if items else f"{int(radius_km)} किलोमीटर के अंदर कोई जन औषधि स्टोर नहीं मिला।"
        ),
    })


@bp.get("/jan_aushadhi/state")
@with_db
def jan_aushadhi_in_state(db):
    state = (request.args.get("state") or "").strip()
    if not state:
        abort(400, description="state query parameter is required")
    limit = _int_arg("limit", default=50, min_val=1, max_val=200)
    items = medupi_jan_aushadhi.find_in_state(db, state, limit)
    return jsonify({"items": items, "count": len(items), "state": state})


# ─────────────────────────────────────────────────────
# Insurance
# ─────────────────────────────────────────────────────

@bp.get("/insurance/schemes")
def insurance_schemes():
    return jsonify({"items": medupi_insurance.schemes()})


@bp.get("/insurance/<path:molecule>")
@with_db
def insurance_coverage(db, molecule):
    scheme = (request.args.get("scheme") or "ayushman").strip()
    return jsonify(medupi_insurance.coverage_for(db, molecule, scheme))


# ─────────────────────────────────────────────────────
# Family wallet
# ─────────────────────────────────────────────────────

@bp.get("/family/profiles")
@with_db
def family_list_profiles(db):
    token = _user_token_or_400()
    return jsonify({"items": medupi_family.list_profiles(db, token)})


@bp.post("/family/profile")
@with_db
def family_add_profile(db):
    token = _user_token_or_400()
    body = _json_body()
    name = str(body.get("name") or "").strip()
    if not name:
        abort(400, description="name is required")
    if len(name) > 120:
        abort(400, description="name too long (max 120 chars)")
    relation = str(body.get("relation") or "self").strip() or "self"
    dob = body.get("dob")
    conditions = body.get("conditions") or []
    if not isinstance(conditions, list):
        abort(400, description="conditions must be a list")
    return jsonify(medupi_family.add_profile(db, token, name, relation, dob, conditions))


@bp.delete("/family/profile/<int:profile_id>")
@with_db
def family_delete_profile(db, profile_id):
    token = _user_token_or_400()
    if not medupi_family.delete_profile(db, token, profile_id):
        abort(404, description="profile not found")
    return jsonify({"ok": True})


@bp.get("/family/wallet")
@with_db
def family_wallet(db):
    token = _user_token_or_400()
    profile_id = _int_arg("profile_id", default=None)
    return jsonify(medupi_family.wallet_report(db, token, profile_id))


@bp.post("/family/wallet")
@with_db
def family_wallet_add(db):
    token = _user_token_or_400()
    body = _json_body()
    profile_id = body.get("profile_id")
    if not isinstance(profile_id, int):
        abort(400, description="profile_id (int) is required")
    medicine_name = str(body.get("medicine_name") or "").strip()
    if not medicine_name:
        abort(400, description="medicine_name is required")
    try:
        qty = int(body.get("qty", 1))
    except (TypeError, ValueError):
        abort(400, description="qty must be an integer")
    try:
        price_paid = float(body.get("price_paid", 0.0))
    except (TypeError, ValueError):
        abort(400, description="price_paid must be a number")
    cheapest = body.get("cheapest_equivalent_price")
    if cheapest is not None:
        try:
            cheapest = float(cheapest)
        except (TypeError, ValueError):
            abort(400, description="cheapest_equivalent_price must be a number")
    salt = body.get("salt_composition")
    try:
        return jsonify(medupi_family.add_wallet_entry(
            db, token, profile_id, medicine_name,
            qty=qty, price_paid=price_paid,
            cheapest_equivalent_price=cheapest,
            salt_composition=salt,
        ))
    except ValueError as e:
        abort(404, description=str(e))


# ─────────────────────────────────────────────────────
# Reminders
# ─────────────────────────────────────────────────────

@bp.get("/reminder")
@with_db
def reminder_list(db):
    token = _user_token_or_400()
    profile_id = _int_arg("profile_id", default=None)
    status = (request.args.get("status") or "active").strip()
    return jsonify({
        "items": medupi_reminders.list_reminders(db, token, profile_id, status)
    })


@bp.post("/reminder")
@with_db
def reminder_add(db):
    token = _user_token_or_400()
    body = _json_body()
    profile_id = body.get("profile_id")
    if not isinstance(profile_id, int):
        abort(400, description="profile_id (int) is required")
    medicine_name = str(body.get("medicine_name") or "").strip()
    if not medicine_name:
        abort(400, description="medicine_name is required")
    next_due = _parse_iso_dt(str(body.get("next_due") or ""))
    kind = str(body.get("kind") or "refill").strip() or "refill"
    recurrence = body.get("recurrence")
    note = body.get("note")
    try:
        return jsonify(medupi_reminders.add_reminder(
            db, token, profile_id, medicine_name, next_due,
            kind=kind, recurrence=recurrence, note=note,
        ))
    except ValueError as e:
        abort(404, description=str(e))


@bp.patch("/reminder/<int:rid>")
@with_db
def reminder_update_status(db, rid):
    token = _user_token_or_400()
    body = _json_body()
    status = str(body.get("status") or "").strip()
    if not medupi_reminders.update_status(db, token, rid, status):
        abort(400, description="reminder not found or invalid status")
    return jsonify({"ok": True})


@bp.delete("/reminder/<int:rid>")
@with_db
def reminder_delete(db, rid):
    token = _user_token_or_400()
    if not medupi_reminders.delete_reminder(db, token, rid):
        abort(404, description="reminder not found")
    return jsonify({"ok": True})


# ─────────────────────────────────────────────────────
# Real-time pharmacy prices (Brave Search snippets · 24h cache)
# ─────────────────────────────────────────────────────

@bp.get("/price/live/<path:name>")
@with_db
def price_live(db, name):
    """Snippet-only — never visits pharmacy URLs (zero-scrape policy)."""
    medupi_search_log.record(db, name)
    refresh = _bool_arg("refresh", default=False)
    limit = _int_arg("limit", default=6, min_val=1, max_val=12)
    return jsonify(medupi_brave_search.fetch_live(db, name, refresh=refresh, limit=limit))


# ─────────────────────────────────────────────────────
# Community-reported prices
# ─────────────────────────────────────────────────────

@bp.post("/community/price")
@with_db
def community_price_add(db):
    token = _user_token_or_400()
    body = _json_body()
    medicine_name = str(body.get("medicine_name") or "").strip()
    if not medicine_name:
        abort(400, description="medicine_name is required")
    try:
        price_paid = float(body.get("price_paid", 0))
    except (TypeError, ValueError):
        abort(400, description="price_paid must be a number")
    if price_paid <= 0:
        abort(400, description="price_paid must be > 0")
    try:
        return jsonify(medupi_community.add_report(
            db,
            user_token=token,
            medicine_name=medicine_name,
            price_paid=price_paid,
            pharmacy_name=body.get("pharmacy_name"),
            city=body.get("city"),
            state=body.get("state"),
            pincode=body.get("pincode"),
            lat=_to_float_or_none(body.get("lat")),
            lng=_to_float_or_none(body.get("lng")),
            salt_composition=body.get("salt_composition"),
            strength=body.get("strength"),
            dosage_form=body.get("dosage_form"),
        ))
    except ValueError as e:
        abort(400, description=str(e))


@bp.get("/community/price")
@with_db
def community_price_list(db):
    medicine_name = (request.args.get("medicine_name") or "").strip() or None
    city = (request.args.get("city") or "").strip() or None
    limit = _int_arg("limit", default=50, min_val=1, max_val=200)
    items = medupi_community.list_reports(
        db, medicine_name=medicine_name, city=city, limit=limit
    )
    stats = (
        medupi_community.stats_for(db, medicine_name, city=city)
        if medicine_name else {"count": len(items)}
    )
    return jsonify({
        "items": items,
        "count": len(items),
        "stats": stats,
        "disclaimer_en": (
            "Community prices are user-reported. Verify with the pharmacy before purchase."
        ),
        "disclaimer_hi": (
            "सामुदायिक मूल्य उपयोगकर्ताओं द्वारा सूचित हैं। खरीदने से पहले दुकान से पुष्टि करें।"
        ),
    })


# ─────────────────────────────────────────────────────
# Scheduler ops
# ─────────────────────────────────────────────────────

@bp.get("/scheduler/status")
def scheduler_status_route():
    """Diagnostic — what jobs are scheduled + their next run times (IST)."""
    return jsonify(medupi_scheduler.status())


@bp.post("/scheduler/trigger/<job_id>")
def scheduler_trigger(job_id):
    """Force a scheduled job to run NOW. Light auth via X-User-Token."""
    _user_token_or_400()
    return jsonify(medupi_scheduler.trigger_now(job_id))
