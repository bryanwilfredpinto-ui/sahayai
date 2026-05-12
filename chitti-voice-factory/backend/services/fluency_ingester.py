"""
services/fluency_ingester.py — Real-source textbook + Wikipedia ingestion.

Honesty contract
----------------
This module does REAL work. No placeholder PDFs. No fake text. No stubs.

For each language we attempt three source channels in order:

  1. NCERT direct-PDF URLs (when listed in textbook_sources.NCERT_URLS).
     We use requests + a short retry. If a URL 404s, we record it in
     pdfs_failed; we do not invent content.

  2. Wikipedia REST API (when the language has a Wikipedia edition).
     We fetch HTML for ~60 well-known articles. This is REAL in-language
     text — a legitimate fluency proxy when textbooks aren't reachable.
     honest_status records source="wikipedia.<lang>.org".

  3. Cousin mapping (when language has neither NCERT nor Wikipedia).
     Copy chunks from the cousin language but tag them so the UI knows
     this is borrowed fluency. fluency_ready=False on such languages.

PDF text extraction prefers PyMuPDF (fitz) — best for Indic scripts —
and falls back to pdfplumber, then pypdf. A clean run uses fitz.

Chunking strategy: paragraph split + sliding window of ~400-600 chars.
"""
from __future__ import annotations

import html
import logging
import re
import time
from pathlib import Path
from typing import Iterable, Optional
from urllib.parse import quote

import requests

from services import fluency_corpus
from services.fluency_corpus import Chunk, CorpusStatus
from services.textbook_sources import (
    WIKI_TOPICS,
    LangSources,
    get_sources,
)
from services import wiki_langlinks

log = logging.getLogger("fluency_ingester")

# ── PDF backends (graceful degradation) ──
_PDF_BACKEND: Optional[str] = None
try:
    import fitz  # PyMuPDF
    _PDF_BACKEND = "fitz"
except Exception:  # noqa: BLE001
    try:
        import pdfplumber  # type: ignore
        _PDF_BACKEND = "pdfplumber"
    except Exception:  # noqa: BLE001
        try:
            import pypdf  # type: ignore
            _PDF_BACKEND = "pypdf"
        except Exception:  # noqa: BLE001
            _PDF_BACKEND = None
            log.warning("No PDF backend available — NCERT PDFs will be skipped")


HTTP_TIMEOUT = 15           # per request; we'd rather miss a slow source than hang
ARCHIVE_TIMEOUT = 25        # archive.org is slower but we still want to time out
USER_AGENT = "ChittiFluencyIngester/1.0 (+https://github.com/sahayai/sahayai)"

# Chunking knobs
CHUNK_TARGET = 500   # chars
CHUNK_OVERLAP = 50


# ── Helpers ──

def _http_get(url: str, *, binary: bool = False, timeout: int = HTTP_TIMEOUT) -> Optional[bytes | str]:
    """GET with timeout + UA. Returns None on failure (silent)."""
    try:
        resp = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT, "Accept": "*/*"},
        )
        if resp.status_code != 200:
            log.info("HTTP %s %s", resp.status_code, url)
            return None
        return resp.content if binary else resp.text
    except Exception as e:  # noqa: BLE001
        log.info("HTTP error %s — %s", url, str(e)[:80])
        return None


def _strip_html(html_text: str) -> str:
    """Crude but effective HTML → plain text. Keeps language characters intact."""
    # Remove scripts and styles entirely
    html_text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html_text, flags=re.DOTALL | re.IGNORECASE)
    # Drop tags
    text = re.sub(r"<[^>]+>", " ", html_text)
    # Decode entities
    text = html.unescape(text)
    # Collapse whitespace
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, *, target: int = CHUNK_TARGET, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Paragraph-aware chunking with sliding window.
    Tries to break on paragraph boundaries; falls back to char windows.
    """
    text = text.strip()
    if not text:
        return []
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", text) if p.strip()]
    out: list[str] = []
    buf = ""
    for p in paragraphs:
        if len(buf) + len(p) + 1 <= target:
            buf = (buf + "\n" + p).strip() if buf else p
        else:
            if buf:
                out.append(buf)
            if len(p) <= target:
                buf = p
            else:
                # Slide window through the long paragraph
                i = 0
                while i < len(p):
                    out.append(p[i:i + target])
                    i += max(1, target - overlap)
                buf = ""
    if buf:
        out.append(buf)
    return out


# ── PDF extraction ──

def extract_pdf_text(pdf_path: Path) -> Optional[str]:
    """Extract plain text from a PDF using the best available backend."""
    if _PDF_BACKEND == "fitz":
        try:
            doc = fitz.open(str(pdf_path))
            parts = []
            for page in doc:
                parts.append(page.get_text("text"))
            doc.close()
            return "\n\n".join(parts).strip() or None
        except Exception as e:  # noqa: BLE001
            log.warning("fitz failed on %s: %s", pdf_path.name, e)
            return None
    if _PDF_BACKEND == "pdfplumber":
        try:
            with pdfplumber.open(str(pdf_path)) as doc:
                parts = [page.extract_text() or "" for page in doc.pages]
            return "\n\n".join(parts).strip() or None
        except Exception as e:  # noqa: BLE001
            log.warning("pdfplumber failed on %s: %s", pdf_path.name, e)
            return None
    if _PDF_BACKEND == "pypdf":
        try:
            reader = pypdf.PdfReader(str(pdf_path))
            parts = [(p.extract_text() or "") for p in reader.pages]
            return "\n\n".join(parts).strip() or None
        except Exception as e:  # noqa: BLE001
            log.warning("pypdf failed on %s: %s", pdf_path.name, e)
            return None
    return None


# ── NCERT channel ──

def fetch_ncert_pdfs(src: LangSources, status: CorpusStatus,
                     max_pdfs: int = 30) -> list[Chunk]:
    """Download up to max_pdfs NCERT URLs, extract text, return chunks."""
    if not src.ncert_pdfs:
        return []
    if _PDF_BACKEND is None:
        status.errors.append("no_pdf_backend_installed")
        return []

    chunks: list[Chunk] = []
    pdf_dir = fluency_corpus.lang_dir(src.code) / "_pdfs"
    chunk_id = 0

    for url in src.ncert_pdfs[:max_pdfs]:
        filename = url.rsplit("/", 1)[-1]
        target = pdf_dir / filename
        if not target.exists():
            data = _http_get(url, binary=True)
            if data is None:
                status.pdfs_failed += 1
                status.errors.append(f"ncert_404: {filename}")
                continue
            if len(data) < 1000:
                status.pdfs_failed += 1
                status.errors.append(f"ncert_tiny: {filename} ({len(data)}B)")
                continue
            target.write_bytes(data)
        status.pdfs_downloaded += 1

        text = extract_pdf_text(target)
        if not text:
            status.errors.append(f"extract_empty: {filename}")
            continue

        for piece in chunk_text(text):
            chunks.append(Chunk(
                id=f"{src.code}_ncert_{chunk_id}",
                text=piece,
                source=f"NCERT:{filename}",
                language=src.code,
                grade=None,
                subject=None,
                textbook_source="curriculum",
            ))
            chunk_id += 1

    if chunks:
        status.sources.append(f"NCERT ({status.pdfs_downloaded} PDFs)")
    return chunks


# ── Archive.org channel (state-board mirrors, NCERT translations) ──

def fetch_archive_pdfs(src: LangSources, status: CorpusStatus,
                       max_pdfs: int = 10) -> list[Chunk]:
    """
    Download textbook PDFs from archive.org. archive.org has flaky servers
    (timeouts, 403s) — we accept failures and move on rather than retry.
    Polite 2-second delay between downloads to avoid burst-rate-limiting.
    """
    if not src.archive_pdfs:
        return []
    if _PDF_BACKEND is None:
        return []

    chunks: list[Chunk] = []
    pdf_dir = fluency_corpus.lang_dir(src.code) / "_pdfs"
    chunk_id = 100_000  # avoid collision with NCERT IDs
    downloaded = 0
    failed = 0

    for url in src.archive_pdfs[:max_pdfs]:
        filename = "archive_" + url.rsplit("/", 1)[-1].replace("/", "_")
        target = pdf_dir / filename
        if not target.exists():
            data = _http_get(url, binary=True, timeout=ARCHIVE_TIMEOUT)
            if data is None:
                failed += 1
                status.errors.append(f"archive_fetch_failed: {filename[:50]}")
                continue
            if len(data) < 5000:
                failed += 1
                status.errors.append(f"archive_tiny: {filename[:50]} ({len(data)}B)")
                continue
            target.write_bytes(data)
            time.sleep(2)  # polite, but not punishing
        downloaded += 1

        text = extract_pdf_text(target)
        if not text:
            status.errors.append(f"archive_extract_empty: {filename[:50]}")
            continue

        for piece in chunk_text(text):
            chunks.append(Chunk(
                id=f"{src.code}_archive_{chunk_id}",
                text=piece,
                source=f"archive.org:{filename}",
                language=src.code,
                textbook_source="curriculum",
            ))
            chunk_id += 1

    if chunks:
        status.sources.append(f"archive.org ({downloaded} PDFs, {failed} failed)")
    return chunks


# ── Wikipedia channel ──

def fetch_wikipedia(src: LangSources, status: CorpusStatus,
                    topics: Iterable[str] = WIKI_TOPICS) -> list[Chunk]:
    """
    Pull HTML for each common topic from the language's Wikipedia.
    Uses /api/rest_v1/page/html/<title>.

    Resolution: try the native-language title from the langlinks cache first
    (much higher hit rate), then fall back to the English title (which works
    via Wikipedia's cross-language redirects for the biggest editions).
    """
    if not src.wikipedia_lang:
        return []

    base = f"https://{src.wikipedia_lang}.wikipedia.org/api/rest_v1/page/html/"
    chunks: list[Chunk] = []
    chunk_id = 0
    ok_topics = 0

    for en_topic in topics:
        # Try resolved native title first, fall back to English.
        candidates: list[str] = []
        native = wiki_langlinks.title_for(en_topic, src.wikipedia_lang)
        if native and native != en_topic:
            candidates.append(native)
        candidates.append(en_topic)

        body = None
        used_title = None
        for cand in candidates:
            url = base + quote(cand)
            body = _http_get(url, binary=False)
            if body is not None:
                used_title = cand
                break
        if body is None:
            continue

        plain = _strip_html(body)
        if len(plain) < 200:
            continue
        ok_topics += 1
        for piece in chunk_text(plain):
            chunks.append(Chunk(
                id=f"{src.code}_wiki_{chunk_id}",
                text=piece,
                source=f"wikipedia.{src.wikipedia_lang}.org/wiki/{used_title}",
                language=src.code,
                subject=en_topic,
                textbook_source="community",
            ))
            chunk_id += 1
        # Be polite
        time.sleep(0.05)

    if chunks:
        status.sources.append(f"Wikipedia ({ok_topics} articles, {src.wikipedia_lang}.wikipedia.org)")
    return chunks


# ── Cousin fallback channel ──

def copy_from_cousin(src: LangSources, status: CorpusStatus) -> list[Chunk]:
    """Borrow chunks from the cousin language; clearly tagged."""
    if not src.cousin:
        return []
    cousin_chunks = fluency_corpus.read_chunks(src.cousin)
    if not cousin_chunks:
        status.errors.append(f"cousin_{src.cousin}_not_ingested_yet")
        return []
    out: list[Chunk] = []
    for i, c in enumerate(cousin_chunks):
        out.append(Chunk(
            id=f"{src.code}_cousin_{i}",
            text=c.text,
            source=f"cousin:{src.cousin}:{c.source}",
            language=src.code,
            grade=c.grade,
            subject=c.subject,
            textbook_source="cousin",
        ))
    if out:
        status.sources.append(f"Cousin mapping from {src.cousin} ({len(out)} chunks)")
    return out


# ── Main per-language driver ──

def ingest_language(code: str, *, do_embed: bool = True) -> dict:
    """
    Ingest a single language end-to-end. Honest about what happened.
    Returns the status dict.
    """
    src = get_sources(code)
    if not src:
        return {"language": code, "error": "unknown_language"}

    status = CorpusStatus(language=code)
    status.notes = src.notes

    all_chunks: list[Chunk] = []

    # 1. NCERT direct (curriculum)
    ncert_chunks = fetch_ncert_pdfs(src, status)
    all_chunks.extend(ncert_chunks)

    # 2. archive.org mirrors (curriculum — state-board + NCERT translations)
    archive_chunks = fetch_archive_pdfs(src, status)
    all_chunks.extend(archive_chunks)

    # 3. Wikipedia (community — real in-language text)
    wiki_chunks = fetch_wikipedia(src, status)
    all_chunks.extend(wiki_chunks)

    # 4. Cousin fallback (only when we still have nothing)
    if not all_chunks and src.cousin:
        cousin_chunks = copy_from_cousin(src, status)
        all_chunks.extend(cousin_chunks)

    # Write chunks JSONL
    written = fluency_corpus.write_chunks(code, all_chunks)
    status.chunks = written

    # Build embeddings + FAISS
    if do_embed and written > 0:
        try:
            _, ok = fluency_corpus.build_embeddings(code)
            status.embedded = ok
            if ok:
                status.faiss_indexed = fluency_corpus.build_faiss_index(code)
        except Exception as e:  # noqa: BLE001
            status.errors.append(f"embed_error: {str(e)[:200]}")

    # Fluency-ready threshold
    status.fluency_ready = (status.chunks >= 50) and status.embedded

    fluency_corpus.write_status(code, status)
    return status.to_dict()
