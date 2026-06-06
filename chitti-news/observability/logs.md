# CNOS — Logging Contract

> *"Every failure: root cause → fix → re-test → deploy."*

What gets logged, where, in what schema, with what retention, and the rules that
keep PII out of every line. All request-path logging routes through
[`lib/observability.py`](../backend/lib/observability.py); ingest and SLA
logging route through the poller and the cron scripts.

---

## What gets logged where

| Stream | Where it lands | Written by | Granularity |
|---|---|---|---|
| Per-poll RSS HTTP status | `news.ingest_logs` (Turso) | `news_ingest._http_get` | one row per source per poll |
| Feed health summary | `feeds_health.log` (file) | RSS poller | one line per poll cycle |
| Per-request quality audit | `quality_audit` (Turso) | `Observability._write` / `install_request_timing` | one row per `request\|response\|rail\|tool\|http` event |
| Thumbs-down + corrections | `quality_feedback` (Turso) | `feedback-widget.js` → `/api/feedback` | one row per 👎 / comment |
| Fact-check verdict log | `news.fact_checks` | factcheck sub-agent | one row per verdict (verdict, match_count, sources) |
| Coverage SLA nightly | `coverage_sla_report_<date>.json` | [`coverage_sla_check.py`](../backend/scripts/coverage_sla_check.py) | one file per night |
| Neutrality nightly | `neutrality_report_<date>.json` | [`neutrality_eval.py`](../backend/scripts/neutrality_eval.py) | one file per run |

---

## `quality_audit` schema (canonical record)

| Field | Type | Notes |
|---|---|---|
| id | int PK | autoincrement |
| request_id | str(32) | indexed; propagated end-to-end (see below) |
| chitti | str(40) | `"chitti-news"` |
| kind | str(16) | `request` \| `response` \| `rail` \| `tool` \| `http` |
| phase | str(20) | `before_model` \| `after_model` \| `before` \| `after` \| `response` |
| rail | str(20) | `safety` \| `relevance` \| `truth` \| `compliance` (rail rows only) |
| action | str(16) | `pass` \| `warn` \| `block` \| `inject` \| `redirect` |
| reason | str(80) | tool name / endpoint / rail reason |
| payload_json | text | structured payload, **truncated to 8000 chars** |
| ts | datetime | server default `now()`; indexed |

The Founder dashboard reads a single ordered stream per `request_id` across all
`kind`s — request → rails → tool calls → response → http timing.

## `quality_feedback` schema

| Field | Type | Notes |
|---|---|---|
| id | int PK | |
| request_id | str | ties feedback to the exact card/response |
| chitti | str | `"chitti-news"` |
| thumbs | int | +1 / −1 |
| comment | text | optional free-text correction |
| ip_hash | str | salted SHA-256, **24 chars** — never the raw IP |
| ts | datetime | |

---

## PII-scrub-before-log rule (hard)

- **Never log a raw IP.** `hash_ip()` salts (`FEEDBACK_IP_SALT`) and truncates to
  24 chars. Rotating the salt resets history by design.
- **Never log secrets.** `_shallow_clean()` redacts any tool-arg key containing
  `token` / `secret` / `password` / `api_key` / `auth` → `<redacted N chars>`.
- **Bound every field.** `user_text` ≤ 4000, `model_output` ≤ 4000, scalar
  tool args ≤ 200, `payload_json` ≤ 8000 chars.
- **Best-effort writes.** `_write()` never raises — a logging failure must never
  break a reader's feed.

---

## Request-id propagation

`install_request_timing` reads `X-Request-Id` from the inbound header (or mints a
12-char hex id), stashes it on Flask `g`, and echoes **both**
`X-Chitti-Request-Id` and `X-Chitti-Response-Time-Ms` on every response. Every
`quality_audit` row for that request carries the same `request_id`, so a single
id traces the full path: ingest → classify → verify → render → feedback.

---

## Retention

| Stream | Retention | Rationale |
|---|---|---|
| `quality_audit` | 90 days rolling | enough for incident forensics; bounded DB |
| `quality_feedback` | indefinite (aggregated) | trust trend; PII already hashed |
| `news.ingest_logs` | 30 days | publisher-health debugging window |
| `feeds_health.log` | 14 days (log-rotate) | operational only |
| SLA / neutrality JSON | indefinite | compliance audit trail (small files) |

---

## Failure protocol (per incident)

1. **Root cause** — which rule / source / API / rate-limit produced it (pull the
   `quality_audit` stream by `request_id`).
2. **Fix** — minimum change, maximum impact.
3. **Re-test** — run the eval that caught it; expand the eval if it didn't.
4. **Deploy** — commit, push, verify on live.

Each incident is documented in `chitti-news/incidents/` (created as needed).

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
