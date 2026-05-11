"""
routes/admin.py
---------------
Flask Blueprint: /api/admin/products/* — Sahay AI Admin Dashboard backend.

Endpoints:
  GET    /api/admin/products              list all product accounts + scheduler status
  POST   /api/admin/products              add a new product account     {product_key, product_name, gmail_address}
  DELETE /api/admin/products/<id>         remove a product (revokes tokens first)
  POST   /api/admin/products/<id>/authorize        body: {redirect?}  → returns Google consent URL
  GET    /api/admin/products/oauth/callback?code&state   Google calls this — closes the loop
  POST   /api/admin/products/<id>/keepalive        manually trigger keep-alive for one product
  POST   /api/admin/products/keepalive-all         manually run keep-alive for ALL products
  GET    /api/admin/products/<id>/logs?limit=20    last N action-log rows for a product
  GET    /api/admin/scheduler                      diagnostic: scheduler status

Auth gate:
  Every endpoint except the OAuth callback requires `?secret=<ADMIN_SECRET>`
  OR an `X-Admin-Secret` header. The OAuth callback is open because Google
  drives it (we can't add custom headers to Google's redirect), but the
  state token is opaque and single-use, so it's still safe.

If ADMIN_SECRET is not set, the dashboard refuses every call and tells the
caller to set it in the env. Fail-closed.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Optional

from flask import Blueprint, abort, jsonify, redirect, request

from services import admin_oauth, admin_scheduler
from services.admin_db import (
    ProductActionLog, ProductGmailAccount, log_action, session,
)

log = logging.getLogger("routes.admin")

bp = Blueprint("admin_products", __name__, url_prefix="/api/admin")


# ───── auth gate ─────

def _require_admin() -> None:
    secret = (os.environ.get("ADMIN_SECRET") or "").strip()
    if not secret:
        abort(503, description="ADMIN_SECRET not configured on the server")
    provided = (
        request.headers.get("X-Admin-Secret")
        or request.args.get("secret")
        or ""
    ).strip()
    if provided != secret:
        abort(401, description="bad or missing admin secret")


# ───── helpers ─────

_KEY_RE = re.compile(r"^[a-z][a-z0-9_]{1,62}$")

# Allowed shop-Chitti domain templates. Mirrors the dropdown in
# chitti_admin_products.html — keep the two in sync. Empty string / null
# is also acceptable (legacy products have no domain).
DOMAIN_TEMPLATES = (
    "shop_management",
    "healthcare",
    "food_business",
    "appointment_management",
    "perishable_goods",
    "inventory_management",
    "b2b_inventory",
    "retail_fashion",
    "electronics_retail",
    "large_item_retail",
)


def _validate_payload(body: dict) -> tuple[str, str, str, Optional[str], Optional[str]]:
    key   = (body.get("product_key") or "").strip().lower()
    name  = (body.get("product_name") or "").strip()
    email = (body.get("gmail_address") or "").strip().lower()
    if not _KEY_RE.match(key):
        abort(400, description="product_key must be lowercase a-z0-9_, start with a letter")
    if not name or len(name) > 128:
        abort(400, description="product_name required (1..128 chars)")
    if "@" not in email or len(email) > 256:
        abort(400, description="gmail_address must be a valid email")

    domain = (body.get("domain_template") or "").strip().lower() or None
    if domain and domain not in DOMAIN_TEMPLATES:
        abort(400, description=f"domain_template must be one of: {', '.join(DOMAIN_TEMPLATES)}")

    raw_features = body.get("features")
    if isinstance(raw_features, list):
        feats = ",".join(str(f).strip() for f in raw_features if str(f).strip())
    else:
        feats = (raw_features or "").strip()
    feats = feats[:1024] or None

    return key, name, email, domain, feats


# ───── routes ─────

@bp.get("/products")
def list_products():
    _require_admin()
    with session() as s:
        rows = s.query(ProductGmailAccount).order_by(ProductGmailAccount.id).all()
        items = [r.to_dict() for r in rows]
    return jsonify({
        "ok": True,
        "items": items,
        "count": len(items),
        "scheduler": admin_scheduler.status(),
        "oauth_configured": admin_oauth.is_configured(),
        "notify_email": (os.environ.get("ADMIN_NOTIFY_EMAIL") or "sire@gmail.com"),
        "domain_templates": list(DOMAIN_TEMPLATES),
    })


@bp.post("/products")
def add_product():
    _require_admin()
    body = request.get_json(silent=True) or {}
    key, name, email, domain, feats = _validate_payload(body)
    with session() as s:
        existing = s.query(ProductGmailAccount).filter_by(product_key=key).first()
        if existing:
            abort(409, description=f"product_key '{key}' already exists")
        row = ProductGmailAccount(
            product_key=key,
            product_name=name,
            gmail_address=email,
            oauth_status="needs_auth",
            domain_template=domain,
            features=feats,
        )
        s.add(row)
        s.flush()
        new_id = row.id
        out = row.to_dict()
    detail = f"key={key} email={email}"
    if domain:
        detail += f" domain={domain}"
    log_action(new_id, "added", "ok", detail)
    return jsonify({"ok": True, "item": out}), 201


@bp.delete("/products/<int:pid>")
def delete_product(pid: int):
    _require_admin()
    # Revoke first (best-effort); then remove the row.
    admin_oauth.disconnect(pid)
    with session() as s:
        row = s.get(ProductGmailAccount, pid)
        if not row:
            abort(404, description="product not found")
        s.delete(row)
    log_action(pid, "deleted", "ok", "row removed by admin")
    return jsonify({"ok": True, "deleted_id": pid})


@bp.post("/products/<int:pid>/authorize")
def authorize(pid: int):
    _require_admin()
    body = request.get_json(silent=True) or {}
    redirect_after = (body.get("redirect") or "").strip()[:500]
    with session() as s:
        row = s.get(ProductGmailAccount, pid)
        if not row:
            abort(404, description="product not found")
    out = admin_oauth.build_authorize_url(pid, redirect_after)
    log_action(pid, "oauth_start", "ok" if out.get("ok") else "fail",
               out.get("error") or out.get("url", "")[:120])
    return jsonify(out)


@bp.get("/products/oauth/callback")
def oauth_callback():
    """
    Public — Google redirects here with ?code&state. Auth is the state token.
    NOT secret-gated (Google doesn't carry our header).
    """
    code  = (request.args.get("code")  or "").strip()
    state = (request.args.get("state") or "").strip()
    err   = (request.args.get("error") or "").strip()
    if err:
        return _result_html(False, f"Google returned error: {err}", "")
    out = admin_oauth.handle_callback(code, state)
    if out.get("ok"):
        fr = (out.get("frontend_redirect") or "").rstrip("/")
        if fr:
            sep = "&" if "?" in fr else "?"
            mismatch_qs = f"&mismatch=1" if out.get("mismatch") else ""
            return redirect(f"{fr}{sep}admin_authorized=1&email={out.get('email','')}{mismatch_qs}")
        msg = f"Connected as {out.get('email','')}."
        if out.get("mismatch"):
            msg += " ⚠ MISMATCH — you signed in with a different account than the row's gmail_address. Edit the row or reconnect with the correct account."
        return _result_html(True, "Gmail authorized", msg)
    return _result_html(False, "Authorization failed", out.get("error") or "unknown error")


@bp.post("/products/<int:pid>/keepalive")
def trigger_keepalive(pid: int):
    _require_admin()
    res = admin_scheduler.run_keep_alive_one(pid, force=True)
    return jsonify(res), (200 if res.get("ok") else 400)


@bp.post("/products/keepalive-all")
def trigger_keepalive_all():
    _require_admin()
    body = request.get_json(silent=True) or {}
    force = bool(body.get("force"))
    return jsonify(admin_scheduler.run_keep_alive_all(force=force))


@bp.get("/products/<int:pid>/logs")
def logs(pid: int):
    _require_admin()
    try:
        limit = max(1, min(200, int(request.args.get("limit") or 20)))
    except ValueError:
        limit = 20
    with session() as s:
        rows = (
            s.query(ProductActionLog)
            .filter(ProductActionLog.product_id == pid)
            .order_by(ProductActionLog.created_at.desc())
            .limit(limit)
            .all()
        )
        items = [{
            "id": r.id,
            "action": r.action,
            "status": r.status,
            "detail": r.detail,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        } for r in rows]
    return jsonify({"ok": True, "items": items, "count": len(items)})


@bp.get("/scheduler")
def scheduler_status():
    _require_admin()
    return jsonify(admin_scheduler.status())


# ───── tiny html helpers ─────

def _result_html(ok: bool, title: str, msg: str):
    color = "#16a34a" if ok else "#b91c1c"
    icon  = "✓" if ok else "✗"
    code  = 200 if ok else 400
    return f"""<!doctype html><meta charset="utf-8"><title>Sahay AI Admin — {title}</title>
<body style="font-family:Inter,'Segoe UI',sans-serif;text-align:center;padding:48px;background:#f8f4ee">
<div style="max-width:540px;margin:0 auto;background:#fff;padding:32px;border-radius:18px;box-shadow:0 6px 24px rgba(14,35,68,.10)">
<div style="font-size:40px;color:{color}">{icon}</div>
<h1 style="color:#0E2344;margin:8px 0 4px">{title}</h1>
<p style="color:#374151;line-height:1.6;font-size:15px">{msg}</p>
<p style="color:#6b7280;font-size:13px;margin-top:24px">You can close this tab and return to the dashboard.</p>
</div></body>""", code