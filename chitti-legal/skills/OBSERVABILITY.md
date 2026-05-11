# OBSERVABILITY — Chitti Legal

The product is small. Observability is, deliberately, also small. Three things matter: did we serve a reply, did the upstream work, did the disclaimer appear.

## Anonymised request log

Today: nothing structured. Render captures stdout from the gunicorn workers in [../render.yaml](../render.yaml). `legal_service.explain()` does not currently log per-request metadata. The Flask access log gives method, path, status, latency — and that is the whole picture.

What we want next:

- Per-request line: `ts`, `request_id` (uuid4), `lang`, `doc_type`, `text_len`, `source` (deepseek / fallback), `tokens.input`, `tokens.output`, `latency_ms`, `http_status`.
- **No raw text.** Never log the body of `text`. The whole point of [BOUNDARIES.md](BOUNDARIES.md) and the not-yet-built PII scrubber (see [DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md) gap 2) is that the user's notice does not leak.
- Log destination: Render stdout for now; a structured sink (e.g. Logflare, Better Stack) when traffic justifies it.

## DeepSeek failure rate

The fallback path in [../backend/services/legal_service.py](../backend/services/legal_service.py) is the single most important signal. Every fallback reply is tagged `source: "fallback"` and (when triggered by an upstream error) carries an `error: "deepseek_http_<code>"` field.

What we want to track:

- Rolling 1h / 24h ratio of `source=fallback` over total `/api/legal/explain` responses.
- Break down by `error` value: `deepseek_http_401` (key expired) is very different from `deepseek_http_502` (DeepSeek had a bad afternoon).
- Alarm threshold: > 5% fallback over a 15-minute window outside scheduled maintenance windows.

## Disclaimer-injection audit

This is the safety-critical metric. Every reply must end with the canonical `LEGAL_DISCLAIMER` string.

`_enforce_disclaimer()` runs in three branches: deepseek-happy, deepseek-error → fallback, missing-key → fallback. A regression that ships a reply without the line is, by [VALUES.md](VALUES.md), a P0.

What we want next:

- A startup self-test that calls each of `_fallback(...)` and a mocked DeepSeek-200 / DeepSeek-500, and asserts the disclaimer substring is present.
- An integration smoke test on the live `chitti-legal-api.onrender.com` endpoint that POSTs a known clause and asserts the disclaimer line is in the response body.
- A daily synthetic check feeding into the founder dashboard at `sahayai.in/founder` per the accountability contract in [../CONTEXT.md](../CONTEXT.md).

