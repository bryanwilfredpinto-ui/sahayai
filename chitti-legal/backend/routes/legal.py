"""HTTP routes for /api/legal/*."""

from flask import Blueprint, jsonify, request

from services import legal_service


bp = Blueprint("legal", __name__, url_prefix="/api/legal")


@bp.get("/health")
def health():
    return jsonify(legal_service.health())


@bp.post("/explain")
def explain():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    language = (body.get("language") or "en").strip()
    doc_type = (body.get("doc_type") or "").strip() or None
    if not text:
        return jsonify({"ok": False, "error": "missing_text"}), 400
    if len(text) > 8000:
        return jsonify({"ok": False, "error": "text_too_long", "max_chars": 8000}), 413
    return jsonify(legal_service.explain(text, language=language, doc_type=doc_type))


@bp.post("/explain-notice")
def explain_notice():
    """
    P0 (2026-05-13) — structured plain-language explainer for a legal NOTICE.
    Returns the same disclaimer-wrapped reply plus a `structured` payload:
      summary, spoken_summary, deadline_phrase, response_days, urgent,
      act_section, what_to_do_next[], lawyer_cta.
    Frontend renders symbol + word labels per the four-user contract.
    """
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    language = (body.get("language") or "en").strip()
    if not text:
        return jsonify({"ok": False, "error": "missing_text"}), 400
    if len(text) > 8000:
        return jsonify({"ok": False, "error": "text_too_long", "max_chars": 8000}), 413
    return jsonify(legal_service.explain_notice(text, language=language))
