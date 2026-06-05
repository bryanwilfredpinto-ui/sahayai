"""
routes/health_scanner.py
-------------------------
**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

Flask Blueprint: /api/health-scanner/* — Chitti Health Scanner.

Chitti Health Scanner is the NEW visual-health capability inside the
Chitti MedUPI family. It complements:
  • Chitti MedUPI       — medicine cost intelligence
  • Chitti Health File  — records / timeline (routes/health_file.py)

SAFETY CONTRACT (this is a medical product — safety is the top priority):
  • Chitti NEVER diagnoses. It DETECTS / NOTICES patterns and ESCALATES
    to a professional. Golden line:
        "Chitti helps you notice — doctors help you heal."
  • Every analysis-ish response carries: a confidence/uncertainty note,
    a plain-language explanation, a suggested action (monitor / consider
    consult / seek care) and the disclaimer
        "This is not a medical diagnosis."
  • No prescriptions. No "you have <disease>". No certainty. No
    fear-mongering. No shaming.
  • AI is honestly less accurate on darker / Fitzpatrick IV–VI skin
    tones — never hide that.

HONEST-STUB CONTRACT:
  The AI vision models are NOT built or clinically validated yet. So:
  • POST /analyze returns an honest 501 "coming_soon". It NEVER returns
    a diagnosis, a probability, or any health verdict.
  • POST /save-to-timeline references the Health File doc endpoint when
    present, else returns an honest 501. We do not invent storage we
    cannot back.
  • Research accuracy numbers (skin 95%, dental 89–97%, …) are TARGETS /
    research benchmarks — they live in the docs, never as an "achieved"
    metric in a response here.

LOCKED platform rules mirrored here:
  • LLM = DeepSeek only (vision via DeepSeek-vision) — disclaimer-guarded.
  • Golden Rule confirm-gate (open camera / capture / save / share /
    remind) lives on the FRONTEND via chittiConfirmAndDo. By the time a
    request reaches this blueprint the user has already said "haan".
  • Camera-intelligence + privacy: health images are AES-256-GCM
    encrypted at rest (via the Health File storage path), user-owned,
    never sold, anonymised before any aggregate, "Chitti forget" deletes
    all. DPDP Act 2023 + ABDM-aware.

This blueprint MIRRORS routes/health_file.py: Blueprint object named
`bp`, registered in main.py exactly like `health_file_bp`.
"""
from __future__ import annotations

import logging

from flask import Blueprint, jsonify, request

log = logging.getLogger("routes.health_scanner")

bp = Blueprint("health_scanner", __name__, url_prefix="/api/health-scanner")


# Server-enforced safety strings — never client-controlled.
DISCLAIMER = "This is not a medical diagnosis."
GOLDEN_LINE = "Chitti helps you notice — doctors help you heal."
UNCERTAINTY_NOTE = (
    "Chitti notices patterns; it does not confirm any condition. "
    "AI visual screening is less accurate on darker / Fitzpatrick IV–VI "
    "skin tones — when in doubt, see a professional."
)


# ── F0–F12 scan types (COSDF) ─────────────────────────────────────
# status="coming_soon" for every one — no model is clinically validated.
SCAN_TYPES = [
    {"id": "F0",  "emoji": "📸", "label": "General Photo Triage",        "status": "coming_soon"},
    {"id": "F1",  "emoji": "🩹", "label": "Skin & Mole Check",            "status": "coming_soon"},
    {"id": "F2",  "emoji": "🦷", "label": "Dental & Oral Check",          "status": "coming_soon"},
    {"id": "F3",  "emoji": "👁️", "label": "Eye & Vision Check",           "status": "coming_soon"},
    {"id": "F4",  "emoji": "💅", "label": "Nail Health Check",            "status": "coming_soon"},
    {"id": "F5",  "emoji": "👅", "label": "Tongue & Throat Check",        "status": "coming_soon"},
    {"id": "F6",  "emoji": "🩺", "label": "Wound & Injury Check",         "status": "coming_soon"},
    {"id": "F7",  "emoji": "💊", "label": "Pill / Medicine Identify",     "status": "coming_soon"},
    {"id": "F8",  "emoji": "📄", "label": "Report / Label Reader",        "status": "coming_soon"},
    {"id": "F9",  "emoji": "🧒", "label": "Child Growth & Rash Check",    "status": "coming_soon"},
    {"id": "F10", "emoji": "🦶", "label": "Foot & Diabetic Foot Check",   "status": "coming_soon"},
    {"id": "F11", "emoji": "💇", "label": "Hair & Scalp Check",           "status": "coming_soon"},
    {"id": "F12", "emoji": "🌡️", "label": "Posture & Swelling Check",     "status": "coming_soon"},
]


# ── helpers ───────────────────────────────────────────────────────

def _safety_envelope(**extra) -> dict:
    """Every analysis-ish response is wrapped in the safety envelope:
    confidence/uncertainty note + plain action + disclaimer + golden line."""
    out = {
        "disclaimer": DISCLAIMER,
        "golden_line": GOLDEN_LINE,
        "uncertainty": UNCERTAINTY_NOTE,
        "confidence": None,      # honest stub — no model has produced a score
        "suggested_action": "monitor",  # safest default; never escalates panic
    }
    out.update(extra)
    return out


# ── /health (smoke) ───────────────────────────────────────────────

@bp.get("/health")
def health():
    return jsonify({
        "ok": True,
        "product": "chitti-health-scanner",
        "status": "skeleton",
    })


# ── /scan-types ───────────────────────────────────────────────────

@bp.get("/scan-types")
def scan_types():
    return jsonify({
        "ok": True,
        "items": SCAN_TYPES,
        "disclaimer": DISCLAIMER,
        "golden_line": GOLDEN_LINE,
    })


# ── /analyze — honest 501, NEVER a diagnosis ──────────────────────

@bp.post("/analyze")
def analyze():
    """Body: { scan_type, image_b64, body_location, profile_id }

    Honest 501 — the AI visual analysis is not yet clinically validated.
    This endpoint NEVER returns a diagnosis, a probability, or any health
    verdict. It can offer to store the image to the Health File timeline.
    """
    body = request.get_json(silent=True) or {}
    scan_type = (body.get("scan_type") or "").strip()
    body_location = (body.get("body_location") or "").strip()
    profile_id = body.get("profile_id")

    return jsonify(_safety_envelope(
        status="coming_soon",
        message=(
            "AI visual analysis is not yet clinically validated. "
            "Chitti can store this image to your Health File timeline. "
            "This is not a medical diagnosis."
        ),
        scan_type=scan_type or None,
        body_location=body_location or None,
        profile_id=profile_id,
    )), 501


# ── /save-to-timeline — honest stub, references Health File if present ─

@bp.post("/save-to-timeline")
def save_to_timeline():
    """Body: { scan_type, image_b64, body_location, profile_id }

    Honest stub. If the Chitti Health File document endpoint is mounted
    on this app, we point the caller at it (the real AES-256-GCM
    encrypted storage path). Otherwise we return an honest 501 — we do
    NOT invent storage we cannot back.
    """
    body = request.get_json(silent=True) or {}
    scan_type = (body.get("scan_type") or "").strip()
    body_location = (body.get("body_location") or "").strip()
    profile_id = body.get("profile_id")

    # Is the Health File docs upload endpoint actually registered?
    health_file_upload = None
    try:
        from flask import current_app
        for rule in current_app.url_map.iter_rules():
            if rule.rule == "/api/health-file/docs" and "POST" in (rule.methods or set()):
                health_file_upload = rule.rule
                break
    except Exception as e:  # noqa: BLE001
        log.warning("health-file route probe skipped: %s", e)

    if health_file_upload:
        # Honest pointer — the frontend should re-POST the image (as
        # blob_b64 + doc_type="scan") to the real encrypted store after
        # the Golden-Rule confirm gate. We don't silently re-route the
        # bytes here so the user's "haan" stays explicit on that surface.
        return jsonify(_safety_envelope(
            status="use_health_file",
            message=(
                "Chitti Health File timeline is available. Send this image "
                "to the Health File document store to keep it (AES-256-GCM "
                "encrypted, user-owned, 'Chitti forget' deletes all). "
                "This is not a medical diagnosis."
            ),
            health_file_endpoint=health_file_upload,
            suggested_doc_type="scan",
            scan_type=scan_type or None,
            body_location=body_location or None,
            profile_id=profile_id,
        )), 200

    return jsonify(_safety_envelope(
        status="coming_soon",
        message=(
            "Saving scans to the Health File timeline is coming soon. "
            "Chitti will store this image AES-256-GCM encrypted, "
            "user-owned, and 'Chitti forget' will delete all. "
            "This is not a medical diagnosis."
        ),
        scan_type=scan_type or None,
        body_location=body_location or None,
        profile_id=profile_id,
    )), 501


# ── /timeline — Guardian Memory (Level 2). Local-first today ──────────

@bp.get("/timeline")
def timeline():
    """Query: profile_id, scan_type

    Guardian Memory is LOCAL-FIRST: the canonical health-photo timeline
    lives on the user's device (browser localStorage), so no health image
    leaves the phone unless the user explicitly saves it to Chitti Health
    File. This endpoint documents the server-sync shape; server-stored
    history is an honest `coming_soon` and points at the encrypted Health
    File vault as the sync target. It NEVER returns analysis or a diagnosis.
    """
    profile_id = request.args.get("profile_id")
    scan_type = (request.args.get("scan_type") or "").strip()
    return jsonify(_safety_envelope(
        status="local_first",
        message=(
            "Your health-photo memory is kept privately on your device. "
            "Server sync to the AES-256-GCM encrypted Chitti Health File "
            "vault is coming soon. This is not a medical diagnosis."
        ),
        canonical_store="device_localStorage:chitti_hs_timeline_v1",
        sync_target="/api/health-file/docs",
        profile_id=profile_id,
        scan_type=scan_type or None,
        items=[],  # server holds none yet — honest empty, not a fake history
    )), 200


# ── /compare — first-vs-latest (Level 2 + 9). Measurement is gated ────

@bp.get("/compare")
def compare():
    """Query: profile_id, scan_type

    The app shows the first vs latest photo side by side on-device. AUTOMATIC
    size/area measurement and any "% change" needs a validated CV model and is
    honest `coming_soon` — we never fabricate a measurement or a trend %.
    Conservative, honest framing only: count of photos + days tracked.
    """
    profile_id = request.args.get("profile_id")
    scan_type = (request.args.get("scan_type") or "").strip()
    return jsonify(_safety_envelope(
        status="coming_soon",
        message=(
            "Automatic size/area comparison is coming soon — it needs a "
            "clinically-validated vision model, so Chitti will not guess a "
            "number. For now, compare the first and latest photo with your "
            "own eyes, or show them to a doctor. This is not a medical diagnosis."
        ),
        measured_change=None,        # never a fabricated %
        trend=None,                  # never a fabricated trend
        profile_id=profile_id,
        scan_type=scan_type or None,
    )), 501
