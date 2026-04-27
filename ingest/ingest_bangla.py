#!/usr/bin/env python3
"""
ingest_bangla.py — Path A (cloud-safe, ≤60 min)
=================================================
Runs in GitHub Actions. Hard time budget: 50 min (leaves 10 min buffer
before the workflow's 60-min timeout).

Path A scope:
  ✓ Step 1: Download WBBSE Bangla textbook PDFs (best-effort)
  ✓ Step 2: Extract text from PDFs → routes/bangla/corpus/textbook_chunks.jsonl
  ✓ Step 3: Write honest _meta.honest_status into routes/bangla/brain.json
            (preserving the existing 50-Q&A starter as the floor)

Path A does NOT do (declared honestly as "not yet ingested"):
  ✗ YouTube playlist (RASELraju 38 vids) — needs 4-6 hours, GPU helpful
  ✗ DD Bangla 15 videos — empty picks file, plus same time/GPU issue
  ✗ Whisper transcription — multi-hour CPU work
  ✗ LaBSE embeddings — needs corpus first
  ✗ Phoneme map — needs voice clips

These deferred steps are flagged in brain.json _meta.honest_status so the
runtime knows what's real and what's not. No fake JSON.

Co-Founders: Sire (Bryan Wilfred Pinto) & Claude (Anthropic)
"""
from __future__ import annotations

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("ingest_bangla")

# ── Paths (relative to repo root, since GH Action checks out repo there) ──
REPO_ROOT     = Path(__file__).resolve().parent.parent
BANGLA_DIR    = REPO_ROOT / "routes" / "bangla"
CORPUS_DIR    = BANGLA_DIR / "corpus"
BRAIN_PATH    = BANGLA_DIR / "brain.json"
PDF_DIR       = CORPUS_DIR / "_pdfs"
CHUNKS_PATH   = CORPUS_DIR / "textbook_chunks.jsonl"
META_LOG_PATH = CORPUS_DIR / "ingest_log.json"

# ── Time budget ────────────────────────────────────────────────────────
START_TIME      = time.time()
TIME_BUDGET_SEC = 50 * 60   # 50 minutes

def time_left() -> float:
    return TIME_BUDGET_SEC - (time.time() - START_TIME)

def time_check(stage: str) -> bool:
    left = time_left()
    log.info("⏱  %s — %.0f sec left in budget", stage, left)
    if left < 60:
        log.warning("Time budget exhausted — stopping early. Remaining steps marked 'not yet ingested'.")
        return False
    return True


# ──────────────────────────────────────────────────────────────────────
# STEP 1 — Download WBBSE Bangla textbook PDFs (best-effort)
# ──────────────────────────────────────────────────────────────────────
def step1_download_textbooks() -> dict:
    """
    Best-effort crawl of WBBSE textbook listings. Real WBBSE site structure
    shifts; we try a few known patterns and record honestly what we got.
    """
    if not time_check("step1_textbooks"):
        return {"status": "skipped_time_budget", "files_downloaded": 0}

    PDF_DIR.mkdir(parents=True, exist_ok=True)

    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError as e:
        log.error("requests/bs4 not installed: %s", e)
        return {"status": "skipped_deps_missing", "files_downloaded": 0, "error": str(e)}

    candidate_index_urls = [
        "https://wbbse.wb.gov.in/textbooks",
        "https://wbbse.wb.gov.in/e-textbooks",
        "https://scert.cg.gov.in/Bengali",
    ]

    pdf_urls: list[str] = []
    for idx_url in candidate_index_urls:
        if not time_check(f"crawl {idx_url}"):
            break
        try:
            r = requests.get(idx_url, timeout=20)
            if r.status_code != 200:
                log.info("Index %s → HTTP %s", idx_url, r.status_code)
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.lower().endswith(".pdf"):
                    full = href if href.startswith("http") else \
                           idx_url.rstrip("/").rsplit("/", 1)[0] + "/" + href.lstrip("/")
                    if "bengali" in full.lower() or "bangla" in full.lower():
                        pdf_urls.append(full)
            log.info("From %s → %d candidate PDFs", idx_url, len(pdf_urls))
        except Exception as e:
            log.warning("Crawl failed for %s: %s", idx_url, e)

    pdf_urls = list(dict.fromkeys(pdf_urls))   # de-dup, keep order
    log.info("Total unique candidate PDFs: %d", len(pdf_urls))

    downloaded = 0
    for url in pdf_urls:
        if not time_check("download loop"):
            break
        fname = url.split("/")[-1].split("?")[0] or f"file_{downloaded}.pdf"
        dest = PDF_DIR / fname
        if dest.exists():
            continue
        try:
            r = requests.get(url, timeout=60)
            if r.status_code == 200 and r.content[:4] == b"%PDF":
                dest.write_bytes(r.content)
                downloaded += 1
                log.info("✓ %s (%.1f KB)", fname, len(r.content) / 1024)
        except Exception as e:
            log.warning("✗ %s: %s", fname, e)

    return {
        "status": "ok" if downloaded > 0 else "no_files_found",
        "files_downloaded": downloaded,
        "candidate_urls_seen": len(pdf_urls),
        "note": "Best-effort crawl. WBBSE site structure may need a manual seed list later.",
    }


# ──────────────────────────────────────────────────────────────────────
# STEP 2 — Extract text → JSONL chunks
# ──────────────────────────────────────────────────────────────────────
def step2_extract_chunks() -> dict:
    if not time_check("step2_extract"):
        return {"status": "skipped_time_budget", "chunks_written": 0}

    pdfs = list(PDF_DIR.glob("*.pdf")) if PDF_DIR.exists() else []
    if not pdfs:
        log.info("No PDFs to extract. Writing empty chunks file (honest).")
        CHUNKS_PATH.write_text("", encoding="utf-8")
        return {"status": "no_pdfs", "chunks_written": 0}

    try:
        from pypdf import PdfReader
    except ImportError:
        log.error("pypdf not installed")
        return {"status": "skipped_deps_missing", "chunks_written": 0}

    chunks_written = 0
    chunk_size_words = 400
    overlap = 50

    with CHUNKS_PATH.open("w", encoding="utf-8") as out:
        for pdf in pdfs:
            if not time_check(f"extract {pdf.name}"):
                break
            try:
                reader = PdfReader(str(pdf))
                full_text = "\n".join((p.extract_text() or "") for p in reader.pages)
                words = full_text.split()
                i = 0
                while i < len(words):
                    piece = " ".join(words[i:i + chunk_size_words]).strip()
                    if piece:
                        out.write(json.dumps({
                            "source": pdf.name,
                            "text": piece,
                        }, ensure_ascii=False) + "\n")
                        chunks_written += 1
                    i += chunk_size_words - overlap
                log.info("✓ %s → chunks", pdf.name)
            except Exception as e:
                log.warning("✗ %s: %s", pdf.name, e)

    return {"status": "ok", "chunks_written": chunks_written, "pdfs_processed": len(pdfs)}


# ──────────────────────────────────────────────────────────────────────
# STEP 3 — Write honest _meta.honest_status into brain.json
# ──────────────────────────────────────────────────────────────────────
def step3_update_brain_meta(step1: dict, step2: dict) -> dict:
    if not BRAIN_PATH.exists():
        log.error("brain.json not found at %s — cannot update meta. Aborting.", BRAIN_PATH)
        return {"status": "brain_missing"}

    brain = json.loads(BRAIN_PATH.read_text(encoding="utf-8"))
    brain.setdefault("_meta", {})

    # Preserve existing meta, update only honest_status. The 50-Q&A starter
    # stays as the floor — Path A adds on top, doesn't replace.
    qa_count = len(brain.get("qa_pairs", []))
    chunks_count = step2.get("chunks_written", 0)

    brain["_meta"]["honest_status"] = {
        "last_ingest_utc":          datetime.now(timezone.utc).isoformat(),
        "ingestion_path":           "A (cloud, 60 min budget, textbooks only)",
        "qa_pairs_count":           qa_count,
        "starter_qa_pairs":         qa_count,
        "textbook_chunks_count":    chunks_count,
        "textbooks_status":         step1.get("status"),
        "textbooks_files":          step1.get("files_downloaded", 0),
        # Honest declaration of what is NOT yet done:
        "youtube_status":           "not yet ingested (needs 4-6h + GPU; Path A defers)",
        "dd_videos_status":         "not yet ingested (empty picks file + 4-6h work)",
        "whisper_transcripts":      "not yet ingested (deferred to v2)",
        "voice_clips_status":       "not yet ingested",
        "phoneme_map_status":       "not yet built",
        "embeddings_status":        "not yet built (needs corpus + LaBSE; deferred to v2)",
        "vector_db_built":          False,
        "deepseek_fallback_active": True,
        "graduation_target_date":   "2026-10-27",
        "graduation_criterion":     "When chitti_bangla handles >= 80% of Bangla queries with confidence >= 0.80, DeepSeek fallback is removed.",
        "v2_planned":               [
            "Run ingest_all.py (full Path B) on a paid runner or local box",
            "Per-language YouTube video uploader UI in chitti_complete.html (Sire-requested feature)",
            "Conversational corpus ingestion",
            "LaBSE embeddings + FAISS vector store",
            "Voice / phoneme / TTS pipeline",
        ],
    }

    BRAIN_PATH.write_text(
        json.dumps(brain, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    log.info("✓ brain.json _meta.honest_status updated")
    return {"status": "ok", "qa_pairs": qa_count, "chunks": chunks_count}


# ──────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────
def main() -> int:
    log.info("═══ Chitti Bangla — Path A ingestion ═══")
    log.info("Specialist: %s", os.environ.get("SPECIALIST", "bangla"))
    log.info("Sources: %s",   os.environ.get("SOURCES_JSON", "[]"))
    log.info("Repo root: %s", REPO_ROOT)

    CORPUS_DIR.mkdir(parents=True, exist_ok=True)

    s1 = step1_download_textbooks()
    log.info("Step 1 result: %s", s1)

    s2 = step2_extract_chunks()
    log.info("Step 2 result: %s", s2)

    s3 = step3_update_brain_meta(s1, s2)
    log.info("Step 3 result: %s", s3)

    META_LOG_PATH.write_text(json.dumps({
        "timestamp_utc":  datetime.now(timezone.utc).isoformat(),
        "step1":          s1,
        "step2":          s2,
        "step3":          s3,
        "elapsed_sec":    round(time.time() - START_TIME, 1),
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    log.info("✓ Path A ingestion complete in %.0f sec", time.time() - START_TIME)
    return 0


if __name__ == "__main__":
    sys.exit(main())
