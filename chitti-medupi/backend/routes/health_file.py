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
from services import health_file_dispatch as dispatch_svc
from services import health_file_insurance_reason as ins_reason
from services import health_file_translate as translate_svc
from services import health_file_doctor_pdf as doctor_pdf

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
    blob_b64 = base64-encoded bytes of the file (max 15MB decoded).

    Phase B-6: family quota enforced before encryption — see
    svc.upload_document → svc.check_family_quota.
    """
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
    except svc.QuotaExceededError as e:
        # Honest 413 — surfaces the family quota state so the frontend
        # can render "X MB used of 500 MB · delete old docs to upload more"
        return jsonify({
            "ok": False, "error": "quota_exceeded",
            "message": str(e),
            "quota_bytes": svc.FAMILY_QUOTA_BYTES,
            "used_bytes": e.used_bytes,
            "incoming_bytes": e.incoming_bytes,
        }), 413
    except ValueError as e:
        abort(400, description=str(e))
    return jsonify({"ok": True, "doc": out})


@bp.get("/quota")
def quota_status():
    """Phase B-6 — surface 'used / 500 MB' so the frontend can warn before upload."""
    user_token = _user_token_or_400(request.args)
    used = svc.family_quota_used_bytes(user_token)
    return jsonify({
        "ok": True,
        "used_bytes": used,
        "quota_bytes": svc.FAMILY_QUOTA_BYTES,
        "used_pct": round(100.0 * used / svc.FAMILY_QUOTA_BYTES, 2),
        "doc_count": svc.family_doc_count(user_token),
    })


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


# ── /dispatch — Phase B-4 reminder dispatch worker ─────────────────

@bp.get("/dispatch/pending")
def dispatch_pending():
    """Un-acknowledged reminders for this user, newest first.

    Frontend long-polls this every 60s, fires a Notification per row,
    speaks `spoken_hi` (or `spoken_en`) via Voice Factory, and surfaces
    a wa.me deep link if WhatsApp channel was selected on the reminder.
    """
    user_token = _user_token_or_400(request.args)
    limit = int(request.args.get("limit") or 50)
    return jsonify({
        "ok": True,
        "items": dispatch_svc.list_pending(user_token, limit=limit),
    })


@bp.post("/dispatch/<int:dispatch_id>/ack")
def dispatch_ack(dispatch_id: int):
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body or request.args)
    if not dispatch_svc.ack(user_token, dispatch_id):
        abort(404)
    return jsonify({"ok": True, "id": dispatch_id})


@bp.post("/dispatch/run-now")
def dispatch_run_now():
    """Diagnostic — force a dispatch tick. Same auth as the rest of the
    blueprint (user_token gate). Returns the queued / rescheduled counts.
    Useful for end-to-end testing without waiting for the 5-minute cron.
    """
    body = request.get_json(silent=True) or {}
    _user_token_or_400(body or request.args)
    return jsonify({"ok": True, **dispatch_svc.run_dispatch()})


# ── /insurance/ask — Phase B-2 reasoning over a policy ────────────

@bp.post("/insurance/ask")
def insurance_ask():
    """Body: { user_token, policy_id, question, lang? }
    Returns: { ok, answer, disclaimer, lang, _status }

    LLM-driven reasoning over a parsed InsurancePolicy row. Server-enforced
    disclaimer rides on every response — never client-controlled.
    """
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    policy_id = _int_or_none(body.get("policy_id"))
    question = (body.get("question") or "").strip()
    lang = (body.get("lang") or "hi").strip().lower()[:6]
    if not policy_id:
        abort(400, description="policy_id required")
    if not question or len(question) > 500:
        abort(400, description="question required (1-500 chars)")

    policies = svc.list_insurance(user_token)
    policy = next((p for p in policies if p.get("id") == policy_id), None)
    if not policy:
        abort(404, description="policy_not_found_or_not_yours")

    out = ins_reason.reason_over_policy(policy, question, lang)
    return jsonify({"ok": True, **out})


@bp.post("/insurance/network-check")
def insurance_network_check():
    """Body: { user_token, policy_id, hospital_name }
    Returns: { ok, in_network: bool|null, matched_name: str|null, message }

    Honest 'unknown' (in_network=null) when the policy's network_hospitals
    list is empty. Never coerces a yes/no.
    """
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body)
    policy_id = _int_or_none(body.get("policy_id"))
    hospital = (body.get("hospital_name") or "").strip()
    if not policy_id or not hospital:
        abort(400, description="policy_id + hospital_name required")

    policies = svc.list_insurance(user_token)
    policy = next((p for p in policies if p.get("id") == policy_id), None)
    if not policy:
        abort(404, description="policy_not_found")

    network = policy.get("network_hospitals") or []
    if not network:
        return jsonify({
            "ok": True, "in_network": None, "matched_name": None,
            "message": (
                f"Policy ke saath network hospital list nahi parse hui hai — "
                f"insurer ki 1800 helpline se confirm karein for {hospital}."
            ),
        })

    needle = hospital.lower()
    matched = next((h for h in network if needle in (h or "").lower() or (h or "").lower() in needle), None)
    if matched:
        return jsonify({
            "ok": True, "in_network": True, "matched_name": matched,
            "message": f"{matched} aapki policy ke network mein hai. Cashless ke liye TPA card aur ID le jaayein.",
        })
    return jsonify({
        "ok": True, "in_network": False, "matched_name": None,
        "message": (
            f"{hospital} parsed network list mein nahi mila. "
            "Insurer ki 1800 helpline par confirm karein — list adhuri ho sakti hai."
        ),
    })


# ── /export/doctor-pdf — Phase B-5 single-page A4 doctor summary ──

@bp.get("/export/doctor-pdf")
def export_doctor_pdf():
    """Query: ?user_token=…&profile_id=N
    Returns: application/pdf — doctor-facing single-document A4 summary.

    Frontend wires this as a download link on the Vitals tab. The user has
    already passed chittiConfirmAndDo() before tapping the link, per the
    Golden Rule. Reportlab is loaded lazily so backends without it (e.g.
    bare unit tests) still import cleanly.
    """
    user_token = _user_token_or_400(request.args)
    pid = _int_or_none(request.args.get("profile_id"))
    if pid is None:
        abort(400, description="profile_id required")
    try:
        pdf_bytes = doctor_pdf.build_doctor_pdf(user_token, pid)
    except ValueError as e:
        abort(404, description=str(e))
    except ImportError as e:
        # reportlab not installed on this host — honest stub
        abort(503, description=f"pdf_pipeline_not_installed: {e}")
    fname = f"chitti-health-summary-{pid}-{request.args.get('user_token', '')[:6]}.pdf"
    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=fname,
    )


# ── /translate — Phase B (cross-language voice in / voice out) ────

@bp.post("/translate")
def translate_text():
    """Body: { user_token, text, source_lang?, target_lang }
    Returns: { ok, translated, source_lang, target_lang, _status }

    DeepSeek translation across the 13 Indian languages on the language
    selector. user_token gate is the only auth — same as the rest of the
    blueprint.
    """
    body = request.get_json(silent=True) or {}
    _user_token_or_400(body)
    text = (body.get("text") or "").strip()
    src = (body.get("source_lang") or "auto").strip().lower()[:6]
    tgt = (body.get("target_lang") or "").strip().lower()[:6]
    if not text or len(text) > 2000:
        abort(400, description="text required (1-2000 chars)")
    if not tgt:
        abort(400, description="target_lang required")

    out = translate_svc.translate(text=text, source_lang=src, target_lang=tgt)
    return jsonify({"ok": True, **out})


# ── /health (smoke) ───────────────────────────────────────────────

@bp.get("/health")
def health():
    return jsonify({"ok": True, "service": "chitti-health-file", "version": "v3-phase-b2-2026-05-24"})
