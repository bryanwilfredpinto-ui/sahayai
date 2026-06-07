"""Vector store — ChromaDB (primary, persistent, local) with a pure-python fallback.

Same tiny API either way:
  add(ids, embeddings, documents, metadatas)
  query(embedding, k) -> list[ {document, metadata, score} ]  (score = cosine, higher better)
  count() -> int
  reset()

ChromaDB is lazy-imported (heavy). When absent, a JSONL cosine store at
`rag/index/fallback.jsonl` keeps the same contract working offline + in tests.
"""
from __future__ import annotations

import json
import logging
import math
from pathlib import Path

from . import config

log = logging.getLogger("legal_rag.store")


class _FallbackStore:
    backend = "jsonl-fallback"

    def __init__(self) -> None:
        config.INDEX_DIR.mkdir(parents=True, exist_ok=True)
        self.path = config.INDEX_DIR / "fallback.jsonl"
        self._rows: list[dict] = []
        if self.path.exists():
            for line in self.path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line:
                    self._rows.append(json.loads(line))

    def reset(self) -> None:
        self._rows = []
        if self.path.exists():
            self.path.unlink()

    def add(self, ids, embeddings, documents, metadatas) -> None:
        for i, emb, doc, meta in zip(ids, embeddings, documents, metadatas):
            self._rows.append({"id": i, "v": emb, "document": doc, "metadata": meta})
        with self.path.open("w", encoding="utf-8") as f:
            for r in self._rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    def count(self) -> int:
        return len(self._rows)

    def query(self, embedding, k: int):
        out = []
        for r in self._rows:
            v = r["v"]
            # vectors are L2-normalised at embed time → cosine == dot product
            score = sum(a * b for a, b in zip(embedding, v))
            out.append({"document": r["document"], "metadata": r["metadata"], "score": float(score)})
        out.sort(key=lambda x: x["score"], reverse=True)
        return out[:k]


class _ChromaStore:
    backend = "chromadb"

    def __init__(self, client, collection) -> None:
        self._c = client
        self._col = collection

    def reset(self) -> None:
        try:
            self._c.delete_collection(config.COLLECTION)
        except Exception:  # noqa: BLE001
            pass
        self._col = self._c.get_or_create_collection(
            config.COLLECTION, metadata={"hnsw:space": "cosine"})

    def add(self, ids, embeddings, documents, metadatas) -> None:
        self._col.add(ids=list(ids), embeddings=list(embeddings),
                      documents=list(documents), metadatas=list(metadatas))

    def count(self) -> int:
        return self._col.count()

    def query(self, embedding, k: int):
        res = self._col.query(query_embeddings=[embedding], n_results=k,
                              include=["documents", "metadatas", "distances"])
        out = []
        docs = (res.get("documents") or [[]])[0]
        metas = (res.get("metadatas") or [[]])[0]
        dists = (res.get("distances") or [[]])[0]
        for doc, meta, dist in zip(docs, metas, dists):
            # chroma cosine distance = 1 - cosine_similarity
            out.append({"document": doc, "metadata": meta, "score": float(1.0 - dist)})
        return out


_cached = None


def get_store(force_fallback: bool = False):
    global _cached
    if _cached is not None and not force_fallback:
        return _cached
    if not force_fallback:
        try:
            import chromadb  # lazy (heavy)
            client = chromadb.PersistentClient(path=str(config.INDEX_DIR))
            col = client.get_or_create_collection(
                config.COLLECTION, metadata={"hnsw:space": "cosine"})
            store = _ChromaStore(client, col)
            log.info("RAG store: ChromaDB @ %s (%d chunks)", config.INDEX_DIR, store.count())
            _cached = store
            return store
        except Exception as e:  # noqa: BLE001
            log.warning("ChromaDB unavailable (%s) — using JSONL fallback store. "
                        "Install requirements-optional.txt for ChromaDB.", type(e).__name__)
    fb = _FallbackStore()
    if not force_fallback:
        _cached = fb
    return fb
