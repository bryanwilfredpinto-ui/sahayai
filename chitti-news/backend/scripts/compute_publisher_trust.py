"""
backend/scripts/compute_publisher_trust.py
------------------------------------------
SHIP gate row #11 — per-publisher trust score computation.

Pulls article + fact-check data from the live API + aggregates per-source:
  trust_score = 50 + 5 * verified_pct - 10 * disputed_pct - 3 * unverified_pct
  clamped to [0, 100]

Outputs:
  scripts/publisher_trust_scores_<date>.json    — full ranked list
  scripts/publisher_trust_top_low.json          — top 20 + lowest 20 (for ops)

Trust scoring is rules-only (no LLM). Per-publisher score is computed
from fact-check verdicts in the production DB; the methodology is
auditable + reproducible per run.

Run:
    python scripts/compute_publisher_trust.py
"""
from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx

BASE = os.environ.get(
    "TRUST_BASE",
    "https://chitti-news-api-production.up.railway.app",
).rstrip("/")
TIMEOUT = float(os.environ.get("TRUST_TIMEOUT", "20"))

# Sample size per (state, language, category) tuple.
SAMPLE_PER_FEED = int(os.environ.get("TRUST_SAMPLE_PER_FEED", "50"))


def _fetch(state: str, lang: str, cat: str) -> list[dict]:
    url = f"{BASE}/api/news/feed?state={state}&language={lang}&category={cat}&n={SAMPLE_PER_FEED}"
    try:
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.get(url)
            if r.status_code != 200:
                return []
            return (r.json() or {}).get("items") or []
    except Exception:
        return []


def _verdict_from(item: dict) -> Optional[str]:
    fc = item.get("factcheck") or {}
    if not isinstance(fc, dict):
        return None
    # Verdict shape varies by build; try a few keys.
    return (fc.get("verdict")
            or fc.get("rating")
            or fc.get("label")
            or _verdict_from_confidence(fc))


def _verdict_from_confidence(fc: dict) -> Optional[str]:
    """Fallback: derive verdict band from confidence + match_count."""
    conf = fc.get("confidence")
    mc = fc.get("match_count")
    if not isinstance(conf, (int, float)):
        return None
    if mc and mc >= 2 and conf >= 70:
        return "verified"
    if conf >= 50:
        return "partial"
    if conf >= 25:
        return "unverified"
    return "disputed"


def _score(per_source: dict) -> dict:
    """Compute trust_score per source from verdict counts."""
    total = sum(per_source.values())
    if total == 0:
        return {"score": 50.0, "band": "unknown", "n_articles": 0, "verdicts": dict(per_source)}
    verified_pct = 100.0 * per_source.get("verified", 0) / total
    disputed_pct = 100.0 * per_source.get("disputed", 0) / total
    unverified_pct = 100.0 * per_source.get("unverified", 0) / total
    raw = 50.0 + 0.5 * verified_pct - 1.0 * disputed_pct - 0.3 * unverified_pct
    score = max(0.0, min(100.0, raw))
    if score >= 80:
        band = "trusted"
    elif score >= 60:
        band = "acceptable"
    elif score >= 40:
        band = "questionable"
    else:
        band = "reject"
    return {
        "score": round(score, 1),
        "band": band,
        "n_articles": total,
        "verdicts": dict(per_source),
    }


def main() -> int:
    print(f"Computing per-publisher trust scores from {BASE}…")
    states = ["india", "mh", "tn", "ka", "kl", "wb", "ap", "ts", "gj", "pb", "up", "bh", "or", "as", "rj", "mp"]
    languages = ["en", "hi", "mr", "ta", "bn", "te", "kn", "ml", "gu", "pa", "or"]
    categories = ["national", "state", "politics", "business", "sports", "entertainment"]

    per_source_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    seen_articles: set[int] = set()
    total_pulled = 0

    for state in states[:10]:  # limit per-run scope; production cron can widen
        for lang in languages[:6]:
            for cat in categories[:4]:
                items = _fetch(state, lang, cat)
                for it in items:
                    aid = it.get("id")
                    if aid is None or aid in seen_articles:
                        continue
                    seen_articles.add(aid)
                    total_pulled += 1
                    src = it.get("source_name") or it.get("source_slug") or "unknown"
                    verdict = _verdict_from(it) or "unverified"
                    per_source_counts[src][verdict] += 1

    print(f"Pulled {total_pulled} unique articles across {len(per_source_counts)} publishers.")

    scores = []
    for src, counts in per_source_counts.items():
        result = _score(counts)
        result["source_name"] = src
        scores.append(result)

    scores.sort(key=lambda r: -r["score"])

    report = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "base_url": BASE,
        "articles_sampled": total_pulled,
        "publishers": len(scores),
        "methodology": (
            "trust_score = 50 + 0.5 * verified_pct - 1.0 * disputed_pct - 0.3 * unverified_pct, "
            "clamped [0,100]. Bands: trusted ≥80, acceptable ≥60, questionable ≥40, reject <40."
        ),
        "scores": scores,
    }
    out_dir = Path(__file__).resolve().parent
    out_path = out_dir / f"publisher_trust_scores_{datetime.utcnow().strftime('%Y%m%d')}.json"
    out_path.write_text(json.dumps(report, indent=2))

    # Also write a top/low summary
    summary = {
        "generated_at": report["generated_at"],
        "top_20_trusted": scores[:20],
        "bottom_20_reject_or_questionable": [s for s in scores if s["band"] in ("reject", "questionable")][:20],
        "band_counts": {
            "trusted":     sum(1 for s in scores if s["band"] == "trusted"),
            "acceptable":  sum(1 for s in scores if s["band"] == "acceptable"),
            "questionable":sum(1 for s in scores if s["band"] == "questionable"),
            "reject":      sum(1 for s in scores if s["band"] == "reject"),
            "unknown":     sum(1 for s in scores if s["band"] == "unknown"),
        },
    }
    summary_path = out_dir / "publisher_trust_top_low.json"
    summary_path.write_text(json.dumps(summary, indent=2))

    print(f"Full report:  {out_path}")
    print(f"Summary:      {summary_path}")
    print(f"Bands: {summary['band_counts']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
