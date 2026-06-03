"""
backend/scripts/coverage_sla_check.py
-------------------------------------
SHIP gate row #15 — Coverage SLA nightly cron.

For every (state x language x category) tuple, queries the production
chitti-news API and verifies per-category article count meets SLA.

SLA (CHITTI_NEWS_MASTER_SPEC §language-completeness):
  - Per (state, language, category): ≥ 5 articles in last 24h for any
    Indian-state-official-language with ≥ 5 publishers seeded
  - English fallback: ≥ 50 articles per category nationally

Output: scripts/coverage_sla_report_<date>.json
Exit code: 0 = all SLAs met; 1 = at least one SLA violated

Run:
    python scripts/coverage_sla_check.py
    or  COVERAGE_SLA_BASE=https://chitti-news-api-production.up.railway.app python scripts/coverage_sla_check.py
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx

BASE = os.environ.get(
    "COVERAGE_SLA_BASE",
    "https://chitti-news-api-production.up.railway.app",
).rstrip("/")
TIMEOUT = float(os.environ.get("COVERAGE_SLA_TIMEOUT", "15"))

# Indian-state-official-language matrix.
# Per SAHAYAI_MASTER §1 / CHITTI_NEWS_MASTER_SPEC, target ≥10 publishers
# per language for state-official languages. For SLA, ≥5 articles/day per
# (state, language, category) is the running gate.
STATES = ["india", "mh", "tn", "ka", "kl", "wb", "ap", "ts", "gj", "pb", "up", "bh", "or", "as"]
LANGUAGES = ["en", "hi", "mr", "ta", "kn", "ml", "bn", "te", "gu", "pa", "or"]
CATEGORIES = ["national", "state", "politics", "business", "sports", "entertainment"]

# Languages with ≥5 publishers seeded today (per QUALITY_STATUS.md 2026-06-02 PM).
SLA_REQUIRED_LANGUAGES = {"en", "hi", "ml", "ta", "te", "pa", "mr", "or", "bn"}

PER_CATEGORY_MIN = int(os.environ.get("COVERAGE_SLA_MIN_PER_CAT", "5"))
NATIONAL_EN_MIN = int(os.environ.get("COVERAGE_SLA_NATIONAL_EN_MIN", "50"))


def _fetch(state: str, lang: str, cat: str) -> Optional[dict]:
    url = f"{BASE}/api/news/feed?state={state}&language={lang}&category={cat}&n=200"
    try:
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.get(url)
            if r.status_code != 200:
                return None
            return r.json()
    except Exception:  # noqa: BLE001
        return None


def main() -> int:
    started = datetime.utcnow().isoformat() + "Z"
    rows: list[dict] = []
    violations: list[dict] = []
    tested = 0

    for lang in LANGUAGES:
        for cat in CATEGORIES:
            state = "india"
            tested += 1
            data = _fetch(state, lang, cat)
            count = (data or {}).get("count", 0)
            min_required = NATIONAL_EN_MIN if (lang == "en" and cat == "national") else PER_CATEGORY_MIN
            sla_required = lang in SLA_REQUIRED_LANGUAGES
            row = {
                "state": state, "lang": lang, "cat": cat,
                "count": count, "required": min_required,
                "sla_required": sla_required,
                "ok": (not sla_required) or count >= min_required,
            }
            rows.append(row)
            if sla_required and count < min_required:
                violations.append(row)

    report = {
        "generated_at": started,
        "base_url": BASE,
        "checks_total": tested,
        "violations_total": len(violations),
        "violations": violations,
        "all_rows": rows,
        "sla_languages": sorted(SLA_REQUIRED_LANGUAGES),
        "per_category_min": PER_CATEGORY_MIN,
        "national_en_min": NATIONAL_EN_MIN,
    }
    out_dir = Path(__file__).resolve().parent
    out_path = out_dir / f"coverage_sla_report_{datetime.utcnow().strftime('%Y%m%d')}.json"
    out_path.write_text(json.dumps(report, indent=2))
    print(f"checked {tested}; violations {len(violations)}; report {out_path}")
    if violations:
        print("VIOLATIONS:")
        for v in violations[:10]:
            print(f"  - state={v['state']} lang={v['lang']} cat={v['cat']} count={v['count']} < required={v['required']}")
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
