# CNOS — SUCCESS METRICS

The numeric bars. If we can't measure it, we can't claim it.

---

## North-star metrics (the 3 we live or die by)

| # | Metric | Target | How measured | Status |
|---|---|---|---|---|
| 1 | **Vernacular completion rate** | ≥ 0.95 for every state-official language: user picks Marathi → gets ≥10 mr stories per category | nightly cron `coverage_sla_check.py` | ⚠️ en/hi/ml/ta/te/pa ≥ target; mr/or/bn/kn/ur/gu below |
| 2 | **Trust score** | ≥ 0.95 per-card user survey: *"Did this come from a real source?"* | post-launch quarterly survey | ❌ no users yet |
| 3 | **Time-to-informed** | < 90 s: user opens → reads 3 "Chitti's Take" bullets → caught up | session analytics (privacy-respecting, on-device aggregate) | ❌ no analytics yet |

---

## Operating metrics (the daily green-lights)

| Metric | Target | Source | Status |
|---|---|---|---|
| Category accuracy F1 | ≥ 0.95 per category | `benchmark_category_200.json` eval | ⚠️ 30 seed rows only |
| Source attribution accuracy | ≥ 0.99 | `news.ingest_logs` (no source mis-tagging) | ✅ structural |
| Verification accuracy F1 | ≥ 0.95 per verdict band | `benchmark_factcheck_200.json` eval | ⚠️ 20 seed rows only |
| Accessibility A+ | every card ≥ 5 elements (🔊/🤖/👍/👎/✏️🎙️) | `cert_chitti_news_v2.mjs` | ✅ 13/14 PASS |
| Trust Strip render | <2 s per card | live cert | ✅ verified |
| Feed query p50 latency | < 300 ms | k6 / Locust | ❌ untested |
| Feed query p95 latency | < 1 s | k6 / Locust | ❌ untested |
| Fact-check verdict latency | p50 < 6 h | `news.fact_checks` timestamps | ⚠️ not aggregated |
| Cross-reference coverage | ≥ 0.70 for verified verdicts | `news.fact_checks.match_count` | ⚠️ not aggregated |
| Cancelled-story respect | 100 % (cancelled never re-appears) | `cert_cancelled_story.mjs` | ✅ 4/4 PASS |
| Politics neutrality | 0 partisan adjectives per 100-article sample | `scripts/neutrality_eval.py` | ✅ 0/100 violations |
| Coverage SLA | 100 % of (state×lang×cat) above per-cell minimum | `scripts/coverage_sla_check.py` | ⚠️ 27/66 pass (mostly multi-language gap) |

---

## Anti-metrics (we must NOT optimise these)

| Anti-metric | Why we refuse to track |
|---|---|
| Time-on-app | Doomscroll incentive — anti-Founder-rule |
| Stories-per-session | Volume ≠ value |
| Click-through rate on headlines | Click-through incentivises clickbait |
| Sponsored-content revenue | No ads, ever |
| Reader political-party inference | Privacy + neutrality hard rules |

---

## Reporting cadence

| Metric class | Cadence | Owner | Surface |
|---|---|---|---|
| North-star metrics | Quarterly survey + monthly DAU snapshot | Sire | Founder dashboard |
| Operating metrics | Daily cron + commit-time benchmark | CTO | QUALITY_STATUS.md + SHIP.md + control_panel |
| Anti-metric audit | Quarterly review | Sire | confirms we are NOT measuring them |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
