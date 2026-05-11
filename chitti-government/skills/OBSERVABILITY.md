# OBSERVABILITY — Chitti Government

What we log, what we expose, what we alert on. Anonymous-by-default — no user identifier ever leaves the device for an eligibility check.

## Scheduler — `/api/government/scheduler/status`

`services/government_scheduler.py` runs three APScheduler jobs:

| Job | Cadence | Status |
| --- | --- | --- |
| `pib_poll` | every 6 h | live since v1 |
| `cleanup_old_pib` | nightly | live since v1 |
| `heartbeat` | every 15 min | live since v1 |
| `myscheme_refresh` | nightly @ 02:00 IST | **unwired** ([`../TODO.md`](../TODO.md) item 3) |
| `document_expiry_sweep` | nightly | **unwired** ([`../TODO.md`](../TODO.md) item 2) |

Each run writes one row to `government.ingest_logs` with `{job, started_at, finished_at, items_in, items_kept, error}`. Observable via `/api/government/freshness`.

## DeepSeek vs rule-engine fallback rate

The eligibility response envelope flags the path:

```json
{ "source": "deepseek" | "rule_engine_fallback",
  "error": "deepseek_http_429"  /* optional */ }
```

The frontend shows an "offline mode" badge when `source == "rule_engine_fallback"`. Track the ratio over time — a rising fallback rate signals a DeepSeek outage or a missing key, and the user still gets a deterministic reply.

## Eligibility-check accuracy

The rule engine is deterministic, so "accuracy" here means: does the predicate set in `schemes_seed.json` reflect the actual scheme's published rules? Audit signal — the anonymous feedback row at `/api/government/feedback` lets a user thumb-down a verdict with a 240-char note. Aggregated at `/api/government/feedback/summary` by `{feature, scheme_slug}`. A scheme with rising thumb-downs is the next one to re-curate.

## Document-expiry sweep

Today: browser-only via `localStorage` + Notification API. No server-side telemetry exists yet — the nightly sweep is unwired. When [`../TODO.md`](../TODO.md) item 2 lands, the channel ID (phone) is encrypted at rest and never returned over any GET endpoint.

## Health

`/api/government/health` reports DeepSeek configured + service banner.
`/api/government/freshness` reports last-synced + last-ingest-log per job.
