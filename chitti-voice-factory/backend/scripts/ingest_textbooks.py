#!/usr/bin/env python3
"""
scripts/ingest_textbooks.py — Run textbook + Wikipedia ingestion for all 26 languages.

Usage:
    cd chitti-voice-factory/backend
    python -m scripts.ingest_textbooks           # all 26 languages, parallel
    python -m scripts.ingest_textbooks --only hi,bn,ta
    python -m scripts.ingest_textbooks --no-embed   # download + chunk only (no embeddings)
    python -m scripts.ingest_textbooks --workers 4  # adjust parallelism (default 8)

The runner:
  1. Loads the multilingual embedding model ONCE on the main thread (heavy).
  2. Submits one task per language to a ThreadPoolExecutor.
  3. Each task: download → extract → chunk → embed → FAISS → honest_status.json.
  4. Tier B/C languages with cousin fallback run AFTER their cousin completes.
  5. Writes data/fluency/_report.json with the aggregate.

Honest reporting — no language is marked complete unless chunks are actually
on disk and embeddings actually exist.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Allow running as `python -m scripts.ingest_textbooks` from backend/
THIS = Path(__file__).resolve()
BACKEND = THIS.parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services import fluency_corpus, fluency_ingester  # noqa: E402
from services.textbook_sources import SOURCES, all_codes  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("ingest_textbooks")


def order_by_dependency(codes: list[str]) -> tuple[list[str], list[str]]:
    """
    Return (first_wave, second_wave). Cousin-fallback languages run in
    second_wave so their cousin is already on disk.
    """
    first, second = [], []
    for c in codes:
        s = SOURCES.get(c)
        if s and s.cousin and not s.wikipedia_lang and not s.ncert_pdfs:
            second.append(c)
        else:
            first.append(c)
    return first, second


def run_wave(codes: list[str], workers: int, do_embed: bool) -> dict:
    results: dict[str, dict] = {}
    if not codes:
        return results
    log.info("Wave starting: %d languages, %d workers", len(codes), workers)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {
            ex.submit(fluency_ingester.ingest_language, code, do_embed=do_embed): code
            for code in codes
        }
        for fut in concurrent.futures.as_completed(futures):
            code = futures[fut]
            try:
                res = fut.result(timeout=900)  # 15 min per language
                results[code] = res
                log.info(
                    "[%s] chunks=%s sources=%s embedded=%s faiss=%s ready=%s",
                    code,
                    res.get("chunks_ingested"),
                    res.get("sources"),
                    res.get("embedded"),
                    res.get("faiss_indexed"),
                    res.get("fluency_ready"),
                )
            except Exception as e:  # noqa: BLE001
                log.exception("[%s] task error: %s", code, e)
                results[code] = {"language": code, "error": str(e)[:200]}
    return results


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated lang codes (default: all 26)")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--no-embed", action="store_true", help="skip embedding step")
    args = ap.parse_args(argv)

    if args.only:
        codes = [c.strip() for c in args.only.split(",") if c.strip()]
        unknown = [c for c in codes if c not in SOURCES]
        if unknown:
            log.error("Unknown lang codes: %s", unknown)
            return 2
    else:
        codes = all_codes()

    log.info("=" * 80)
    log.info("CHITTI FLUENCY INGESTION — %d languages", len(codes))
    log.info("Workers: %d  Embeddings: %s", args.workers, not args.no_embed)
    log.info("Output: %s", fluency_corpus.DATA_ROOT)
    log.info("=" * 80)

    # Pre-load embedding model on main thread to avoid 26x first-load thrash.
    if not args.no_embed:
        log.info("Pre-loading multilingual embedding model on main thread...")
        fluency_corpus.get_embedder()

    started = time.time()
    first_wave, second_wave = order_by_dependency(codes)
    log.info("First wave: %s", first_wave)
    log.info("Cousin-dependent wave: %s", second_wave)

    results: dict[str, dict] = {}
    results.update(run_wave(first_wave, args.workers, not args.no_embed))
    if second_wave:
        log.info("Second wave (cousin-dependent) starting...")
        results.update(run_wave(second_wave, args.workers, not args.no_embed))

    elapsed = time.time() - started
    ready = sum(1 for r in results.values() if r.get("fluency_ready"))
    partial = sum(1 for r in results.values() if r.get("chunks_ingested", 0) > 0 and not r.get("fluency_ready"))
    failed = sum(1 for r in results.values() if not r.get("chunks_ingested", 0))

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "elapsed_sec": round(elapsed, 1),
        "total_languages": len(codes),
        "fluency_ready": ready,
        "partial_corpus_only": partial,
        "failed": failed,
        "results": results,
    }
    report_path = fluency_corpus.DATA_ROOT / "_report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    log.info("=" * 80)
    log.info("DONE in %.1fs", elapsed)
    log.info("Fluency-ready: %d / %d", ready, len(codes))
    log.info("Partial (chunks but no embed): %d", partial)
    log.info("Failed (no chunks): %d", failed)
    log.info("Report: %s", report_path)
    log.info("=" * 80)
    return 0


if __name__ == "__main__":
    sys.exit(main())
