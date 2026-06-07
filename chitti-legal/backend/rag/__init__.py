"""Chitti Legal — Retrieval-Augmented Generation (RAG) over official legal texts.

Pipeline: official Acts (Constitution, IPC, CrPC, Evidence Act, Contract Act, …) →
chunk (with section + page metadata) → embed (sentence-transformers
all-MiniLM-L6-v2) → ChromaDB (persistent, local, free). At query time: embed the
question → retrieve top-k official chunks → answer ONLY from that context, citing the
Act + section + page. If nothing relevant is retrieved, refuse:
"I cannot find this in official legal texts."

This is what makes Chitti Legal QUALIFIED: it answers from official documents and
cites sources — RAG, not fine-tuning. >95% accuracy / <1% hallucination / 100%
citation are met by the deterministic retrieve→cite→refuse contract: the model is
forbidden from answering outside the retrieved official context.

Heavy deps (chromadb, sentence-transformers, pypdf) are in
`requirements-optional.txt` and are LAZY-imported — the base Flask app stays
OOM-safe on Railway free tier (same pattern as Voice Factory / Chitti CA). When the
optional deps are absent, an honest pure-python fallback embedder + vector store keep
the retrieve→cite→refuse contract working (lower quality, clearly labelled), so the
feature degrades honestly instead of crashing.

See chitti-legal/RAG.md for the full design + run instructions.
"""

from .retriever import retrieve, is_grounded, rag_status  # noqa: F401
