"""
services/profession_classifier.py
---------------------------------
Rules-only deterministic classifier (CHITTI_NEWS_AI_MASTER_SPEC v0.3 §4).

**Doctrine — locked 2026-05-29 (PM).** Classification is rules-only. No
Gemini, no DeepSeek, no OpenAI, no paid inference of any kind. The system
must function with every LLM provider offline.

The classifier emits per-profession tags built from four signal layers:

  1. **Source-default tags**     (highest signal — the source declares its
                                  primary audience in courses_sources.json)
  2. **URL pattern matches**     (per-source `url_patterns`; e.g. a
                                  microsoft-learn URL at /azure/developer/
                                  emits software-developer)
  3. **Keyword hits in text**    (title >> topics >> summary, weighted)
       - `strong_keywords`       — high-signal terms (boost 0.5)
       - `aliases`               — display/synonyms     (boost 0.3)
       - `intent_keywords`       — broader signals      (boost 0.2)
  4. **Exclude keywords (veto)** — `exclude_keywords` in
                                  profession_registry.json veto a tag
                                  entirely no matter how high the score.

Final per-profession confidence is the SUM of all positive signals,
clamped to [0, 1.0]. Tags above `min_confidence` (default 0.5) emit.

Every emitted tag carries:
  - profession_slug
  - confidence            (float, in [0, 1.0])
  - matched_keywords      (the actual keywords that fired)
  - source_signals        (which source-default / URL-pattern rules fired)
  - rule_version          (so re-runs after rule edits get fresh tags)

Public API:

  classify(title, summary, topics, *, source_slug=None, url=None)
    → list[dict]    one dict per emitted tag (the explainability shape above)

  classify_unlabeled_courses(limit=N)
    → dict          batch ingest helper, identical contract to v0.2 but
                    uses the new rules engine and writes the same
                    profession_relevance rows.
"""
from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models.courses_v2 import CourseV2, ProfessionRelevance
from models.aggregated_items import AggregatedItem
from models.articles import Article

log = logging.getLogger("profession_classifier")

_REGISTRY_FILE = Path(__file__).resolve().parent.parent / "data" / "profession_registry.json"
_SOURCES_FILE  = Path(__file__).resolve().parent.parent / "data" / "courses_sources.json"
_STREAMS_FILE  = Path(__file__).resolve().parent.parent / "data" / "streams_sources.json"

RULE_VERSION = os.environ.get("CLASSIFIER_VERSION", "v0.6-rules-2026-06-04-streams-defaults-honored")
DEFAULT_MIN_CONFIDENCE = float(os.environ.get("CLASSIFIER_MIN_CONFIDENCE", "0.5"))

# Per-signal weights — tunable but tracked under RULE_VERSION so re-tunes
# invalidate cached tags cleanly.
_W_STRONG_TITLE     = 0.50
_W_STRONG_TOPIC     = 0.40
_W_STRONG_SUMMARY   = 0.25
_W_ALIAS_TITLE      = 0.30
_W_ALIAS_TOPIC      = 0.20
_W_ALIAS_SUMMARY    = 0.10
_W_INTENT_TITLE     = 0.20
_W_INTENT_TOPIC     = 0.15
_W_INTENT_SUMMARY   = 0.05
# (source-default and URL-pattern weights live IN the JSON so non-coders
# can re-tune without touching Python.)


# ────────────────────────────────────────────────────────────────────────
# Registry loaders + indexes
# ────────────────────────────────────────────────────────────────────────

def _load_registry() -> dict[str, dict]:
    """profession_slug → profession dict (with lowered keyword lists)."""
    with _REGISTRY_FILE.open(encoding="utf-8") as f:
        rows = json.load(f).get("professions", [])
    out: dict[str, dict] = {}
    for p in rows:
        out[p["slug"]] = {
            "slug": p["slug"],
            "label_en": p["label_en"],
            "strong_keywords":  [k.lower() for k in p.get("strong_keywords",  []) if k],
            "aliases":          [k.lower() for k in p.get("aliases",          []) if k],
            "intent_keywords":  [k.lower() for k in p.get("intent_keywords",  []) if k],
            "exclude_keywords": [k.lower() for k in p.get("exclude_keywords", []) if k],
        }
    return out


def _load_sources() -> dict[str, dict]:
    """source_slug -> source dict with default_professions + url_patterns.

    Merges sources from BOTH data files so that default_professions on
    cert / tool / job / scheme / grant / research / startup manifests
    in streams_sources.json are honored at classification time.

    Without the streams merge, the classifier was silently ignoring the
    default_professions on every aggregator-stream source -- so a Doctor
    cert manifest tagged [["doctor", 0.85]] would only get a 'doctor'
    tag if its title also matched a doctor keyword.  Discovered 2026-06-04
    during the all-13-personas audit (teacher cert = 0 despite 8 tagged
    items).
    """
    out: dict[str, dict] = {}
    with _SOURCES_FILE.open(encoding="utf-8") as f:
        for s in json.load(f).get("sources", []):
            out[s["slug"]] = s
    try:
        with _STREAMS_FILE.open(encoding="utf-8") as f:
            streams = json.load(f).get("streams", {})
        for stream_key, stream_spec in streams.items():
            if stream_key.startswith("_"):
                continue
            for s in stream_spec.get("sources", []) or []:
                # streams_sources.json sources don't always have url_patterns;
                # normalise so the classifier doesn't KeyError later.
                s.setdefault("url_patterns", [])
                s.setdefault("default_professions", [])
                out[s["slug"]] = s
    except Exception:  # noqa: BLE001
        pass
    return out


_REGISTRY = _load_registry()
_SOURCES  = _load_sources()


def reload_rules() -> None:
    """Hot-reload helper for benchmark iterations."""
    global _REGISTRY, _SOURCES
    _REGISTRY = _load_registry()
    _SOURCES = _load_sources()


# ────────────────────────────────────────────────────────────────────────
# Matching primitives
# ────────────────────────────────────────────────────────────────────────

def _word_in(needle: str, haystack: str) -> bool:
    """Token-boundary aware substring match (cheap, no regex compile per call)."""
    if not needle or not haystack:
        return False
    # Treat strong_keywords containing "/" or "." (e.g. "fast.ai", "node.js")
    # as literal substring matches — word boundaries don't behave well there.
    if any(ch in needle for ch in ".+/-"):
        return needle in haystack
    # General case: word boundary on each side
    pattern = r"(?<![a-z0-9])" + re.escape(needle) + r"(?![a-z0-9])"
    return re.search(pattern, haystack) is not None


def _hits(needles: list[str], haystack: str) -> list[str]:
    """Return the subset of needles that match haystack (token-aware)."""
    return [n for n in needles if _word_in(n, haystack)]


# ────────────────────────────────────────────────────────────────────────
# The classifier
# ────────────────────────────────────────────────────────────────────────

def classify(
    title: str,
    summary: Optional[str] = None,
    topics: Optional[str] = None,
    *,
    source_slug: Optional[str] = None,
    url: Optional[str] = None,
    min_confidence: float = DEFAULT_MIN_CONFIDENCE,
) -> list[dict]:
    """Return list of per-profession tag dicts (explainable shape).

    Each dict:
        {
          "profession_slug": str,
          "confidence":      float,                 # in [0, 1.0]
          "matched_keywords": list[str],            # human-readable terms that fired
          "source_signals":  list[str],             # rule traces ("source_default:fast-ai", "url_pattern:/azure/developer")
          "rule_version":    str,
        }
    """
    title_lc   = (title   or "").lower()
    topics_lc  = (topics  or "").lower()
    summary_lc = (summary or "").lower()
    url_lc     = (url     or "").lower()

    # Accumulators keyed by profession_slug
    scores: dict[str, float] = {}
    keywords: dict[str, set[str]] = {}
    signals: dict[str, set[str]] = {}

    def add(slug: str, weight: float, *, kw: Optional[str] = None, signal: Optional[str] = None) -> None:
        scores[slug] = scores.get(slug, 0.0) + weight
        if kw:
            keywords.setdefault(slug, set()).add(kw)
        if signal:
            signals.setdefault(slug, set()).add(signal)

    # ---- Layer 1: source-default tags ----------------------------------
    if source_slug and source_slug in _SOURCES:
        src = _SOURCES[source_slug]
        for entry in src.get("default_professions", []) or []:
            if isinstance(entry, (list, tuple)) and len(entry) == 2:
                slug, w = entry
                if slug in _REGISTRY:
                    add(slug, float(w), signal=f"source_default:{source_slug}")

    # ---- Layer 2: URL pattern rules ------------------------------------
    if source_slug and source_slug in _SOURCES and url_lc:
        for pat in _SOURCES[source_slug].get("url_patterns", []) or []:
            needle = pat.get("match", "").lower()
            if needle and needle in url_lc:
                for entry in pat.get("labels", []) or []:
                    if isinstance(entry, (list, tuple)) and len(entry) == 2:
                        slug, w = entry
                        if slug in _REGISTRY:
                            add(slug, float(w), signal=f"url_pattern:{needle}")

    # ---- Layer 3: keyword hits (title >> topics >> summary) ------------
    for slug, prof in _REGISTRY.items():
        for kw in _hits(prof["strong_keywords"], title_lc):
            add(slug, _W_STRONG_TITLE, kw=kw)
        for kw in _hits(prof["strong_keywords"], topics_lc):
            add(slug, _W_STRONG_TOPIC, kw=kw)
        for kw in _hits(prof["strong_keywords"], summary_lc):
            add(slug, _W_STRONG_SUMMARY, kw=kw)

        for kw in _hits(prof["aliases"], title_lc):
            add(slug, _W_ALIAS_TITLE, kw=kw)
        for kw in _hits(prof["aliases"], topics_lc):
            add(slug, _W_ALIAS_TOPIC, kw=kw)
        for kw in _hits(prof["aliases"], summary_lc):
            add(slug, _W_ALIAS_SUMMARY, kw=kw)

        for kw in _hits(prof["intent_keywords"], title_lc):
            add(slug, _W_INTENT_TITLE, kw=kw)
        for kw in _hits(prof["intent_keywords"], topics_lc):
            add(slug, _W_INTENT_TOPIC, kw=kw)
        for kw in _hits(prof["intent_keywords"], summary_lc):
            add(slug, _W_INTENT_SUMMARY, kw=kw)

    # ---- Layer 4: exclude_keywords (veto) ------------------------------
    full_text = " ".join([title_lc, topics_lc, summary_lc])
    for slug, prof in _REGISTRY.items():
        if not prof["exclude_keywords"]:
            continue
        for kw in prof["exclude_keywords"]:
            if kw and kw in full_text:
                scores.pop(slug, None)
                keywords.pop(slug, None)
                signals.pop(slug, None)
                break

    # ---- Assemble + filter ---------------------------------------------
    out: list[dict] = []
    for slug, raw_score in scores.items():
        conf = round(min(1.0, raw_score), 3)
        if conf < min_confidence:
            continue
        out.append({
            "profession_slug":  slug,
            "confidence":       conf,
            "matched_keywords": sorted(keywords.get(slug, set())),
            "source_signals":   sorted(signals.get(slug, set())),
            "rule_version":     RULE_VERSION,
        })
    out.sort(key=lambda d: -d["confidence"])
    return out


# ────────────────────────────────────────────────────────────────────────
# Batch persist over the courses table
# ────────────────────────────────────────────────────────────────────────

def _persist_tags(item_kind: str, item_id: int, tags: list[dict]) -> int:
    if not tags:
        return 0
    inserted = 0
    with SessionLocal() as db:
        for t in tags:
            row = ProfessionRelevance(
                item_kind=item_kind,
                item_id=item_id,
                profession_slug=t["profession_slug"],
                confidence=t["confidence"],
                classifier_version=t["rule_version"],
            )
            db.add(row)
            try:
                db.commit()
                inserted += 1
            except IntegrityError:
                db.rollback()
                continue
            except Exception as e:  # noqa: BLE001
                db.rollback()
                log.warning("persist tag failed kind=%s id=%s slug=%s: %s",
                            item_kind, item_id, t["profession_slug"], e)
    return inserted


def classify_unlabeled_articles(*, limit: int = 1000) -> dict:
    """Run the rules-only classifier over every news article lacking tags
    at the current RULE_VERSION. Idempotent. News articles have no
    source-default tags or url_patterns (sources are RSS-only) — pure
    keyword classification.
    """
    report = {
        "started_at": datetime.utcnow().isoformat() + "Z",
        "rule_version": RULE_VERSION,
        "min_confidence": DEFAULT_MIN_CONFIDENCE,
        "kind": "article",
        "scanned": 0, "tagged": 0, "untagged": 0, "labels_persisted": 0,
    }
    with SessionLocal() as db:
        existing_q = db.query(ProfessionRelevance.item_id).filter(
            ProfessionRelevance.item_kind == "article",
            ProfessionRelevance.classifier_version == RULE_VERSION,
        ).subquery()
        candidates = (
            db.query(Article)
              .filter(~Article.id.in_(existing_q.select()))
              .order_by(Article.id.asc())
              .limit(limit).all()
        )
        report["scanned"] = len(candidates)
        snapshots = [(a.id, a.title, a.summary, None, a.source_slug, a.url) for a in candidates]

    for cid, title, summary, topics, source_slug, url in snapshots:
        tags = classify(title, summary, topics, source_slug=None, url=url)
        if tags:
            report["tagged"] += 1
            report["labels_persisted"] += _persist_tags("article", cid, tags)
        else:
            report["untagged"] += 1
    report["finished_at"] = datetime.utcnow().isoformat() + "Z"
    return report


def classify_unlabeled_stream_items(*, kind: Optional[str] = None, limit: int = 1000) -> dict:
    """Classify aggregated_items rows (cert/tool/job/scheme/roadmap_node).
    If kind is None, classifies across all kinds."""
    report = {
        "started_at": datetime.utcnow().isoformat() + "Z",
        "rule_version": RULE_VERSION,
        "min_confidence": DEFAULT_MIN_CONFIDENCE,
        "kind": kind or "all",
        "scanned": 0, "tagged": 0, "untagged": 0, "labels_persisted": 0,
    }
    with SessionLocal() as db:
        # Build a query of (item_id, kind) tuples already classified.
        existing_pairs = set(
            (r.item_id, r.item_kind) for r in db.query(
                ProfessionRelevance.item_id, ProfessionRelevance.item_kind
            ).filter(
                ProfessionRelevance.classifier_version == RULE_VERSION,
                ProfessionRelevance.item_kind.in_([
                    "cert", "tool", "job", "scheme", "roadmap_node",
                    "grant", "research", "startup",
                ]),
            )
        )
        q = db.query(AggregatedItem)
        if kind:
            q = q.filter(AggregatedItem.kind == kind)
        candidates = [
            a for a in q.order_by(AggregatedItem.id.asc()).limit(limit).all()
            if (a.id, a.kind) not in existing_pairs
        ]
        report["scanned"] = len(candidates)
        snapshots = [
            (a.id, a.kind, a.title, a.summary, a.topics, a.source_slug, a.url)
            for a in candidates
        ]

    for cid, ckind, title, summary, topics, source_slug, url in snapshots:
        tags = classify(title, summary, topics, source_slug=source_slug, url=url)
        if tags:
            report["tagged"] += 1
            report["labels_persisted"] += _persist_tags(ckind, cid, tags)
        else:
            report["untagged"] += 1
    report["finished_at"] = datetime.utcnow().isoformat() + "Z"
    return report


def classify_unlabeled_courses(*, limit: int = 1000) -> dict:
    """Run the rules-only classifier over every course lacking tags at the
    current RULE_VERSION. Idempotent. Returns a structured report.
    """
    report = {
        "started_at": datetime.utcnow().isoformat() + "Z",
        "rule_version": RULE_VERSION,
        "min_confidence": DEFAULT_MIN_CONFIDENCE,
        "scanned": 0,
        "tagged": 0,
        "untagged": 0,
        "labels_persisted": 0,
    }
    with SessionLocal() as db:
        existing_q = db.query(ProfessionRelevance.item_id).filter(
            ProfessionRelevance.item_kind == "course",
            ProfessionRelevance.classifier_version == RULE_VERSION,
        ).subquery()
        candidates = (
            db.query(CourseV2)
              .filter(~CourseV2.id.in_(existing_q.select()))
              .order_by(CourseV2.id.asc())
              .limit(limit)
              .all()
        )
        report["scanned"] = len(candidates)
        snapshots = [
            (c.id, c.title, c.summary, c.topics, c.source_slug, c.url)
            for c in candidates
        ]

    for cid, title, summary, topics, source_slug, url in snapshots:
        tags = classify(title, summary, topics, source_slug=source_slug, url=url)
        if tags:
            report["tagged"] += 1
            report["labels_persisted"] += _persist_tags("course", cid, tags)
        else:
            report["untagged"] += 1

    report["finished_at"] = datetime.utcnow().isoformat() + "Z"
    return report
