"""HTTP routes for /api/voice/*."""

from flask import Blueprint, jsonify, request

import languages
import ledger
import router


bp = Blueprint("voice", __name__, url_prefix="/api/voice")


_TIER_C_HUMAN_EN = {
    "tcy": "Chitti is still learning Tulu. We need volunteer voice donors.",
    "kfa": "Chitti is still learning Kodava. We need volunteer voice donors.",
    "kru": "Chitti is still learning Oraon (Kurukh). We need volunteer voice donors.",
}
_TIER_C_HUMAN_NATIVE = {
    "tcy": "ಚಿಟ್ಟಿ ತುಳುನು ಕಲ್ತೊಂದುಲ್ಲೆ. ಎಂಕುಲೆಗ್ ತುಳುದ ಕಂಠದಾನಿಗ್ ಬೋಡು.",
    "kfa": "ಚಿಟ್ಟಿ ಕೊಡವತ್ ಕತ್ತುಲ್ಲ. ಒಪ್ಪಿಗೆದ ಕಂಠ ದಾನ ಬೇಕು.",
    "kru": "चिट्टी कुड़ुख़ कलिखता। हमें कुड़ुख़ बोलने वालों की ज़रूरत है।",
}


@bp.get("/languages")
def list_languages():
    return jsonify({
        "count": len(languages.ALL_LANGUAGES),
        "primary": [
            {
                "code": l.code, "name_en": l.name_en, "name_native": l.name_native,
                "web_speech_code": l.web_speech_code, "tier": l.tier,
                "bhashini_supported": l.bhashini_supported,
                "ai4bharat_supported": l.ai4bharat_supported,
            }
            for l in languages.PRIMARY_12
        ],
        "cousin": [
            {
                "code": l.code, "name_en": l.name_en, "name_native": l.name_native,
                "web_speech_code": l.web_speech_code, "tier": l.tier,
                "bhashini_supported": l.bhashini_supported,
                "ai4bharat_supported": l.ai4bharat_supported,
            }
            for l in languages.COUSIN_12
        ],
    })


@bp.get("/status")
def status_all():
    out = {}
    for lang in languages.ALL_LANGUAGES:
        s = ledger.status_for(lang.code)
        out[lang.code] = {
            "name_en": lang.name_en,
            "name_native": lang.name_native,
            "tier": lang.tier,
            **s,
        }
    return jsonify({
        "count": len(out),
        "languages": out,
        "suppliers": router.list_suppliers(),
    })


@bp.get("/status/<lang>")
def status_one(lang: str):
    if lang not in languages.BY_CODE:
        return jsonify({"error": "unknown_language", "code": lang}), 404
    L = languages.BY_CODE[lang]
    s = ledger.status_for(lang)
    return jsonify({
        "code": lang,
        "name_en": L.name_en,
        "name_native": L.name_native,
        "tier": L.tier,
        "family": L.family,
        **s,
    })


@bp.post("/speak")
def speak():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    lang = (body.get("language") or "").strip()

    if not text:
        return jsonify({"ok": False, "error": "missing_text"}), 400
    if not lang or lang not in languages.BY_CODE:
        return jsonify({"ok": False, "error": "unknown_language", "code": lang}), 400
    if len(text) > 2000:
        return jsonify({"ok": False, "error": "text_too_long", "max_chars": 2000}), 413

    if languages.is_tier_c(lang):
        return jsonify({
            "ok": False,
            "supplier": None,
            "language": lang,
            "reason": "voice_not_available",
            "human_message_en": _TIER_C_HUMAN_EN.get(lang, "Donor program required."),
            "human_message_native": _TIER_C_HUMAN_NATIVE.get(lang, ""),
            "donor_url": f"/voice_donor.html?lang={lang}",
        }), 503

    result = router.synthesize(text, lang)
    if not result.ok:
        return jsonify({
            "ok": False,
            "supplier": result.supplier,
            "language": lang,
            "error_code": result.error_code,
            "error_message": result.error_message,
        }), 502

    return jsonify({
        "ok": True,
        "supplier": result.supplier,
        "language": lang,
        "text": text,
        "voice_lang_code": result.voice_lang_code,
        "client_directive": result.client_directive,
        "audio_url": result.audio_url,
        "audio_bytes": result.audio_bytes_count,
        "latency_ms": result.latency_ms,
        "disclaimer": result.disclaimer,
    })


@bp.get("/honest-banner/<lang>")
def honest_banner(lang: str):
    if lang not in languages.BY_CODE:
        return jsonify({"error": "unknown_language", "code": lang}), 404
    L = languages.BY_CODE[lang]
    s = ledger.status_for(lang)
    if L.tier == "C":
        return jsonify({
            "code": lang,
            "verdict": "donor_required",
            "english": _TIER_C_HUMAN_EN.get(lang, ""),
            "native": _TIER_C_HUMAN_NATIVE.get(lang, ""),
        })
    if not s["available"]:
        return jsonify({
            "code": lang,
            "verdict": "not_yet",
            "english": f"{L.name_en} voice has not been verified in the last 24 hours. Tap Speak to test.",
        })
    return jsonify({
        "code": lang,
        "verdict": "ok",
        "supplier": s["supplier"],
        "english": (
            f"{L.name_en} voice is live via {s['supplier']}. "
            f"Average latency {s['avg_latency_ms_24h']} ms over last 24 h."
        ),
    })


@bp.get("/ledger")
def ledger_recent():
    limit = min(int(request.args.get("limit", 200)), 1000)
    return jsonify({"count": limit, "rows": ledger.recent_log(limit)})


@bp.post("/donate")
def donate():
    # v1 stub — full flow ships in Phase 9.
    return jsonify({
        "ok": False,
        "error": "donor_flow_not_yet_open",
        "message": "Voice donor flow ships in Phase 9. See spec §9.",
    }), 501


@bp.get("/donations")
def donations():
    return jsonify({"count": 0, "donors": []})


@bp.post("/submit")
def submit_voice():
    """Stage 1: Submit voice recording with consent.

    Body: {
      language_code: "hi",
      donor_name: "Priya",
      donor_email: "priya@example.com",
      donor_phone: "+91-...",
      audio_base64: "...",
      consent_stage1: true
    }

    Returns: {
      ok: true,
      submission_id: "...",
      message: "Voice recorded. Thank you!"
    }
    """
    import base64
    import uuid

    body = request.get_json(silent=True) or {}
    lang = (body.get("language_code") or "").strip()
    name = (body.get("donor_name") or "").strip()
    email = (body.get("donor_email") or "").strip()
    phone = (body.get("donor_phone") or "").strip()
    audio_b64 = (body.get("audio_base64") or "").strip()
    consent = body.get("consent_stage1", False)

    if not all([lang, name, email, audio_b64, consent]):
        return jsonify({
            "ok": False,
            "error": "missing_required_fields",
        }), 400

    if lang not in languages.BY_CODE:
        return jsonify({
            "ok": False,
            "error": "unknown_language",
        }), 400

    try:
        audio_bytes = base64.b64decode(audio_b64)
    except Exception:
        return jsonify({
            "ok": False,
            "error": "invalid_audio_encoding",
        }), 400

    if len(audio_bytes) > 50 * 1024 * 1024:  # 50 MB max
        return jsonify({
            "ok": False,
            "error": "audio_too_large",
            "max_bytes": 50 * 1024 * 1024,
        }), 413

    import hashlib
    audio_sha256 = hashlib.sha256(audio_bytes).hexdigest()
    submission_id = str(uuid.uuid4())

    # TODO: Upload to TeraBox/MEGA
    audio_storage_url = f"https://chitti-internal/submissions/{submission_id}"

    if not ledger.create_submission(
        submission_id=submission_id,
        language_code=lang,
        donor_name=name,
        donor_email=email,
        donor_phone=phone,
        audio_sha256=audio_sha256,
        audio_duration_s=len(audio_bytes) / 48000.0,  # rough estimate
        audio_storage_url=audio_storage_url,
    ):
        return jsonify({
            "ok": False,
            "error": "submission_failed",
        }), 500

    return jsonify({
        "ok": True,
        "submission_id": submission_id,
        "message": f"Thank you, {name}! Your voice has been recorded.",
        "next_step": f"/voice_confirmation.html?submission_id={submission_id}",
    }), 201


@bp.get("/hall-of-fame")
def hall_of_fame():
    """Public Hall of Fame — all winners across all languages."""
    winners = ledger.get_winners()
    by_lang = {}
    for w in winners:
        lang = w["language_code"]
        if lang not in by_lang:
            by_lang[lang] = []
        by_lang[lang].append({
            "winner_id": w["winner_id"],
            "donor_name": w["donor_name"],
            "donor_photo_url": w["donor_photo_url"],
            "language_code": w["language_code"],
            "created_at": w["created_at"],
        })

    return jsonify({
        "ok": True,
        "total_winners": len(winners),
        "languages_represented": len(by_lang),
        "winners_by_language": by_lang,
        "all_winners": [
            {
                "winner_id": w["winner_id"],
                "donor_name": w["donor_name"],
                "donor_photo_url": w["donor_photo_url"],
                "language_code": w["language_code"],
                "created_at": w["created_at"],
            }
            for w in winners
        ],
    })
