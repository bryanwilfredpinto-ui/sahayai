# Chitti News AI — EVALS

The ongoing quality bar — what we measure, how, and what counts as a pass.

> Foundational benchmark report: [PHASE_0_BENCHMARK.md](PHASE_0_BENCHMARK.md). EVALS.md is the rolling contract; PHASE_0_BENCHMARK is the 2026-05-29 snapshot.

---

## What we measure

### E1 — Classification F1 per profession (rules-only)

| | |
|---|---|
| Dataset | [`backend/data/benchmark_200.json`](backend/data/benchmark_200.json) — 250 hand-labelled rows, stratified across 8 sources + Sire's worked examples |
| Harness | `c:/tmp/benchmark_harness.py` (committed soon to `chitti-news-ai/scripts/benchmark_harness.py`) |
| Output | Per-profession precision / recall / F1 / FP-list / FN-list / rule-contribution breakdown |
| Pass threshold | F1 ≥ 0.85 for every profession |
| Current status (2026-06-03) | 12 / 13 PASS; business-owner at 0.833 (Power Platform ambiguity in ground truth) |
| Re-run cadence | After every rule edit + weekly on Sunday cron |

### E2 — Fail-open contract

| | |
|---|---|
| Dataset | 4 known cases + 4 generated edge cases |
| Harness | [`backend/tests/test_fail_open.py`](backend/tests/test_fail_open.py) — 6 tests |
| Pass threshold | 100 % with every LLM env var unset |
| Current status | 6 / 6 PASS |
| Re-run cadence | Pre-commit (manual today; CI in v0.4) |

### E3 — Source freshness

| | |
|---|---|
| What | Per-source `last_verified_at` + HTTP HEAD probe of 30 random items |
| Pass threshold | Broken-link rate < 5 %; staleness median < 30 days for live sources |
| Current status (Phase 0) | 0 / 30 broken; static manifests by definition have higher staleness |
| Re-run cadence | Weekly Sunday 09:00 IST |

### E4 — Live ingest health

| | |
|---|---|
| What | Per-source per-poll: fetched + inserted + elapsed + error |
| Pass threshold | Per-source < 5 % failure rate over 7-day rolling window |
| Current status | Per-poll logs live in [`feeds_health.log`](feeds_health.log) equivalent for news-ai |
| Re-run cadence | Every poll (6 h for streams; configurable for news) |

### E5 — Per-card explainability coverage

| | |
|---|---|
| What | % of classified cards that render a complete "ℹ Why this matters" disclosure (category + confidence + matched_keywords + source_signals + rule_version) |
| Pass threshold | 100 % |
| Current status | 100 % (CI-derived from `feed.py::_explain` re-derivation logic) |
| Re-run cadence | Per response (the disclosure is rendered every time) |

### E6 — Four-user contract per-card

| | |
|---|---|
| What | Every card carries the 5 elements: 🔊 / 🤖 / 👍 / 👎 / 🌐 |
| Pass threshold | Every card |
| Current status | ❌ FAIL on the new For You + per-stream cards (feedback-widget.js doesn't auto-attach to `.art-card` inside new `data-chitti-response` wrappers in the new markup) |
| Re-run cadence | Per cert pass |

### E7 — Mobile 375 px cert

| | |
|---|---|
| What | All 5 stream tabs + For You render at 375 px without horizontal scroll; tap targets ≥ 48×48 |
| Pass threshold | All 6 pages (4 original + For You + 5 new stream tabs = 10 page-states) pass |
| Current status | ❌ untested |
| Re-run cadence | Per release |

### E8 — Trust score user survey

| | |
|---|---|
| What | Per-card "Was this useful?" survey overlaid on 👍/👎 |
| Pass threshold | ≥ 0.95 of responses say "real, useful source" |
| Current status | ❌ no signal yet (no users yet) |
| Re-run cadence | Quarterly when DAU > 100 |

### E9 — Career-outcome user survey (12-month)

| | |
|---|---|
| What | "Did Chitti help you learn / get a job / earn more in the last year?" |
| Pass threshold | ≥ 0.40 yes |
| Current status | ❌ no users yet |
| Re-run cadence | Annual |

---

## The gating rule (Phase 0 → Phase 1 → SHIP)

| Phase | Gate | Status |
|---|---|---|
| Phase 0 (locked) | E1 PASS for software-developer + E2 + E3 + E4 + E5 | ✅ ALL PASS |
| Phase 1 (in flight) | E1 PASS for 12 of 13 + E2 + E5 + frontend live | ✅ 12/13 + 6/6 + 100% + LIVE |
| **SHIP (v1.0)** | E1 PASS for 13/13 + E6 + E7 + Turso wired in prod | ❌ business-owner + four-user contract + mobile cert + Turso |

---

## What we will measure when we have users

Per [PRODUCT_VISION.md](PRODUCT_VISION.md) north-star metrics:

| | Target |
|---|---|
| Time-to-useful-answer | < 10 s |
| Trust score (survey) | ≥ 0.95 |
| 12-month career-outcome impact | ≥ 0.40 |

These metrics CANNOT be measured today (no DAU). They're the gate to call this "world-class".

---

**World Class Chitti News AI — Commando Discipline. Zero Excuses.**
