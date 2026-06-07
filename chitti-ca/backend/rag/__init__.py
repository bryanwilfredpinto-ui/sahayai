"""Chitti CA — Retrieval-Augmented Generation (RAG) over official tax/GST documents.

Pipeline: official PDFs → chunk (with section + page metadata) → embed
(sentence-transformers all-MiniLM-L6-v2) → ChromaDB (persistent, local, free).
At query time: embed the question → retrieve top-k official chunks → answer ONLY
from that context, citing section + page. If nothing relevant is retrieved, refuse:
"I cannot find this in official documents."

Heavy deps (chromadb, sentence-transformers, pypdf) are in
`requirements-optional.txt` and are LAZY-imported — the base Flask app stays
OOM-safe on Railway free tier (same pattern as Voice Factory). When the optional
deps are absent, an honest pure-python fallback embedder + vector store keep the
retrieve→cite→refuse contract working (lower quality, clearly labelled), so the
feature degrades honestly instead of crashing.

See chitti-ca/RAG.md for the full design + run instructions.
"""

from .retriever import retrieve, is_grounded, rag_status  # noqa: F401
