"""Admin routes for managing voice submissions and winners."""

from functools import wraps

from flask import Blueprint, jsonify, request, session

import ledger
from services.admin_auth import _is_admin, exchange_github_code, exchange_google_code, generate_oauth_state, validate_oauth_state
from config import settings


bp = Blueprint("admin", __name__, url_prefix="/admin")


def require_admin(f):
    """Decorator to require admin authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_email = session.get("user_email")
        if not user_email or user_email not in settings.ADMIN_EMAILS:
            return jsonify({"ok": False, "error": "unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function


@bp.get("/oauth/start")
def oauth_start():
    """Start OAuth flow (GitHub or Google)."""
    provider = settings.ADMIN_OAUTH_PROVIDER
    state = generate_oauth_state()

    if provider == "github":
        auth_url = (
            "https://github.com/login/oauth/authorize?"
            f"client_id={settings.ADMIN_OAUTH_ID}&"
            f"state={state}&"
            "scope=user:email"
        )
    elif provider == "google":
        auth_url = (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.ADMIN_OAUTH_ID}&"
            f"state={state}&"
            "response_type=code&"
            f"redirect_uri={request.host_url.rstrip('/')}%2Fadmin%2Foauth%2Fcallback&"
            "scope=openid%20email%20profile"
        )
    else:
        return jsonify({"ok": False, "error": f"unknown_provider:{provider}"}), 500

    session["oauth_state"] = state
    return jsonify({"ok": True, "auth_url": auth_url})


@bp.get("/oauth/callback")
async def oauth_callback():
    """OAuth callback handler."""
    code = request.args.get("code")
    state = request.args.get("state")

    if not code or not state or not validate_oauth_state(state):
        return jsonify({"ok": False, "error": "invalid_oauth_state"}), 400

    provider = settings.ADMIN_OAUTH_PROVIDER

    if provider == "github":
        user, error = await exchange_github_code(code)
    elif provider == "google":
        redirect_uri = f"{request.host_url.rstrip('/')}/admin/oauth/callback"
        user, error = await exchange_google_code(code, redirect_uri)
    else:
        return jsonify({"ok": False, "error": f"unknown_provider:{provider}"}), 500

    if error or not user:
        return jsonify({"ok": False, "error": error or "oauth_exchange_failed"}), 401

    if not _is_admin(user):
        return jsonify({
            "ok": False,
            "error": "not_authorized",
            "email": user.email,
        }), 403

    session["user_email"] = user.email
    session["user_name"] = user.name
    session["user_avatar"] = user.avatar_url
    return {"ok": True, "redirect": "/admin/dashboard.html"}


@bp.get("/submissions")
@require_admin
def list_submissions():
    """List all voice submissions (pending + winners)."""
    import sqlite3

    with sqlite3.connect("./chitti_voice_factory.sqlite") as c:
        c.row_factory = sqlite3.Row
        rows = c.execute(
            """
            SELECT * FROM voice_submissions
            ORDER BY created_at DESC
            LIMIT 500
            """
        ).fetchall()

    return jsonify({
        "ok": True,
        "count": len(rows),
        "submissions": [
            {
                "submission_id": r["submission_id"],
                "language_code": r["language_code"],
                "donor_name": r["donor_name"],
                "donor_email": r["donor_email"],
                "audio_storage_url": r["audio_storage_url"],
                "consent_stage1_accepted_at": r["consent_stage1_accepted_at"],
                "is_winner": r["is_winner"],
                "created_at": r["created_at"],
            }
            for r in rows
        ],
    })


@bp.get("/submissions/<submission_id>")
@require_admin
def get_submission_detail(submission_id: str):
    """Get details of a specific submission."""
    sub = ledger.get_submission(submission_id)
    if not sub:
        return jsonify({"ok": False, "error": "not_found"}), 404

    return jsonify({
        "ok": True,
        "submission": {
            "submission_id": sub["submission_id"],
            "language_code": sub["language_code"],
            "donor_name": sub["donor_name"],
            "donor_email": sub["donor_email"],
            "donor_phone": sub["donor_phone"],
            "audio_storage_url": sub["audio_storage_url"],
            "audio_sha256": sub["audio_sha256"],
            "consent_stage1_accepted_at": sub["consent_stage1_accepted_at"],
            "is_winner": sub["is_winner"],
            "created_at": sub["created_at"],
        },
    })


@bp.post("/submissions/<submission_id>/confirm-winner")
@require_admin
def confirm_winner(submission_id: str):
    """Stage 2: Admin confirms submission as winner (immutable)."""
    import uuid

    body = request.get_json(silent=True) or {}
    donor_photo_url = body.get("donor_photo_url")

    sub = ledger.get_submission(submission_id)
    if not sub:
        return jsonify({"ok": False, "error": "submission_not_found"}), 404

    if sub["is_winner"]:
        return jsonify({"ok": False, "error": "already_a_winner"}), 409

    winner_id = str(uuid.uuid4())
    if not ledger.confirm_winner(
        submission_id=submission_id,
        winner_id=winner_id,
        donor_photo_url=donor_photo_url,
    ):
        return jsonify({"ok": False, "error": "confirmation_failed"}), 500

    # Update synthesis map to use this voice
    ledger.set_synthesis_map(
        language_code=sub["language_code"],
        supplier_type="winner_voice",
        winner_id=winner_id,
    )

    return jsonify({
        "ok": True,
        "winner_id": winner_id,
        "message": f"{sub['donor_name']} is now the voice of {sub['language_code']}!",
    }), 201


@bp.get("/winners")
@require_admin
def list_winners():
    """List all Hall of Fame winners."""
    winners = ledger.get_winners()
    return jsonify({
        "ok": True,
        "count": len(winners),
        "winners": [
            {
                "winner_id": w["winner_id"],
                "submission_id": w["submission_id"],
                "language_code": w["language_code"],
                "donor_name": w["donor_name"],
                "donor_photo_url": w["donor_photo_url"],
                "can_delete": w["can_delete"],
                "created_at": w["created_at"],
            }
            for w in winners
        ],
    })


@bp.get("/voice-synthesis-map")
@require_admin
def get_synthesis_map():
    """Get current language → supplier mapping."""
    import languages

    out = {}
    for lang in languages.ALL_LANGUAGES:
        mapping = ledger.get_synthesis_map(lang.code)
        if mapping:
            out[lang.code] = {
                "supplier_type": mapping["supplier_type"],
                "winner_id": mapping["winner_id"],
                "updated_at": mapping["updated_at"],
            }

    return jsonify({
        "ok": True,
        "count": len(out),
        "synthesis_map": out,
    })
