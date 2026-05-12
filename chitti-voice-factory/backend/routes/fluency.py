"""
routes/fluency.py — /api/voice/fluency/* endpoints.

Surfaces the textbook + Wikipedia fluency corpus to Chitti language pages.
This is the FLUENCY side (grammar, vocabulary, sentence patterns).
PRONUNCIATION is owned by /api/voice/speak (Bhashini cascade), and is independent.
"""
from __future__ import annotations

import logging

from flask import Blueprint, abort, jsonify, request

from datetime import datetime, timezone

from services import fluency_corpus, youtube_learner
from services.fluency_corpus import Chunk
from services.languages import get_language
from services.textbook_sources import get_sources
from services.youtube_learner import (
    MAX_VIDEOS_PER_LANG,
    YouTubeProcessingError,
)

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


# ── YouTube video learning ──

def _err(code: int, error: str, detail: str = ""):
    return jsonify({"ok": False, "error": error, "detail": detail}), code


@bp.get("/<lang>/videos")
def videos_list(lang: str):
    """List YouTube videos a user has added for this language."""
    if not get_language(lang):
        abort(404, description="unknown_language")
    lang_dir = fluency_corpus.lang_dir(lang)
    videos = youtube_learner.load_videos(lang_dir)
    return jsonify({
        "language": lang,
        "videos": [v.to_dict() for v in videos],
        "max_videos": MAX_VIDEOS_PER_LANG,
        "count": len(videos),
    })


@bp.post("/<lang>/videos")
def videos_add(lang: str):
    """Add a YouTube URL to the language's video queue."""
    if not get_language(lang):
        abort(404, description="unknown_language")
    body = request.get_json(silent=True) or {}
    url = (body.get("url") or "").strip()
    if not url:
        return _err(400, "url_required")
    lang_dir = fluency_corpus.lang_dir(lang)
    try:
        record, all_videos = youtube_learner.add_video(lang_dir, url)
    except YouTubeProcessingError as e:
        return _err(400, e.code, e.detail)
    return jsonify({
        "ok": True,
        "video": record.to_dict(),
        "count": len(all_videos),
        "max_videos": MAX_VIDEOS_PER_LANG,
    })


@bp.delete("/<lang>/videos/<video_id>")
def videos_remove(lang: str, video_id: str):
    """Remove a queued or processed video (does NOT delete chunks)."""
    if not get_language(lang):
        abort(404, description="unknown_language")
    lang_dir = fluency_corpus.lang_dir(lang)
    remaining = youtube_learner.remove_video(lang_dir, video_id)
    return jsonify({"ok": True, "remaining": len(remaining)})


@bp.post("/<lang>/videos/process")
def videos_process(lang: str):
    """
    Process all queued (unprocessed) videos for this language:
      - fetch transcript (preferring this lang's track; falling back to
        auto-generated / translated)
      - chunk it
      - append to chunks.jsonl with textbook_source="community",
        source="youtube:<video_id>"
      - record outcomes in videos.json
    Embedding rebuild is OPTIONAL (?embed=1) since it is the slow step.
    """
    if not get_language(lang):
        abort(404, description="unknown_language")
    lang_dir = fluency_corpus.lang_dir(lang)
    videos = youtube_learner.load_videos(lang_dir)
    if not videos:
        return jsonify({"ok": True, "processed": 0, "skipped": 0, "errors": 0,
                        "note": "no videos queued"})

    do_embed = request.args.get("embed", "0").lower() in ("1", "true", "yes")
    base_id = len(fluency_corpus.read_chunks(lang))  # numeric id offset
    processed = 0
    errors = 0
    skipped = 0
    total_new_chunks = 0

    for video in videos:
        if video.processed_at and not video.error:
            skipped += 1
            continue
        try:
            text, auto_gen = youtube_learner.fetch_transcript(
                video.video_id, preferred_lang=lang
            )
        except YouTubeProcessingError as e:
            video.error = str(e)
            video.processed_at = datetime.now(timezone.utc).isoformat()
            errors += 1
            continue

        # Chunk and append
        from services.fluency_ingester import chunk_text  # local import
        pieces = chunk_text(text)
        chunks_to_append: list[Chunk] = []
        for i, piece in enumerate(pieces):
            chunks_to_append.append(Chunk(
                id=f"{lang}_yt_{video.video_id}_{i}",
                text=piece,
                source=f"youtube:{video.video_id}",
                language=lang,
                subject="YouTube user-added",
                textbook_source="community",
            ))
        appended = fluency_corpus.append_chunks(lang, chunks_to_append)
        total_new_chunks += appended

        video.error = None
        video.auto_generated = auto_gen
        video.transcript_chars = len(text)
        video.transcript_chunks = appended
        video.processed_at = datetime.now(timezone.utc).isoformat()
        processed += 1

    youtube_learner.save_videos(lang_dir, videos)

    embed_status: dict | None = None
    if do_embed and total_new_chunks > 0:
        n, ok = fluency_corpus.build_embeddings(lang)
        faiss_ok = fluency_corpus.build_faiss_index(lang) if ok else False
        embed_status = {"embedded": ok, "faiss_indexed": faiss_ok, "chunks": n}

    return jsonify({
        "ok": True,
        "processed": processed,
        "skipped": skipped,
        "errors": errors,
        "new_chunks": total_new_chunks,
        "embed": embed_status,
        "videos": [v.to_dict() for v in videos],
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
