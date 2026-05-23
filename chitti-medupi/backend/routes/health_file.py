"""
routes/health_file.py
---------------------
Flask Blueprint: /api/health-file/* — Chitti Health File.

All write endpoints are scoped by `user_token` (the same per-device
opaque string the rest of Chitti uses). The Golden Rule confirm-gate
lives on the FRONTEND (chitti_health_file.html via chittiConfirmAndDo).
The backend does NOT re-prompt — by the time a request hits this
blueprint, the user has already said "haan" on the page.

PRIVACY: per the CHITTI_HEALTH_FILE_MASTER_SPEC.md privacy contract,
documents are AES-256-GCM encrypted at rest. Plaintext leaves the
server only when:
  (a) the original uploading user requests it back via /file?user_token=…
  (b) a one-shot share-token issued via /share/token is consumed within
      its 30-minute TTL — that path caches the decrypted bytes in
      memory ONLY for the lifetime of the token.

DPDP Act 2023 compliance: each response is scoped to the caller's
user_token; the audit-log in lib/observability fires automatically via
the timing middleware.
"""
from __future__ import annotations

import base64
import logging
from io import BytesIO

from flask import Blueprint, abort, jsonify, request, send_file

from services import health_file_service as svc

log = logging.getLogger("routes.health_file")

bp = Blueprint("health_file", __name__, url_prefix="/api/health-file")


# ── helpers ──────────────────────────────────────────────────────

def _user_token_or_400(body_or_args) -> str:
    if isinstance(body_or_args, dict):
        t = (body_or_args.get("user_token") or "").strip()
    else:
        t = (body_or_args.get("user_token") or "").strip()
    if not t or len(t) < 8:
        abort(400, description="user_token is required (≥8 chars, frontend mints a UUID per device).")
    return t


def _int_or_none(v) -> int | None:
    try: return int(v) if v not in (None, "", "null") else None
    except (TypeError, ValueError): return None


# ── /profiles ─────────────────────────────────────────────────────

@bp.get("/profiles")
def profiles_list():
    user_token = _user_token_or_400(request.args)
    return jsonify({"ok": True, "items": svc.list_profiles(user_token)})


@bp.post("/profiles")
def profiles_create():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    try:
        out = svc.create_profile(
            user_token=user_token,
            name=(body.get("name") or "").strip(),
            relation=(body.get("relation") or "self").strip(),
            dob=(body.get("dob") or None),
        )
    except ValueError as e:
        abort(400, description=str(e))
    return jsonify({"ok": True, "profile": out})


# ── /docs ─────────────────────────────────────────────────────────

@bp.post("/docs")
def docs_upload():
    """JSON body: { user_token, profile_id, doc_type, display_name,
        blob_b64, blob_mime, doc_date?, doctor_name?, hospital_name?,
        auto_extract? }
    blob_b64 = base64-encoded bytes of the file (max 15MB decoded)."""
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    blob_b64 = (body.get("blob_b64") or "").strip()
    if not blob_b64:
        abort(400, description="blob_b64 is required (base64-encoded file bytes)")
    try:
        blob = base64.b64decode(blob_b64, validate=True)
    except (ValueError, TypeError):
        abort(400, description="blob_b64 is not valid base64")
    try:
        out = svc.upload_document(
            user_token=user_token,
            profile_id=int(body.get("profile_id") or 0),
            doc_type=(body.get("doc_type") or "other"),
            display_name=(body.get("display_name") or "Document"),
            blob_bytes=blob,
            blob_mime=(body.get("blob_mime") or "application/octet-stream"),
            doc_date=(body.get("doc_date") or None),
            doctor_name=(body.get("doctor_name") or None),
            hospital_name=(body.get("hospital_name") or None),
            auto_extract=bool(body.get("auto_extract", True)),
        )
    except ValueError as e:
        abort(400, description=str(e))
    return jsonify({"ok": True, "doc": out})


@bp.get("/docs")
def docs_list():
    user_token = _user_token_or_400(request.args)
    out = svc.list_documents(
        user_token,
        profile_id=_int_or_none(request.args.get("profile_id")),
        doc_type=(request.args.get("doc_type") or None),
        limit=int(request.args.get("limit") or 100),
    )
    return jsonify({"ok": True, "items": out})


@bp.get("/docs/<doc_id>")
def doc_meta(doc_id: str):
    user_token = _user_token_or_400(request.args)
    try:
        return jsonify({"ok": True, "doc": svc.get_document_meta(user_token, doc_id)})
    except ValueError as e:
        abort(404, description=str(e))


@bp.get("/docs/<doc_id>/file")
def doc_file(doc_id: str):
    """Stream the decrypted bytes back to the OWNER (verified by
    user_token match)."""
    user_token = _user_token_or_400(request.args)
    try:
        plaintext, mime, name = svc.get_document_blob(user_token, doc_id)
    except ValueError:
        abort(404, description="not_found")
    return send_file(
        BytesIO(plaintext),
        mimetype=mime,
        as_attachment=True,
        download_name=(name or "document"),
    )


@bp.delete("/docs/<doc_id>")
def doc_forget(doc_id: str):
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body or request.args)
    if not svc.forget_document(user_token, doc_id):
        abort(404, description="not_found")
    return jsonify({"ok": True, "forgotten": doc_id})


# ── /facts ────────────────────────────────────────────────────────

@bp.get("/facts")
def facts_list():
    user_token = _user_token_or_400(request.args)
    return jsonify({"ok": True, "items": svc.list_facts(
        user_token,
        profile_id=_int_or_none(request.args.get("profile_id")),
        kind=(request.args.get("kind") or None),
        search=(request.args.get("q") or None),
        limit=int(request.args.get("limit") or 200),
    )})


# ── /vitals ───────────────────────────────────────────────────────

@bp.post("/vitals")
def vitals_log():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    try:
        out = svc.log_vital(
            user_token=user_token,
            profile_id=int(body.get("profile_id") or 0),
            kind=(body.get("kind") or "").strip(),
            value=float(body.get("value")),
            value2=(None if body.get("value2") in (None, "") else float(body["value2"])),
            unit=(body.get("unit") or None),
            note=(body.get("note") or None),
            reading_at=(body.get("reading_at") or None),
        )
    except (ValueError, KeyError, TypeError) as e:
        abort(400, description=str(e))
    return jsonify({"ok": True, "vital": out})


@bp.get("/vitals")
def vitals_list():
    user_token = _user_token_or_400(request.args)
    pid = _int_or_none(request.args.get("profile_id"))
    if pid is None:
        abort(400, description="profile_id is required")
    return jsonify({"ok": True, "items": svc.list_vitals(
        user_token, profile_id=pid,
        kind=(request.args.get("kind") or None),
        limit=int(request.args.get("limit") or 200),
    )})


# ── /reminders ────────────────────────────────────────────────────

@bp.get("/reminders")
def reminders_list():
    user_token = _user_token_or_400(request.args)
    return jsonify({"ok": True, "items": svc.list_reminders(
        user_token,
        profile_id=_int_or_none(request.args.get("profile_id")),
        limit=int(request.args.get("limit") or 200),
    )})


@bp.post("/reminders")
def reminders_create():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    try:
        out = svc.create_reminder(
            user_token=user_token,
            profile_id=int(body.get("profile_id") or 0),
            kind=(body.get("kind") or "").strip(),
            label=(body.get("label") or "").strip(),
            next_fire_at=(body.get("next_fire_at") or "").strip(),
            rrule=(body.get("rrule") or None),
            detail=(body.get("detail") or None),
            channels=(body.get("channels") or "browser,whatsapp"),
            advance_alerts=(body.get("advance_alerts") or None),
        )
    except (ValueError, KeyError) as e:
        abort(400, description=str(e))
    return jsonify({"ok": True, "reminder": out})


@bp.post("/reminders/<int:rid>/toggle")
def reminders_toggle(rid: int):
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    enabled = bool(body.get("enabled", True))
    if not svc.toggle_reminder(user_token, rid, enabled):
        abort(404)
    return jsonify({"ok": True, "id": rid, "enabled": enabled})


@bp.delete("/reminders/<int:rid>")
def reminders_delete(rid: int):
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body or request.args)
    if not svc.delete_reminder(user_token, rid):
        abort(404)
    return jsonify({"ok": True, "deleted": rid})


# ── /insurance ────────────────────────────────────────────────────

@bp.get("/insurance")
def insurance_list():
    user_token = _user_token_or_400(request.args)
    return jsonify({"ok": True, "items": svc.list_insurance(
        user_token, profile_id=_int_or_none(request.args.get("profile_id")),
    )})


@bp.post("/insurance")
def insurance_create():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    try:
        out = svc.create_insurance(
            user_token=user_token,
            profile_id=int(body.get("profile_id") or 0),
            policy_kind=(body.get("policy_kind") or "health").strip(),
            company=(body.get("company") or "").strip(),
            policy_number=(body.get("policy_number") or "").strip(),
            sum_assured=(_float_or_none(body.get("sum_assured"))),
            coverage_inr=(_float_or_none(body.get("coverage_inr"))),
            premium_inr=(_float_or_none(body.get("premium_inr"))),
            premium_mode=(body.get("premium_mode") or None),
            start_date=(body.get("start_date") or None),
            due_date=(body.get("due_date") or None),
            renewal_date=(body.get("renewal_date") or None),
            maturity_date=(body.get("maturity_date") or None),
            nominee=(body.get("nominee") or None),
            document_id=(body.get("document_id") or None),
        )
    except (ValueError, KeyError) as e:
        abort(400, description=str(e))
    return jsonify({"ok": True, "policy": out})


def _float_or_none(v):
    try: return float(v) if v not in (None, "", "null") else None
    except (TypeError, ValueError): return None


# ── /share — per-use voice consent (gated on frontend) ─────────────

@bp.post("/share/token")
def share_mint():
    """Body: { user_token, doc_id, ttl_minutes? }
    Returns: { ok, token, expires_in } — a one-shot, time-bound link
    the user can paste into WhatsApp."""
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    doc_id = (body.get("doc_id") or "").strip()
    if not doc_id:
        abort(400, description="doc_id required")
    ttl = int(body.get("ttl_minutes") or 30)
    try:
        token = svc.issue_share_token_with_plaintext(user_token, doc_id, ttl)
    except ValueError as e:
        abort(404 if str(e) == "not_found" else 400, description=str(e))
    return jsonify({"ok": True, "token": token, "expires_in": ttl * 60})


@bp.get("/share/file")
def share_consume():
    token = (request.args.get("token") or "").strip()
    if not token:
        abort(400, description="token required")
    try:
        plaintext, mime, name = svc.consume_share_token(token)
    except ValueError as e:
        abort(410 if str(e) == "expired" else 404, description=str(e))
    return send_file(
        BytesIO(plaintext),
        mimetype=mime,
        as_attachment=True,
        download_name=(name or "shared-document"),
    )


# ── /health (smoke) ───────────────────────────────────────────────

@bp.get("/health")
def health():
    return jsonify({"ok": True, "service": "chitti-health-file", "version": "v1-skeleton-2026-05-23"})
