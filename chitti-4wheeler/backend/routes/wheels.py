"""
chitti-4wheeler / backend / routes / wheels.py
----------------------------------------------
P0 surface today:
  POST /api/4w/ask               — DeepSeek Hinglish Q&A
  GET  /api/4w/dtc/<code>        — DTC plain-Hinglish stub (~16 codes today)
  POST /api/4w/breakdown         — deterministic decision tree
  GET  /api/4w/maintenance/next  — next-service estimate
  POST /api/4w/profile           — persist car profile (Turso)
  GET  /api/4w/profile           — read car profile

Profile persistence: Turso embedded-replica. Per
[SAHAYAI_MASTER §2 row 2 — one DB per Chitti]. Profile keyed by
`X-Chitti-Device` header (or client IP fallback).
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request

from database import SessionLocal, sync_now
from models import CarProfile
from services import deepseek_client

log = logging.getLogger("routes.wheels")

bp = Blueprint("wheels_4w", __name__)


_DTC: dict[str, dict] = {
    "P0101": {"sev": "M", "en": "MAF range / performance", "hi": "Air intake sensor pe problem — mileage girega.", "band": "₹1 500-5 000"},
    "P0117": {"sev": "M", "en": "Coolant temp sensor low", "hi": "Coolant sensor kharab — fan trigger sahi nahi.", "band": "₹500-2 500"},
    "P0128": {"sev": "L", "en": "Coolant thermostat", "hi": "Thermostat stuck open — warm-up dheere.", "band": "₹800-3 000"},
    "P0131": {"sev": "M", "en": "O2 sensor low voltage", "hi": "Oxygen sensor kharab — fuel mixture galat, mileage girega.", "band": "₹2 000-6 000"},
    "P0171": {"sev": "M", "en": "System too lean (bank 1)", "hi": "Petrol kam mil raha — air leak ya fuel filter blocked.", "band": "₹500-3 000"},
    "P0172": {"sev": "M", "en": "System too rich (bank 1)", "hi": "Petrol zyada mil raha — injector ya MAP issue.", "band": "₹1 500-5 000"},
    "P0300": {"sev": "H", "en": "Random misfire", "hi": "Random misfire — fuel quality ya multiple plugs / coils.", "band": "₹800-6 000"},
    "P0301": {"sev": "H", "en": "Cylinder 1 misfire", "hi": "Cylinder 1 mein misfire — spark plug, coil, ya injector.", "band": "₹300-5 000"},
    "P0302": {"sev": "H", "en": "Cylinder 2 misfire", "hi": "Cylinder 2 mein misfire — spark plug, coil, ya injector.", "band": "₹300-5 000"},
    "P0401": {"sev": "M", "en": "EGR flow insufficient", "hi": "EGR valve ya passage chocked.", "band": "₹2 000-12 000"},
    "P0420": {"sev": "M", "en": "Catalytic converter efficiency low", "hi": "Cat-con efficiency low — fuel system / O2 sensor probable. Long-term ₹15-50k bill.", "band": "₹2 000-50 000"},
    "P0455": {"sev": "L", "en": "EVAP large leak", "hi": "EVAP system leak — pehle petrol cap tight karo.", "band": "₹0-2 000"},
    "P0500": {"sev": "L", "en": "Vehicle speed sensor", "hi": "Speed sensor — speedometer galat.", "band": "₹500-2 500"},
    "P0560": {"sev": "M", "en": "System voltage", "hi": "Charging system fault — battery khali ho rahi hai.", "band": "₹500-7 500"},
    "P0606": {"sev": "H", "en": "ECM internal", "hi": "ECU internal fault — dealer dikhao.", "band": "₹10 000-50 000"},
    "P0700": {"sev": "H", "en": "Transmission control", "hi": "Transmission control fault — workshop visit zaroori.", "band": "₹2 000-50 000"},
}


_BRAND_SCHEDULE = {
    "Maruti Suzuki": {"oil_km": 10000, "air_km": 30000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 40000, "ac_km": 20000},
    "Hyundai":       {"oil_km": 10000, "air_km": 30000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 40000, "ac_km": 20000},
    "Tata":          {"oil_km": 7500,  "air_km": 25000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 40000, "ac_km": 20000},
    "Mahindra":      {"oil_km": 7500,  "air_km": 25000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 30000, "ac_km": 20000},
    "Honda":         {"oil_km": 10000, "air_km": 30000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 40000, "ac_km": 20000},
    "Toyota":        {"oil_km": 10000, "air_km": 30000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 40000, "ac_km": 20000},
    "Kia":           {"oil_km": 10000, "air_km": 30000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 40000, "ac_km": 20000},
    "MG":            {"oil_km": 10000, "air_km": 30000, "plug_km": 60000, "brake_km": 40000, "coolant_km": 40000, "ac_km": 20000},
}


_RSA = {
    "Maruti Suzuki": "1800-102-1800",
    "Hyundai": "1800-102-4645",
    "Tata": "1800-209-8282",
    "Mahindra": "1800-209-6006",
    "Honda": "1800-113-121",
    "Toyota": "1800-425-0001",
    "Kia": "1800-108-5000",
    "MG": "1800-100-6464",
    "Skoda": "1800-102-6464",
    "VW": "1800-209-0909",
    "Renault": "1800-103-5353",
    "Nissan": "1800-209-2002",
    "*": "1033 (generic highway authority RSA)",
}


def _device_token() -> str:
    return (request.headers.get("X-Chitti-Device") or request.remote_addr or "anon").strip()[:128]


def _load_profile(device: str) -> dict | None:
    db = SessionLocal()
    try:
        row = db.query(CarProfile).filter(CarProfile.device_token == device).first()
        if not row:
            return None
        return {"brand": row.brand, "model": row.model, "year": row.year, "fuel": row.fuel, "tx": row.tx, "odo": row.odo, "reg": row.reg}
    finally:
        db.close()


@bp.post("/ask")
def ask():
    body = request.get_json(silent=True) or {}
    q = (body.get("question") or "").strip()
    if not q:
        return jsonify({"error": "missing_question", "hint": "POST {question: '...', profile?: {...}}"}), 400
    profile = body.get("profile") or _load_profile(_device_token())
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
            "hint": "Local library mein nahi mila. POST /api/4w/ask se DeepSeek pe pucho. Full ~2 000-code library queued in P1.",
        }), 404
    return jsonify({"code": code, **row})


@bp.post("/breakdown")
def breakdown():
    body = request.get_json(silent=True) or {}
    profile = body.get("profile") or _load_profile(_device_token()) or {}
    brand = (profile.get("brand") or "").strip()
    rsa = _RSA.get(brand) or _RSA["*"]
    return jsonify({
        "steps": [
            "Hazard lights ON. Car side mein lagao. Sab log barrier ke peeche khade ho.",
            "Reflective triangle 50 m peeche rakho.",
            "Fuel check — empty hai? Emergency fuel delivery available hai.",
            "Battery — dashboard lights dim? Horn low? → battery problem. Jump start chahiye.",
            "Check-engine light ON hai? DTC tab pe code daalo.",
            "Starter sound: click-click only → battery/starter motor. Crank but no start → fuel pump/spark/sensor.",
            "5 minute aaram. Phir start try karo.",
            "Agar start ho gayi — seedha mechanic. 40 km/h se upar mat jao. Hazards on.",
            "Agar nahi → SOS tab. Family cascade. RSA number neeche.",
        ],
        "rsa_number": rsa,
        "brand_matched": bool(_RSA.get(brand)),
        "vaani_protocol": "Family cascade only. Chitti never auto-dials 100 / 108 / 112.",
    })


@bp.get("/maintenance/next")
def maintenance_next():
    profile = _load_profile(_device_token()) or {}
    brand = profile.get("brand") or ""
    odo = int(profile.get("odo") or 0)
    schedule = _BRAND_SCHEDULE.get(brand) or _BRAND_SCHEDULE["Maruti Suzuki"]
    items = []
    for k, label in (
        ("oil_km", "Engine oil"),
        ("air_km", "Air filter"),
        ("plug_km", "Spark plugs"),
        ("brake_km", "Brake pads"),
        ("coolant_km", "Coolant flush"),
        ("ac_km", "AC cabin filter"),
    ):
        step = schedule[k]
        next_due_at = ((odo // step) + 1) * step if step else 0
        items.append({"item": label, "interval_km": step, "next_due_at_km": next_due_at, "km_remaining": max(0, next_due_at - odo)})
    return jsonify({"profile": profile, "schedule": items})


@bp.post("/profile")
def save_profile():
    body = request.get_json(silent=True) or {}
    device = _device_token()
    db = SessionLocal()
    try:
        row = db.query(CarProfile).filter(CarProfile.device_token == device).first()
        if row is None:
            row = CarProfile(device_token=device)
            db.add(row)
        for k in ("brand", "model", "year", "fuel", "tx", "odo", "reg"):
            if k in body:
                setattr(row, k, body.get(k))
        db.commit()
        sync_now()
        return jsonify({"ok": True, "saved": {"brand": row.brand, "model": row.model, "year": row.year, "fuel": row.fuel, "tx": row.tx, "odo": row.odo, "reg": row.reg}})
    except Exception as e:  # noqa: BLE001
        db.rollback()
        log.exception("save_profile failed: %s", e)
        return jsonify({"ok": False, "error": "save_failed"}), 500
    finally:
        db.close()


@bp.get("/profile")
def get_profile():
    p = _load_profile(_device_token())
    if p is None:
        return jsonify({"ok": False, "error": "no_profile"}), 404
    return jsonify({"ok": True, "profile": p})


@bp.route("/<path:rest>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def coming_soon(rest: str):
    return jsonify({
        "error": "coming_soon",
        "path": "/api/4w/" + rest,
        "hint": "Per chitti-4wheeler/skills/FEATURES.md — feature is queued. See §2 PLANNED.",
    }), 501
