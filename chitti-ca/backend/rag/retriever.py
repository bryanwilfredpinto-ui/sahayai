"""Retriever — embed the question, fetch top-k official chunks, decide if grounded.

`retrieve(query)` returns:
  { "grounded": bool,
    "results": [ {text, score, doc, source, url, section, page, ref} ],
    "embedder": str, "semantic": bool, "store": str, "min_score": float, "count": int }

`grounded` is False when the corpus is empty OR the best chunk scores below the
active embedder's relevance floor → the caller must refuse:
"I cannot find this in official documents."
"""
from __future__ import annotations

import logging

from . import config
from .embedder import get_embedder
from .store import get_store

log = logging.getLogger("ca_rag.retriever")


def _ref(meta: dict) -> str:
    sec = (meta.get("section") or "").strip()
    page = (meta.get("page") or "").strip()
    doc = meta.get("doc") or meta.get("source") or "official document"
    bits = []
    if sec and sec != "—":
        bits.append(f"Section {sec}")
    if page and page not in ("—", "", "None"):
        bits.append(f"page {page}")
    loc = ", ".join(bits)
    return f"{doc} — {loc}" if loc else doc


def retrieve(query: str, k: int | None = None) -> dict:
    query = (query or "").strip()
    embedder = get_embedder()
    store = get_store()
    count = store.count()
    base = {"embedder": embedder.name, "semantic": embedder.semantic,
            "store": store.backend, "min_score": embedder.min_score, "count": count}
    if not query or count == 0:
        return {"grounded": False, "results": [], **base}

    qv = embedder.embed([query])[0]
    rows = store.query(qv, k or config.TOP_K)
    results = []
    for r in rows:
        meta = r.get("metadata") or {}
        results.append({
            "text": r["document"], "score": round(float(r["score"]), 4),
            "doc": meta.get("doc"), "source": meta.get("source"), "url": meta.get("url"),
            "section": meta.get("section"), "page": meta.get("page"),
            "ref": _ref(meta),
        })
    grounded = bool(results) and results[0]["score"] >= embedder.min_score
    return {"grounded": grounded, "results": results, **base}


def is_grounded(query: str) -> bool:
    return retrieve(query).get("grounded", False)


def rag_status() -> dict:
    """Cheap health/status for /api/ca/rag/health — does NOT embed anything."""
    embedder = get_embedder()
    store = get_store()
    return {
        "ready": store.count() > 0,
        "chunks": store.count(),
        "embedder": embedder.name,
        "semantic": embedder.semantic,
        "store": store.backend,
        "min_score": embedder.min_score,
        "note": ("Semantic RAG ready." if embedder.semantic and store.count()
                 else "Running on the pure-python fallback (install requirements-optional.txt for "
                      "ChromaDB + sentence-transformers) or the corpus is empty (run python -m rag.ingest)."),
    }
