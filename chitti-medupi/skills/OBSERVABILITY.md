# OBSERVABILITY — Logs, Audit, Health, Alerts

How we know the product is alive, what we record when something happens, who hears about a failure, and how fast.

---

## 1. Logging

**Application logs**
- Flask + gunicorn stdout → captured by Render's log stream.
- INFO level on every API request: method, path, status, duration, family-scope (no PII payloads).
- WARN on degraded paths: Brave quota near limit, LLM key missing, freshness > 7 days served from cache.
- ERROR on exceptions: full traceback, but **never** the uploaded image bytes or the raw OCR text containing user-identifying info.

**Audit tables (Postgres `medupi.*`)**
- `medupi.search_log` — every strict-match query: timestamp, brand/salt/strength/form, hit count, response time. Drives the search-frequency popularity feature.
- `medupi.loader_run` — every data load: source, timestamps, row counts, notes. See [TRUTH_SOURCES.md](TRUTH_SOURCES.md).
- `medupi.price_cache` — every Brave snippet pulled: source URL, snippet text, pulled-at timestamp. Drives the freshness pill.
- `medupi.community_price` — every user-reported price: medicine, price, pharmacy, city, timestamp. Aggregated for median + IQR.

**What we never log**
- Uploaded medicine images (binary or base64).
- Raw vision-prompt responses with brand-name + manufacturer combined (that's a user-identifying tuple on chronic-illness queries).
- Family wallet entries at the row level — only aggregates.
- Any PAN / Aadhaar / phone number even if surfaced in a search.

---

## 2. `/health` endpoint behaviour

**Path:** `GET /api/medupi/health`

**Response shape:**
```json
{
  "ok": true,
  "service": "chitti-medupi-api",
  "version": "<git-sha>",
  "uptime_seconds": 12345,
  "checks": {
    "database": "ok" | "error: <reason>",
    "schema_medupi": "ok" | "missing",
    "row_count_medicines": 211207,
    "scheduler": "running" | "stopped",
    "llm_provider": "deepseek-vl" | "anthropic-vision" | "unconfigured",
    "brave_search": "ok" | "quota_exhausted" | "unconfigured"
  },
  "loader_runs_latest": {
    "apollo_csv": "<iso8601>",
    "jan_aushadhi": "<iso8601>",
    "nppa": "<iso8601>",
    "cdsco": "<iso8601>"
  }
}
```

The endpoint returns **HTTP 200 even on degraded** — `ok: false` only when the database is unreachable. Degraded providers (LLM down, Brave quota exhausted) surface in `checks.*` so UptimeRobot can alert on shape, not just status.

---

## 3. UptimeRobot monitoring

- **Cadence:** Every 5 minutes.
- **Target:** `GET https://chitti-medupi-api.onrender.com/api/medupi/health`.
- **Alert condition:** HTTP 5xx, timeout > 30s, OR (HTTP 200 with `ok: false`).
- **Notification:** Email to Bryan + optional WhatsApp via the Chitti Vaani cascade pattern when wired.
- **Render free-tier note:** First request after idle takes ~30 seconds (cold start). UptimeRobot's 5-min cadence keeps the container warm during business hours; expect cold starts overnight.

---

## 4. Deploy monitoring via Render API

- **Render Blueprint:** [`render.yaml`](../render.yaml) defines the `chitti-medupi-api` service.
- **Deploy hook:** GitHub push to `main` → Render auto-builds.
- **Post-deploy verification (per memory `feedback_verify_before_handover.md`):** Bryan or the developer must `curl` the production endpoint and confirm a real medicine lookup returns a real row — never assume "the build succeeded" equals "the product works."
- **Smoke tests:**
  ```bash
  curl 'https://chitti-medupi-api.onrender.com/api/medupi/medicine/Crocin%20650'
  curl 'https://chitti-medupi-api.onrender.com/api/medupi/jan_aushadhi?lat=23.26&lng=77.41'
  curl 'https://chitti-medupi-api.onrender.com/api/medupi/risk/Metformin'
  curl 'https://chitti-medupi-api.onrender.com/api/medupi/health'
  ```

---

## 5. Failure modes and who hears

| Failure | Detection | User-facing behaviour | Who is notified |
|---|---|---|---|
| **DB unreachable** | `/health` returns `ok:false` | API returns 503; frontend shows "Service warming up — try again in 30s" in EN / HI | UptimeRobot → Bryan email immediately |
| **DeepSeek (or Anthropic) vision down** | Wrapper returns `{"_error": "..."}` | Vision scan tile hidden; "Type the medicine name or speak" surfaced in EN / HI | Logged WARN; Bryan checked on next deploy |
| **DeepSeek balance exhausted** | HTTP 402 on `/ask` agentic endpoint | Agentic panel shows "Service paused — basic flows still work" | Logged WARN; Bryan email when first 402 of the day fires |
| **Brave quota exhausted** | HTTP 429 from Brave | Live-prices panel hidden with EN / HI caption "live prices unavailable today" | Logged WARN; daily digest to Bryan |
| **Loader run failed** | `medupi.loader_run.notes` populated with error | No user-facing change (catalogue is unchanged) | Logged ERROR; Bryan reviews on next session |
| **Scheduler stopped** | `/health` → `checks.scheduler: stopped` | Refill/expiry reminders stop firing | UptimeRobot picks up via shape check; Bryan email |
| **Disclaimer banner missing** | Frontend smoke test (manual) | This is a P0 — product is unshippable without it | Bryan; rollback immediately |

---

## 6. Privacy-respecting telemetry

- No Google Analytics with custom dimensions on medicine queries.
- No Mixpanel / Amplitude / Segment with health events.
- Aggregate counts only: total queries today, top-N most-searched salts (by salt, not by user), Jan Aushadhi-store coverage gaps by district. Never per-user time-series.
- The four-user contract extends to telemetry: a Blind user's screen-reader stream is not captured; a Mute user's tap-pattern is not fingerprinted; an Illiterate user's Hindi-voice query is not transcribed for training.

---

## 7. Founder dashboard

Per the global Sahay AI contract, all feature status is visible at **sahayai.in/founder**. MedUPI surfaces there:

- Live `/health` colour-and-symbol (green check / amber dot / red cross — never colour-only).
- Latest loader-run timestamps per source.
- Today's query volume.
- Today's degraded-provider count.
- Open P0 / P1 items from [TODO.md](../TODO.md).
