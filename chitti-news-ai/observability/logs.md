# Logs — Chitti News AI

> Backend logs (APScheduler jobs + Flask routes) and frontend console policy.
> No PII, no secrets, only diagnostic. Aligned with
> [`../guardrails/privacy.md`](../guardrails/privacy.md).

---

## Backend logs

### Source

- Flask logger at `INFO` level by default; `DEBUG` only when `DEBUG=true` env var is set (never in production).
- All log lines go to stdout → captured by Railway's log stream.
- Format: `[timestamp] [level] [job/route] message`.

### Job logs

The backend runs three APScheduler jobs (see [`../backend/services/news_scheduler.py`](../backend/services/news_scheduler.py)):

#### Job: `rss_poll` (every 30 min)

```
[2026-06-06 07:00:00] INFO [rss_poll] starting cycle 12348
[2026-06-06 07:00:00] INFO [rss_poll] source=anthropic-blog fetched=3 new=1 dupes=2
[2026-06-06 07:00:01] INFO [rss_poll] source=openai-blog fetched=2 new=2 dupes=0
[2026-06-06 07:00:01] WARN [rss_poll] source=google-ai-blog timeout after 8s; retry next cycle
[2026-06-06 07:00:02] INFO [rss_poll] source=mit-tech-review fetched=5 new=4 dupes=1
[2026-06-06 07:00:03] INFO [rss_poll] cycle 12348 complete; 7 new articles persisted
```

What's logged: source_id, fetched count, new count, dupe count, errors.
What's NOT logged: article body, full URLs (only host), user identifiers.

#### Job: `classify_sweep` (after each rss_poll cycle)

```
[2026-06-06 07:00:04] INFO [classify_sweep] starting; 7 unclassified articles
[2026-06-06 07:00:04] INFO [classify_sweep] article=a4b9c2e1 profession=software-developer conf=0.87 keywords=4 source_default=0.3
[2026-06-06 07:00:04] INFO [classify_sweep] article=b5c9d3f2 profession=accountant conf=0.62 keywords=2 source_default=0.4
[2026-06-06 07:00:05] WARN [classify_sweep] article=c6d0e4a3 conf=0.31 (below 0.5); placed in 'everyone' only
[2026-06-06 07:00:05] INFO [classify_sweep] sweep complete; 7 articles classified, 1 below threshold
```

What's logged: article_id (opaque hash), profession, confidence, keyword count, source default weight.
What's NOT logged: article title (could be PII-adjacent), article body.

#### Job: `streams_refresh` (hourly)

```
[2026-06-06 07:30:00] INFO [streams_refresh] cycle starting
[2026-06-06 07:30:01] INFO [streams_refresh] stream=ai-aaj cards=12 fresh=3
[2026-06-06 07:30:01] INFO [streams_refresh] stream=tools cards=8 fresh=1
[2026-06-06 07:30:02] INFO [streams_refresh] stream=bharat-ai cards=6 fresh=2
[2026-06-06 07:30:02] INFO [streams_refresh] stream=prashikshan cards=15 fresh=0
[2026-06-06 07:30:03] INFO [streams_refresh] broken-link sweep: checked=45 ok=44 broken=1
[2026-06-06 07:30:03] WARN [streams_refresh] broken-link removed: course=stale-course-id host=brokendomain.com
[2026-06-06 07:30:03] INFO [streams_refresh] cycle complete
```

What's logged: stream id, card counts, broken-link host + course id.
What's NOT logged: user-visible card content, prompt text (would risk PII).

---

### Route logs

Per-request logs at `INFO`:

```
[2026-06-06 07:30:00] INFO [GET /api/news-ai/feed/news?profession=software-developer&lang=en] 200 142ms
[2026-06-06 07:30:01] INFO [POST /api/feedback/collect] 200 8ms event=vote
[2026-06-06 07:30:02] INFO [GET /health] 200 3ms
```

What's logged: method, route path with query keys (NOT values for sensitive params), status, duration, event type.
What's NOT logged: request body, response body, headers, IP (raw), User-Agent.

### Errors

```
[2026-06-06 07:30:05] ERROR [GET /api/news-ai/feed/news] 500 deepseek_timeout fell back to rules-only output
[2026-06-06 07:30:05] ERROR [POST /api/feedback/collect] 400 pii_detected_in_reason_text counter+1
```

The error class is logged; the offending payload is NOT. PII-detected events log only the counter increment, never the payload.

---

## Frontend console policy

The frontend code (`chitti_news_ai.html`, `chitti_coach.js`, `chitti_a11y.js`) follows:

1. ❌ No `console.log` of user input (profession text, free-text feedback, search terms).
2. ❌ No `console.log` of profile fields (profession, skills, goal).
3. ❌ No `console.log` of API keys (there are no API keys in the frontend — see [`../guardrails/safety.md`](../guardrails/safety.md)).
4. ❌ No `console.log` of localStorage contents.
5. ✓ `console.warn` of fetch failures with route + status only (no body).
6. ✓ `console.info` of voice recognition transcripts during DEV mode (`?debug=1` query); suppressed in production.
7. ✓ `console.error` for unhandled exceptions; messages must NOT include user input.

A CI check `test_no_sensitive_console_logs` greps `chitti_coach.js` + `chitti_news_ai.html` for `console.log(profile` / `console.log(localStorage` / `console.log(.*input.value` and fails on hit.

---

## Log retention

- Backend stdout → Railway logs → 30 days.
- Daily aggregate counters → Turso `news_ai_metrics.db` → 12 months.
- Weekly trend snapshots → Turso `news_ai_trends.db` → 24 months.

After 30 days, only aggregate counters survive. No per-request log can be replayed beyond that.

---

## What's deliberately verbose

To diagnose issues (especially classifier accuracy regressions, the historical "cricket-in-business" bug, and language fallback frequency):

- Every classifier decision logs confidence + keyword count.
- Every Trust Agent block logs the reason.
- Every Language Agent fallback logs `fallback_from → lang`.
- Every Voice Factory tier transition logs source → target.

These exist explicitly to support the Quality Gate 7 — Observability checklist.

---

## What's deliberately silent

- Per-user behaviour (no user concept on the backend).
- Per-card consumption time.
- Per-tab dwell.
- Per-IP request patterns (only `ip_hash` aggregates exist).

If you can't tell from the logs that User X read Card Y at time T, that's correct. We can tell from the logs that 142 anonymised hashes voted on Card Y in the last 24 h.

---

## CI checks

- `test_no_pii_in_logs` — fuzz with planted email / phone / PAN → assert backend log file contains none.
- `test_no_user_agent_in_log` — fuzz with custom UA → assert log file omits it.
- `test_no_sensitive_console_logs` — static grep over frontend.
- `test_classifier_logs_confidence` — verify classify_sweep log line includes `conf=` field.

---

Last reviewed: 2026-06-06
