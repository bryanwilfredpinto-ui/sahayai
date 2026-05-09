"""
routes/government.py
--------------------
Flask Blueprint covering the full /api/government/* surface.

No pydantic — body validation is hand-rolled, mirroring chitti-medupi.

Route map (all prefixed /api/government):

  Catalog
    GET  /schemes                       → ?state=&category=&q=  list catalog
    GET  /schemes/<slug>                → single scheme detail
    GET  /schemes/<slug>/checklist      → document checklist for a scheme
    GET  /schemes/<slug>/status_link    → official portal deep-link

  Eligibility
    POST /eligibility/check             → body {profile, scheme_slug?}
                                           → verdict + DeepSeek voice reply
    POST /eligibility/scan              → body {profile} → top 10 matches across catalog

  Alerts (PIB feed)
    GET  /alerts                        → ?limit=30  recent scheme announcements
    POST /alerts/poll                   → force-run a PIB poll (idempotent)

  Locator
    GET  /locator/kinds                 → list of supported office kinds
    GET  /locator                       → ?kind=csc&lat=&lng=&radius_km=  Nominatim search

  Feedback
    POST /feedback                      → {feature, scheme_slug?, verdict, note?}
    GET  /feedback/summary              → aggregated up/down counts (operator view)

  Status & freshness
    GET  /scheduler/status              → APScheduler diagnostic
    GET  /freshness                     → last_synced_at + last ingest log per job
"""
from __future__ import annotations

import logging
from datetime import date, datetime
from functools import wraps

from flask import Blueprint, abort, jsonify, request

from database import SessionLocal
from models.feedback import Feedback
from models.ingest_log import IngestLog
from models.scheme import Scheme
from services import (
    government_database,
    government_deepseek,
    government_eligibility,
    government_locator,
    government_pib,
    government_scheduler,
)

log = logging.getLogger("routes.government")

bp = Blueprint("government", __name__, url_prefix="/api/government")


# ───────────── helpers ─────────────

def with_db(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        db = SessionLocal()
        try:
            return fn(db, *args, **kwargs)
        finally:
            db.close()
    return wrapper


def _json_body() -> dict:
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        abort(400, description="JSON body required")
    return body


def _float_arg(name: str, default=None) -> float | None:
    raw = request.args.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
    except ValueError:
        abort(400, description=f"{name} must be a number")


def _dob_to_age(dob_str: str | None) -> int | None:
    """Parse a dd/mm/yyyy (or ddmmyyyy) string and return integer age in years.
    Returns None on any parse failure — the rule engine treats `age=None`
    as 'unknown', which is the right behaviour for malformed input.
    """
    if not dob_str:
        return None
    s = dob_str.strip()
    # Accept dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, ddmmyyyy (8 digits)
    digits = "".join(ch for ch in s if ch.isdigit())
    if len(digits) != 8:
        return None
    try:
        dd = int(digits[0:2])
        mm = int(digits[2:4])
        yyyy = int(digits[4:8])
        dob = date(yyyy, mm, dd)
    except (ValueError, TypeError):
        return None
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < 0 or age > 150:
        return None
    return age


def _normalise_profile(profile: dict) -> dict:
    """Derive `age` from `dob_ddmmyyyy` when the caller sends DOB only.
    Mutates a shallow copy so callers can rely on `age` being set.
    """
    p = dict(profile or {})
    if p.get("age") is None:
        derived = _dob_to_age(p.get("dob_ddmmyyyy"))
        if derived is not None:
            p["age"] = derived
    return p


def _int_arg(name: str, default=None, min_val=None, max_val=None) -> int | None:
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


# ───────────── health ─────────────

@bp.get("/health")
def health():
    return jsonify(government_deepseek.health())


# ───────────── catalog ─────────────

@bp.get("/schemes")
@with_db
def list_schemes(db):
    state = (request.args.get("state") or "").strip().upper() or None
    category = (request.args.get("category") or "").strip().lower() or None
    q = (request.args.get("q") or "").strip() or None
    limit = _int_arg("limit", default=200, min_val=1, max_val=500)
    rows = government_database.list_schemes(
        db, state_code=state, category=category, q=q, limit=limit
    )
    return jsonify({"ok": True, "count": len(rows), "schemes": [s.to_dict() for s in rows]})


@bp.get("/schemes/<slug>")
@with_db
def get_scheme(db, slug: str):
    sch = government_database.get_by_slug(db, slug)
    if sch is None:
        abort(404, description=f"scheme not found: {slug}")
    return jsonify({"ok": True, "scheme": sch.to_dict()})


@bp.get("/schemes/<slug>/checklist")
@with_db
def get_checklist(db, slug: str):
    sch = government_database.get_by_slug(db, slug)
    if sch is None:
        abort(404, description=f"scheme not found: {slug}")
    docs = sch.documents_required or []
    items = [
        {"name": d, "status": "pending"}
        for d in docs
    ]
    return jsonify({
        "ok": True,
        "scheme_slug": sch.slug,
        "scheme_name": sch.name_en,
        "items": items,
        "application_url": sch.application_url,
        "helpline": sch.helpline,
    })


@bp.get("/schemes/<slug>/status_link")
@with_db
def get_status_link(db, slug: str):
    sch = government_database.get_by_slug(db, slug)
    if sch is None:
        abort(404, description=f"scheme not found: {slug}")
    if not sch.status_check_url:
        return jsonify({
            "ok": True,
            "available": False,
            "scheme_slug": sch.slug,
            "scheme_name": sch.name_en,
            "voice_handoff_en": (
                f"Application status for {sch.name_en} cannot be checked through Chitti yet. "
                "The official portal at "
                f"{sch.source_url or sch.application_url or ''} "
                "is the only authoritative source."
            ),
            "voice_handoff_hi": (
                f"{sch.name_hi or sch.name_en} ke aavedan ki sthiti Chitti se nahin dikhayi ja sakti. "
                "Sarkari portal hi ekmatra sahi srot hai."
            ),
            "official_url": sch.source_url or sch.application_url,
            "helpline": sch.helpline,
        })
    return jsonify({
        "ok": True,
        "available": True,
        "scheme_slug": sch.slug,
        "scheme_name": sch.name_en,
        "official_url": sch.status_check_url,
        "voice_handoff_en": (
            f"I will now open the official {sch.name_en} status page. "
            "Enter your registration number or Aadhaar there. Chitti does not see those details."
        ),
        "voice_handoff_hi": (
            f"Main {sch.name_hi or sch.name_en} ka sarkari status page khol raha hoon. "
            "Wahaan apna registration number ya Aadhaar daaliye. Chitti ko ye details nahin dikhti."
        ),
        "helpline": sch.helpline,
    })


# ───────────── eligibility ─────────────

@bp.post("/eligibility/check")
@with_db
def eligibility_check(db):
    body = _json_body()
    profile = body.get("profile") or {}
    if not isinstance(profile, dict):
        abort(400, description="profile must be an object")
    slug = (body.get("scheme_slug") or "").strip()
    language = (body.get("language") or "hi").strip()
    if not slug:
        abort(400, description="scheme_slug is required")
    sch = government_database.get_by_slug(db, slug)
    if sch is None:
        abort(404, description=f"scheme not found: {slug}")
    profile = _normalise_profile(profile)
    verdict = government_eligibility.evaluate(sch, profile)
    voice = government_deepseek.explain(verdict, language=language)
    return jsonify({
        "ok": True,
        "verdict": verdict,
        "voice": voice,
    })


@bp.post("/eligibility/scan")
@with_db
def eligibility_scan(db):
    body = _json_body()
    profile = body.get("profile") or {}
    if not isinstance(profile, dict):
        abort(400, description="profile must be an object")
    profile = _normalise_profile(profile)
    state = (profile.get("state_code") or "").strip().upper() or None
    rows = government_database.list_schemes(db, state_code=state, limit=500)
    results = government_eligibility.evaluate_many(rows, profile)
    eligible_only = (request.args.get("eligible_only") or "false").lower() in ("1", "true", "yes")
    if eligible_only:
        results = [r for r in results if r["verdict"] in ("eligible", "partial")]
    top = results[:25]
    return jsonify({
        "ok": True,
        "count": len(top),
        "total_evaluated": len(results),
        "results": top,
    })


# ───────────── alerts ─────────────

@bp.get("/alerts")
@with_db
def alerts(db):
    limit = _int_arg("limit", default=30, min_val=1, max_val=100)
    rows = government_pib.list_recent(db, limit=limit)
    return jsonify({
        "ok": True,
        "count": len(rows),
        "items": [r.to_dict() for r in rows],
    })


@bp.post("/alerts/poll")
def alerts_poll():
    out = government_pib.poll_all()
    return jsonify(out)


# ───────────── locator ─────────────

@bp.get("/locator/kinds")
def locator_kinds():
    return jsonify({"ok": True, "kinds": government_locator.list_kinds()})


@bp.get("/locator")
def locator():
    kind = (request.args.get("kind") or "").strip().lower()
    if not kind:
        abort(400, description="kind is required")
    lat = _float_arg("lat", None)
    lng = _float_arg("lng", None)
    radius = _float_arg("radius_km", 10.0) or 10.0
    return jsonify(government_locator.find_nearby(kind, lat=lat, lng=lng, radius_km=radius))


# ───────────── feedback ─────────────

@bp.post("/feedback")
@with_db
def feedback(db):
    body = _json_body()
    feature = (body.get("feature") or "").strip().lower()
    verdict = (body.get("verdict") or "").strip().lower()
    if feature not in (
        "eligibility_checker",
        "alerts",
        "locator",
        "checklist",
        "status_tracker",
        "form_filler",
        "digilocker_upload",
        "general",
    ):
        abort(400, description="feature is required (and must be a known feature key)")
    if verdict not in ("up", "down"):
        abort(400, description="verdict must be 'up' or 'down'")
    note = (body.get("note") or "").strip() or None
    if note and len(note) > 240:
        note = note[:240]
    scheme_slug = (body.get("scheme_slug") or "").strip() or None
    fb = Feedback(
        feature=feature,
        scheme_slug=scheme_slug,
        verdict=verdict,
        note=note,
    )
    db.add(fb)
    db.commit()
    return jsonify({"ok": True})


@bp.get("/feedback/summary")
@with_db
def feedback_summary(db):
    rows = db.query(Feedback).all()
    bucket: dict[str, dict[str, int]] = {}
    for r in rows:
        b = bucket.setdefault(r.feature, {"up": 0, "down": 0})
        b[r.verdict] = b.get(r.verdict, 0) + 1
    return jsonify({"ok": True, "by_feature": bucket, "total": len(rows)})


# ───────────── scheduler & freshness ─────────────

@bp.get("/scheduler/status")
def scheduler_status():
    return jsonify({"ok": True, **government_scheduler.status()})


@bp.get("/freshness")
@with_db
def freshness(db):
    last_logs = (
        db.query(IngestLog)
        .order_by(IngestLog.started_at.desc())
        .limit(50)
        .all()
    )
    seen: dict[str, dict] = {}
    for il in last_logs:
        if il.job_name in seen:
            continue
        seen[il.job_name] = {
            "job": il.job_name,
            "status": il.status,
            "rows_in": il.rows_in,
            "rows_new": il.rows_new,
            "started_at": il.started_at.isoformat() if il.started_at else None,
            "finished_at": il.finished_at.isoformat() if il.finished_at else None,
            "detail": il.detail,
        }
    schemes_synced_at = (
        db.query(Scheme.last_synced_at)
        .order_by(Scheme.last_synced_at.desc())
        .first()
    )
    return jsonify({
        "ok": True,
        "now_utc": datetime.utcnow().isoformat(),
        "schemes_last_synced_at": (
            schemes_synced_at[0].isoformat() if schemes_synced_at and schemes_synced_at[0] else None
        ),
        "jobs": list(seen.values()),
    })
