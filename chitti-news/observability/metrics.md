# CNOS — Metric Catalog

> *"If we can't measure it, we can't claim it."*

The complete catalog of signals CNOS tracks. Every signal has a definition, a
target, a source (table or script), and an **honest** current status. Most
quality signals are emitted through [`lib/observability.py`](../backend/lib/observability.py)
(the `Observability` object → `quality_audit` table + optional Prometheus +
optional OpenTelemetry). SLA signals come from the nightly cron scripts.

Status legend: ✅ live & green · ⚠️ wired but seed-only / not-aggregated · ❌ not built / no-users-yet

---

## 1. Accuracy metrics (the swarm's correctness)

| # | Metric | Definition | Target | Source | Status |
|---|---|---|---|---|---|
| 1 | Category-classifier F1 | macro-F1 of predicted vs hand-labelled category over the benchmark | ≥ 0.95 (politics ≥ 0.92) | `benchmark_category_200.json` eval (`category_classifier_eval.py` TO BUILD) | ⚠️ 30 seed rows only |
| 2 | Source-attribution accuracy | fraction of cards whose `source_slug` / publisher matches the true RSS origin | ≥ 0.99 | `news.ingest_logs` (source_slug is a mandatory ingest field) | ✅ structural |
| 3 | Verification F1 | macro-F1 of verdict (verified/partial/disputed/unverified) vs ground truth | ≥ 0.95 (verified band ≥ 0.85) | `benchmark_factcheck_200.json` eval (`factcheck_eval.py` TO BUILD) | ⚠️ 20 seed rows only |
| 4 | Cross-reference coverage | share of `verified` verdicts backed by ≥2 corroborating sources | ≥ 0.70 | `news.fact_checks.match_count` | ⚠️ not aggregated |

---

## 2. Coverage & completeness

| # | Metric | Definition | Target | Source | Status |
|---|---|---|---|---|---|
| 5 | Coverage SLA per (state × lang × cat) | per-cell article count in last 24h above per-cell minimum | ≥ 5/day per cell (en national ≥ 50) | [`coverage_sla_check.py`](../backend/scripts/coverage_sla_check.py) nightly JSON | ⚠️ 27/66 pass (multi-lang depth gap) |
| 6 | Vernacular completion rate | states whose official language hits the per-category floor | ≥ 0.95 per state-official lang | `coverage_sla_check.py` (`SLA_REQUIRED_LANGUAGES`) | ⚠️ en/hi/ml/ta/te/pa OK; mr/or/bn/kn/ur/gu below |

---

## 3. Neutrality & trust

| # | Metric | Definition | Target | Source | Status |
|---|---|---|---|---|---|
| 7 | Politics neutrality violations | partisan adjectives / loaded phrases per 100-article politics sample | 0 / 100 | [`neutrality_eval.py`](../backend/scripts/neutrality_eval.py) (`PARTISAN_REGEX`) | ✅ 0/100 |
| 8 | Publisher trust score | per-source weighted trust used to rank corroboration | seeded ≥ 0.5; primary-source > secondary | [`compute_publisher_trust.py`](../backend/scripts/compute_publisher_trust.py) | ⚠️ seed weights only |

---

## 4. Engagement signals (per-card feedback — never doomscroll metrics)

| # | Metric | Definition | Target | Source | Status |
|---|---|---|---|---|---|
| 9 | Per-card 👍/👎 rate | thumbs per card, tagged to card/request id | 👎 rate < 0.05 per category | `quality_feedback` table (via `feedback-widget.js` → `lib/observability.py::hash_ip`) | ⚠️ news cards not yet wired to Founder dashboard |
| 10 | User-correction text rate | free-text corrections submitted per 1000 cards | trend down | `quality_feedback.comment` | ⚠️ no-users-yet |

---

## 5. Latency & reliability

| # | Metric | Definition | Target | Source | Status |
|---|---|---|---|---|---|
| 11 | Feed query p50 latency | median `/api/news/feed` server time | < 300 ms | `chitti_http_latency_ms` histogram (`install_request_timing`) | ❌ untested at scale |
| 12 | Feed query p95 latency | 95th-pct feed server time | < 1 s | `chitti_http_latency_ms` histogram | ❌ untested at scale |
| 13 | Trust-Strip render time | client time to first Trust Strip paint per card | < 2 s | live cert (`cert_chitti_news_v2.mjs`) | ✅ verified |
| 14 | Fact-check verdict latency | time from ingest to published verdict | p50 < 6 h | `news.fact_checks` timestamps | ⚠️ not aggregated |
| 15 | Publisher fetch-failure rate | share of polls returning non-200 / parse error | < 0.05 per source | `news.ingest_logs` HTTP status + `last_error` | ✅ logged, ⚠️ not alerted |

---

## How signals are emitted

`Observability` writes one `quality_audit` row per `request|response|rail|tool|http`
event into the Chitti's own Turso DB. Prometheus counters/histograms
(`chitti_requests_total`, `chitti_latency_ms`, `chitti_http_latency_ms`, …) are
exposed at `/metrics` via `make_metrics_blueprint()` **only if** `prometheus_client`
is installed. OpenTelemetry traces are NO-OP unless `OTEL_EXPORTER_OTLP_ENDPOINT`
is set — adding tracing later is one env var, zero code changes.

---

## Reporting cadence

| Metric class | Cadence | Owner | Surface |
|---|---|---|---|
| Accuracy F1 (cat/verify) | After every classifier / factcheck change | CTO | QUALITY_STATUS.md |
| Coverage SLA + vernacular | Nightly cron | cron | per-day JSON report |
| Neutrality + publisher trust | Weekly cron | cron | per-week JSON report |
| Latency (p50/p95) | Continuous (Prometheus) | CTO | `/metrics` + ops dashboard |
| Per-card feedback | Daily aggregate | CTO | Founder dashboard (wiring pending) |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
