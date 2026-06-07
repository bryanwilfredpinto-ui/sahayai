"""RAG configuration — paths, model, thresholds. All overridable via env."""
from __future__ import annotations
import os
from pathlib import Path

RAG_DIR = Path(__file__).resolve().parent
CORPUS_DIR = Path(os.environ.get("LEGAL_RAG_CORPUS", str(RAG_DIR / "corpus")))   # source docs (.md/.txt/.pdf)
INDEX_DIR = Path(os.environ.get("LEGAL_RAG_INDEX", str(RAG_DIR / "index")))      # persisted vector store
COLLECTION = os.environ.get("LEGAL_RAG_COLLECTION", "chitti_legal_official")

# sentence-transformers model (free, local, ~80 MB). Override for a bigger model.
EMBED_MODEL = os.environ.get("LEGAL_RAG_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Chunking — legal Acts are long; slightly larger windows keep a section together.
CHUNK_CHARS = int(os.environ.get("LEGAL_RAG_CHUNK_CHARS", "1100"))
CHUNK_OVERLAP = int(os.environ.get("LEGAL_RAG_CHUNK_OVERLAP", "180"))

# Retrieval
TOP_K = int(os.environ.get("LEGAL_RAG_TOP_K", "5"))
# Minimum cosine similarity for a chunk to count as "relevant". Below this for the
# BEST chunk → we refuse ("I cannot find this in official legal texts"). Tuned per
# embedder: sentence-transformers is semantic (higher floor); the pure-python
# fallback is lexical (lower floor). The active embedder reports its own floor.
MIN_SCORE_SBERT = float(os.environ.get("LEGAL_RAG_MIN_SCORE", "0.30"))
# The lexical fallback is noisy (char-trigram overlap), so its floor is HIGHER than
# the semantic model's: in a legal product, over-refusing is safe, under-refusing
# (answering off-context = hallucination) is not. Measured separation on the official
# corpus: in-corpus queries ~0.35–0.47, off-topic ~0.17–0.30 → floor 0.33.
MIN_SCORE_FALLBACK = float(os.environ.get("LEGAL_RAG_MIN_SCORE_FALLBACK", "0.33"))
