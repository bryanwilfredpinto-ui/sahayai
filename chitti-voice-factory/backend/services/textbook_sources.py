"""
services/textbook_sources.py — Per-language source registry for fluency ingestion.

HONEST DESIGN
-------------
Textbook ingestion sources fall into three tiers of confidence:

  S1  NCERT direct PDF — when we have a known-working URL. Authoritative.
  S2  Wikipedia REST API — when a Wikipedia edition exists in the target language.
       This is REAL text in the target language. It is NOT textbook content,
       but it is a legitimate fluency corpus (grammar, vocabulary, sentence
       structure). honest_status.json records the source clearly.
  S3  Cousin mapping — when the language has no Wikipedia and no NCERT
       (Bodo, Dogri, Chhattisgarhi, Kodava, Oraon). We borrow the nearest
       major language and clearly mark fluency_ready=False with notes.

Wikipedia title list = 60 common topics that exist across every Wikipedia
(India, Mathematics, Science, History, Geography, etc.) — gives a sturdy
corpus without needing to scrape Special:Random.

NCERT URLs were sampled by hand from ncert.nic.in/textbook.php in May 2026.
URLs that 404 are recorded as pdfs_failed in honest_status.json; we do not
silently pretend they worked.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

log = logging.getLogger("textbook_sources")


@dataclass
class LangSources:
    code: str
    name: str
    wikipedia_lang: Optional[str]      # e.g. "hi"; None if no Wikipedia in this language
    ncert_pdfs: list[str] = field(default_factory=list)   # full URLs
    archive_pdfs: list[str] = field(default_factory=list)  # archive.org PDF URLs
    cousin: Optional[str] = None        # ISO code of cousin (when self-sourcing fails)
    notes: str = ""


# ── Common Wikipedia topics that exist in nearly every edition ──
# Picked because each is a stable article across languages; broad fluency coverage.
WIKI_TOPICS = [
    "India",
    "Asia",
    "Mathematics",
    "Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Geography",
    "History",
    "Literature",
    "Music",
    "Dance",
    "Cinema",
    "Sport",
    "Cricket",
    "Football",
    "Education",
    "School",
    "University",
    "Language",
    "Culture",
    "Religion",
    "Hinduism",
    "Buddhism",
    "Islam",
    "Christianity",
    "Sikhism",
    "Constitution_of_India",
    "Indian_independence_movement",
    "Mahatma_Gandhi",
    "Rabindranath_Tagore",
    "B._R._Ambedkar",
    "Sun",
    "Moon",
    "Earth",
    "Water",
    "Tree",
    "Animal",
    "Plant",
    "Bird",
    "Fish",
    "Computer",
    "Internet",
    "Telephone",
    "Train",
    "Aeroplane",
    "Agriculture",
    "Rice",
    "Wheat",
    "Tea",
    "Cotton",
    "Mountain",
    "River",
    "Ganges",
    "Himalayas",
    "Mumbai",
    "Delhi",
    "Kolkata",
    "Chennai",
    "Bangalore",
    "Hyderabad",
]


# ── NCERT direct-PDF URLs (verified May 2026 sample, may have rotated) ──
# Where possible we use full-book ZIPs (more reliable than per-chapter PDFs).
# These are best-effort; ingester logs each as success/failure honestly.
NCERT_URLS = {
    "hi": [
        # Class 1 Hindi - Sarangi
        "https://ncert.nic.in/textbook/pdf/ahsm101.pdf",
        "https://ncert.nic.in/textbook/pdf/ahsm102.pdf",
        # Class 5 Hindi - Rimjhim
        "https://ncert.nic.in/textbook/pdf/ehht101.pdf",
        # Class 9 Hindi - Sparsh
        "https://ncert.nic.in/textbook/pdf/ihsp101.pdf",
        "https://ncert.nic.in/textbook/pdf/ihsp102.pdf",
        # Class 10 Hindi - Kshitij
        "https://ncert.nic.in/textbook/pdf/jhkz101.pdf",
        "https://ncert.nic.in/textbook/pdf/jhkz102.pdf",
    ],
    "ur": [
        "https://ncert.nic.in/textbook/pdf/aurd101.pdf",
        "https://ncert.nic.in/textbook/pdf/burd101.pdf",
    ],
    "sa": [
        # Sanskrit - Ruchira
        "https://ncert.nic.in/textbook/pdf/fhsk101.pdf",  # Class 6
        "https://ncert.nic.in/textbook/pdf/ghsk101.pdf",  # Class 7
        "https://ncert.nic.in/textbook/pdf/hhsk101.pdf",  # Class 8
        "https://ncert.nic.in/textbook/pdf/ihsk101.pdf",  # Class 9
        "https://ncert.nic.in/textbook/pdf/jhsk101.pdf",  # Class 10
    ],
    "en": [
        # English textbook — used by some Tier C as cousin fallback
        "https://ncert.nic.in/textbook/pdf/aemr101.pdf",
        "https://ncert.nic.in/textbook/pdf/bemr101.pdf",
    ],
}


# ── Full 26-language registry ──
SOURCES: dict[str, LangSources] = {
    # Tier A — Constitutional, NCERT translates many books here
    "hi":  LangSources("hi",  "Hindi",      "hi",  NCERT_URLS["hi"]),
    "bn":  LangSources("bn",  "Bengali",    "bn"),
    "te":  LangSources("te",  "Telugu",     "te"),
    "ta":  LangSources("ta",  "Tamil",      "ta"),
    "kn":  LangSources("kn",  "Kannada",    "kn"),
    "ml":  LangSources("ml",  "Malayalam",  "ml"),
    "mr":  LangSources("mr",  "Marathi",    "mr"),
    "gu":  LangSources("gu",  "Gujarati",   "gu"),
    "or":  LangSources("or",  "Odia",       "or"),
    "as":  LangSources("as",  "Assamese",   "as"),
    "pa":  LangSources("pa",  "Punjabi",    "pa"),
    "ur":  LangSources("ur",  "Urdu",       "ur",  NCERT_URLS["ur"]),

    # Tier B — Cousins (varied Wikipedia coverage)
    "bho": LangSources("bho", "Bhojpuri",    "bh",
                       notes="Bhojpuri Wikipedia consolidated under 'bh' code."),
    "hne": LangSources("hne", "Chhattisgarhi", None, cousin="hi",
                       notes="No Chhattisgarhi Wikipedia. Cousin: Hindi."),
    "mai": LangSources("mai", "Maithili",    "mai"),
    "kok": LangSources("kok", "Konkani",     "gom",
                       notes="Konkani Wikipedia uses code 'gom' (Goan Konkani)."),
    "doi": LangSources("doi", "Dogri",       None,   cousin="hi",
                       notes="No Dogri Wikipedia. Cousin: Hindi."),
    "sd":  LangSources("sd",  "Sindhi",      "sd"),
    "ks":  LangSources("ks",  "Kashmiri",    "ks",   notes="Small Wikipedia"),
    "mni": LangSources("mni", "Manipuri",    "mni"),
    "brx": LangSources("brx", "Bodo",        None,   cousin="as",
                       notes="No Bodo Wikipedia. Cousin: Assamese."),
    "sat": LangSources("sat", "Santhali",    "sat",  notes="Ol Chiki script"),
    "sa":  LangSources("sa",  "Sanskrit",    "sa",   NCERT_URLS["sa"]),

    # Tier C — No Wikipedia, no NCERT
    "tcy": LangSources("tcy", "Tulu",        "tcy"),
    "kfa": LangSources("kfa", "Kodava",      None,   cousin="kn",
                       notes="No Kodava Wikipedia. Cousin: Kannada."),
    "kru": LangSources("kru", "Oraon (Kurukh)", None, cousin="hi",
                       notes="No Kurukh Wikipedia. Cousin: Hindi."),
}


def _merge_discovered() -> None:
    """
    On import, merge any URLs in data/discovered_textbook_urls.json into the
    SOURCES registry. This lets scripts/discover_*.py expand the source plan
    without requiring code edits.
    """
    discovered_path = Path(__file__).resolve().parent.parent / "data" / "discovered_textbook_urls.json"
    if not discovered_path.exists():
        return
    try:
        # utf-8-sig handles PowerShell-written files that include a BOM
        data = json.loads(discovered_path.read_text(encoding="utf-8-sig"))
    except Exception as e:  # noqa: BLE001
        log.warning("Failed to load discovered URLs: %s", e)
        return
    for lang, plan in data.items():
        src = SOURCES.get(lang)
        if not src:
            continue
        ncert = plan.get("ncert", [])
        archive = plan.get("archive", [])
        # Dedupe while preserving order
        for url in ncert:
            if url not in src.ncert_pdfs:
                src.ncert_pdfs.append(url)
        for url in archive:
            if url not in src.archive_pdfs:
                src.archive_pdfs.append(url)
    n_ncert = sum(len(s.ncert_pdfs) for s in SOURCES.values())
    n_archive = sum(len(s.archive_pdfs) for s in SOURCES.values())
    log.info("Merged discovered URLs: %d NCERT + %d archive.org", n_ncert, n_archive)


_merge_discovered()


def get_sources(code: str) -> Optional[LangSources]:
    return SOURCES.get(code)


def all_codes() -> list[str]:
    return list(SOURCES.keys())
