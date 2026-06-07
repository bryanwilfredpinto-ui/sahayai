"""Ingest — build the Chitti CA vector DB from official documents.

Usage:
  python -m rag.ingest                 # ingest whatever is already in rag/corpus/ (.md/.txt/.pdf)
  python -m rag.ingest --download      # first download official PDFs (sources.py), then ingest
  python -m rag.ingest --reset         # wipe the vector DB before ingesting
  python -m rag.ingest --fallback      # force the pure-python embedder/store (no heavy deps)

Idempotent: re-running rebuilds the collection from the corpus on disk. Every chunk
is stored with {doc, source, url, section, page} so answers can cite the exact
section + page and link the official source. Never fabricates content — if a download
is blocked it logs the failure and skips that source.
"""
from __future__ import annotations

import argparse
import logging
import ssl
import sys
import urllib.request
from pathlib import Path

from . import config
from .chunker import chunk_path
from .embedder import get_embedder
from .sources import OFFICIAL_SOURCES, BROWSER_UA
from .store import get_store

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ca_rag.ingest")


def _download_one(src: dict) -> Path | None:
    config.CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    urls = [src["url"]] + list(src.get("mirrors") or [])
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    for url in urls:
        if not url.lower().endswith(".pdf"):
            log.info("  · %s: %s is a landing page, not a direct PDF — skipping auto-download "
                     "(drop the PDF into rag/corpus/ manually).", src["id"], url)
            continue
        dest = config.CORPUS_DIR / f"{src['id']}.pdf"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA})
            with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
                data = r.read()
            if len(data) < 1000 or not data[:5].startswith(b"%PDF"):
                log.warning("  ✗ %s: %s did not return a PDF (%d bytes)", src["id"], url, len(data))
                continue
            dest.write_bytes(data)
            log.info("  ✓ %s: downloaded %.1f MB → %s", src["id"], len(data) / 1e6, dest.name)
            return dest
        except Exception as e:  # noqa: BLE001
            log.warning("  ✗ %s: %s (%s)", src["id"], type(e).__name__, str(e)[:90])
    log.warning("  ✗ %s: all sources failed — corpus will rely on the seed docs until this is "
                "fetched manually. Source of record: %s", src["id"], src["url"])
    return None


def download_all() -> int:
    log.info("Downloading official sources → %s", config.CORPUS_DIR)
    got = 0
    for src in OFFICIAL_SOURCES:
        if _download_one(src):
            got += 1
    log.info("Downloaded %d/%d official PDFs.", got, len(OFFICIAL_SOURCES))
    return got


def build(reset: bool = False, force_fallback: bool = False) -> dict:
    embedder = get_embedder(force_fallback=force_fallback)
    store = get_store(force_fallback=force_fallback)
    if reset:
        store.reset()

    files = sorted(
        [p for p in config.CORPUS_DIR.glob("**/*") if p.suffix.lower() in (".md", ".txt", ".pdf")]
    )
    if not files:
        log.warning("No documents in %s. Add official PDFs (or run with --download) and re-run.",
                    config.CORPUS_DIR)
        return {"files": 0, "chunks": 0, "embedder": embedder.name, "store": store.backend}

    all_chunks: list[dict] = []
    for p in files:
        chunks = chunk_path(p)
        log.info("  · %s → %d chunks", p.name, len(chunks))
        all_chunks.extend(chunks)

    if not all_chunks:
        log.warning("0 chunks produced (pypdf missing for PDFs?). Install requirements-optional.txt.")
        return {"files": len(files), "chunks": 0, "embedder": embedder.name, "store": store.backend}

    texts = [c["text"] for c in all_chunks]
    log.info("Embedding %d chunks with %s …", len(texts), embedder.name)
    vecs = embedder.embed(texts)
    ids = [c["chunk_id"] for c in all_chunks]
    metas = [{"doc": c["doc"], "source": c["source"], "url": c["url"],
              "section": c["section"], "page": str(c["page"])} for c in all_chunks]
    if reset:
        store.reset()
    store.add(ids=ids, embeddings=vecs, documents=texts, metadatas=metas)
    out = {"files": len(files), "chunks": store.count(),
           "embedder": embedder.name, "semantic": embedder.semantic, "store": store.backend}
    log.info("Vector DB built: %(chunks)d chunks · embedder=%(embedder)s · store=%(store)s", out)
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Build Chitti CA RAG vector DB")
    ap.add_argument("--download", action="store_true", help="download official PDFs first")
    ap.add_argument("--reset", action="store_true", help="wipe the vector DB before ingesting")
    ap.add_argument("--fallback", action="store_true", help="force pure-python embedder/store")
    args = ap.parse_args(argv)
    if args.download:
        download_all()
    res = build(reset=args.reset or True, force_fallback=args.fallback)
    print(res)
    return 0 if res.get("chunks", 0) > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
