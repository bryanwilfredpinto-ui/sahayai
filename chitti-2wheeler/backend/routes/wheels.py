"""
chitti-2wheeler / backend / routes / wheels.py
----------------------------------------------
P0 surface today:
  POST /api/2w/ask               — DeepSeek Hinglish Q&A
  GET  /api/2w/dtc/<code>        — DTC plain-Hinglish stub
  POST /api/2w/breakdown         — deterministic decision tree
  GET  /api/2w/maintenance/next  — next-service estimate
  POST /api/2w/profile           — persist bike profile (process-mem)

Everything else from chitti-2wheeler/skills/FEATURES.md returns 501
with an honest "coming soon" body. Per the
[Honest stubs over fake demos] platform rule.
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request

from services import deepseek_client

log = logging.getLogger("routes.wheels")

bp = Blueprint("wheels_2w", __name__)


# Tiny in-memory store keyed by device-token in the header. NOT persistent;
# the production Turso row lands in P1 (the actual data flow is captured
# in FEATURES.md row W1).
_PROFILES: dict[str, dict] = {}


# ── Plain-Hinglish DTC stub (~12 most common codes today; ~600 in P1) ──
_DTC: dict[str, dict] = {
    "P0107": {"sev": "M", "en": "Manifold absolute pressure low", "hi": "MAP sensor pe problem — air intake reading galat ho rahi hai.", "band": "₹500-2 000"},
    "P0117": {"sev": "M", "en": "Coolant temperature sensor", "hi": "Coolant sensor kharab — fan trigger sahi nahi.", "band": "₹500-1 500"},
    "P0131": {"sev": "M", "en": "O2 sensor low voltage", "hi": "Oxygen sensor kharab — fuel mixture galat, mileage girega.", "band": "₹1 200-3 500"},
    "P0171": {"sev": "M", "en": "System too lean", "hi": "Petrol kam mil raha — air leak ya fuel filter blocked.", "band": "₹300-2 500"},
    "P0172": {"sev": "M", "en": "System too rich", "hi": "Petrol zyada mil raha — injector ya MAP issue.", "band": "₹1 500-5 000"},
    "P0201": {"sev": "H", "en": "Injector circuit cyl 1", "hi": "Cylinder 1 injector circuit fault — start ya dhak-dhak issue.", "band": "₹1 500-5 000"},
    "P0301": {"sev": "H", "en": "Cylinder 1 misfire", "hi": "Cylinder 1 mein misfire — spark plug, coil, ya injector kharab.", "band": "₹300-5 000"},
    "P0335": {"sev": "H", "en": "Crankshaft sensor", "hi": "Crank sensor kharab — bike start nahi hogi.", "band": "₹1 500-4 000"},
    "P0420": {"sev": "M", "en": "Catalytic converter efficiency low", "hi": "Cat-con efficiency low — fuel system issue probable. Long-term ₹15-50k bill.", "band": "₹2 000-50 000"},
    "P0500": {"sev": "L", "en": "Vehicle speed sensor", "hi": "Speed sensor — speedometer galat reading.", "band": "₹500-2 000"},
    "P0560": {"sev": "M", "en": "System voltage", "hi": "Charging system fault — battery khali ho rahi hai.", "band": "₹500-7 500"},
    "P0700": {"sev": "H", "en": "Transmission control", "hi": "Transmission control fault — mechanic dikhao.", "band": "₹2 000-30 000"},
}


# ── Brand-specific maintenance schedule (commuter defaults; refined per-model later) ──
_BRAND_SCHEDULE = {
    "Hero":          {"oil_km": 5000,  "air_km": 8000,  "plug_km": 12000, "chain_km": 500},
    "Honda":         {"oil_km": 5000,  "air_km": 10000, "plug_km": 12000, "chain_km": 500},
    "Bajaj":         {"oil_km": 5000,  "air_km": 8000,  "plug_km": 15000, "chain_km": 500},
    "TVS":           {"oil_km": 5000,  "air_km": 8000,  "plug_km": 12000, "chain_km": 500},
    "Royal Enfield": {"oil_km": 7500,  "air_km": 10000, "plug_km": 15000, "chain_km": 500},
    "Yamaha":        {"oil_km": 6000,  "air_km": 10000, "plug_km": 12000, "chain_km": 500},
    "Suzuki":        {"oil_km": 6000,  "air_km": 10000, "plug_km": 12000, "chain_km": 500},
    "KTM":           {"oil_km": 7500,  "air_km": 10000, "plug_km": 15000, "chain_km": 500},
}


# ── Brand RSA numbers ──
_RSA = {
    "Hero": "1800-258-4747",
    "Honda": "1800-103-1234",
    "Bajaj": "1800-233-2453",
    "TVS": "1800-258-8888",
    "Royal Enfield": "1800-210-0007",
    "Yamaha": "1800-420-1600",
    "Suzuki": "1800-103-3402",
    "KTM": "1800-419-1090",
    "*": "1033 (generic highway authority RSA)",
}


def _device_token() -> str:
    return (request.headers.get("X-Chitti-Device") or request.remote_addr or "anon").strip()


@bp.post("/ask")
def ask():
    body = request.get_json(silent=True) or {}
    q = (body.get("question") or "").strip()
    if not q:
        return jsonify({"error": "missing_question", "hint": "POST {question: '...', profile?: {...}}"}), 400
    profile = body.get("profile") or _PROFILES.get(_device_token())
    out = deepseek_client.ask(q, profile=profile)
    return jsonify(out)


@bp.get("/dtc/<code>")
def dtc(code: str):
    code = (code or "").strip().upper()
    row = _DTC.get(code)
    if not row:
        return jsonify({
            "error": "not_in_local_library",
            "code": code,
            "hint": "Local library mein nahi mila. POST /api/2w/ask se DeepSeek pe pucho. Full ~600-code library queued in P1.",
        }), 404
    return jsonify({"code": code, **row})


@bp.post("/breakdown")
def breakdown():
    body = request.get_json(silent=True) or {}
    profile = body.get("profile") or _PROFILES.get(_device_token()) or {}
    brand = (profile.get("brand") or "").strip()
    rsa = _RSA.get(brand) or _RSA["*"]
    return jsonify({
        "steps": [
            "Hazard lights ON. Side mein bike lagao. Helmet pehna rakho.",
            "Fuel check — reserve switch ON karo agar hai.",
            "Check-engine light ON hai? Adapter pair karo (coming soon).",
            "Battery — horn bajti hai? Indicators light hain? Nahi → battery low.",
            "Side-stand safety switch — BS-VI bikes pe side stand down hai toh start nahi hogi.",
            "5 minute aaram do. Phir kick/self try karo.",
            "Agar start ho gayi — seedha mechanic. 40 km/h se upar mat jao.",
            "Agar nahi → SOS tab khol ke family cascade fire karo (RSA number neeche).",
        ],
        "rsa_number": rsa,
        "brand_matched": bool(_RSA.get(brand)),
        "vaani_protocol": "Family cascade only. Chitti never auto-dials 100 / 108 / 112.",
    })


@bp.get("/maintenance/next")
def maintenance_next():
    profile = _PROFILES.get(_device_token()) or {}
    brand = profile.get("brand") or ""
    odo = int(profile.get("odo") or 0)
    schedule = _BRAND_SCHEDULE.get(brand) or _BRAND_SCHEDULE["Hero"]
    items = []
    for k, label in (("oil_km", "Engine oil"), ("air_km", "Air filter"), ("plug_km", "Spark plug"), ("chain_km", "Chain lubrication")):
        step = schedule[k]
        next_due_at = ((odo // step) + 1) * step if step else 0
        items.append({"item": label, "interval_km": step, "next_due_at_km": next_due_at, "km_remaining": max(0, next_due_at - odo)})
    return jsonify({"profile": profile, "schedule": items})


@bp.post("/profile")
def save_profile():
    body = request.get_json(silent=True) or {}
    tok = _device_token()
    _PROFILES[tok] = {k: body.get(k) for k in ("brand", "model", "year", "fuel", "odo", "reg")}
    return jsonify({"ok": True, "saved": _PROFILES[tok], "scope": "in-memory; Turso row lands in P1"})


# ── Honest 501 stubs for the rest of FEATURES.md so the page never silently 404s ──
@bp.route("/<path:rest>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def coming_soon(rest: str):
    return jsonify({
        "error": "coming_soon",
        "path": "/api/2w/" + rest,
        "hint": "Per chitti-2wheeler/skills/FEATURES.md — feature is queued. See §2 PLANNED.",
    }), 501
