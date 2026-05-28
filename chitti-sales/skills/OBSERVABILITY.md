# Chitti Sales — OBSERVABILITY

Operational targets for once the backend lands. Today there is no backend code, so the rest of this file is a target list, not a status report.

## 1. Anonymised request logging

For every `POST /api/sales/ask`, log:

- Timestamp
- `language` field
- `topic` field (if supplied)
- `len(text)` — **length only, never the body** (the user may have described their customers in detail; see [BOUNDARIES.md](BOUNDARIES.md))
- Source path taken: `deepseek` / `fallback_no_key` / `fallback_http_<code>` / `fallback_network`
- `usage.prompt_tokens` and `usage.completion_tokens` from DeepSeek
- `book_cited` — extracted (best-effort) from the reply text for the per-book frequency metric

Default: Python `logging` to stdout (Railway captures it). When traffic warrants, switch to structured JSON logging — same plan as Chitti CA.

## 2. Per-tactic / per-book citation frequency

The highest-value Sales-specific metric. For every reply, parse the book attribution out of the reply text and increment a counter:

- `book_cited_carnegie_total`
- `book_cited_cialdini_total`
- `book_cited_rackham_total`
- `book_cited_dixon_adamson_total`
- `book_cited_ross_total`
- `book_cited_voss_total`
- `book_cited_klaff_total`
- `book_cited_pink_total`
- `book_cited_moore_total`
- `book_cited_tracy_total`
- `book_cited_general_wisdom_total` — when the reply says "this is general sales wisdom, not from one of the 10 books"
- `book_cited_missing_total` — when no attribution is detectable in the reply (this is a prompt drift signal, page the founder if it rises)
- `book_cited_unknown_total` — when a book name is detected that is NOT one of the 10 (this is a hallucination signal — see [GUARDRAILS.md](GUARDRAILS.md))

The audit hook is the cheapest defence against the model fabricating tactic attributions.

## 3. DeepSeek failure rate

Same as Chitti CA / Legal. Counters for:

- `deepseek_http_5xx`
- `deepseek_http_429` — rate-limit (we are paying, so this surfacing matters)
- `deepseek_http_4xx` other — likely a prompt / payload bug
- `deepseek_network_error` — DNS / TLS / timeout
- `deepseek_no_key` — deploy misconfiguration (should be zero in prod)

Today: nothing. We will rely on inspecting Railway logs once the backend lands.

## 4. Disclaimer-injection audit (every reply)

The single highest-value safety metric — same as Chitti CA. For every reply leaving the server, assert:

```python
assert SALES_DISCLAIMER in response["reply"]
```

Emit:

- `disclaimer_present_total` — should equal `replies_total`
- `disclaimer_appended_by_server_total` — counts the cases where the model forgot and `_enforce_disclaimer()` had to append. A rising number here means the prompt is drifting and needs review.
- `disclaimer_missing_total` — should be **zero forever**. If it ever increments, page the founder.

## 5. Dark-pattern audit (substring scan)

Cheap defence against [BOUNDARIES.md](BOUNDARIES.md) item 2. For every reply, scan for forbidden phrases:

- `fake scarcity`, `pretend the stock is low`, `lie about`
- `false urgency`, `made-up deadline`, `invent a deadline`
- `trick the customer`, `manipulate the customer`, `pressure them into`
- `tell them whatever they want to hear`

Emit `dark_pattern_phrase_detected_total`. The check is intentionally crude (regex substring); a hit triggers a manual review. The aim is not to be exhaustive but to catch flagrant cases.

## 6. User feedback (thumbs up / down per response)

The shared feedback widget [../../feedback-widget.js](../../feedback-widget.js) is included in the Chitti Sales page footer. Every thumbs-up, thumbs-down, and suggestion submission POSTs to the existing shared Chitti Vaani feedback endpoint with `data-page="chitti_sales"`.

For the Sales product we read:

- Daily thumbs-up vs thumbs-down ratio.
- Suggestion-text count, grouped weekly.
- Top 10 suggestion themes (manual review by founder, monthly).

See [../FEEDBACK_CAPTURE.md](../FEEDBACK_CAPTURE.md) for the full pipeline.

## 7. Health endpoints

Once the backend lands:

- `GET /health` — Flask process up
- `GET /api/sales/health` — also reports `deepseek_configured` and the canonical disclaimer string

UptimeRobot polls both at 5-minute interval. Same as the other Chittis.

## 8. What we deliberately do **not** log

- The raw user question (privacy — they may have described their customers).
- The raw DeepSeek reply (size; replay via prompt + topic + language is acceptable for sampled debugging).
- IP addresses beyond what Railway's edge already records.
- Anything about the user's customers — phone numbers, names, addresses, payment history. The [BOUNDARIES.md](BOUNDARIES.md) rule against accepting customer data means we have nothing to log either.
