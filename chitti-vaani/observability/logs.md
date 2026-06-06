# Logs — Chitti Vaani

> Backend logs (Flask routes + APScheduler jobs) and frontend console policy.
> No PII, no secrets, diagnostic only. Aligned with
> [`../guardrails/privacy.md`](../guardrails/privacy.md).
> Quality framework: [`../backend/lib/observability.py`](../backend/lib/observability.py).

---

## Backend logs — source and format

- Flask logger at `INFO` level by default; `DEBUG` only when `DEBUG=true`
  env var is set (never in production).
- All log lines go to stdout → captured by Railway's log stream.
- Format: `[timestamp] [level] [job/route] message`
- Log retention: Railway stream → 30 days. Daily aggregates in Turso
  `chitti_vaani_quality.db` → 12 months. Weekly trend snapshots → 24 months.
  After 30 days, only aggregate counters survive; no per-request log can be
  replayed beyond that window.

---

## quality_audit rows — the canonical record

Every significant backend event writes a row to the `quality_audit` table
(schema in `observability.py`):

| Column | Values for Vaani | Notes |
|---|---|---|
| `chitti` | `"chitti-vaani"` | constant |
| `kind` | `request` / `response` / `rail` / `tool` / `http` | event type |
| `phase` | `before_model` / `after_model` / `before` / `after` / `response` | lifecycle position |
| `rail` | `safety` / `relevance` / `truth` / `compliance` | set for `kind="rail"` rows |
| `action` | `pass` / `warn` / `block` / `inject` / `redirect` | rail decision outcome |
| `reason` | short free-text | e.g. `"route_confidence_low"`, `"disclaimer_injected"` |
| `payload_json` | truncated JSON ≤ 8000 chars | see per-event specs below |

These rows are the primary source for the chitti-founder Founder dashboard,
the daily 07:00 IST digest, and the Swarm weekly collect cycle.

---

## Route logs (Flask per-request)

```
[2026-06-06 07:00:00] INFO [POST /api/vaani/ask?lang=hi] 200 1420ms
[2026-06-06 07:00:01] INFO [POST /api/feedback/collect] 200 9ms type=thumbs_up
[2026-06-06 07:00:02] INFO [GET /api/vaani/health] 200 4ms
[2026-06-06 07:00:03] INFO [POST /api/vaani/emergency/trigger] 200 88ms partners=2
[2026-06-06 07:00:04] INFO [POST /api/vaani/email/send] 200 2100ms msg_id_tail=a3f9
```

What is logged: method, route path (query keys only — never query values for
sensitive params), status, elapsed_ms, one domain-specific tag.
What is NOT logged: request body, response body, headers, raw client IP,
User-Agent, any PII.

`X-Chitti-Response-Time-Ms` on every response header carries the same
`elapsed_ms` value for client-side instrumentation.

---

## quality_audit — per-request / per-response rows

Every call to `POST /api/vaani/ask` produces two rows:

### kind="request" (before_model)

```json
{
  "kind":    "request",
  "phase":   "before_model",
  "payload": {
    "user_text": "Maa ka number dial karo",  // truncated to 4000 chars
    "lang":      "hi",
    "mode":      "ask"
  }
}
```

### kind="response" (after_model)

```json
{
  "kind":    "response",
  "phase":   "after_model",
  "payload": {
    "user_text":    "Maa ka number dial karo",    // truncated to 2000 chars
    "model_output": "Theek hai, Maa ko dial karta hun...", // truncated to 4000 chars
    "latency_ms":   1420
  }
}
```

---

## quality_audit — rail rows

Rail decisions (safety / relevance / truth / compliance) produce:

```json
{
  "kind":   "rail",
  "phase":  "before_model",
  "rail":   "safety",
  "action": "pass",
  "reason": "no_emergency_keyword_in_text",
  "payload": {}
}
```

```json
{
  "kind":   "rail",
  "phase":  "after_model",
  "rail":   "compliance",
  "action": "inject",
  "reason": "disclaimer_enforced",
  "payload": {
    "disclaimer_appended": "Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo."
  }
}
```

```json
{
  "kind":   "rail",
  "phase":  "before_model",
  "rail":   "relevance",
  "action": "warn",
  "reason": "route_confidence_low",
  "payload": {
    "route_confidence": 0.58,
    "routed_to":        "chitti-ca",
    "confirm_spoken":   true
  }
}
```

---

## AuditLog — Golden Rule action events

Every call to `chittiConfirmAndDo()` produces a Golden Rule audit entry.
Currently written to the frontend's in-memory undo closure; planned to be
persisted to `quality_audit` with `kind="tool"`, `reason="golden_rule_action"`.

```json
{
  "kind":    "tool",
  "phase":   "before",
  "reason":  "golden_rule_action",
  "payload": {
    "action_type":    "email_send",
    "recipient_hash": "sha256(email)[:12]",
    "confirmed":      true,
    "confirm_method": "voice_haan",
    "undo_window_ms": 30000
  }
}
```

```json
{
  "kind":    "tool",
  "phase":   "after",
  "reason":  "golden_rule_action",
  "payload": {
    "action_type": "email_send",
    "success":     true,
    "msg_id_tail": "a3f9",
    "elapsed_ms":  2100
  }
}
```

What is logged: action type, outcome, confirmation method, success/failure.
What is NOT logged: recipient email in full (only hash), message body, UPI PIN, VPA amounts.

The `product_action_logs` table ([DATABASE.md](../DATABASE.md)) provides an
additional server-side audit trail for Gmail send actions: `action` values
`manual_send_ok` / `manual_send_fail` with `detail` truncated to 4000 chars.

---

## Emergency event logs

### `/api/vaani/emergency/trigger`

```
[2026-06-06 01:15:00] WARN [emergency] trigger user_token=abc12…  source=keyword partners=2 reason=bachao
```

What is logged: truncated user_token (first 8 chars + ellipsis), source,
partner count, reason snippet (≤ 200 chars), transcript snippet (≤ 1000 chars).
What is NOT logged: full user_token, Trusted Circle contact names or phones,
partner user_tokens.

A `quality_audit` row with `kind="tool"`, `phase="before"` is written on
trigger received, and `phase="after"` when relay fan-out completes (allowing
latency calculation).

### `/api/vaani/emergency/check-in`

```
[2026-06-06 01:15:08] INFO [emergency] check-in user_token=abc12…  said="theek hun"
```

`said` is logged at INFO level (not sensitive — it confirms the user is safe).
The 8-second delta between trigger and check-in (T3 − T0) is computable from
the two `quality_audit` rows and is used for the false-positive rate metric.

---

## Voice Factory cascade ledger logs

Every TTS call to the Voice Factory produces a stdout log line:

```
[2026-06-06 07:00:05] INFO [voice_factory] lang=hi tier=A supplier=bhashini_mock latency_ms=312 success=true text_len=87
[2026-06-06 07:00:06] WARN [voice_factory] lang=snt tier=C supplier=community fallback=none latency_ms=0 success=false note=not_supported
```

What is logged: language code, tier used (A/B/C), supplier slug, latency, success flag, text length.
What is NOT logged: the text spoken (could contain user data), user identifier.

Tier C failures that log `success=false` trigger the honest *"Voice in [lang]
temporarily unavailable."* banner. They are aggregated in the weekly digest
under "Language coverage gaps."

---

## APScheduler job logs

### Job: `feedback_daily_report` (06:00 IST)

```
[2026-06-06 06:00:00] INFO [feedback_daily] starting daily report
[2026-06-06 06:00:01] INFO [feedback_daily] page=chitti_vaani thumbs_up=142 thumbs_down=18 suggestions=7
[2026-06-06 06:00:01] INFO [feedback_daily] top suggestion: "vaani should remember my contacts" score=4.2
[2026-06-06 06:00:02] INFO [feedback_daily] report emailed via admin mailbox; msg_id_tail=b7e2
```

What is logged: page, vote counts, suggestion score, message ID tail.
What is NOT logged: suggestion free-text in full (junk-filtered before persisting),
user email from the suggestion form.

### Job: `admin_keepalive` (1st of month, 06:00 IST)

```
[2026-06-06 06:00:00] INFO [admin_keepalive] starting monthly keepalive; products=3
[2026-06-06 06:00:01] INFO [admin_keepalive] product=chittivaani keepalive_ok=true msg_id_tail=c1d4
[2026-06-06 06:00:02] INFO [admin_keepalive] product=chittinews keepalive_ok=true msg_id_tail=f8a2
[2026-06-06 06:00:03] WARN [admin_keepalive] product=chittimedupi token_expired=true; notifying Sire
```

What is logged: product key, keepalive success/failure, message ID tail, token status.
What is NOT logged: OAuth access_token or refresh_token values.

### Job: `self_ping` (every 4 min, via chitti-founder)

```
[2026-06-06 07:00:00] INFO [self_ping] GET https://chitti-vaani.up.railway.app/health → 200 OK 312ms
[2026-06-06 07:08:00] ERROR [self_ping] GET https://chitti-vaani.up.railway.app/health → 503 (attempt 1); next retry 4 min
```

Non-200 triggers a debounced email to Sire (1 h deduplication per Chitti).
Logged to Turso `chitti_founder_db`.

---

## feedback_log rows — persisted feedback events

Schema per [`../DATABASE.md §"feedback_log"`](../DATABASE.md):

```
page=chitti_vaani  type=thumbs_down  text=<PII-scanned>  user_segment=blind
ip_hash=<24-char hex>  is_junk=0  created_at=2026-06-06T07:00:00
```

What is logged: page slug, type, cleaned text (PII-scanned), user segment, ip_hash.
What is NOT logged: User-Agent in full, raw client IP, full disability profile.

Junk filter runs at write time:
- `_IMPOSSIBLE` regex — abuse patterns.
- One-word entries → `is_junk=1`.
- Duplicate normalised text → collapsed; survivor inherits highest-impact segment.

---

## Frontend console policy

Frontend code (`chitti_vaani.html`, `chitti_a11y.js`, `feedback-widget.js`,
`chitti_features.js`):

1. ❌ No `console.log` of user input (spoken text, typed queries, contact search terms).
2. ❌ No `console.log` of localStorage contents (Trusted Circle, Medical ID, profile).
3. ❌ No `console.log` of OAuth tokens, API keys, or user_token.
4. ❌ No `console.log` of the full emergency keyword trigger transcript.
5. ✓ `console.warn` of fetch failures with route + status code only (never body).
6. ✓ `console.info` for voice recognition transcripts in DEV mode only
   (`?debug=1` query param; suppressed in production by a compile-time flag or
   `if (window.location.search.includes('debug=1'))`).
7. ✓ `console.error` for unhandled exceptions; messages must NOT include user input.

A CI check `test_no_sensitive_console_logs` greps all frontend files for:
- `console.log(localStorage`
- `console.log(.*token`
- `console.log(.*profile`
- `console.log(.*user_text`

---

## "Chitti forget" log impact

When `Chitti.a11y.forget('all')` runs:

- localStorage entries are deleted. No server-side log entry is created for
  the deletion (there is no server-side profile to delete).
- Camera tombstone row written (if any camera captures exist): `{ts, hash}` only.
- Voice sample IndexedDB entries deleted. A `console.info` line is written in
  DEV mode only.
- The wipe is announced via Voice Factory and a visual toast. The utterance
  text is logged to stdout (`INFO [vaani] forget_wipe user_token=<8chars>…`) at
  the backend only for rate-limiting the forget action (no PII).

---

## CI checks

- `test_no_pii_in_logs` — fuzz with planted email / phone / PAN in request body
  → assert backend log file contains none.
- `test_emergency_log_truncates_token` — assert `user_token` in log = first 8 chars + ellipsis.
- `test_no_sensitive_console_logs` — static grep over all frontend JS/HTML files.
- `test_quality_audit_row_per_ask` — fuzz `/api/vaani/ask` → assert exactly 2
  `quality_audit` rows (`request` + `response`) per call.
- `test_golden_rule_audit_row` — mock `chittiConfirmAndDo` confirm path → assert
  `kind="tool"` `reason="golden_rule_action"` row written.

---

Last reviewed: 2026-06-06
