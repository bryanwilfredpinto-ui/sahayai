#!/usr/bin/env python3
"""scripts/report_summary.py — Print a per-language summary of the fluency corpus on disk."""
from __future__ import annotations

import json
import sys
from pathlib import Path

THIS = Path(__file__).resolve()
BACKEND = THIS.parent.parent
REPORT = BACKEND / "data" / "fluency" / "_report.json"


def main() -> int:
    if not REPORT.exists():
        print("No _report.json yet — run scripts/ingest_textbooks.py first.")
        return 1
    d = json.loads(REPORT.read_text(encoding="utf-8"))
    rows = [
        (k, v["chunks_ingested"], v.get("pdfs_downloaded", 0), v.get("sources", []),
         v.get("embedded", False), v.get("fluency_ready", False))
        for k, v in d["results"].items()
    ]
    rows.sort(key=lambda r: -r[1])
    total = sum(r[1] for r in rows)
    print(f"Ingestion run: {d['timestamp']}  elapsed {d['elapsed_sec']:.1f}s")
    print(f"TOTAL: {total:,} chunks across {len(rows)} languages")
    print(f"Fluency-ready: {d['fluency_ready']}/26  Partial: {d['partial_corpus_only']}  Failed: {d['failed']}")
    print()
    print(f"{'lang':<5}{'chunks':>8}{'pdfs':>6}  {'emb':<5}{'rdy':<5}  sources")
    print("-" * 80)
    for lang, chunks, pdfs, sources, emb, rdy in rows:
        src_short = "; ".join(s.split(" (")[0] if " (" in s else s for s in sources)
        print(f"{lang:<5}{chunks:>8}{pdfs:>6}  {str(emb):<5}{str(rdy):<5}  {src_short}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
