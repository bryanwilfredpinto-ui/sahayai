# OBSERVABILITY — Chitti UPI Fraud Guard

What we measure, what we cannot yet measure, and where it surfaces.

## Today's surface

- `GET /` — service banner JSON (build is up).
- `GET /health` — Flask liveness (process up, does NOT verify DeepSeek).
- `GET /api/upi/health` — `{deepseek_configured, model}` diagnostic. Founder dashboard at `sahayai.in/founder` is expected to ping this (P0-4 in [`../TODO.md`](../TODO.md)).

Every successful `/api/upi/check` returns `source: "deepseek" | "fallback"` and (on DeepSeek path) a `tokens: {input, output}` block. That is the per-request observability we already ship.

There is **no** `/metrics`, no Prometheus, no Sentry, no telemetry endpoint. P1-7 in [`../TODO.md`](../TODO.md).

## Metrics that matter (intended)

### 1. Verdict distribution

The HIGH / MEDIUM / LOW ratio over rolling windows (hour, day, week). Healthy product behaviour: HIGH and MEDIUM should each be non-trivial; LOW should be the smallest bucket (the user paste-checks because they are already suspicious). A spike to >90% LOW or >90% HIGH is a model-drift or prompt-injection signal.

### 2. False-positive rate (when known)

True FP rate requires labelled feedback. P1-8 ("report this scam" button) is the prerequisite. Until then we can only proxy via:
- complaint frequency
- the share of HIGH verdicts on sample-card known scams (should be 100%)

Quote no FP/FN number until the corpus exists.

### 3. DeepSeek failure rate

Percentage of `/api/upi/check` calls that return `source: "fallback"`. Breakdown by `error` field: `deepseek_http_502`, `deepseek_http_429`, `httpx.RequestError`, key-missing.

Healthy: < 1% (excluding key-unset dev environments).
Alert: > 5% in a 5-minute window.

### 4. Fallback-to-MEDIUM rate

Specifically the rate at which `_fallback()` fires AND `risk` is therefore `MEDIUM`-by-default. Distinct from "DeepSeek returned MEDIUM" because the failure mode is opposite — the user gets the Hindi-only canned warning, not a real classification ([`../PROMPTS.md`](../PROMPTS.md) §2).

### 5. Latency p50 / p95

DeepSeek is a network call. Railway free-plan cold start adds ~30s. p95 budget is 35s; anything beyond is unspeakable for a blind-user flow.

### 6. Token usage / cost

`tokens.input + tokens.output` summed per day. Capacity-planning input for whether prompt caching (memory entry _Build, debug, optimize Claude API_ does not apply here — DeepSeek does not yet offer the same caching primitive) is worth investigating.

## Privacy

No request body is logged. Counters and statuses only.
