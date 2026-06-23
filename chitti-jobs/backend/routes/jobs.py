"""
routes/jobs.py
--------------
All Chitti Jobs HTTP endpoints (BO2–BO10). Identity is the X-User-Token
device UUID — never server-assigned (MEMORY_ARCHITECTURE.md §1). Body
validation is hand-rolled (no pydantic), mirroring the other Chittis.

BO9 approval flow (Constitution Art 1 + Art 5):
  GET  /digest                       → jobs scoring 7+ (Apply / Skip)
  POST /scored/<id>/skip             → user skips
  POST /scored/<id>/apply            → DRAFT email+cover (BO7) + mailto (BO8);
                                       ATS<70% is gated unless override=true (§24)
  POST /applications/<id>/sent       → user confirms THEY sent it → status=applied
Chitti never transmits anything: the user's own mail app sends the mailto.
"""
from __future__ import annotations

import json
from functools import wraps

from flask import Blueprint, jsonify, request
from sqlalchemy.orm import Session

from database import SessionLocal
from models.application import Application, APPLICATION_STATUSES
from models.job_raw import JobRaw
from models.job_scored import JobScored
from services import (
    ats_engine,
    crm,
    email_compose,
    job_sources,
    jobs_deepseek,
    jobs_scheduler,
    level_classifier,
    memory_client,
    pipeline,
)

bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")


def with_db(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        db: Session = SessionLocal()
        try:
            return fn(db, *args, **kwargs)
        finally:
            db.close()
    return wrapper


def _uid() -> str:
    return (request.headers.get("X-User-Token") or "").strip()


def _body() -> dict:
    return request.get_json(silent=True) or {}


def _need_uid():
    uid = _uid()
    if not uid:
        return None, (jsonify({"error": "missing_user_token",
                               "detail": "X-User-Token header (device UUID) is required"}), 400)
    return uid, None


# ── health ───────────────────────────────────────────────────────────────
@bp.get("/health")
def health():
    h = jobs_deepseek.health()
    h["scheduler"] = jobs_scheduler.status()
    return jsonify(h)


# ── BO2/BO3: profile (memory) ──────────────────────────────────────────────
@bp.get("/profile")
@with_db
def get_profile(db):
    uid, err = _need_uid()
    if err:
        return err
    profile = memory_client.get_profile(db, uid)
    return jsonify({"knows_user": memory_client.knows_user(db, uid), "profile": profile})


@bp.post("/profile")
@with_db
def save_profile(db):
    """BO2 onboarding + BO3 classify. Consent-gated (memory is opt-in)."""
    uid, err = _need_uid()
    if err:
        return err
    b = _body()
    consent = bool(b.get("consent", b.get("consent_basic", False)))
    fields = {k: b[k] for k in (
        "name", "experience_years", "current_role", "target_roles",
        "target_locations", "target_industries", "salary_expectation",
        "work_type", "resume_text", "linkedin_url", "career_situation",
        "blacklist_companies", "gulf_target", "lang",
    ) if k in b}
    # BO3: derive level from experience + role + situation.
    level = level_classifier.classify(
        fields.get("experience_years"), fields.get("current_role", ""),
        fields.get("career_situation", ""),
    )
    profile = memory_client.save_profile(db, uid, fields, consent=consent)
    # persist derived level
    from models.user import UserProfile
    p = db.query(UserProfile).filter(UserProfile.uid == uid).first()
    if p:
        p.user_level = level
        db.commit()
    profile["user_level"] = level
    return jsonify({"ok": True, "knows_user": memory_client.knows_user(db, uid),
                    "user_level": level, "profile": profile})


# ── BO4: sourcing ──────────────────────────────────────────────────────────
@bp.post("/source")
@with_db
def source_now(db):
    """Run the RSS source poll for this user now (BO4 auto path on demand)."""
    uid, err = _need_uid()
    if err:
        return err
    profile = memory_client.get_profile(db, uid)
    if not memory_client.knows_user(db, uid):
        return jsonify({"error": "no_profile",
                        "detail": "Set up your profile first (MEMORY FIRST — BO2)."}), 409
    src = pipeline.source_user(db, uid, profile)
    sc = pipeline.score_pending(db, uid, profile)
    return jsonify({"ok": True, "source": src, "score": sc})


@bp.post("/manual")
@with_db
def manual_paste(db):
    """BO4 primary v1 path: user pastes a JD (+ optional url/title); Chitti
    ingests + scores it immediately and returns the verdict."""
    uid, err = _need_uid()
    if err:
        return err
    b = _body()
    if not (b.get("jd_text") or b.get("url")):
        return jsonify({"error": "missing_input", "detail": "Provide jd_text (paste the JD) or a url."}), 400
    item = job_sources.parse_manual(
        jd_text=b.get("jd_text", ""), url=b.get("url", ""),
        title=b.get("title", ""), company=b.get("company", ""),
        location=b.get("location", ""),
    )
    job_sources.ingest_items(db, uid, [item])
    profile = memory_client.get_profile(db, uid)
    sc = pipeline.score_pending(db, uid, profile)
    # return the just-added scored row
    raw = (db.query(JobRaw).filter(JobRaw.user_id == uid)
           .order_by(JobRaw.id.desc()).first())
    scored = (db.query(JobScored)
              .filter(JobScored.user_id == uid, JobScored.job_id == raw.id).first()) if raw else None
    return jsonify({"ok": True, "score_run": sc, "job": _scored_payload(db, scored) if scored else None})


# ── BO9: approval flow ──────────────────────────────────────────────────────
@bp.get("/digest")
@with_db
def digest(db):
    """Daily digest — jobs scoring 7+ awaiting Apply/Skip (CEOS §23B Step 5)."""
    uid, err = _need_uid()
    if err:
        return err
    # score anything new first so the digest is fresh
    profile = memory_client.get_profile(db, uid)
    if memory_client.knows_user(db, uid):
        pipeline.score_pending(db, uid, profile)
    min_score = int(request.args.get("min_score", 7))
    rows = (db.query(JobScored)
            .filter(JobScored.user_id == uid, JobScored.status == "pending",
                    JobScored.score >= min_score)
            .order_by(JobScored.score.desc(), JobScored.id.desc()).all())
    return jsonify({"count": len(rows), "min_score": min_score,
                    "jobs": [_scored_payload(db, r) for r in rows]})


@bp.post("/scored/<int:scored_id>/skip")
@with_db
def skip(db, scored_id):
    uid, err = _need_uid()
    if err:
        return err
    row = db.query(JobScored).filter(JobScored.id == scored_id, JobScored.user_id == uid).first()
    if not row:
        return jsonify({"error": "not_found"}), 404
    row.status = "skip"
    db.commit()
    return jsonify({"ok": True, "status": "skip"})


@bp.post("/scored/<int:scored_id>/apply")
@with_db
def apply(db, scored_id):
    """User tapped Apply. Draft email+cover (BO7), build mailto (BO8),
    create the application (status=reviewed). ATS<70% is gated (§24) unless
    the user passes override=true — Art 1 keeps the final choice theirs."""
    uid, err = _need_uid()
    if err:
        return err
    row = db.query(JobScored).filter(JobScored.id == scored_id, JobScored.user_id == uid).first()
    if not row:
        return jsonify({"error": "not_found"}), 404
    raw = db.query(JobRaw).filter(JobRaw.id == row.job_id).first()
    if not raw:
        return jsonify({"error": "job_missing"}), 404

    profile = memory_client.get_profile(db, uid)
    resume = profile.get("resume_text") or ""
    ats = ats_engine.score(resume, raw.jd_text or "") if (resume and raw.jd_text) else None

    override = bool(_body().get("override"))
    if ats and ats["match_pct"] < 70 and not override:
        return jsonify({
            "ok": True, "gated": True, "reason": "ats_below_70",
            "ats": {"match_pct": ats["match_pct"], "missing": ats["missing"],
                    "suggestions": ats["suggestions"]},
            "message": (f"ATS match is {ats['match_pct']}% — below the 70% bar. "
                        "Add the missing keywords to your resume (if true) and try again, "
                        "or send anyway with override=true."),
        })

    draft = jobs_deepseek.draft_application(profile, {
        "title": raw.title, "company": raw.company, "location": raw.location,
        "jd_text": raw.jd_text,
    }, ats)
    bundle = email_compose.compose_application_email(
        to=_body().get("to", ""), subject=draft.get("subject") or f"Application for {raw.title}",
        email_body=draft.get("email_body") or "", cover_letter=draft.get("cover_letter") or "",
    )
    app = crm.upsert_application(
        db, uid, raw.id, email_draft=bundle["body"],
        cover_letter=draft.get("cover_letter") or "", mailto_link=bundle["mailto"],
        status="reviewed",
    )
    row.status = "apply"
    db.commit()
    return jsonify({
        "ok": True, "gated": False, "application_id": app.id,
        "draft_source": draft.get("source"), "subject": bundle["subject"],
        "email": bundle, "ats": ({"match_pct": ats["match_pct"]} if ats else None),
        "note": "Review/edit the draft, then tap the mail link — your own app opens and YOU send it.",
    })


@bp.post("/applications/<int:app_id>/sent")
@with_db
def mark_sent(db, app_id):
    """User confirms they sent the draft from their own mail app (Art 5)."""
    uid, err = _need_uid()
    if err:
        return err
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == uid).first()
    if not app:
        return jsonify({"error": "not_found"}), 404
    crm.mark_sent(db, app)
    return jsonify({"ok": True, "status": "applied", "sent_at": app.sent_at.isoformat()})


# ── BO10: CRM ────────────────────────────────────────────────────────────────
@bp.get("/pipeline")
@with_db
def pipeline_view(db):
    uid, err = _need_uid()
    if err:
        return err
    apps = (db.query(Application).filter(Application.user_id == uid)
            .order_by(Application.updated_at.desc()).all())
    out = []
    for a in apps:
        raw = db.query(JobRaw).filter(JobRaw.id == a.job_id).first()
        job = {"title": raw.title, "company": raw.company, "location": raw.location,
               "url": raw.url} if raw else {}
        out.append(crm.to_dict(a, job))
    # group counts for the Kanban
    counts = {s: 0 for s in APPLICATION_STATUSES}
    for a in apps:
        counts[a.status] = counts.get(a.status, 0) + 1
    return jsonify({"count": len(out), "counts": counts, "applications": out})


@bp.post("/applications/<int:app_id>/status")
@with_db
def update_status(db, app_id):
    uid, err = _need_uid()
    if err:
        return err
    new_status = (_body().get("status") or "").lower().strip()
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == uid).first()
    if not app:
        return jsonify({"error": "not_found"}), 404
    try:
        crm.set_status(db, app, new_status, note=_body().get("note", ""))
    except ValueError as e:
        return jsonify({"error": "bad_status", "detail": str(e),
                        "valid": list(APPLICATION_STATUSES)}), 400
    return jsonify({"ok": True, "status": app.status})


# ── helpers ──────────────────────────────────────────────────────────────────
def _scored_payload(db, row: JobScored) -> dict:
    raw = db.query(JobRaw).filter(JobRaw.id == row.job_id).first()
    try:
        reasons = json.loads(row.match_reasons) if row.match_reasons else {}
    except (ValueError, TypeError):
        reasons = {}
    return {
        "scored_id": row.id,
        "job_id": row.job_id,
        "score": row.score,
        "ats_match_pct": row.ats_match_pct,
        "status": row.status,
        "reasons": reasons,
        "title": raw.title if raw else None,
        "company": raw.company if raw else None,
        "location": raw.location if raw else None,
        "url": raw.url if raw else None,
        "platform": raw.platform if raw else None,
    }
