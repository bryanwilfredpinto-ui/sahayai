"""HTTP routes for /api/lv/* — Logo + Video endpoints."""

from flask import Blueprint, jsonify, request

from services import logo_service, video_service


bp = Blueprint("lv", __name__, url_prefix="/api/lv")


@bp.get("/health")
def health():
    return jsonify({
        "ok": True,
        "logo": logo_service.health(),
        "video": video_service.health(),
    })


@bp.post("/logo/generate")
def logo_generate():
    body = request.get_json(silent=True) or {}
    brand = (body.get("brand_name") or "").strip()
    tagline = (body.get("tagline") or "").strip()
    palette = (body.get("palette") or "bharat").strip()
    style = (body.get("style") or "monogram").strip()
    if not brand:
        return jsonify({"ok": False, "error": "missing_brand_name"}), 400
    if len(brand) > 80:
        return jsonify({"ok": False, "error": "brand_name_too_long", "max": 80}), 413
    return jsonify(logo_service.generate_logo(
        brand_name=brand, tagline=tagline, palette_name=palette, style=style,
    ))


@bp.post("/video/enqueue")
def video_enqueue():
    body = request.get_json(silent=True) or {}
    script = (body.get("script") or "").strip()
    language = (body.get("language") or "en").strip()
    try:
        duration_s = int(body.get("duration_s") or 30)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "invalid_duration_s"}), 400
    if not script:
        return jsonify({"ok": False, "error": "missing_script"}), 400
    if len(script) > 4000:
        return jsonify({"ok": False, "error": "script_too_long", "max": 4000}), 413
    result = video_service.enqueue(script=script, language=language, duration_s=duration_s)
    return jsonify(result), (200 if result.get("ok") else 400)


@bp.get("/video/status/<job_id>")
def video_status(job_id: str):
    result = video_service.status(job_id)
    if not result.get("ok"):
        return jsonify(result), 404
    return jsonify(result)
