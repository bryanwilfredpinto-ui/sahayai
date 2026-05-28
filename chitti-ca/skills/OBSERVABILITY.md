# Chitti CA — OBSERVABILITY

Operational gaps acknowledged in [../TODO.md](../TODO.md) — this file lists what we want, not all of which is wired yet.

## 1. Request logging (anonymised)

For every `POST /api/ca/ask`, log:

- Timestamp
- `language` field
- `topic` field (if supplied)
- `len(text)` — **length only, never the body** (the user may have pasted PAN / Aadhaar / bank numbers; see [BOUNDARIES.md](BOUNDARIES.md))
- Source path taken: `deepseek` / `fallback_no_key` / `fallback_http_<code>` / `fallback_network`
- `usage.prompt_tokens` and `usage.completion_tokens` from DeepSeek

Today, the service uses Python `logging` to stdout only (Railway captures it). No structured JSON logging, no aggregation. Cheap fix: switch to `logging.Formatter` with JSON output.

## 2. DeepSeek failure rate

We need a counter and a dashboard panel for:

- `deepseek_http_5xx` — upstream failure
- `deepseek_http_429` — rate-limit (we are paying, so this surfacing matters)
- `deepseek_http_4xx` other — likely a prompt / payload bug
- `deepseek_network_error` — DNS / TLS / timeout
- `deepseek_no_key` — deploy misconfiguration (should be zero in prod)

Today: nothing. We rely on inspecting Railway logs.

## 3. Disclaimer-injection audit (every reply)

The single highest-value metric. For every reply leaving the server, assert:

```python
assert CA_DISCLAIMER in response["reply"]
```

Emit:

- `disclaimer_present_total` — should equal `replies_total`
- `disclaimer_appended_by_server_total` — counts the cases where the model forgot and `_enforce_disclaimer()` had to append. A rising number here means the prompt is drifting and needs review.
- `disclaimer_missing_total` — should be **zero forever**. If it ever increments, page the founder.

Today: the assertion logic in `_enforce_disclaimer()` runs, but it does not emit metrics. The fix is a counter + a log line per branch.

## 4. Health endpoints

- `GET /health` — Flask process up
- `GET /api/ca/health` — also reports `deepseek_configured` and the canonical disclaimer string

Neither endpoint is polled by anything today (see [../TODO.md](../TODO.md) operational gaps).

## 5. What we deliberately do **not** log

- The raw user question (privacy — they may paste PAN / Aadhaar).
- The raw DeepSeek reply (size; replay via prompt + topic + language is acceptable).
- IP addresses beyond what Railway's edge already records.
