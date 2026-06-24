"""
routes/dpdp.py
--------------
Flask Blueprint: Universal Onboarding + DPDP consent, backed by
``lib/dpdp_consent.py`` (default-deny consent store + user_facts).

Endpoints:
  POST /api/vaani/onboarding
    Body: { uid, facts:{lang,occupation,pincode,coarse,profile,...}, consents:{domain:bool} }
    → persists user_facts (onboarding_complete=true) + applies each consent toggle.
    Returns: { ok, onboarding_complete }

  GET  /api/vaani/onboarding/status?uid=...    → { onboarding_complete, facts, consents }
  GET  /api/vaani/dpdp/consent?uid=&domain=    → { granted }   (default DENY)
  POST /api/vaani/dpdp/grant   { uid, domain } → { ok, granted:true }
  POST /api/vaani/dpdp/revoke  { uid, domain } → { ok, granted:false }
  POST /api/vaani/dpdp/forget  { uid }         → { ok, ...counts, tombstoned:true }

DPDP doctrine (lib/dpdp_consent.py):
  * Default DENY — a domain with no row returns False.
  * Fail-closed — check_consent() returns False on any error.
  * "Chitti forget" deletes all data and keeps a tombstone.

The onboarding profile + consents are keyed by the device UUID the frontend
generated (localStorage ``chitti_device_uuid``). The localStorage copy on the
phone is the authoritative gate; this server record is the durable, cross-Chitti
source the consent gate reads via check_consent() from every other backend.
"""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from lib.dpdp_consent import (
    check_consent,
    forget_user,
    get_user_facts,
    grant_consent,
    list_consents,
    revoke_consent,
    set_consents,
    set_user_facts,
)

bp = Blueprint("dpdp", __name__)


def _uid(data, default=""):
    return (data.get("uid") or data.get("user_id") or default or "").strip()


@bp.route("/api/vaani/onboarding", methods=["POST"])
def onboarding():
    data = request.get_json(silent=True) or {}
    uid = _uid(data)
    if not uid:
        return jsonify({"ok": False, "error": "uid required"}), 400
    facts = data.get("facts") or {}
    consents = data.get("consents") or {}
    try:
        set_user_facts(uid, facts, onboarding_complete=True)
        if isinstance(consents, dict):
            set_consents(uid, consents)
        return jsonify({"ok": True, "onboarding_complete": True})
    except Exception as e:  # noqa: BLE001
        return jsonify({"ok": False, "error": str(e)}), 500


@bp.route("/api/vaani/onboarding/status", methods=["GET"])
def onboarding_status():
    uid = (request.args.get("uid") or request.args.get("user_id") or "").strip()
    if not uid:
        return jsonify({"ok": False, "error": "uid required"}), 400
    facts = get_user_facts(uid)
    return jsonify({
        "ok": True,
        "onboarding_complete": bool(facts and facts.get("onboarding_complete")),
        "facts": facts or {},
        "consents": list_consents(uid),
    })


@bp.route("/api/vaani/dpdp/consent", methods=["GET"])
def consent_check():
    uid = (request.args.get("uid") or "").strip()
    domain = (request.args.get("domain") or "").strip()
    return jsonify({"ok": True, "uid": uid, "domain": domain,
                    "granted": check_consent(uid, domain)})


@bp.route("/api/vaani/dpdp/grant", methods=["POST"])
def consent_grant():
    data = request.get_json(silent=True) or {}
    uid, domain = _uid(data), (data.get("domain") or "").strip()
    if not uid or not domain:
        return jsonify({"ok": False, "error": "uid and domain required"}), 400
    try:
        grant_consent(uid, domain)
        return jsonify({"ok": True, "granted": True})
    except Exception as e:  # noqa: BLE001
        return jsonify({"ok": False, "error": str(e)}), 500


@bp.route("/api/vaani/dpdp/revoke", methods=["POST"])
def consent_revoke():
    data = request.get_json(silent=True) or {}
    uid, domain = _uid(data), (data.get("domain") or "").strip()
    if not uid or not domain:
        return jsonify({"ok": False, "error": "uid and domain required"}), 400
    try:
        revoke_consent(uid, domain)
        return jsonify({"ok": True, "granted": False})
    except Exception as e:  # noqa: BLE001
        return jsonify({"ok": False, "error": str(e)}), 500


@bp.route("/api/vaani/dpdp/forget", methods=["POST"])
def forget():
    data = request.get_json(silent=True) or {}
    uid = _uid(data)
    if not uid:
        return jsonify({"ok": False, "error": "uid required"}), 400
    try:
        res = forget_user(uid)
        res["ok"] = True
        return jsonify(res)
    except Exception as e:  # noqa: BLE001
        return jsonify({"ok": False, "error": str(e)}), 500
