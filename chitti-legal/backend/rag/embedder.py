"""Embedder — sentence-transformers (primary) with an honest pure-python fallback.

`get_embedder()` returns an object with:
  .name        -> str  (e.g. "sentence-transformers/all-MiniLM-L6-v2" or "hashing-fallback-512")
  .semantic    -> bool (True if a real ML model; False for the lexical fallback)
  .min_score   -> float (relevance floor for THIS embedder, from config)
  .embed(texts: list[str]) -> list[list[float]]   (L2-normalised vectors)

The fallback is a deterministic, dependency-free hashing bag-of-words vector. It is
purely LEXICAL (keyword overlap), not semantic — good enough to keep the
retrieve→cite→refuse contract working offline and in tests, and clearly labelled so
no one mistakes it for the real model. Install requirements-optional.txt to get the
real sentence-transformers embeddings in production.
"""
from __future__ import annotations

import hashlib
import logging
import math
import re

from . import config

log = logging.getLogger("legal_rag.embedder")

_TOKEN = re.compile(r"[a-z0-9]+")
# light stoplist so common words don't dominate the lexical fallback
_STOP = {
    "the", "a", "an", "of", "to", "in", "is", "for", "and", "or", "on", "at", "by",
    "be", "as", "it", "this", "that", "with", "from", "are", "was", "i", "you",
    "my", "do", "does", "what", "how", "when", "which", "can", "will", "shall",
}


def _tokens(text: str) -> list[str]:
    return [t for t in _TOKEN.findall((text or "").lower()) if t not in _STOP and len(t) > 1]


class _HashingEmbedder:
    """Deterministic lexical embedder. No deps. Used when sentence-transformers absent."""

    name = "hashing-fallback-512"
    semantic = False
    dim = 512

    def __init__(self) -> None:
        self.min_score = config.MIN_SCORE_FALLBACK

    def _vec(self, text: str) -> list[float]:
        v = [0.0] * self.dim
        toks = _tokens(text)
        if not toks:
            return v
        # sublinear TF + token hashing into 512 buckets (+ char-3gram for robustness)
        from collections import Counter
        tf = Counter(toks)
        for tok, c in tf.items():
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16) % self.dim
            v[h] += 1.0 + math.log(c)
            for i in range(len(tok) - 2):  # char trigrams catch sec/section, art/article, 138
                g = tok[i:i + 3]
                hg = int(hashlib.md5(("#" + g).encode()).hexdigest(), 16) % self.dim
                v[hg] += 0.5
        norm = math.sqrt(sum(x * x for x in v))
        return [x / norm for x in v] if norm else v

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._vec(t) for t in texts]


class _SbertEmbedder:
    semantic = True

    def __init__(self, model) -> None:
        self._m = model
        self.name = config.EMBED_MODEL
        self.min_score = config.MIN_SCORE_SBERT

    def embed(self, texts: list[str]) -> list[list[float]]:
        # normalize_embeddings=True → cosine == dot product
        vecs = self._m.encode(list(texts), normalize_embeddings=True, convert_to_numpy=True)
        return [list(map(float, row)) for row in vecs]


_cached = None


def get_embedder(force_fallback: bool = False):
    """Return the best available embedder, cached. Lazy-imports sentence-transformers."""
    global _cached
    if _cached is not None and not force_fallback:
        return _cached
    if not force_fallback:
        try:
            from sentence_transformers import SentenceTransformer  # lazy (heavy)
            model = SentenceTransformer(config.EMBED_MODEL)
            _cached = _SbertEmbedder(model)
            log.info("RAG embedder: %s (semantic)", _cached.name)
            return _cached
        except Exception as e:  # noqa: BLE001 — honest fallback, never crash the app
            log.warning("sentence-transformers unavailable (%s) — using lexical fallback. "
                        "Install requirements-optional.txt for semantic embeddings.", type(e).__name__)
    fb = _HashingEmbedder()
    if not force_fallback:
        _cached = fb
    return fb
