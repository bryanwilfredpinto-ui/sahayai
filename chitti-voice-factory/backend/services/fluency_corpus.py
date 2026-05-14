"""
services/fluency_corpus.py — Per-language fluency corpus + vector index.

Stores textbook-derived chunks for each of the 26 Chitti languages.
FLUENCY (grammar, vocabulary, sentence patterns) is independent of PRONUNCIATION
(Bhashini/donor voice). Both feed the language-specific Chitti page, but this
module owns ONLY the fluency side.

Layout (per language):
    data/fluency/<lang>/
        _pdfs/                  raw downloaded textbook PDFs
        chunks.jsonl            extracted text chunks {id, text, source, language, grade, subject}
        embeddings.npy          float32 numpy array, rows aligned with chunks.jsonl
        index.faiss             optional FAISS IndexFlatIP (when faiss-cpu installed)
        honest_status.json      what actually got ingested vs. what failed
"""
from __future__ import annotations

import json
import logging
import os
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

log = logging.getLogger("fluency_corpus")

# ── Optional backends (LAZY) ──
# numpy / faiss / sentence-transformers all live in requirements-optional.txt
# and are imported on first use, not at module-load. This keeps Render
# free-tier cold-start fast (no PyTorch import on /health) and means a
# missing dep returns an honest 503 instead of crashing gunicorn.
HAS_NUMPY: Optional[bool] = None       # tri-state: None = not probed yet
HAS_FAISS: Optional[bool] = None
HAS_ST: Optional[bool] = None
_np = None                             # populated by _load_numpy()
_faiss = None                          # populated by _load_faiss()
_SentenceTransformerCls = None         # populated by _load_st()


def _load_numpy():
    global HAS_NUMPY, _np
    if HAS_NUMPY is None:
        try:
            import numpy as _imported_np
            _np = _imported_np
            HAS_NUMPY = True
        except ImportError:
            HAS_NUMPY = False
            log.warning("numpy not available — fluency search/embeddings disabled")
    return _np if HAS_NUMPY else None


def _load_faiss():
    global HAS_FAISS, _faiss
    if HAS_FAISS is None:
        try:
            import faiss as _imported_faiss  # type: ignore
            _faiss = _imported_faiss
            HAS_FAISS = True
        except ImportError:
            HAS_FAISS = False
            log.warning("faiss not available — falling back to numpy cosine search")
    return _faiss if HAS_FAISS else None


def _load_st():
    global HAS_ST, _SentenceTransformerCls
    if HAS_ST is None:
        try:
            from sentence_transformers import SentenceTransformer as _ST  # type: ignore
            _SentenceTransformerCls = _ST
            HAS_ST = True
        except ImportError:
            HAS_ST = False
            log.warning("sentence-transformers not available — embeddings disabled")
    return _SentenceTransformerCls if HAS_ST else None


# ── Paths ──
DATA_ROOT = Path(__file__).resolve().parent.parent / "data" / "fluency"
DATA_ROOT.mkdir(parents=True, exist_ok=True)

# Multilingual model that covers all 22 scheduled Indian languages.
EMBEDDING_MODEL_NAME = os.environ.get(
    "CHITTI_FLUENCY_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)

_MODEL: Optional["SentenceTransformer"] = None
_MODEL_LOCK = threading.Lock()


def get_embedder():
    """Lazy-load the multilingual sentence-transformer (single global instance).

    Returns None if sentence-transformers isn't installed — callers must
    handle this honestly (return 503, fall back to chunk slice, etc.).
    The dep + ~500 MB PyTorch download only land when this function is
    actually called, so /health stays fast on cold start.
    """
    global _MODEL
    ST = _load_st()
    if ST is None:
        return None
    if _MODEL is None:
        with _MODEL_LOCK:
            if _MODEL is None:
                log.info("Loading multilingual embedding model: %s", EMBEDDING_MODEL_NAME)
                _MODEL = ST(EMBEDDING_MODEL_NAME)
    return _MODEL


@dataclass
class Chunk:
    id: str
    text: str
    source: str
    language: str
    grade: Optional[str] = None
    subject: Optional[str] = None
    char_count: int = 0
    textbook_source: str = "community"   # one of: curriculum, community, cousin
    # curriculum = real textbook (NCERT/state board)
    # community = open corpus in the target language (Wikipedia, UDHR, etc.)
    # cousin    = borrowed chunk from a related language


@dataclass
class CorpusStatus:
    language: str
    chunks: int = 0
    pdfs_downloaded: int = 0
    pdfs_failed: int = 0
    embedded: bool = False
    faiss_indexed: bool = False
    sources: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    last_updated: Optional[str] = None
    fluency_ready: bool = False
    notes: str = ""

    def to_dict(self) -> dict:
        return {
            "language": self.language,
            "chunks_ingested": self.chunks,
            "pdfs_downloaded": self.pdfs_downloaded,
            "pdfs_failed": self.pdfs_failed,
            "embedded": self.embedded,
            "faiss_indexed": self.faiss_indexed,
            "sources": self.sources,
            "errors": self.errors[:20],
            "last_updated": self.last_updated,
            "fluency_ready": self.fluency_ready,
            "notes": self.notes,
        }


def lang_dir(lang: str) -> Path:
    d = DATA_ROOT / lang
    d.mkdir(parents=True, exist_ok=True)
    (d / "_pdfs").mkdir(exist_ok=True)
    return d


def chunks_path(lang: str) -> Path:
    return lang_dir(lang) / "chunks.jsonl"


def embeddings_path(lang: str) -> Path:
    return lang_dir(lang) / "embeddings.npy"


def faiss_path(lang: str) -> Path:
    return lang_dir(lang) / "index.faiss"


def status_path(lang: str) -> Path:
    return lang_dir(lang) / "honest_status.json"


def _serialise_chunk(c: Chunk) -> str:
    return json.dumps({
        "id": c.id,
        "text": c.text,
        "textbook_source": c.textbook_source,
        "source": c.source,
        "language": c.language,
        "grade": c.grade,
        "subject": c.subject,
        "char_count": c.char_count or len(c.text),
    }, ensure_ascii=False)


def append_chunks(lang: str, chunks: Iterable[Chunk]) -> int:
    """Append chunks to chunks.jsonl without rewriting existing rows.
    Returns count appended. Used by the YouTube learner so user-added videos
    don't trigger a full corpus rewrite."""
    p = chunks_path(lang)
    n = 0
    with p.open("a", encoding="utf-8") as f:
        for c in chunks:
            f.write(_serialise_chunk(c) + "\n")
            n += 1
    return n


def write_chunks(lang: str, chunks: Iterable[Chunk]) -> int:
    """Overwrite chunks.jsonl. Returns count written."""
    p = chunks_path(lang)
    n = 0
    with p.open("w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps({
                "id": c.id,
                "text": c.text,
                "textbook_source": c.textbook_source,
                "source": c.source,
                "language": c.language,
                "grade": c.grade,
                "subject": c.subject,
                "char_count": c.char_count or len(c.text),
            }, ensure_ascii=False) + "\n")
            n += 1
    return n


def read_chunks(lang: str) -> list[Chunk]:
    p = chunks_path(lang)
    if not p.exists():
        return []
    out: list[Chunk] = []
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            out.append(Chunk(
                id=d["id"],
                text=d["text"],
                source=d.get("source", ""),
                language=d.get("language", lang),
                grade=d.get("grade"),
                subject=d.get("subject"),
                char_count=d.get("char_count", len(d["text"])),
                textbook_source=d.get("textbook_source", "community"),
            ))
    return out


def build_embeddings(lang: str, batch_size: int = 64) -> tuple[int, bool]:
    """
    Read chunks.jsonl, generate embeddings, save embeddings.npy.
    Returns (num_embedded, ok). Returns (0, False) honestly when
    sentence-transformers / numpy aren't installed.
    """
    embedder = get_embedder()
    np_mod = _load_numpy()
    if embedder is None or np_mod is None:
        log.warning("[%s] no embedder/numpy available — skipping embedding step", lang)
        return 0, False
    chunks = read_chunks(lang)
    if not chunks:
        return 0, False
    texts = [c.text for c in chunks]
    log.info("[%s] embedding %d chunks...", lang, len(texts))
    vecs = embedder.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,  # cosine via inner-product
    ).astype("float32")
    np_mod.save(embeddings_path(lang), vecs)
    log.info("[%s] wrote embeddings: shape=%s", lang, vecs.shape)
    return len(chunks), True


def build_faiss_index(lang: str) -> bool:
    """Build a FAISS IndexFlatIP from embeddings.npy. Returns True if written.

    Honest no-op when faiss or numpy aren't installed.
    """
    faiss_mod = _load_faiss()
    np_mod = _load_numpy()
    if faiss_mod is None or np_mod is None:
        return False
    ep = embeddings_path(lang)
    if not ep.exists():
        return False
    vecs = np_mod.load(ep)
    if vecs.size == 0:
        return False
    dim = vecs.shape[1]
    index = faiss_mod.IndexFlatIP(dim)
    index.add(vecs)
    faiss_mod.write_index(index, str(faiss_path(lang)))
    log.info("[%s] wrote FAISS index: %d vectors, dim=%d", lang, vecs.shape[0], dim)
    return True


def write_status(lang: str, status: CorpusStatus) -> None:
    status.last_updated = datetime.now(timezone.utc).isoformat()
    with status_path(lang).open("w", encoding="utf-8") as f:
        json.dump(status.to_dict(), f, ensure_ascii=False, indent=2)


def read_status(lang: str) -> Optional[dict]:
    p = status_path(lang)
    if not p.exists():
        return None
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def search(lang: str, query: str, k: int = 5) -> list[dict]:
    """
    Top-k similarity search over the language's corpus.
    Uses FAISS when available, else numpy cosine.
    Returns list of {chunk_id, text, score, source, grade, subject}.

    When sentence-transformers / numpy aren't installed (e.g. on the
    free-tier dyno that ships without `requirements-optional.txt`), this
    honestly returns the first `k` chunks with `score=None` so the
    endpoint stays useful (the language page can still surface excerpt
    text). Hard failure is reserved for the explicit embed-pass.
    """
    chunks = read_chunks(lang)
    if not chunks:
        return []
    embedder = get_embedder()
    np_mod = _load_numpy()
    if embedder is None or np_mod is None:
        return [
            {"chunk_id": c.id, "text": c.text, "score": None, "source": c.source,
             "grade": c.grade, "subject": c.subject}
            for c in chunks[:k]
        ]

    q_vec = embedder.encode([query], normalize_embeddings=True, convert_to_numpy=True).astype("float32")

    faiss_mod = _load_faiss()
    if faiss_mod is not None and faiss_path(lang).exists():
        index = faiss_mod.read_index(str(faiss_path(lang)))
        scores, ids = index.search(q_vec, k)
        ids = ids[0].tolist()
        scores = scores[0].tolist()
    else:
        ep = embeddings_path(lang)
        if not ep.exists():
            return []
        vecs = np_mod.load(ep)
        sims = (vecs @ q_vec.T).ravel()
        ids = np_mod.argsort(-sims)[:k].tolist()
        scores = [float(sims[i]) for i in ids]

    out = []
    for i, score in zip(ids, scores):
        if 0 <= i < len(chunks):
            c = chunks[i]
            out.append({
                "chunk_id": c.id,
                "text": c.text,
                "score": float(score) if score is not None else None,
                "source": c.source,
                "grade": c.grade,
                "subject": c.subject,
            })
    return out


def summary_all() -> dict:
    """Aggregate honest status across all 26 languages (whatever has been ingested)."""
    out = {}
    if not DATA_ROOT.exists():
        return out
    for d in sorted(DATA_ROOT.iterdir()):
        if not d.is_dir():
            continue
        s = read_status(d.name)
        if s:
            out[d.name] = s
    return out
