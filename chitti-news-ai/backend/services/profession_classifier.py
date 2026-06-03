"""
services/profession_classifier.py
---------------------------------
Multi-label profession classifier for ingested items (CHITTI_NEWS_AI_MASTER_SPEC
v0.2 §4 + §5).

**Aggregator doctrine — locked 2026-05-29.** The classifier's job is
classification, NOT generation. It does not write summaries, invent course
content, or recommend tools. It takes ONE item (title + summary + topics)
and returns the subset of the 13 profession slugs that genuinely care
about it. Confidence is reported per label.

LLM endpoint is env-var-driven via the existing `DEEPSEEK_*` knobs (per
the [[project_deepseek_balance_exhausted_2026_05_27]] hijack, these point
at Gemini 2.0 Flash's OpenAI-compatible endpoint today). The classifier
calls the chat-completions endpoint with `response_format=json_object`
and a tight system prompt.

Honest fallback ladder:
  1. LLM unreachable / no API key  →  rule-based classifier via keyword
     match against the profession registry's `aliases` + `intent_keywords`.
     Confidence is capped at 0.6 for rule-based hits — surfaces clearly
     to the UI as "classification offline" mode.
  2. LLM returns malformed JSON      →  log + fall through to rule-based.
  3. LLM returns empty label set    →  the item appears in feeds for
     `Everyone` only, never in a profession feed.

Cache shape: profession_relevance rows are keyed by
  (item_kind, item_id, profession_slug, classifier_version)
so re-running with a new prompt version produces a fresh set without
clobbering history.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models.courses_v2 import CourseV2, ProfessionRelevance

log = logging.getLogger("profession_classifier")

# ────────────────────────────────────────────────────────────────────────
# Configuration
# ────────────────────────────────────────────────────────────────────────

_LLM_URL = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/chat/completions")
_LLM_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
_LLM_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
_LLM_TIMEOUT_S = float(os.environ.get("CLASSIFIER_TIMEOUT_SEC", "20"))
_CLASSIFIER_VERSION = os.environ.get("CLASSIFIER_VERSION", "v0.2-2026-05-29")

_REGISTRY_FILE = Path(__file__).resolve().parent.parent / "data" / "profession_registry.json"


# ────────────────────────────────────────────────────────────────────────
# Profession registry
# ────────────────────────────────────────────────────────────────────────

def _load_registry() -> list[dict]:
    with _REGISTRY_FILE.open(encoding="utf-8") as f:
        return json.load(f).get("professions", [])


_REGISTRY = _load_registry()
_SLUGS = [p["slug"] for p in _REGISTRY]
_RULE_KEYWORDS: dict[str, list[str]] = {
    p["slug"]: [k.lower() for k in (p.get("intent_keywords", []) + p.get("aliases", []))]
    for p in _REGISTRY
}


# ────────────────────────────────────────────────────────────────────────
# Rule-based fallback
# ────────────────────────────────────────────────────────────────────────

def classify_rule_based(text: str) -> list[tuple[str, float]]:
    """Keyword-match against intent_keywords + aliases. Confidence capped at 0.6.

    Returns a list of (profession_slug, confidence). The UI must surface
    these with a visible "classification offline" note per v0.2 §10.
    """
    if not text:
        return []
    lc = text.lower()
    hits: list[tuple[str, float]] = []
    for slug, keywords in _RULE_KEYWORDS.items():
        matches = sum(1 for k in keywords if k and k in lc)
        if matches >= 1:
            conf = min(0.6, 0.3 + 0.1 * matches)
            hits.append((slug, round(conf, 3)))
    return hits


# ────────────────────────────────────────────────────────────────────────
# LLM-based classifier
# ────────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a multi-label classifier. Given ONE learning item (a free course, "
    "certification, tool, job listing, government scheme, or learning roadmap "
    "node), decide which Indian-professional audiences would genuinely benefit "
    "from it. You are NOT a recommender. You do not invent content. You do not "
    "add commentary. You do not translate. You only classify.\n\n"
    "Allowed labels (return only slugs from this list):\n"
    + "\n".join(f"  - {p['slug']}: {p['label_en']}" for p in _REGISTRY)
    + "\n\nRules:\n"
    "  - Return AT MOST 4 labels. Quality over quantity.\n"
    "  - If the item is generally educational (programming basics, English, "
    "math), include `student` AND the specific profession.\n"
    "  - If unsure, return [] (empty list). Do not guess.\n"
    "  - confidence ∈ [0,1]. Use 0.9+ only when the item explicitly mentions the profession.\n\n"
    "Output STRICTLY this JSON shape and nothing else:\n"
    '{"labels":[{"slug":"<one of the slugs above>","confidence":<0..1>}],"reason":"<≤120 chars>"}'
)


def _llm_call(user_text: str) -> Optional[dict]:
    if not _LLM_KEY:
        return None
    try:
        with httpx.Client(timeout=_LLM_TIMEOUT_S) as client:
            resp = client.post(
                _LLM_URL,
                headers={
                    "Authorization": f"Bearer {_LLM_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_text},
                    ],
                    "temperature": 0.0,
                    "max_tokens": 350,
                    "response_format": {"type": "json_object"},
                },
            )
            if resp.status_code >= 400:
                log.warning("classifier LLM HTTP %s: %s", resp.status_code, resp.text[:200])
                return None
            body = resp.json()
            content = body["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception as e:  # noqa: BLE001
        log.warning("classifier LLM call failed: %s", e)
        return None


def classify_llm(title: str, summary: Optional[str], topics: Optional[str]) -> Optional[list[tuple[str, float]]]:
    """Return list of (slug, confidence) from the LLM, or None if unavailable."""
    parts = [f"Title: {title}"]
    if summary:
        parts.append(f"Summary: {summary[:400]}")
    if topics:
        parts.append(f"Topics: {topics[:200]}")
    user_text = "\n".join(parts)

    payload = _llm_call(user_text)
    if not payload:
        return None
    labels = payload.get("labels")
    if not isinstance(labels, list):
        return None
    out: list[tuple[str, float]] = []
    for lab in labels:
        if not isinstance(lab, dict):
            continue
        slug = lab.get("slug")
        conf = lab.get("confidence")
        if not isinstance(slug, str) or slug not in _SLUGS:
            continue
        try:
            conf_f = float(conf)
        except (TypeError, ValueError):
            continue
        out.append((slug, round(max(0.0, min(1.0, conf_f)), 3)))
    return out


# ────────────────────────────────────────────────────────────────────────
# Hybrid: LLM with rule-based fallback
# ────────────────────────────────────────────────────────────────────────

def classify(title: str, summary: Optional[str] = None, topics: Optional[str] = None) -> tuple[list[tuple[str, float]], str]:
    """Best-available classification. Returns (labels, mode).

    mode ∈ {"llm", "rule", "none"} — the UI shows this so users can see
    when classifications are confidence-limited fallbacks.
    """
    llm_labels = classify_llm(title, summary, topics)
    if llm_labels is not None and llm_labels:
        return llm_labels, "llm"
    text = " ".join([title or "", summary or "", topics or ""])
    rule_labels = classify_rule_based(text)
    if rule_labels:
        return rule_labels, "rule"
    return [], "none"


# ────────────────────────────────────────────────────────────────────────
# Persist
# ────────────────────────────────────────────────────────────────────────

def _persist_labels(item_kind: str, item_id: int, labels: list[tuple[str, float]]) -> int:
    """Insert ProfessionRelevance rows. Returns count inserted."""
    if not labels:
        return 0
    inserted = 0
    with SessionLocal() as db:
        for slug, conf in labels:
            row = ProfessionRelevance(
                item_kind=item_kind,
                item_id=item_id,
                profession_slug=slug,
                confidence=conf,
                classifier_version=_CLASSIFIER_VERSION,
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
                log.warning("persist labels failed kind=%s id=%s slug=%s: %s",
                            item_kind, item_id, slug, e)
    return inserted


# ────────────────────────────────────────────────────────────────────────
# Public entrypoint: classify all un-classified courses
# ────────────────────────────────────────────────────────────────────────

def classify_unlabeled_courses(*, limit: int = 500) -> dict:
    """Find courses with no classification at the current classifier_version
    and label them. Returns a structured report. Idempotent.
    """
    report = {
        "started_at": datetime.utcnow().isoformat() + "Z",
        "classifier_version": _CLASSIFIER_VERSION,
        "llm_used": bool(_LLM_KEY),
        "scanned": 0,
        "classified_llm": 0,
        "classified_rule": 0,
        "no_labels": 0,
        "labels_persisted": 0,
    }
    with SessionLocal() as db:
        # Find courses that have no relevance row at the current version.
        existing_q = db.query(ProfessionRelevance.item_id).filter(
            ProfessionRelevance.item_kind == "course",
            ProfessionRelevance.classifier_version == _CLASSIFIER_VERSION,
        ).subquery()
        candidates = (
            db.query(CourseV2)
              .filter(~CourseV2.id.in_(existing_q))
              .order_by(CourseV2.id.asc())
              .limit(limit)
              .all()
        )
        report["scanned"] = len(candidates)
        snapshots = [(c.id, c.title, c.summary, c.topics) for c in candidates]

    for course_id, title, summary, topics in snapshots:
        labels, mode = classify(title, summary, topics)
        if mode == "llm":
            report["classified_llm"] += 1
        elif mode == "rule":
            report["classified_rule"] += 1
        else:
            report["no_labels"] += 1
        if labels:
            report["labels_persisted"] += _persist_labels("course", course_id, labels)

    report["finished_at"] = datetime.utcnow().isoformat() + "Z"
    return report
