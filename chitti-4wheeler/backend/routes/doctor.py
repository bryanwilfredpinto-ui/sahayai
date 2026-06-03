"""
chitti-4wheeler / backend / routes / doctor.py
----------------------------------------------
Car Doctor surface (MECH-5). All DETERMINISTIC — NO DeepSeek, NO network,
NO LLM. Knowledge tables + scoring live in services/doctor_data.py.

Routes (registered under /api/4w by main.py; Werkzeug specificity makes
these win over wheels.py's /<path:rest> catch-all):

  Dashboard Doctor
    GET  /dashboard/lights        — warning-light KB (~14 telltales)
    POST /dashboard/check         — interpret one light_key (or photo→pick)

  Sound Doctor
    GET  /sound/catalogue         — ~9 car sounds
    POST /sound/check             — ranked causes (or audio→pick)

  OBD2 snapshot interpreter
    POST /obd/snapshot            — decode codes + flag live params

  Used-Vehicle Inspector (~100 points)
    GET  /inspect/checklist       — the checklist
    POST /inspect/score           — weighted score + verdict

  Vehicle Health Passport (persisted + Trust Score)
    POST /passport/event          — persist an event
    GET  /passport                — events + trust score
    GET  /passport/trust-score    — trust score only

Honesty contract:
  - Photo auto-detect (dashboard) + audio classification (sound) need a
    vision/audio model we have NOT built. Those inputs return HTTP 200
    with mode="pick_or_describe" — never a fabricated result, never 501.
  - Every diagnostic carries a confidence band (high/medium/low).
  - Red-line systems (brakes/steering/airbag/overheat/tyre/EV-HV) force
    can_drive=False + a do-not-drive note.
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request

from database import SessionLocal, sync_now
from models import PassportEvent
from routes.wheels import _DTC, _device_token
from services import doctor_data as dd

log = logging.getLogger("routes.doctor")

doctor_bp = Blueprint("doctor_4w", __name__)


# ──────────────────────────────────────────────────────────────────────
# 1. Dashboard Doctor
# ──────────────────────────────────────────────────────────────────────
@doctor_bp.get("/dashboard/lights")
def dashboard_lights():
    return jsonify({"lights": dd.light_summary()})


@doctor_bp.post("/dashboard/check")
def dashboard_check():
    body = request.get_json(silent=True) or {}
    key = (body.get("light_key") or "").strip()

    if not key and body.get("image"):
        return jsonify({
            "mode": "pick_or_describe",
            "message_en": "Photo auto-detect of a dashboard light needs a vision model that is COMING SOON. Pick the light from the list, or describe its colour and symbol.",
            "message_hi": "Photo se dashboard light pehchaanna abhi COMING SOON hai. List se light chuno, ya uska rang aur symbol bata do.",
            "lights": dd.light_summary(),
        })

    light = dd.DASHBOARD_INDEX.get(key)
    if not light:
        return jsonify({"error": "unknown_light", "light_key": key, "hint": "GET /api/4w/dashboard/lights for valid keys."}), 404

    return jsonify({
        "light_key": key,
        "severity": light["severity"],
        "can_drive": light["can_drive"],
        "risk": light["risk"],
        "recommended_within": light["recommended_within"],
        "confidence": dd.light_confidence(light),
        "note_en": light["note_en"],
        "note_hi": light["note_hi"],
    })


# ──────────────────────────────────────────────────────────────────────
# 2. Sound Doctor
# ──────────────────────────────────────────────────────────────────────
@doctor_bp.get("/sound/catalogue")
def sound_catalogue():
    return jsonify({"sounds": dd.sound_catalogue_summary()})


@doctor_bp.post("/sound/check")
def sound_check():
    body = request.get_json(silent=True) or {}
    key = (body.get("sound_key") or "").strip()

    if not key and body.get("audio"):
        return jsonify({
            "mode": "pick_or_describe",
            "message_en": "Audio classification of a car sound needs an audio model that is COMING SOON. Pick the closest sound from the catalogue, or describe when it happens.",
            "message_hi": "Awaaz se sound pehchaanna abhi COMING SOON hai. Catalogue se sabse milta-julta sound chuno, ya batao kab aata hai.",
            "sounds": dd.sound_catalogue_summary(),
        })

    sound = dd.SOUND_INDEX.get(key)
    if not sound:
        return jsonify({"error": "unknown_sound", "sound_key": key, "hint": "GET /api/4w/sound/catalogue for valid keys."}), 404

    return jsonify({
        "sound_key": key,
        "name_en": sound["name_en"],
        "name_hi": sound["name_hi"],
        "candidates": sound["candidates"],
        "confidence": dd.sound_confidence(sound),
        "can_drive": sound["can_drive"],
        "safety_note_en": sound["safety_note_en"],
        "safety_note_hi": sound["safety_note_hi"],
    })


# ──────────────────────────────────────────────────────────────────────
# 3. OBD2 snapshot interpreter (deterministic; reuses wheels.py _DTC)
# ──────────────────────────────────────────────────────────────────────
_SEV_RANK = {"L": 1, "M": 2, "H": 3, "?": 1}


def _decode_codes(codes: list) -> list[dict]:
    decoded: list[dict] = []
    for raw in codes or []:
        code = str(raw or "").strip().upper()
        if not code:
            continue
        row = _DTC.get(code)
        if row:
            decoded.append({"code": code, "sev": row["sev"], "en": row["en"], "hi": row["hi"], "band": row["band"]})
        else:
            decoded.append({"code": code, "sev": "?", "note": "not in local library; ask via /api/4w/ask"})
    return decoded


def _live_flags(live: dict) -> tuple[list[dict], bool]:
    """Return (flags, overheat_forces_no_drive)."""
    flags: list[dict] = []
    no_drive = False
    if not isinstance(live, dict):
        return flags, no_drive

    volts = live.get("volts")
    if isinstance(volts, (int, float)) and volts < 12.0:
        flags.append({"param": "volts", "value": volts, "sev": "M",
                      "en": "Battery/charging voltage low (<12.0V) — alternator or battery weak.",
                      "hi": "Charging voltage low (<12.0V) — alternator/battery weak."})

    coolant = live.get("coolant_c")
    if isinstance(coolant, (int, float)) and coolant > 110:
        no_drive = True
        flags.append({"param": "coolant_c", "value": coolant, "sev": "H",
                      "en": "Coolant over 110°C — engine OVERHEATING. Stop and let it cool.",
                      "hi": "Coolant 110°C se upar — engine OVERHEAT. Rukо aur thanda hone do."})

    stft = live.get("stft")
    ltft = live.get("ltft")
    if isinstance(stft, (int, float)) and isinstance(ltft, (int, float)) and abs(stft + ltft) > 25:
        flags.append({"param": "fuel_trim", "value": round(stft + ltft, 1), "sev": "M",
                      "en": "Combined fuel trim over 25% — vacuum leak, MAF, or fuel-delivery issue.",
                      "hi": "Fuel trim 25% se zyada — vacuum leak, MAF, ya fuel-delivery issue."})

    rpm = live.get("rpm")
    if isinstance(rpm, (int, float)) and rpm > 0 and rpm < 600:
        flags.append({"param": "rpm", "value": rpm, "sev": "L",
                      "en": "Idle RPM low (<600) — possible idle-control or vacuum issue.",
                      "hi": "Idle RPM low (<600) — idle-control ya vacuum issue ho sakta."})

    return flags, no_drive


@doctor_bp.post("/obd/snapshot")
def obd_snapshot():
    body = request.get_json(silent=True) or {}
    codes = body.get("codes") or []
    live = body.get("live") or {}

    decoded = _decode_codes(codes)
    flags, overheat_no_drive = _live_flags(live)

    # Overall severity from decoded codes + flags.
    sev_values = [_SEV_RANK.get(d.get("sev"), 1) for d in decoded] + [_SEV_RANK.get(f.get("sev"), 1) for f in flags]
    max_rank = max(sev_values) if sev_values else 0
    overall = {0: "none", 1: "low", 2: "medium", 3: "high"}[max_rank]

    can_drive = not overheat_no_drive and overall != "high"

    has_unknown = any(d.get("sev") == "?" for d in decoded)
    if not decoded and not flags:
        confidence = "high"  # confidently nothing flagged
        summary_en = "No stored codes and all live params look normal. Nothing flagged."
        summary_hi = "Koi code nahi aur live params normal. Kuch flag nahi hua."
    else:
        confidence = "medium" if has_unknown else "high"
        parts_en = [d.get("en") or d.get("note") for d in decoded] + [f["en"] for f in flags]
        summary_en = " ".join(p for p in parts_en if p) or "Snapshot interpreted."
        parts_hi = [d.get("hi") for d in decoded if d.get("hi")] + [f["hi"] for f in flags]
        summary_hi = " ".join(parts_hi) or "Snapshot samjha gaya."
        if overheat_no_drive:
            summary_en = "DO NOT DRIVE — engine overheating. " + summary_en
            summary_hi = "MAT CHALAO — engine overheat. " + summary_hi

    return jsonify({
        "decoded": decoded,
        "live_flags": flags,
        "overall_severity": overall,
        "can_drive": can_drive,
        "summary_en": summary_en,
        "summary_hi": summary_hi,
        "confidence": confidence,
    })


# ──────────────────────────────────────────────────────────────────────
# 4. Used-Vehicle Inspector (~100-point deterministic)
# ──────────────────────────────────────────────────────────────────────
@doctor_bp.get("/inspect/checklist")
def inspect_checklist():
    return jsonify({"categories": dd.INSPECT_CATEGORIES, "total_points": dd.inspect_total_points()})


def _repair_band(score_pct: float, n_critical_fail: int) -> str:
    if n_critical_fail >= 2 or score_pct < 50:
        return "₹40 000-2 50 000+ (major work likely; budget for the worst)"
    if n_critical_fail == 1 or score_pct < 70:
        return "₹15 000-60 000 (notable repairs expected)"
    if score_pct < 90:
        return "₹3 000-15 000 (minor fettling)"
    return "₹0-3 000 (cosmetic / consumables only)"


@doctor_bp.post("/inspect/score")
def inspect_score():
    body = request.get_json(silent=True) or {}
    answers = body.get("answers") or {}
    if not isinstance(answers, dict):
        return jsonify({"error": "bad_answers", "hint": "POST {answers: {point_id: 'pass'|'fail'|'na'}}"}), 400

    index = dd.inspect_index()
    total_weight = 0
    got_weight = 0
    critical_fails: list[dict] = []
    answered = 0

    for pid, verdict in answers.items():
        pt = index.get(pid)
        if not pt:
            continue
        v = str(verdict or "").strip().lower()
        if v == "na":
            continue
        answered += 1
        w = pt["weight"]
        total_weight += w
        if v == "pass":
            got_weight += w
        elif v == "fail":
            if pt["critical"]:
                critical_fails.append({"id": pid, "category": pt["category"], "q_en": pt["q_en"], "q_hi": pt["q_hi"]})
        # any other token treated as not-pass, contributes 0

    score_pct = round((got_weight / total_weight) * 100, 1) if total_weight else 0.0
    n_crit = len(critical_fails)

    if n_crit >= 1:
        verdict = "avoid" if (n_crit >= 2 or score_pct < 70) else "caution"
    elif score_pct >= 80:
        verdict = "buy"
    elif score_pct >= 60:
        verdict = "caution"
    else:
        verdict = "avoid"

    # Confidence reflects how much of the 100-point sheet was actually filled.
    coverage = answered / dd.inspect_total_points() if dd.inspect_total_points() else 0
    confidence = "high" if coverage >= 0.6 else ("medium" if coverage >= 0.3 else "low")

    if verdict == "buy":
        advice_en = "Solid car on this inspection. Negotiate on the minor points and proceed."
        advice_hi = "Inspection mein gaadi achhi hai. Chhote points par mol-bhaav karo aur aage badho."
    elif verdict == "caution":
        advice_en = "Mixed result. Fix-or-walk on the failed points; price in the repairs before you commit."
        advice_hi = "Mila-jula result. Fail points par molbhav/repair price karo, phir hi haan karo."
    else:
        advice_en = "Walk away or only buy at a deep discount — the failures (especially safety-critical ones) cost more than they save."
        advice_hi = "Chhod do ya bahut sasta hi lo — safety-critical fails ki marammat bachat se zyada padegi."

    if critical_fails:
        names = ", ".join(c["q_en"] for c in critical_fails[:4])
        advice_en = f"SAFETY-CRITICAL FAIL: {names}. " + advice_en

    return jsonify({
        "score_pct": score_pct,
        "verdict": verdict,
        "confidence": confidence,
        "critical_fails": critical_fails,
        "expected_repair_band": _repair_band(score_pct, n_crit),
        "points_answered": answered,
        "total_points": dd.inspect_total_points(),
        "advice_en": advice_en,
        "advice_hi": advice_hi,
    })


# ──────────────────────────────────────────────────────────────────────
# 5. Vehicle Health Passport (persisted + deterministic Trust Score)
# ──────────────────────────────────────────────────────────────────────
_VALID_KINDS = {"service", "repair", "diagnosis", "inspection", "doc"}


def _event_dict(e: PassportEvent) -> dict:
    return {
        "id": e.id, "kind": e.kind, "title": e.title, "detail": e.detail,
        "cost": e.cost, "odo": e.odo, "resolved": e.resolved,
        "at": e.at.isoformat() if e.at else None,
    }


def _trust_score(events: list[PassportEvent]) -> tuple[int, str]:
    """Deterministic 0-100. Service history + · count/recency + ·
    unresolved critical repairs − · missing docs −."""
    if not events:
        return 0, "red"

    score = 40  # baseline once any history exists

    kinds = [e.kind for e in events]
    n_service = kinds.count("service")
    n_doc = kinds.count("doc")
    n_inspection = kinds.count("inspection")

    score += min(n_service, 5) * 6          # up to +30 for service history
    score += min(len(events), 6) * 2        # up to +12 for an active record
    score += min(n_inspection, 2) * 4       # up to +8 for inspections logged
    score += 6 if n_doc >= 1 else 0         # docs present
    score += 4 if n_doc >= 3 else 0         # good doc coverage

    # Unresolved repair events drag it down (resolved is 1=fixed, else open).
    n_unresolved = sum(1 for e in events if e.kind == "repair" and e.resolved != 1)
    score -= min(n_unresolved, 5) * 8

    # No docs at all is a red flag for a used car.
    if n_doc == 0:
        score -= 10

    score = max(0, min(100, score))
    band = "green" if score >= 80 else ("amber" if score >= 50 else "red")
    return score, band


@doctor_bp.post("/passport/event")
def passport_event():
    body = request.get_json(silent=True) or {}
    kind = (body.get("kind") or "").strip().lower()
    title = (body.get("title") or "").strip()
    if kind not in _VALID_KINDS:
        return jsonify({"error": "bad_kind", "hint": f"kind must be one of {sorted(_VALID_KINDS)}"}), 400
    if not title:
        return jsonify({"error": "missing_title", "hint": "POST {kind, title, detail?, cost?, odo?, resolved?}"}), 400

    device = _device_token()

    def _int_or_none(v):
        try:
            return int(v) if v is not None else None
        except (TypeError, ValueError):
            return None

    resolved = body.get("resolved")
    resolved_int = None if resolved is None else (1 if bool(resolved) else 0)

    db = SessionLocal()
    try:
        row = PassportEvent(
            device_token=device, kind=kind, title=title[:160],
            detail=(body.get("detail") or None), cost=_int_or_none(body.get("cost")),
            odo=_int_or_none(body.get("odo")), resolved=resolved_int,
        )
        db.add(row)
        db.commit()
        sync_now()
        return jsonify({"ok": True, "event": _event_dict(row)})
    except Exception as e:  # noqa: BLE001
        db.rollback()
        log.exception("passport_event failed: %s", e)
        return jsonify({"ok": False, "error": "save_failed"}), 500
    finally:
        db.close()


def _load_events(device: str) -> list[PassportEvent]:
    db = SessionLocal()
    try:
        return (
            db.query(PassportEvent)
            .filter(PassportEvent.device_token == device)
            .order_by(PassportEvent.at.desc(), PassportEvent.id.desc())
            .all()
        )
    finally:
        db.close()


@doctor_bp.get("/passport")
def passport():
    device = _device_token()
    events = _load_events(device)
    score, band = _trust_score(events)

    if not events:
        return jsonify({
            "events": [], "trust_score": 0, "trust_band": "red",
            "summary_en": "No passport events yet. Log services, repairs and documents to build a trust score.",
            "summary_hi": "Abhi koi passport event nahi. Service, repair aur documents log karo taaki trust score bane.",
        })

    n_service = sum(1 for e in events if e.kind == "service")
    summary_en = f"{len(events)} event(s) on record · {n_service} service(s). Trust score {score}/100 ({band})."
    summary_hi = f"{len(events)} event record mein · {n_service} service. Trust score {score}/100 ({band})."
    return jsonify({
        "events": [_event_dict(e) for e in events],
        "trust_score": score, "trust_band": band,
        "summary_en": summary_en, "summary_hi": summary_hi,
    })


@doctor_bp.get("/passport/trust-score")
def passport_trust_score():
    events = _load_events(_device_token())
    score, band = _trust_score(events)
    return jsonify({"trust_score": score, "trust_band": band})
