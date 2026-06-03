"""
backend/scripts/neutrality_eval.py
----------------------------------
SHIP gate row #14 — Politics neutrality eval.

Pulls 100 politics articles from production and scans their `chitti_insight`
+ `summary` fields for:
  - Partisan labels (party-specific adjectives, opinion words)
  - Loaded phrases ("propaganda", "anti-national", "communal", etc.)
  - First-person opinion verbs ("believe", "insist", "we hope")

Hard rule per [skills/chitti-news-politics/](../skills/chitti-news-politics/):
  Politics summaries must be neutral. Zero partisan adjectives. Equal
  coverage. Factual only.

Pass: 0 violations across the 100-article sample.
Output: scripts/neutrality_report_<date>.json
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

import httpx

BASE = os.environ.get(
    "NEUTRALITY_EVAL_BASE",
    "https://chitti-news-api-production.up.railway.app",
).rstrip("/")

# Adjectives + phrases that signal partisan slant. Hand-curated; not exhaustive.
# Note: case-insensitive match. We do NOT flag party NAMES (BJP, Congress,
# AAP, etc.) — naming a party is factual; labelling its action is not.
PARTISAN_LABELS = [
    # Pejoratives
    "anti-national", "anti national", "anti-bharat", "anti bharat",
    "communal", "casteist", "fundamentalist", "extremist", "radical",
    "propaganda", "ploy", "sham", "farce", "outrage",
    "warmongering", "warmonger",
    # Loaded adjectives
    "ill-conceived", "ill conceived", "misguided", "incompetent",
    "corrupt regime", "corrupt government",
    "great victory", "historic blunder", "historic mistake",
    "shameful", "appalling", "deplorable",
    # Opinion-bearing phrases in news context
    "rightly so", "as expected", "predictably",
    "we believe", "we hope", "in our view",
    "let us be clear", "make no mistake",
    # Conspiracy framing
    "covert agenda", "hidden agenda", "secret plot",
    "deep state",
]
PARTISAN_REGEX = re.compile(
    r"(?<![a-z])(" + "|".join(re.escape(t) for t in PARTISAN_LABELS) + r")(?![a-z])",
    re.IGNORECASE,
)


def _fetch_politics_sample(n: int = 100) -> list[dict]:
    """Pull up to N politics articles across recent multi-state coverage."""
    items: list[dict] = []
    states = ["india", "mh", "tn", "ka", "kl", "wb", "ap", "ts", "gj", "pb", "up", "bh", "or"]
    for st in states:
        if len(items) >= n:
            break
        url = f"{BASE}/api/news/feed?state={st}&language=en&category=politics&n=20"
        try:
            with httpx.Client(timeout=20) as c:
                r = c.get(url)
                if r.status_code != 200:
                    continue
                data = r.json()
                for it in (data.get("items") or []):
                    items.append({
                        "id": it.get("id"),
                        "title": it.get("title"),
                        "summary": it.get("summary") or "",
                        "chitti_insight": (it.get("chitti_insight") or {}),
                        "source_name": it.get("source_name"),
                        "state": st,
                    })
                    if len(items) >= n:
                        break
        except Exception:  # noqa: BLE001
            continue
    return items[:n]


def _scan(article: dict) -> list[str]:
    fields = [
        article.get("summary") or "",
    ]
    insight = article.get("chitti_insight") or {}
    if isinstance(insight, dict):
        for k in ("text", "bullets", "summary"):
            v = insight.get(k)
            if isinstance(v, str):
                fields.append(v)
            elif isinstance(v, list):
                for s in v:
                    if isinstance(s, str):
                        fields.append(s)
    hits: list[str] = []
    for f in fields:
        for m in PARTISAN_REGEX.finditer(f):
            hits.append(m.group(0).lower())
    return list(set(hits))


def main() -> int:
    print(f"Pulling politics sample from {BASE}…")
    articles = _fetch_politics_sample(100)
    if not articles:
        print("ERROR: no politics articles retrieved — cannot run eval.")
        return 2
    print(f"Got {len(articles)} articles")

    violations: list[dict] = []
    for a in articles:
        hits = _scan(a)
        if hits:
            violations.append({
                "id": a.get("id"),
                "title": a.get("title", "")[:120],
                "source": a.get("source_name"),
                "state": a.get("state"),
                "partisan_hits": hits,
            })

    report = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "base_url": BASE,
        "articles_sampled": len(articles),
        "violations_total": len(violations),
        "pass": len(violations) == 0,
        "violations": violations,
        "partisan_label_list_size": len(PARTISAN_LABELS),
    }
    out_dir = Path(__file__).resolve().parent
    out_path = out_dir / f"neutrality_report_{datetime.utcnow().strftime('%Y%m%d')}.json"
    out_path.write_text(json.dumps(report, indent=2))
    print(f"\nSampled: {len(articles)} · Violations: {len(violations)} · Pass: {report['pass']}")
    print(f"Report: {out_path}")
    if violations:
        print("VIOLATIONS (first 10):")
        for v in violations[:10]:
            print(f"  - [{v['source']}] {v['title']!r} hits={v['partisan_hits']}")
    return 0 if not violations else 1


if __name__ == "__main__":
    sys.exit(main())
