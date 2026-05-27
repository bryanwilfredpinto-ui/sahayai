"""
routes/camera.py
----------------
Flask Blueprint: /api/camera/* — Universal Camera analyzer for chitti_camera_universal.js.

Endpoints:
  POST /api/camera/analyze
    Body: { user_token, mode, lang, image_b64, page?, mode_label? }
    Returns: { ok, text, mode, lang, capture_id, elapsed_ms?, model? }
              or { ok=False, error, text } on honest failure.

The substrate posts a base64 JPEG (≤ 1 MB) plus the active mode + lang. We
route to services/camera_vision.analyze() which calls the LLM via the same
DEEPSEEK_* env vars every other Vaani service uses — so the Gemini env-var
hijack (2026-05-27) flips this endpoint at the same time.

No image is stored server-side here. If you want capture-intelligence (§2b),
the substrate ALSO fires chitti_camera.js → /api/camera/capture out-of-band.
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request

from services import camera_vision

log = logging.getLogger("routes.camera")

bp = Blueprint("camera", __name__, url_prefix="/api/camera")


@bp.post("/analyze")
def analyze_route():
    body = request.get_json(silent=True) or {}
    image_b64 = (body.get("image_b64") or "").strip()
    image_b64_frames = body.get("image_b64_frames") or None
    mode = (body.get("mode") or "").strip().lower()
    lang = (body.get("lang") or "hi").strip().lower()
    user_token = (body.get("user_token") or "").strip()
    page = (body.get("page") or "").strip()[:120]
    if not image_b64 and not image_b64_frames:
        abort(400, description="image_b64 or image_b64_frames is required")
    if not mode:
        abort(400, description="mode is required")

    out = camera_vision.analyze(
        image_b64=image_b64,
        image_b64_frames=image_b64_frames if isinstance(image_b64_frames, list) else None,
        mode=mode,
        lang=lang,
        user_token=user_token,
        page=page,
    )
    status = 200 if out.get("ok") else 502 if out.get("error", "").startswith("upstream_") else 400
    return jsonify(out), status


@bp.get("/health")
def health_route():
    from config import settings
    return jsonify({
        "ok": True,
        "configured": bool(settings.DEEPSEEK_API_KEY),
        "model": settings.DEEPSEEK_MODEL,
        "modes": [
            "medicine", "food_label", "fashion_outfit", "document_read",
            "bill_check", "legal_notice", "crop_plant", "prescription",
            "qr_payment", "product_authentic",
            "fashion_video",  # multi-frame (2-6 keyframes from 10s clip)
        ],
        "langs": ["hi", "en", "bn", "te", "ta", "mr", "gu", "kn", "ml", "pa"],
    })
