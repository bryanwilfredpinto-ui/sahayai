#!/usr/bin/env python3
"""
scripts/embed_all.py — Run embedding + FAISS pass over every language that
has already been ingested (chunks.jsonl on disk).

This is the second-pass companion to ingest_textbooks.py --no-embed. The split
exists because sentence-transformers + torch are heavy installs; on a fresh
box we run text ingestion first (fast, network-bound) and embedding after
(GPU/CPU-bound, requires model download).

Updates honest_status.json in place: sets embedded=True and faiss_indexed
exactly when those files land on disk. Nothing is faked.
"""
from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

THIS = Path(__file__).resolve()
BACKEND = THIS.parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services import fluency_corpus  # noqa: E402
from services.textbook_sources import all_codes  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("embed_all")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated lang codes (default: all that have chunks)")
    args = ap.parse_args(argv)

    if args.only:
        codes = [c.strip() for c in args.only.split(",") if c.strip()]
    else:
        codes = all_codes()

    embedder = fluency_corpus.get_embedder()
    if embedder is None:
        log.error("sentence-transformers not installed — aborting")
        return 2

    started = time.time()
    ready = 0
    for code in codes:
        cp = fluency_corpus.chunks_path(code)
        if not cp.exists():
            log.info("[%s] no chunks.jsonl — skipping", code)
            continue
        t0 = time.time()
        n, ok = fluency_corpus.build_embeddings(code)
        if not ok:
            log.warning("[%s] embedding failed", code)
            continue
        faiss_ok = fluency_corpus.build_faiss_index(code)

        # Update honest_status.json in place
        existing = fluency_corpus.read_status(code) or {}
        from services.fluency_corpus import CorpusStatus
        st = CorpusStatus(
            language=code,
            chunks=existing.get("chunks_ingested", n),
            pdfs_downloaded=existing.get("pdfs_downloaded", 0),
            pdfs_failed=existing.get("pdfs_failed", 0),
            sources=existing.get("sources", []),
            errors=existing.get("errors", []),
            notes=existing.get("notes", ""),
        )
        st.embedded = ok
        st.faiss_indexed = faiss_ok
        st.fluency_ready = (st.chunks >= 50) and st.embedded
        fluency_corpus.write_status(code, st)
        ready += int(st.fluency_ready)
        log.info("[%s] embedded %d chunks in %.1fs (faiss=%s, ready=%s)",
                 code, n, time.time() - t0, faiss_ok, st.fluency_ready)

    log.info("Embedding pass complete in %.1fs — %d languages fluency_ready",
             time.time() - started, ready)
    return 0


if __name__ == "__main__":
    sys.exit(main())
