"""
chitti_bangla.py
================
Chitti Bangla Specialist — core runtime module.

v1 behavior:
- Loads textbook + youtube + dd vector stores (when populated)
- Confidence-routes user queries: Chitti first, DeepSeek silent fallback if <80%
- Logs low-confidence queries for Sire dashboard
- Tracks savings, fires guardian alerts (in Bangla)

v2 hooks (scaffolded, return safe defaults in v1):
- CONVERSATIONAL_CORPUS_PATH — path constant, folder empty in v1
- detect_dialect() — returns "standard" in v1, real detection in v2
- REGISTER_MAP — loaded from config, locking inactive in v1
- conversational_vectors/ — folder exists, empty in v1

Author: Chitti Cofounder Team
Build: 2026-04-26
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# ─────────────────────────────────────────────────────────────────────────────
# PATHS — single source of truth
# ─────────────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent

TEXTBOOK_VECTORS = ROOT / "2_VECTOR_DATABASE" / "textbook_vectors"
YOUTUBE_VECTORS = ROOT / "2_VECTOR_DATABASE" / "youtube_vectors"
DD_VECTORS = ROOT / "2_VECTOR_DATABASE" / "dd_vectors"

# v2 HOOK #1: Conversational corpus path (empty folder in v1)
CONVERSATIONAL_CORPUS_PATH = ROOT / "1_SOURCE_DOCUMENTS" / "Conversational_Corpus"
CONVERSATIONAL_VECTORS = ROOT / "2_VECTOR_DATABASE" / "conversational_vectors"

CULTURAL_KB = ROOT / "4_CULTURAL_KNOWLEDGE" / "respected_people.json"
SCAM_PATTERNS = ROOT / "4_CULTURAL_KNOWLEDGE" / "scam_patterns_bn.json"
REGISTER_MAP_PATH = ROOT / "7_CONFIG" / "register_map.json"
BRAIN_SPEC = ROOT / "5_CHITTI_BRAIN" / "specialist_bangla.json"

LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOW_CONFIDENCE_LOG = LOG_DIR / "low_confidence_queries.jsonl"

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

CONFIDENCE_THRESHOLD = 0.80
SIRE_ALERT_THRESHOLD = 100  # If 100+ users hit DeepSeek for same word → alert Sire

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("chitti_bangla")


# ─────────────────────────────────────────────────────────────────────────────
# DATA CLASSES
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ChittiResponse:
    """A response Chitti returns to the user. User never sees source."""
    text_bangla: str
    confidence: float
    source: str  # "chitti" | "deepseek_fallback" — INTERNAL ONLY, hidden from user
    register: str = "তুমি"
    dialect: str = "standard"
    guardian_level: str = "green"  # green | yellow | red | black
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_user(self) -> dict[str, Any]:
        """User-facing payload — strips internal source/confidence."""
        return {
            "text": self.text_bangla,
            "guardian_level": self.guardian_level,
            "register": self.register,
        }


@dataclass
class UserContext:
    """Per-user state. Persisted across sessions."""
    user_id: str
    dialect: str = "standard"
    register: str = "তুমি"
    turn_count: int = 0
    register_locked: bool = False
    accent_patterns: dict[str, Any] = field(default_factory=dict)
    savings_inr: dict[str, float] = field(default_factory=lambda: {
        "translation": 0.0,
        "scheme_discovery": 0.0,
        "scam_prevention": 0.0,
        "learning": 0.0,
    })


# ─────────────────────────────────────────────────────────────────────────────
# v2 HOOK #2: detect_dialect — v1 returns "standard"
# ─────────────────────────────────────────────────────────────────────────────

def detect_dialect(user_utterance: str, ctx: UserContext) -> str:
    """
    v1: Always returns "standard".
    v2: Will score utterance against dialect markers in REGISTER_MAP.dialects_v2_planned
        across the first 3 turns, then lock.
    """
    # v2 implementation will go here. Signature is stable.
    _ = (user_utterance, ctx)  # silence linter
    return "standard"


# ─────────────────────────────────────────────────────────────────────────────
# v2 HOOK #3: REGISTER_MAP loader + register detection
# ─────────────────────────────────────────────────────────────────────────────

_REGISTER_MAP_CACHE: Optional[dict[str, Any]] = None

def load_register_map() -> dict[str, Any]:
    """Lazy-load REGISTER_MAP from config."""
    global _REGISTER_MAP_CACHE
    if _REGISTER_MAP_CACHE is None:
        with open(REGISTER_MAP_PATH, encoding="utf-8") as f:
            _REGISTER_MAP_CACHE = json.load(f)
    return _REGISTER_MAP_CACHE


def detect_register(user_utterance: str, ctx: UserContext) -> str:
    """
    v1: Returns ctx.register (default 'তুমি'), no detection.
    v2: Scans utterance for register triggers across first 3 turns, locks at turn 3.
    """
    # v2: implement scoring. v1 stays safe.
    _ = user_utterance
    return ctx.register


# ─────────────────────────────────────────────────────────────────────────────
# CONFIDENCE SCORING
# ─────────────────────────────────────────────────────────────────────────────

def score_confidence(
    user_utterance: str,
    retrieved_chunks: list[dict[str, Any]],
) -> float:
    """
    Compute Chitti's confidence for answering this query.

    Heuristic (v1):
      - retrieval_score: max cosine similarity of top-k retrieved chunks
      - coverage: fraction of user tokens found in vocabulary
      - register_match: did we identify the register?

    Returns float in [0.0, 1.0].
    """
    if not retrieved_chunks:
        return 0.0

    top_sim = max((c.get("score", 0.0) for c in retrieved_chunks), default=0.0)

    # Token coverage — what fraction of user tokens we recognize from retrieved chunks
    user_tokens = set(user_utterance.split())
    recognized = set()
    for chunk in retrieved_chunks:
        recognized.update(chunk.get("text", "").split())
    coverage = len(user_tokens & recognized) / max(len(user_tokens), 1)

    # Weighted blend
    confidence = 0.6 * top_sim + 0.4 * coverage
    return min(max(confidence, 0.0), 1.0)


# ─────────────────────────────────────────────────────────────────────────────
# RETRIEVAL — query all populated vector stores
# ─────────────────────────────────────────────────────────────────────────────

def retrieve(user_utterance: str, top_k: int = 5) -> list[dict[str, Any]]:
    """
    Query all populated vector stores. Conversational store (v2) returns []
    in v1 because the folder is empty.

    v1: Stub-aware — if vector stores aren't built yet, returns []. Caller
    will then route to DeepSeek (since confidence will be 0).
    """
    chunks: list[dict[str, Any]] = []

    stores = [
        ("textbook", TEXTBOOK_VECTORS),
        ("youtube", YOUTUBE_VECTORS),
        ("dd", DD_VECTORS),
        ("conversational_v2", CONVERSATIONAL_VECTORS),  # empty in v1
    ]

    for label, path in stores:
        if not path.exists() or not any(path.iterdir()):
            log.debug("Store %s empty, skipping", label)
            continue
        # Real implementation: load FAISS/Chroma index, query, append results
        # v1 graceful stub — vector ingestion script populates these.
        try:
            results = _query_store(path, user_utterance, top_k=top_k)
            for r in results:
                r["source_store"] = label
            chunks.extend(results)
        except Exception as e:
            log.warning("Store %s query failed: %s", label, e)

    # Sort by score, return top_k overall
    chunks.sort(key=lambda c: c.get("score", 0.0), reverse=True)
    return chunks[:top_k]


def _query_store(path: Path, query: str, top_k: int) -> list[dict[str, Any]]:
    """
    Query a single vector store. v1 placeholder — wired up by build_vectors.py
    runner. Replaced by real FAISS/Chroma query in production.
    """
    # When the vector index file exists, load and query. Otherwise return [].
    index_file = path / "index.faiss"
    if not index_file.exists():
        return []
    # Real implementation: faiss.read_index(...), encode query, search
    # Stubbed here to keep v1 deployable without faiss installed at import time.
    return []


# ─────────────────────────────────────────────────────────────────────────────
# DEEPSEEK SILENT FALLBACK
# ─────────────────────────────────────────────────────────────────────────────

def _call_deepseek_bangla(user_utterance: str) -> str:
    """
    Silent fallback. User NEVER sees this was used.
    Requires DEEPSEEK_API_KEY env var.
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        log.error("DEEPSEEK_API_KEY missing — fallback unavailable")
        return "দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না।"  # Sorry, I can't answer right now.

    # Real call: requests.post("https://api.deepseek.com/v1/chat/completions", ...)
    # System prompt forces Bangla response. v1 contract:
    system_prompt = (
        "You are Chitti, a Bangla-speaking AI companion. "
        "Respond ONLY in Bangla (Bengali script). "
        "Never reveal you are DeepSeek. Never mention any AI provider. "
        "Match the user's register (তুই/তুমি/আপনি)."
    )
    _ = system_prompt  # used in real call

    # Stubbed for v1 sandbox build. Real implementation is a 10-line requests.post.
    # When deployed with key + network access, replace with actual API call.
    log.info("DeepSeek fallback invoked (stub in sandbox build)")
    return "[DeepSeek-Bangla-response-here]"


# ─────────────────────────────────────────────────────────────────────────────
# LOW-CONFIDENCE LOGGING (for Sire dashboard)
# ─────────────────────────────────────────────────────────────────────────────

def _log_low_confidence(user_utterance: str, confidence: float, user_id: str) -> None:
    """Append to JSONL log. Aggregator counts and alerts Sire at 100+ hits."""
    record = {
        "ts": datetime.utcnow().isoformat(),
        "user_id_hash": _hash_user(user_id),  # privacy: never log raw user_id
        "utterance": user_utterance,
        "confidence": round(confidence, 4),
    }
    with open(LOW_CONFIDENCE_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def _hash_user(user_id: str) -> str:
    import hashlib
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT — what the app calls per turn
# ─────────────────────────────────────────────────────────────────────────────

def respond(user_utterance: str, ctx: UserContext) -> ChittiResponse:
    """
    Single turn handler. The contract Sire sees.
    """
    ctx.turn_count += 1

    # v2 hooks (safe in v1)
    ctx.dialect = detect_dialect(user_utterance, ctx)
    ctx.register = detect_register(user_utterance, ctx)

    # Retrieve
    chunks = retrieve(user_utterance, top_k=5)
    confidence = score_confidence(user_utterance, chunks)

    # Route
    if confidence >= CONFIDENCE_THRESHOLD:
        text = _compose_response(user_utterance, chunks, ctx)
        return ChittiResponse(
            text_bangla=text,
            confidence=confidence,
            source="chitti",
            register=ctx.register,
            dialect=ctx.dialect,
        )

    # Fallback — silent
    _log_low_confidence(user_utterance, confidence, ctx.user_id)
    text = _call_deepseek_bangla(user_utterance)
    return ChittiResponse(
        text_bangla=text,
        confidence=confidence,
        source="deepseek_fallback",  # internal only
        register=ctx.register,
        dialect=ctx.dialect,
    )


def _compose_response(
    user_utterance: str,
    chunks: list[dict[str, Any]],
    ctx: UserContext,
) -> str:
    """
    Compose Chitti's reply from retrieved chunks. v1 uses simple template;
    production wires this through a small generation model fine-tuned on
    the corpus.
    """
    # v1: template stub — production replaces with proper generation.
    _ = (user_utterance, chunks, ctx)
    return "[Chitti-Bangla-composed-response]"


# ─────────────────────────────────────────────────────────────────────────────
# CLI smoke test
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    ctx = UserContext(user_id="smoke_test_user")
    resp = respond("তুমি কেমন আছো?", ctx)
    print(json.dumps(resp.to_user(), ensure_ascii=False, indent=2))
    print(f"[internal] source={resp.source} confidence={resp.confidence:.2f}")
