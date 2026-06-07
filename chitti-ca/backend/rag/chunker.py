"""Chunker — turn a source document into retrievable chunks with citation metadata.

Supports .pdf (lazy pypdf, per-page so we keep the real page number) and .md/.txt
(front-matter metadata + heading-based sections). Every chunk carries:
  {text, doc, source, url, section, page, chunk_id}
so the answer can cite "Section N, page P" and link the official source.
"""
from __future__ import annotations

import logging
import re
from pathlib import Path

from . import config

log = logging.getLogger("ca_rag.chunker")

# "Section 80C", "Sec. 22", "S. 17(5)", "80-IAC", "Rule 36(4)"
_SEC_RE = re.compile(
    r"\b(?:section|sec\.?|s\.|rule)\s*([0-9]{1,3}[A-Z]{0,4}(?:\([0-9a-zA-Z]+\))?)",
    re.IGNORECASE,
)
_FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _front_matter(text: str) -> tuple[dict, str]:
    m = _FM_RE.match(text)
    if not m:
        return {}, text
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, text[m.end():]


def _split(text: str):
    """Yield (chunk_text) windows of ~CHUNK_CHARS with overlap, on sentence-ish bounds."""
    text = re.sub(r"[ \t]+", " ", text).strip()
    if not text:
        return
    size, overlap = config.CHUNK_CHARS, config.CHUNK_OVERLAP
    i = 0
    n = len(text)
    while i < n:
        end = min(i + size, n)
        # try to end on a sentence/clause boundary inside the window tail
        if end < n:
            window = text[i:end]
            cut = max(window.rfind(". "), window.rfind("\n"), window.rfind("; "))
            if cut > size * 0.5:
                end = i + cut + 1
        yield text[i:end].strip()
        if end >= n:
            break
        i = max(end - overlap, i + 1)


def _detect_section(chunk: str, default: str) -> str:
    m = _SEC_RE.search(chunk)
    return m.group(1).upper() if m else default


def chunk_text_file(path: Path) -> list[dict]:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    meta, body = _front_matter(raw)
    doc = meta.get("doc") or path.stem
    source = meta.get("source") or meta.get("authority") or "official document"
    url = meta.get("url") or ""
    base_section = meta.get("section") or ""
    out = []
    for idx, ch in enumerate(_split(body)):
        if len(ch) < 40:
            continue
        # For curated docs the declared front-matter section is AUTHORITATIVE (the doc
        # is *about* that section); only auto-detect when none was declared.
        sec = base_section if base_section else _detect_section(ch, "")
        out.append({
            "text": ch, "doc": doc, "source": source, "url": url,
            "section": sec, "page": meta.get("page") or "—",
            "chunk_id": f"{path.stem}:{idx}",
        })
    return out


def chunk_pdf(path: Path, doc: str, source: str, url: str) -> list[dict]:
    try:
        from pypdf import PdfReader  # lazy (optional dep)
    except Exception as e:  # noqa: BLE001
        log.warning("pypdf unavailable (%s) — cannot chunk %s. Install requirements-optional.txt.",
                    type(e).__name__, path.name)
        return []
    reader = PdfReader(str(path))
    out = []
    for pno, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:  # noqa: BLE001
            continue
        for idx, ch in enumerate(_split(text)):
            if len(ch) < 60:
                continue
            out.append({
                "text": ch, "doc": doc, "source": source, "url": url,
                "section": _detect_section(ch, ""), "page": pno,
                "chunk_id": f"{path.stem}:p{pno}:{idx}",
            })
    return out


def chunk_path(path: Path, doc: str = "", source: str = "", url: str = "") -> list[dict]:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return chunk_pdf(path, doc or path.stem, source or "official document", url)
    if ext in (".md", ".txt"):
        return chunk_text_file(path)
    return []
