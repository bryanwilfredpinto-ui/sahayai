# Chitti News — EVALS

The ongoing quality bar — what we measure, how, and what counts as a pass.

---

## What we measure

### E1 — Per-(state × language × category) coverage

| | |
|---|---|
| What | For every (state, language, category) triple: ingested article count over last 24h |
| Source | `news_db.feed()` `coverage` payload |
| Pass threshold | For every Indian-state-official-language: per-category count ≥ 5 daily |
| Current status (2026-06-03) | en + hi ≥ 5/category for every state; mr ≥ 5 for MH (verified live: 30 items, 2,151 mr total). bn/te/kn/ml/gu/pa/or under target. |
| Re-run cadence | Hourly (via `/api/news/admin/coverage-report`) |

### E2 — Per-publisher fetch health

| | |
|---|---|
| What | Per-source: fetched count, status, used_cloudscraper, last_error |
| Source | `feeds_health.log` + `news.ingest_logs` |
| Pass threshold | Per-source < 10 % failure rate over 24h rolling window |
| Current status | ⚠️ live; not aggregated into a dashboard yet |
| Re-run cadence | Every poll (default 15-30 min) |

### E3 — Fact-check verdict latency

| | |
|---|---|
| What | Time from article ingest → final verdict (verified / partial / disputed / unverified) |
| Source | `news.fact_checks` timestamps |
| Pass threshold | p50 < 6 hours |
| Current status | ⚠️ live; latency distribution not yet computed |
| Re-run cadence | Per verdict |

### E4 — Cross-reference coverage

| | |
|---|---|
| What | % of articles with ≥2 corroborating sources at verdict time |
| Source | `news.fact_checks.corroborating_sources` |
| Pass threshold | ≥ 0.70 for verified verdicts |
| Current status | ⚠️ live; rate not aggregated |
| Re-run cadence | Daily |

### E5 — Per-category classifier accuracy

| | |
|---|---|
| What | When chitti-news's content-based classifier reclassifies an article, does it match a human label? |
| Dataset | 200-row hand-labelled per-category benchmark (NOT YET BUILT for chitti-news; chitti-news-ai has its own) |
| Pass threshold | F1 ≥ 0.85 per category |
| Current status | ❌ no benchmark dataset yet for chitti-news category classifier |
| Re-run cadence | After every classifier change |

### E6 — Trust Strip rendering coverage

| | |
|---|---|
| What | % of articles whose Trust Strip renders all 4 elements (verdict · corroboration count · publisher trust · reading time) in <2s |
| Pass threshold | 100 % |
| Current status | ✅ Trust Strip locked 2026-05-29 (commit `159ee02`) — but coverage % not measured |
| Re-run cadence | Per cert pass |

### E7 — Per-category sub-agent neutrality (politics)

| | |
|---|---|
| What | For politics articles: % of summaries that contain ANY partisan label / opinion-bearing adjective |
| Dataset | 100 politics articles per quarter |
| Pass threshold | 0 % (hard rule — politics sub-agent is neutral) |
| Current status | ⚠️ enforced by sub-agent prompt; not yet metric-tested |
| Re-run cadence | Quarterly |

### E8 — Cancelled-story respect

| | |
|---|---|
| What | After a user "Cancels" a story, does that story re-appear in their feed? |
| Pass threshold | 0 % (must never re-appear) |
| Current status | ✅ enforced in frontend (localStorage filter); not yet automated test |
| Re-run cadence | Per release |

### E9 — Four-user contract per-card

| | |
|---|---|
| What | Every card has: 🔊 / 🤖 / 👍 / 👎 / 🌐 + ISL panel + Trust Strip + reading time |
| Pass threshold | 100 % |
| Current status | ✅ inherited via `feedback-widget.js` + `chitti_a11y.js` — last cert 2026-05-27 |
| Re-run cadence | Per release (next cert needed post Trust Strip rollout) |

### E10 — Mobile 375 px cert

| | |
|---|---|
| What | Every page renders at 375 px without horizontal scroll; tap targets ≥ 48×48 |
| Pass threshold | All pages |
| Current status | ⚠️ partial — last full cert 2026-05-27 (pre Trust Strip) |
| Re-run cadence | Per release |

---

## The gating rule

| Phase | Gate |
|---|---|
| Current production | E1 (en/hi/mr/ta) + E2 + E3 + E6 + E9 (2026-05-27 cert) |
| Next release gate | E1 for every Indian state language + E5 benchmark created + E9 re-cert post Trust Strip + E10 refreshed |
| **World-class SHIP** | Every E1–E10 PASS; 200+ publishers; trust survey ≥ 0.95 |

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
