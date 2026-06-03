# CNAIOS — Observability

> *"Every failure: root cause → fix → re-test → deploy."*

---

## What we track

| Signal | Source | Surface |
|---|---|---|
| Per-card 👍 / 👎 | `feedback-widget.js` | `quality_feedback` table |
| Misclassified item (low confidence + 👎) | rule classifier + user feedback | per-rule-version aggregate |
| Broken-link rate per source | weekly HEAD probe (PENDING build) | Founder dashboard |
| Per-source dead-link percentage | `last_verified_status` per row in `aggregated_items` | Founder dashboard |
| Boot-time ingest landed counts | `[boot]` log lines | Railway logs |
| Scheduler run outcomes | `streams_refresh` + `classify_sweep` | Railway logs |
| LLM fallback rate (extractive vs llm) | `enhancement.explain` response `source` field | aggregate per day |
| Mobile cert PASS rate | `cert_news_ai.mjs` JSON | per-release |
| Per-profession FN list (from benchmark) | benchmark harness | per-rule-version |

---

## Admin endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/news-ai/feed/admin/stats` | counts per kind + per profession (METRICS_TOKEN-gated) |
| `POST /api/news-ai/feed/admin/ingest/courses-now` | trigger ingest |
| `POST /api/news-ai/feed/admin/ingest/streams-now` | trigger ingest |
| `POST /api/news-ai/feed/admin/classify/all-now` | trigger classify |

All gated by `METRICS_TOKEN` env var.

---

## Existing observability surfaces

| Surface | Status |
|---|---|
| Railway logs (real-time) | ✅ live |
| `/api/news-ai/feed/admin/stats` | ✅ live |
| `cert_news_ai_result.json` | ✅ per-cert run |
| `benchmark_report.json` | ✅ per-benchmark run |
| QUALITY_STATUS.md | ✅ updated 2026-06-04 |
| Founder dashboard cards | ⚠️ chitti-news-ai cards not yet wired |

---

## Gaps

| Gap | Plan |
|---|---|
| Founder dashboard for chitti-news-ai | extend chitti-founder with feed-route + cards |
| Real-time LLM-fallback-rate alerting | aggregate `enhancement.explain.source` per day |
| Per-source weekly HEAD probe cron | new script |
| Per-profession-FN visibility per release | publish `benchmark_report.json` artifact |

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
