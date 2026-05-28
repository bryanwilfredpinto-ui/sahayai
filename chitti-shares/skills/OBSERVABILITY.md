# OBSERVABILITY

What we measure, where it lives, and how to read it.

## 1. Per-symbol cache hit rate

- Cache: [`services/cache.py`](../backend/services/cache.py) — in-memory TTL store (quotes 60 s, fundamentals 1 hr, news 10 min).
- Each `cache.get(key)` records hit/miss in process counters; exposed via the `/health` and `/api/usage/today` endpoints.
- Watch: a sustained miss rate >40% on `fundamentals:*` keys means screener.in's HTML changed or the dyno cold-started — investigate `screener_client` first.

## 2. Angel SmartAPI quota usage

- Tracked alongside DeepSeek in `shares.usage_log` (one row per call) by [`usage_tracker.py`](../backend/services/usage_tracker.py).
- Aggregated nightly into `shares.daily_quota_summary` at 00:00 IST by the scheduler.
- Concurrency: 6-thread `ThreadPoolExecutor` in [`scanner.py`](../backend/services/scanner.py) caps fan-out so a single universe scan doesn't exhaust the Angel free tier.
- Watch: bursts during 09:15 IST market open + universe-scan triggers from the technical frontend.

## 3. Scheduler health

- [`services/scheduler.py`](../backend/services/scheduler.py) — in-process APScheduler that replaces paid Railway cron jobs.
- Jobs and cadence:
  - Alerts check — every 5 min, 09:15–15:30 IST Mon–Fri.
  - Open-call tracker — every 5 min during market hours.
  - Kite re-auth reminder — daily 05:55 IST (skipped when `DATA_SOURCE=yahoo`).
  - Daily quota summary rollover — 00:00 IST.
- Health check: `/health` exposes `last_scheduler_tick`. Stale tick (>10 min during market hours) means the free dyno slept — first user request re-wakes the scheduler.
- Backstop: secret-gated `/api/cron/*` URLs remain callable by an external curl so a sleeping dyno does not block alerts.

## 4. Agentic-tool call audit log

- Every DeepSeek call (chat, agent tool-calling loop, Story Mode) is decorated with `@tracked` in [`usage_tracker.py`](../backend/services/usage_tracker.py).
- Each call writes one row to `shares.usage_log`: provider=`deepseek`, operation (`chat` / `agent.technical` / `agent.fundamental`), `input_tokens`, `output_tokens`, `cost_inr` (₹22.50 / 1M input + ₹91.50 / 1M output), the user id, and the tool names invoked inside the loop.
- Hard cap: ₹100/day → `CapExceeded` → HTTP 503 with `{code: "BUDGET_CAP_EXCEEDED"}`.
- Soft cap: ₹50/day → logged warning, no user impact.

## 5. Story-Mode generation latency

- Story Mode endpoint (pending wire per [`../TODO.md`](../TODO.md) §A and §J) will record `request_started_at` and `response_completed_at` per call in `usage_log` so we can plot P50/P95 generation latency.
- Target: P95 under 8 s end-to-end on the warm dyno; over that, fall back to the cached compute-only verdict.

## 6. Hard failures surface to the page

`CapExceeded`, `ScreenerEmpty`, `AngelAuthFailed`, and `DeepSeekTimeout` are all exception-handled in [`main.py`](../backend/main.py) so the frontend can render a "service degraded" pill rather than a generic 500.
