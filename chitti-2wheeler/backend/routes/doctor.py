"""
chitti-2wheeler / backend / routes / doctor.py
----------------------------------------------
MECH-5: the Doctor surface — five deterministic diagnostic endpoints.
NO DeepSeek / NO network / NO LLM in any route here. Everything scores
against the fixed knowledge tables in services/doctor_data.py.

Routes (all under /api/2w — registered with the SAME prefix as wheels.py;
Werkzeug specificity makes these win over wheels.py's /<path:rest>):

  Dashboard Doctor
    GET  /api/2w/dashboard/lights
    POST /api/2w/dashboard/check        {light_key} | {image:true}

  Sound Doctor
    GET  /api/2w/sound/catalogue
    POST /api/2w/sound/check            {sound_key} | {audio:true}

  OBD2 snapshot interpreter
    POST /api/2w/obd/snapshot           {codes:[...], live:{volts,rpm,coolant_c}}

  Used-Vehicle Inspector (100-point)
    GET  /api/2w/inspect/checklist
    POST /api/2w/inspect/score          {answers:{point_id: pass|fail|na}}

  Vehicle Health Passport (persisted + Trust Score)
    POST /api/2w/passport/event
    GET  /api/2w/passport
    GET  /api/2w/passport/trust-score

Honesty contract:
  - photo auto-detect (dashboard) + audio classification (sound) are NOT
    built (need a vision/audio provider). Those inputs return HTTP 200
    mode:"pick_or_describe" — never a fabricated result, never 501.
  - every diagnostic carries a confidence band + Likely/Possible language.
  - safety red-lines force can_ride:false + a do-not-ride note.
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request

from database import SessionLocal, sync_now
from models import PassportEvent
from routes.wheels import _DTC, _device_token
from services.doctor_data import (
    DASHBOARD_LIGHTS,
    INSPECT_CHECKLIST,
    OBD_THRESHOLDS,
    SOUND_CATALOGUE,
    total_inspect_points,
)

log = logging.getLogger("routes.doctor")

doctor_bp = Blueprint("doctor_2w", __name__)

_COLOR_WORD = {"red": "RED / Stop", "amber": "AMBER / Caution", "green": "GREEN / OK"}


# ─────────────────────────── Dashboard Doctor ────────────────────────────
def _light_public(l: dict) -> dict:
    return {
        "key": l["key"], "icon": l["icon"], "name_en": l["name_en"], "name_hi": l["name_hi"],
        "color": l["color"], "color_word": _COLOR_WORD.get(l["color"], l["color"]),
        "severity": l["severity"], "can_ride": l["can_ride"], "recommended_within": l["recommended_within"],
    }


@doctor_bp.get("/dashboard/lights")
def dashboard_lights():
    return jsonify({"lights": [_light_public(l) for l in DASHBOARD_LIGHTS]})


@doctor_bp.post("/dashboard/check")
def dashboard_check():
    body = request.get_json(silent=True) or {}
    key = (body.get("light_key") or "").strip().lower()
    if not key and body.get("image"):
        return jsonify({
            "mode": "pick_or_describe",
            "message_en": "Photo auto-detect of a dashboard light is COMING SOON (needs a vision provider). "
                          "For now, please pick the light from the list or describe it.",
            "message_hi": "Photo se dashboard light pehchanna COMING SOON hai (vision provider chahiye). "
                          "Abhi list mein se light chuno ya bata do kaunsi jal rahi.",
            "lights": [_light_public(l) for l in DASHBOARD_LIGHTS],
        }), 200
    l = next((x for x in DASHBOARD_LIGHTS if x["key"] == key), None)
    if not l:
        return jsonify({
            "error": "unknown_light", "light_key": key,
            "hint": "Not in the local telltale library. GET /api/2w/dashboard/lights for valid keys.",
        }), 404
    # red-line telltales never report can_ride true; confidence reflects KB certainty.
    confidence = "high" if l["severity"] in ("red", "green") else "medium"
    return jsonify({
        "light_key": l["key"], "name_en": l["name_en"], "name_hi": l["name_hi"],
        "color": l["color"], "color_word": _COLOR_WORD.get(l["color"], l["color"]),
        "severity": l["severity"], "can_ride": l["can_ride"], "risk": l["risk"],
        "recommended_within": l["recommended_within"], "confidence": confidence,
        "note_en": l["note_en"], "note_hi": l["note_hi"],
    })


# ───────────────────────────── Sound Doctor ──────────────────────────────
@doctor_bp.get("/sound/catalogue")
def sound_catalogue():
    return jsonify({"sounds": [
        {"key": s["key"], "name_en": s["name_en"], "name_hi": s["name_hi"], "when": s["when"]}
        for s in SOUND_CATALOGUE
    ]})


@doctor_bp.post("/sound/check")
def sound_check():
    body = request.get_json(silent=True) or {}
    key = (body.get("sound_key") or "").strip().lower()
    if not key and body.get("audio"):
        return jsonify({
            "mode": "pick_or_describe",
            "message_en": "Audio classification of an engine sound is COMING SOON (needs an audio model). "
                          "For now, pick the closest sound from the catalogue or describe it.",
            "message_hi": "Awaaz se diagnosis COMING SOON hai (audio model chahiye). "
                          "Abhi catalogue mein se sabse milti-julti awaaz chuno ya bata do.",
            "sounds": [{"key": s["key"], "name_en": s["name_en"], "name_hi": s["name_hi"], "when": s["when"]}
                       for s in SOUND_CATALOGUE],
        }), 200
    s = next((x for x in SOUND_CATALOGUE if x["key"] == key), None)
    if not s:
        return jsonify({
            "error": "unknown_sound", "sound_key": key,
            "hint": "Not in the local sound catalogue. GET /api/2w/sound/catalogue for valid keys.",
        }), 404
    return jsonify({
        "sound_key": s["key"], "name_en": s["name_en"], "name_hi": s["name_hi"], "when": s["when"],
        "candidates": s["candidates"], "confidence": s["confidence"],
        "safety_note_en": s["safety_note_en"], "safety_note_hi": s["safety_note_hi"],
    })


# ────────────────────── OBD2 snapshot interpreter ────────────────────────
_SEV_ORDER = {"L": 1, "M": 2, "H": 3, "?": 2}


def _decode_codes(codes: list) -> list[dict]:
    out = []
    for raw in codes:
        code = str(raw or "").strip().upper()
        if not code:
            continue
        row = _DTC.get(code)
        if row:
            out.append({"code": code, "sev": row["sev"], "en": row["en"], "hi": row["hi"], "band": row["band"]})
        else:
            out.append({"code": code, "sev": "?", "note": "not in local library — POST /api/2w/ask to look it up"})
    return out


def _live_flags(live: dict) -> tuple[list[dict], bool]:
    flags, overheat = [], False
    t = OBD_THRESHOLDS
    volts = live.get("volts")
    if isinstance(volts, (int, float)):
        if volts < t["volts_low"]:
            flags.append({"param": "volts", "value": volts, "sev": "M",
                          "note_en": f"Battery voltage low ({volts}V) — Likely a charging/regulator issue.",
                          "note_hi": f"Battery voltage kam ({volts}V) — charging/regulator issue ho sakta."})
        elif volts > t["volts_high"]:
            flags.append({"param": "volts", "value": volts, "sev": "M",
                          "note_en": f"Voltage high ({volts}V) — Possible over-charging / regulator fault.",
                          "note_hi": f"Voltage zyada ({volts}V) — over-charging / regulator fault ho sakta."})
    coolant = live.get("coolant_c")
    if isinstance(coolant, (int, float)):
        if coolant > t["coolant_overheat"]:
            overheat = True
            flags.append({"param": "coolant_c", "value": coolant, "sev": "H",
                          "note_en": f"Overheating ({coolant}°C) — do NOT ride, stop and cool down.",
                          "note_hi": f"Over-heat ({coolant}°C) — mat chalao, ruk ke thanda hone do."})
        elif coolant > t["coolant_warm"]:
            flags.append({"param": "coolant_c", "value": coolant, "sev": "M",
                          "note_en": f"Running hot ({coolant}°C) — Possible coolant/fan issue, monitor.",
                          "note_hi": f"Garam chal rahi ({coolant}°C) — coolant/fan issue ho sakta, dhyan do."})
    rpm = live.get("rpm")
    if isinstance(rpm, (int, float)) and rpm > t["rpm_high_idle"] and live.get("at_idle"):
        flags.append({"param": "rpm", "value": rpm, "sev": "L",
                      "note_en": f"High idle ({rpm} rpm) — Possible idle/air screw or throttle issue.",
                      "note_hi": f"Idle high ({rpm} rpm) — idle/air-screw ya throttle issue ho sakta."})
    return flags, overheat


@doctor_bp.post("/obd/snapshot")
def obd_snapshot():
    body = request.get_json(silent=True) or {}
    codes = body.get("codes") or []
    live = body.get("live") or {}
    if not isinstance(codes, list):
        return jsonify({"error": "bad_codes", "hint": "codes must be a list like [\"P0301\"]"}), 400

    decoded = _decode_codes(codes)
    flags, overheat = _live_flags(live if isinstance(live, dict) else {})

    sevs = [_SEV_ORDER.get(d["sev"], 2) for d in decoded] + [_SEV_ORDER.get(f["sev"], 2) for f in flags]
    has_high = any(s >= 3 for s in sevs)
    has_unknown = any(d["sev"] == "?" for d in decoded)
    can_ride = not (overheat or has_high)
    overall = "high" if (overheat or has_high) else ("medium" if sevs else "low")

    if overheat:
        summary_en = "STOP — overheating detected. Do not ride until the engine cools and coolant is checked."
        summary_hi = "RUKO — over-heat hai. Engine thanda aur coolant check hone tak mat chalao."
    elif has_high:
        summary_en = "Serious fault(s) found. Ride gently to a mechanic; avoid hard revving."
        summary_hi = "Serious fault mila. Dhire mechanic tak jao; zor se mat ghumao."
    elif decoded or flags:
        summary_en = "Minor fault(s) noted. Likely safe to ride gently; get them looked at soon."
        summary_hi = "Chhote fault hain. Dhire chalana theek; jaldi dikha do."
    else:
        summary_en = "No stored codes and live params within range. Looks healthy."
        summary_hi = "Koi code nahi, live params range mein. Healthy lagti hai."

    # honest confidence: lower when any code wasn't in the local library
    confidence = "low" if has_unknown else ("high" if (overheat or has_high) else "medium")
    return jsonify({
        "decoded": decoded, "live_flags": flags, "overall_severity": overall,
        "can_ride": can_ride, "summary_en": summary_en, "summary_hi": summary_hi,
        "confidence": confidence,
    })


# ─────────────────────── Used-Vehicle Inspector ──────────────────────────
@doctor_bp.get("/inspect/checklist")
def inspect_checklist():
    return jsonify({"categories": INSPECT_CHECKLIST, "total_points": total_inspect_points()})


def _all_points() -> dict[str, dict]:
    return {p["id"]: p for cat in INSPECT_CHECKLIST for p in cat["points"]}


@doctor_bp.post("/inspect/score")
def inspect_score():
    body = request.get_json(silent=True) or {}
    answers = body.get("answers") or {}
    if not isinstance(answers, dict):
        return jsonify({"error": "bad_answers", "hint": "answers must be {point_id: pass|fail|na}"}), 400

    points = _all_points()
    earned = possible = 0
    critical_fails: list[dict] = []
    fail_count = 0
    for pid, p in points.items():
        ans = str(answers.get(pid, "na")).strip().lower()
        if ans == "na":
            continue  # excluded from both sides — unknown, not counted
        possible += p["weight"]
        if ans == "pass":
            earned += p["weight"]
        elif ans == "fail":
            fail_count += 1
            if p["critical"]:
                critical_fails.append({"id": pid, "q_en": p["q_en"], "q_hi": p["q_hi"]})

    score_pct = round(100 * earned / possible) if possible else 0

    if critical_fails:
        # any safety/title critical fail caps the verdict — never "buy"
        verdict = "avoid" if (len(critical_fails) >= 2 or score_pct < 70) else "caution"
    elif score_pct >= 80:
        verdict = "buy"
    elif score_pct >= 60:
        verdict = "caution"
    else:
        verdict = "avoid"

    # expected repair band scales with number of fails (deterministic).
    band = _repair_band(fail_count, len(critical_fails))
    confidence = "high" if possible >= total_inspect_points() * 0.6 else "medium"

    advice_en, advice_hi = _inspect_advice(verdict, critical_fails)
    return jsonify({
        "score_pct": score_pct, "verdict": verdict, "confidence": confidence,
        "critical_fails": critical_fails, "expected_repair_band": band,
        "answered": possible and len([a for a in answers.values() if str(a).lower() != "na"]) or 0,
        "advice_en": advice_en, "advice_hi": advice_hi,
    })


def _repair_band(fail_count: int, crit: int) -> str:
    if fail_count == 0:
        return "₹0-1,000 (routine consumables)"
    if crit >= 2 or fail_count >= 8:
        return "₹15,000+ (major — multiple/critical items)"
    if crit >= 1 or fail_count >= 4:
        return "₹5,000-15,000 (significant)"
    return "₹1,000-5,000 (minor)"


def _inspect_advice(verdict: str, crit: list) -> tuple[str, str]:
    if verdict == "avoid" and crit:
        names = ", ".join(c["q_en"] for c in crit[:3])
        return (
            f"Avoid — critical safety/title item(s) failed: {names}. Walk away or get them fixed before any deal.",
            "Avoid — critical safety/title item fail hua. Sauda chhodo ya theek karwa ke hi aage badho.",
        )
    if verdict == "avoid":
        return ("Avoid — too many faults for the price. Keep looking.",
                "Avoid — itne fault paise ke hisaab se zyada hain. Aur dekho.")
    if verdict == "caution":
        return ("Caution — rideable but negotiate hard and budget for repairs. Re-check the failed points.",
                "Caution — chalegi par mol-bhaav karo aur repair ka budget rakho. Fail points dobara dekho.")
    return ("Looks good — strong inspection. Verify documents on VAHAN before paying.",
            "Achhi lagti hai — strong inspection. Paise dene se pehle VAHAN pe documents check karo.")


# ──────────────────── Vehicle Health Passport ────────────────────────────
_VALID_KINDS = {"service", "repair", "diagnosis", "inspection", "doc"}


@doctor_bp.post("/passport/event")
def passport_event():
    body = request.get_json(silent=True) or {}
    kind = (body.get("kind") or "").strip().lower()
    title = (body.get("title") or "").strip()
    if kind not in _VALID_KINDS:
        return jsonify({"error": "bad_kind", "hint": f"kind must be one of {sorted(_VALID_KINDS)}"}), 400
    if not title:
        return jsonify({"error": "missing_title", "hint": "title is required"}), 400

    device = _device_token()
    db = SessionLocal()
    try:
        ev = PassportEvent(
            device_token=device, kind=kind, title=title[:200],
            detail=(body.get("detail") or None), cost=_as_int(body.get("cost")),
            odo=_as_int(body.get("odo")),
        )
        db.add(ev)
        db.commit()
        sync_now()
        return jsonify({"ok": True, "id": ev.id, "kind": ev.kind, "title": ev.title})
    except Exception as e:  # noqa: BLE001
        db.rollback()
        log.exception("passport_event failed: %s", e)
        return jsonify({"ok": False, "error": "save_failed"}), 500
    finally:
        db.close()


def _as_int(v) -> int | None:
    try:
        return int(v) if v is not None and str(v).strip() != "" else None
    except (TypeError, ValueError):
        return None


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


def _compute_trust(events: list[PassportEvent]) -> tuple[int, str]:
    """Deterministic 0-100 Trust Score from passport history.

    + service history present · + breadth/volume of records ·
    − unresolved critical repairs (no later service) · − missing docs.
    """
    if not events:
        return 0, "red"
    kinds = [e.kind for e in events]
    score = 40  # baseline: at least one recorded event = some transparency

    if "service" in kinds:
        score += 20
    score += min(20, len(events) * 3)        # breadth / volume
    if "inspection" in kinds:
        score += 5
    if "doc" in kinds:
        score += 10
    else:
        score -= 10                          # missing docs penalty

    # unresolved critical repair: a repair event with no later service event.
    last_service_idx = next((i for i, e in enumerate(events) if e.kind == "service"), None)
    repair_idxs = [i for i, e in enumerate(events) if e.kind == "repair"]
    # events are newest-first; "later" = smaller index.
    unresolved = any(
        last_service_idx is None or ri < last_service_idx for ri in repair_idxs
    )
    if repair_idxs and unresolved:
        score -= 15

    score = max(0, min(100, score))
    band = "green" if score >= 80 else ("amber" if score >= 50 else "red")
    return score, band


def _event_public(e: PassportEvent) -> dict:
    return {
        "id": e.id, "kind": e.kind, "title": e.title, "detail": e.detail,
        "cost": e.cost, "odo": e.odo, "at": e.at.isoformat() if e.at else None,
    }


@doctor_bp.get("/passport")
def passport():
    events = _load_events(_device_token())
    score, band = _compute_trust(events)
    if not events:
        return jsonify({
            "events": [], "trust_score": 0, "trust_band": "red",
            "summary_en": "No passport history yet. Add service, repair and document events to build a Trust Score.",
            "summary_hi": "Abhi koi passport history nahi. Service, repair aur document events add karke Trust Score banao.",
        })
    summary_en = f"{len(events)} event(s) recorded. Trust Score {score}/100 ({band.upper()})."
    summary_hi = f"{len(events)} event record hue. Trust Score {score}/100 ({band.upper()})."
    return jsonify({
        "events": [_event_public(e) for e in events],
        "trust_score": score, "trust_band": band,
        "summary_en": summary_en, "summary_hi": summary_hi,
    })


@doctor_bp.get("/passport/trust-score")
def passport_trust_score():
    score, band = _compute_trust(_load_events(_device_token()))
    return jsonify({"trust_score": score, "trust_band": band})
