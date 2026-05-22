"""
routes/vault.py
---------------
Flask Blueprint: /api/vaani/vault/* — Chitti Document Vault Phase 1.

Endpoints
~~~~~~~~~
  POST /api/vaani/vault/upload
       multipart: user_token, display_name, category, expiry_date?,
                  notes?, file (≤ 25 MB)
       → 200 { ok, doc_id, category, size_bytes, expiry_date }

  GET  /api/vaani/vault/list?user_token=…
       → 200 { docs: [{doc_id, display_name, category, mime_type,
                       size_bytes, expiry_date, uploaded_at, notes}…] }

  GET  /api/vaani/vault/file?user_token=…&doc_id=…
       → streams decrypted file with Content-Type from mime_type

  GET  /api/vaani/vault/expiries?user_token=…&days=30
       → 200 { items: [{… , days_left, bucket: today|1_day|7_day|30_day}] }

  POST /api/vaani/vault/share
       body: { user_token, doc_id, target_label, ttl_minutes? }
       → 200 { ok, share_token, expires_at, ttl_minutes }
       Issues a one-shot share-audit token. The frontend then fetches
       /file and dispatches via openWhatsApp() etc. — the backend
       does NOT push the file to a third party directly. See
       services/vault_service.py docstring for the per-use rule.

  POST /api/vaani/vault/share/consumed
       body: { user_token, share_token }
       → 200 { ok }
       Frontend tells the backend the share has been dispatched, so
       the audit log can flip the token to consumed (one-shot).

  POST /api/vaani/vault/delete
       body: { user_token, doc_id }
       → 200 { ok }
       Soft-delete (sets forget_at + unlinks the on-disk blob).

Privacy rule (non-negotiable, per CHITTI_PA_MASTER §5.3):
  - Documents are encrypted at rest with a per-user Fernet key
    derived from user_token. The server CANNOT decrypt without the
    user_token, which is never stored in clear.
  - Every share request needs a per-use confirmation in the frontend
    BEFORE /share is called — the backend trusts the frontend gate.
    The audit log records every share-token issuance for replay.
"""
from __future__ import annotations

import logging
import re
from datetime import date

from flask import Blueprint, abort, jsonify, request, Response

from services import vault_service

log = logging.getLogger("routes.vault")

bp = Blueprint("vaani_vault", __name__, url_prefix="/api/vaani/vault")


def _user_token_or_400(value: str) -> str:
    t = (value or "").strip()
    if not t or len(t) < 8:
        abort(400, description="user_token is required (frontend should generate a UUID per device)")
    return t


@bp.post("/upload")
def upload_route():
    user_token = _user_token_or_400(request.form.get("user_token") or "")
    display_name = (request.form.get("display_name") or "").strip()
    category = (request.form.get("category") or "other").strip().lower()
    expiry_str = (request.form.get("expiry_date") or "").strip()
    notes = (request.form.get("notes") or "").strip()
    f = request.files.get("file")
    if not f:
        abort(400, description="file is required (multipart)")
    if not display_name:
        abort(400, description="display_name is required")
    expiry_date = None
    if expiry_str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", expiry_str):
            abort(400, description="expiry_date must be YYYY-MM-DD")
        try:
            expiry_date = date.fromisoformat(expiry_str)
        except ValueError:
            abort(400, description="expiry_date must be a real date")
    data = f.read()
    try:
        out = vault_service.upload(
            user_token=user_token,
            display_name=display_name,
            category=category,
            file_bytes=data,
            mime_type=f.mimetype or "application/octet-stream",
            expiry_date=expiry_date,
            notes=notes or None,
        )
    except ValueError as e:
        abort(400, description=str(e))
    return jsonify(out)


@bp.get("/list")
def list_route():
    user_token = _user_token_or_400(request.args.get("user_token") or "")
    return jsonify({"docs": vault_service.list_docs(user_token)})


@bp.get("/file")
def file_route():
    user_token = _user_token_or_400(request.args.get("user_token") or "")
    doc_id = (request.args.get("doc_id") or "").strip()
    if not doc_id:
        abort(400, description="doc_id is required")
    try:
        plain, mime, display_name = vault_service.fetch_blob(user_token=user_token, doc_id=doc_id)
    except KeyError:
        abort(404, description="document not found")
    except PermissionError as e:
        abort(403, description=str(e))
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", display_name).strip("._") or "file"
    return Response(
        plain,
        mimetype=mime or "application/octet-stream",
        headers={
            "Content-Disposition": f'inline; filename="{safe_name}"',
            "Cache-Control": "private, no-store",
        },
    )


@bp.get("/expiries")
def expiries_route():
    user_token = _user_token_or_400(request.args.get("user_token") or "")
    try:
        # 10-year horizon — passports + property + LIC policies expire well
        # beyond a single year. The frontend defaults to 30 days; this cap
        # only matters when a power-user / test asks for a longer window.
        days = max(1, min(3650, int(request.args.get("days") or "30")))
    except ValueError:
        days = 30
    return jsonify({"items": vault_service.expiring_within(user_token, days=days), "horizon_days": days})


@bp.post("/share")
def share_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body.get("user_token") or "")
    doc_id = (body.get("doc_id") or "").strip()
    target_label = (body.get("target_label") or "")[:200]
    ttl = body.get("ttl_minutes")
    if not doc_id:
        abort(400, description="doc_id is required")
    out = vault_service.issue_share_token(
        user_token=user_token, doc_id=doc_id, target_label=target_label,
        ttl_minutes=int(ttl) if ttl else None,
    )
    if not out:
        abort(404, description="document not found")
    return jsonify(out)


@bp.post("/share/consumed")
def share_consumed_route():
    body = request.get_json(silent=True) or {}
    _user_token_or_400(body.get("user_token") or "")  # validate shape, not used
    token = (body.get("share_token") or "").strip()
    if not token:
        abort(400, description="share_token is required")
    ok = vault_service.mark_share_consumed(token)
    return jsonify({"ok": bool(ok)})


@bp.post("/delete")
def delete_route():
    body = request.get_json(silent=True) or {}
    user_token = _user_token_or_400(body.get("user_token") or "")
    doc_id = (body.get("doc_id") or "").strip()
    if not doc_id:
        abort(400, description="doc_id is required")
    ok = vault_service.soft_delete(user_token=user_token, doc_id=doc_id)
    if not ok:
        abort(404, description="document not found")
    return jsonify({"ok": True})
