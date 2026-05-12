"""
routes/fluency.py — /api/voice/fluency/* endpoints.

Surfaces the textbook + Wikipedia fluency corpus to Chitti language pages.
This is the FLUENCY side (grammar, vocabulary, sentence patterns).
PRONUNCIATION is owned by /api/voice/speak (Bhashini cascade), and is independent.
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request

from services import fluency_corpus
from services.languages import get_language
from services.textbook_sources import get_sources

log = logging.getLogger("routes.fluency")

bp = Blueprint("fluency", __name__, url_prefix="/api/voice/fluency")


@bp.get("/status")
def status_all():
    """Aggregate honest status for every language with ingested data."""
    return jsonify({
        "languages": fluency_corpus.summary_all(),
        "note": "fluency_ready=true requires chunks>=50 AND embeddings on disk.",
    })


@bp.get("/status/<lang>")
def status_one(lang: str):
    if not get_language(lang):
        abort(404, description="unknown_language")
    s = fluency_corpus.read_status(lang)
    src = get_sources(lang)
    return jsonify({
        "language": lang,
        "status": s or {"chunks_ingested": 0, "fluency_ready": False,
                        "notes": "not ingested yet"},
        "source_plan": {
            "ncert_pdf_urls": len(src.ncert_pdfs) if src else 0,
            "wikipedia_lang": src.wikipedia_lang if src else None,
            "cousin": src.cousin if src else None,
            "notes": src.notes if src else "",
        },
    })


@bp.get("/search/<lang>")
def search(lang: str):
    if not get_language(lang):
        abort(404, description="unknown_language")
    q = (request.args.get("q") or "").strip()
    if not q:
        abort(400, description="q query parameter is required")
    try:
        k = max(1, min(int(request.args.get("k", "5")), 20))
    except ValueError:
        k = 5
    results = fluency_corpus.search(lang, q, k=k)
    return jsonify({
        "language": lang,
        "query": q,
        "k": k,
        "results": results,
    })


@bp.get("/chunks/<lang>")
def chunks(lang: str):
    """Paginated view of the corpus for inspection / debugging."""
    if not get_language(lang):
        abort(404, description="unknown_language")
    try:
        offset = max(0, int(request.args.get("offset", "0")))
        limit = max(1, min(int(request.args.get("limit", "20")), 200))
    except ValueError:
        offset, limit = 0, 20
    all_chunks = fluency_corpus.read_chunks(lang)
    page = all_chunks[offset:offset + limit]
    return jsonify({
        "language": lang,
        "total": len(all_chunks),
        "offset": offset,
        "limit": limit,
        "chunks": [
            {
                "id": c.id,
                "text": c.text,
                "source": c.source,
                "grade": c.grade,
                "subject": c.subject,
                "char_count": c.char_count,
            }
            for c in page
        ],
    })
