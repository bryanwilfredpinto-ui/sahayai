# CNOS — Observability

> *"Every failure: root cause → fix → re-test → deploy."*

---

## What we track

| Signal | Source | Surface |
|---|---|---|
| Misclassified news | user 👎 + admin reclassify ratio | Founder dashboard |
| Broken links | per-poll HTTP status in `news.ingest_logs` | Founder dashboard |
| Wrong publisher | user 👎 with reason text | Founder dashboard |
| User corrections | feedback widget text | `quality_feedback` table |
| Thumbs-down rate per category | aggregated daily | Founder dashboard |
| Accessibility failures | mobile cert + Lighthouse | per-release report |
| Verification errors (drift / failure to corroborate) | factcheck logs | per-verdict logs |
| Coverage SLA violations | `coverage_sla_check.py` nightly | per-day JSON report |
| Publisher fetch failures | `news_ingest._http_get` per-source `last_error` | source registry |

---

## Failure-handling protocol

For every failure observed:

1. **Root cause** — what produced the failure (rule? source? API? rate limit?)
2. **Fix** — minimum change, maximum impact
3. **Re-test** — run the eval that caught it; expand the eval if it didn't
4. **Deploy** — commit, push, verify on live

Documented per incident in `chitti-news/incidents/` (TO BUILD as needed).

---

## Existing observability surfaces

| Surface | What it shows | Status |
|---|---|---|
| `/admin/coverage-report` | per-(state×lang×cat) counts | ⚠️ partial; map to `coverage_sla_check.py` |
| `/api/news/admin/sources` | per-publisher fetch state | ✅ live (296 sources) |
| `feeds_health.log` | per-poll RSS health | ✅ live |
| chitti-founder daily report | aggregated 👍/👎 per Chitti | ⚠️ Chitti News cards not yet wired |
| QUALITY_STATUS.md | per-product audit history | ✅ updated 2026-06-04 |

---

## Gaps

| Gap | Plan |
|---|---|
| Founder dashboard for chitti-news per-state | extend chitti-founder cards |
| Real-time alerting on verdict drift | webhook from factcheck → Founder |
| Per-card user-feedback aggregation | wire `feedback-widget.js` → `quality_feedback` for news cards |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
