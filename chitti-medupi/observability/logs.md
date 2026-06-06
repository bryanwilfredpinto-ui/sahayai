CEOS Level 10 — Observability: Logs

Authored 2026-06-06

> What MedUPI writes down when something happens, what it deliberately refuses to
> write down, how long it keeps it, and how PII is scrubbed. A medicine query is
> a health signal — the logging posture is "record the operation, never the
> patient."

Companion docs: [observability/metrics.md](metrics.md) · [skills/OBSERVABILITY.md](../skills/OBSERVABILITY.md) · [guardrails/privacy.md](../guardrails/privacy.md) · [skills/TRUTH_SOURCES.md](../skills/TRUTH_SOURCES.md) (loader audit).

---

## 1. Application logs

- Flask + gunicorn stdout → captured by Railway's log stream.
- **INFO** on every API request: method, path, status, duration, family-scope — **no PII payloads**.
- **WARN** on degraded paths: Brave quota near limit, LLM key missing, freshness > 7 days served from cache, first 402 of the day (DeepSeek balance exhausted).
- **ERROR** on exceptions: full traceback, but **never** the uploaded image bytes/base64 and **never** the raw OCR/vision text containing user-identifying info.

---

## 2. Turso audit tables (`medupi.*`)

| Table | One row per | Drives | PII? |
|---|---|---|---|
| `medupi.search_log` | strict-match query (ts, brand/salt/strength/form, hit count, response time) | search-frequency popularity | No — aggregated by salt |
| `medupi.loader_run` | data load (source, started/finished, rows loaded/skipped/errored, notes) | the loader-audit trail ([TRUTH_SOURCES](../skills/TRUTH_SOURCES.md)) | No |
| `medupi.price_cache` | Brave snippet pulled (source URL, snippet text, pulled-at) | the freshness pill | No |
| `medupi.community_price` | user-reported price (medicine, price, pharmacy, city, ts) | median + IQR aggregate | `user_token` **stripped before aggregation** |
| `quality_audit` | HTTP request (kind="http") | observability + Founder dashboard | No |
| `quality_feedback` | per-response 👍/👎 tagged to box ID | feedback aggregate | No |

> A row in an application table without a corresponding `loader_run` is a violation — *the database is the truth, the loader run is the receipt* ([skills/TRUTH_SOURCES.md](../skills/TRUTH_SOURCES.md)).

---

## 3. What we NEVER log (P0 if breached)

- Uploaded medicine **images** (binary or base64).
- Raw vision-prompt responses combining **brand + manufacturer** (a user-identifying tuple on chronic-illness queries).
- Family wallet entries at the **row level** — only aggregates.
- Any **PAN / Aadhaar / phone** even if surfaced in a free-text search.
- A blind user's screen-reader stream, a mute user's tap-pattern, an illiterate user's voice transcript.

---

## 4. PII scrubbing rules

| Rule | Mechanism |
|---|---|
| `user_token` stripped before any aggregate write | enforced in the community-price + camera-aggregate path ([guardrails/privacy.md §2](../guardrails/privacy.md)) |
| Location coarsened to district/pincode in aggregates | no finer-than-district geo ever leaves the device |
| Image bytes never reach a log sink | `medupi_recognition.py` passes bytes only to the provider call, never to `log.*` |
| Brand+manufacturer tuple kept out of ERROR logs | exception handlers log `str(e)`, not the vision payload |
| No third-party analytics | no GA/Mixpanel/Amplitude/Segment health events ([metrics.md §5](metrics.md)) |

---

## 5. Retention

| Log/table | Retention |
|---|---|
| Railway application logs | platform default; operational, no PII to age out |
| `medupi.search_log` | operational; aggregated, no per-user series |
| `medupi.price_cache` | short-lived; snippets > 7 days tagged stale and not served as current |
| `medupi.community_price` | retained as anonymised aggregate input |
| `quality_audit` / `quality_feedback` | per the platform quality stack; rolled into Founder daily/weekly digests |

Turso write-durability under Railway redeploy is currently **ephemeral** (tactical bypass; revisit at DAU > 100, ARCHITECTURE §9) — a labelled, known limitation, not silent loss.

---

## 6. `/health` and failure signals

`GET /api/medupi/health` returns **HTTP 200 even when degraded** (`ok:false` only when the DB is unreachable); degraded providers (LLM down, Brave quota exhausted, scheduler stopped) surface in `checks.*` so the monitor alerts on **shape, not just status** ([skills/OBSERVABILITY.md §2–§5](../skills/OBSERVABILITY.md)). A **missing disclaimer banner** is a P0 caught by the frontend smoke test — rollback immediately.
