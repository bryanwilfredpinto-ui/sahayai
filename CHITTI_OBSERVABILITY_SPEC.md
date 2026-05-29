🎖️ **World Class Chitti Observability — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Observability — Design Spec (Sire 2026-05-29)

> Transform Chitti's translation/localization audit from **on-demand** (`tools/audit_per_chitti.mjs`, run by hand) into **always-on real-time observability** with a live footer badge on every page.

## Target footer (always visible on every Chitti page)

```
┌──────────────────────────────────────────────────────────┐
│  🔍 AI Observability — LIVE                              │
│  Response Time: 1.2 sec                                  │
│  Verification Agent: Active ✅                            │
│  Audit ID: CH-20260529-A7F3                              │
│  Feedback Learning: Enabled (47 samples)                 │
│  Last 5 mins: 234 cards · 0 failures                     │
└──────────────────────────────────────────────────────────┘
```

## Stack alignment

Sire's spec assumed Node.js + React. **Actual production stack:**

| Layer | Tech | Why |
|---|---|---|
| Backend | FastAPI (Python 3.11) on Railway | 15 services already run this way |
| Frontend | Vanilla HTML/JS substrates auto-loaded by `chitti_a11y.js` | Single-file pages on GitHub Pages — no React build step |
| DB | Turso libSQL (Mumbai region) via `lib/turso_http.py` direct-HTTPS shim | One DB per Chitti |
| Translation substrate | `chitti_lang.js` (baked T-table 3,681 keys × 26 langs) + `chitti_lang_runtime.js` (Gemini-2.5-Flash-Lite fallback) | Live in repo |
| Audit (existing) | `tools/audit_per_chitti.mjs` (Playwright, run by hand) | Snapshot output, not live |
| Feedback (partial) | `feedback-widget.js` + `/api/feedback/collect` → `chitti-vaani-api` Railway | Already collects 👍/👎/✏️/🎤 with `box_id` |

No Node.js. No React. New work integrates with what already exists.

---

## Feature breakdown

### 1. Response Time Tracking

**Goal**: capture translation latency per card / per widget; expose P95 / P99 + log >3s operations.

**Where it runs**: client-side JS substrate (no server-side timer would be honest — translation is partly client-side T-table lookup, partly LLM-fallback network round-trip).

**Implementation**:
- Wrap every `chitti_lang_runtime.js::callBackend()` invocation in `performance.now()` start/end.
- For T-table hits (baked translations), record near-zero latency separately so the histogram doesn't get diluted.
- Push samples into a ring buffer in `localStorage` (last 200 samples × 2 buckets = T-table vs LLM).
- Client computes P50 / P95 / P99 every 5s for badge display.
- Slow ops (>3s) → `POST /api/observability/slow_op` with `{ audit_id, box_id, text_length, elapsed_ms, source_lang, target_lang }`.

**New code**:
- `chitti_observability.js` (new substrate, ~250 lines) — auto-loaded by `chitti_a11y.js`.
- Inside `chitti_lang_runtime.js::callBackend()`, 3-line wrap with `_chittiObs.recordLatency(start, end, kind)`.

**Backend**:
- `observability/routes.py::record_slow_op` — INSERT into `observability.slow_ops`.

**Effort**: **3–4 hours** (instrumentation + ring buffer + percentile calc + badge wire).

---

### 2. Real-Time Verification Agent

**Goal**: always-on agent that validates every translation; flips status `Active ✅` / `Degraded ⚠️` / `Failed ❌` within 5s of breach.

**Checks** (every 5s, client-side):

| Check | How | Threshold |
|---|---|---|
| Card detection success | Compare `document.querySelectorAll(SELECTOR).length` against last-known count | drop > 30% → Degraded |
| Translation completeness | Count cards whose text-node contains ≥ 3 Latin chars in non-English session | > 5% un-translated → Degraded |
| Widget attachment | Count `[data-chitti-response]` with attached `.chitti-fb-box-bar` OR `.chitti-card-widget` | < 95% attached → Degraded |
| LLM endpoint reachable | Last LLM call returned 200 within last 60s OR no LLM calls attempted | timeout / 5xx within last 60s → Failed |
| Cache integrity | localStorage cache prefix matches expected version | mismatch → Degraded |

**Implementation**:
- `chitti_observability.js::startVerificationAgent()` — `setInterval` 5000ms loop.
- Each tick computes 5 checks, sets `_chittiObs.status = 'Active' | 'Degraded' | 'Failed'`.
- Status drives the badge color (green / amber / red).
- On Degraded / Failed → `POST /api/observability/alert` once per breach (deduped by check+minute).

**Backend**:
- `observability/routes.py::record_alert` — INSERT into `observability.alerts`.
- Optional: forward to Telegram channel via existing `TELEGRAM_BOT_TOKEN` env var if Sire wants.

**Effort**: **4–5 hours** (5 checks + threshold logic + dedup + badge wire + alert endpoint).

---

### 3. Audit ID Generation

**Goal**: every session has a unique ID, displayed in footer, used to look up past audits.

**Format**: `CH-YYYYMMDD-XXXX`  
- `YYYYMMDD` = session start date (IST)  
- `XXXX` = 4-char base36 hash of `Date.now() + Math.random()`  
- Example: `CH-20260529-A7F3`

**Implementation**:
- `chitti_observability.js` mints the ID on first load, stores in `localStorage.chitti_audit_id`.
- ID persists across page navigations within `sahayai.in` (24h TTL — new session next day OR after explicit clear).
- Every backend POST (slow_op, alert, feedback) carries the `audit_id` field.
- Footer badge displays the ID.

**Backend**:
- `observability/routes.py::lookup_audit(audit_id)` — returns merged timeline of all events under that ID:
  - Translation latencies (last 100)
  - Slow ops
  - Alerts
  - 👍/👎/✏️/🎤 feedback
  - Pages visited
- Gated by `ADMIN_MOBILE` for Sire's-only access. Public users can see their OWN audit_id only (cookie-bound).

**DB schema**:
```sql
CREATE TABLE observability.audits (
  audit_id          TEXT PRIMARY KEY,
  started_at        TIMESTAMP NOT NULL,
  device_fingerprint TEXT,                -- hash of UA+screen+lang, NOT PII
  user_token        TEXT,                 -- existing chitti_user_token from localStorage
  pages_visited     TEXT,                 -- JSON array
  total_cards       INTEGER DEFAULT 0,
  total_translations INTEGER DEFAULT 0,
  total_alerts      INTEGER DEFAULT 0,
  status            TEXT                  -- 'active' | 'closed'
);
```

**Effort**: **2–3 hours** (ID minting + propagation across all POSTs + lookup endpoint + DB row).

---

### 4. Feedback Learning Loop

**Goal**: 👍 / 👎 / ✏️ / 🎤 feedback already collected by `feedback-widget.js`. Link to `audit_id`, aggregate weekly, surface "Samples collected: N" in footer.

**What already exists**:
- `feedback-widget.js` attaches per-box bar with 4 buttons.
- POSTs to `https://chitti-vaani-api-production.up.railway.app/api/feedback/collect`.
- Stores `{ page, box_id, kind, text, ts }`.

**What's missing**:
- `audit_id` field on every POST (Feature 3 prerequisite).
- Weekly aggregation job: cluster 👎 by `(page, box_id, target_lang)` → frequency table.
- Re-training stub: every Friday IST 18:00, dump aggregated 👎 patterns to `observability.retrain_queue` for Sire's review.
- Dashboard count: "Samples collected: N" = last-7-day 👍 + 👎 count.

**Implementation**:
- Patch `feedback-widget.js` to read `localStorage.chitti_audit_id` and include in POST payload.
- Backend `observability/jobs.py::weekly_aggregate` (APScheduler cron, Fri 18:00 IST) — already-running APScheduler in `chitti-shares` and `chitti-vaani`.
- Dashboard endpoint `/api/observability/feedback_summary` returns `{ samples_last_7d, samples_lifetime, last_aggregated, retrain_queue_size }`.

**Effort**: **5–7 hours** (audit_id linkage + cron + aggregation SQL + dashboard endpoint + retrain stub).

---

## File structure (new + modified)

```
chitti-shares/backend/
  observability/                      ← NEW package
    __init__.py
    routes.py                         ← FastAPI router (slow_op, alert, lookup, feedback_summary, dashboard)
    jobs.py                           ← APScheduler cron (weekly aggregation)
    models.py                         ← SQLAlchemy: SlowOp, Alert, Audit, RetrainQueueItem
    schema.sql                        ← Turso CREATE TABLE statements (idempotent)

(repo root)
  chitti_observability.js             ← NEW substrate (~400 lines): timer, verification agent, audit ID, badge
  feedback-widget.js                  ← patch: include audit_id in POST body (~5 lines)
  chitti_a11y.js                      ← patch: auto-load chitti_observability.js (~6 lines)
  chitti_lang_runtime.js              ← patch: instrument callBackend() with timer (~3 lines)
  CHITTI_OBSERVABILITY_SPEC.md        ← this file
```

## API endpoints (added)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/observability/slow_op` | Log a >3s translation | none (rate-limited per audit_id) |
| POST | `/api/observability/alert` | Log a verification-agent breach | none (rate-limited) |
| POST | `/api/observability/heartbeat` | Periodic ping with current Active/Degraded status | none (rate-limited) |
| GET  | `/api/observability/lookup/{audit_id}` | Full timeline for one session | cookie-bound to that audit_id, OR ADMIN_MOBILE |
| GET  | `/api/observability/dashboard` | Aggregate JSON (last 5-min counts, P95/P99, sample count, last alert) | none — used by badge |
| GET  | `/api/observability/feedback_summary` | 👍/👎 counts + retrain queue size | none |
| GET  | `/chitti/observability` | HTML dashboard (Sire-only) | ADMIN_MOBILE |

## DB schema (Turso)

```sql
-- All under observability schema (one DB per Chitti, can be co-hosted with chitti-shares)

CREATE TABLE IF NOT EXISTS observability.slow_ops (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id      TEXT NOT NULL,
  ts            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page          TEXT,
  box_id        TEXT,
  text_length   INTEGER,
  elapsed_ms    INTEGER,
  source_lang   TEXT,
  target_lang   TEXT,
  kind          TEXT                  -- 'translation' | 'card_attach' | 'feedback_post'
);
CREATE INDEX idx_slow_ops_audit ON observability.slow_ops(audit_id, ts);

CREATE TABLE IF NOT EXISTS observability.alerts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id      TEXT NOT NULL,
  ts            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page          TEXT,
  check_name    TEXT,                 -- 'card_detection' | 'translation_completeness' | 'widget_attach' | 'llm_reachable' | 'cache_integrity'
  severity      TEXT,                 -- 'degraded' | 'failed'
  observed_value TEXT,
  threshold     TEXT,
  resolved_at   TIMESTAMP
);
CREATE INDEX idx_alerts_audit ON observability.alerts(audit_id, ts);

CREATE TABLE IF NOT EXISTS observability.audits (
  audit_id          TEXT PRIMARY KEY,
  started_at        TIMESTAMP NOT NULL,
  last_seen_at      TIMESTAMP,
  device_fingerprint TEXT,
  user_token        TEXT,
  pages_visited     TEXT,                 -- JSON array
  total_cards       INTEGER DEFAULT 0,
  total_translations INTEGER DEFAULT 0,
  total_alerts      INTEGER DEFAULT 0,
  status            TEXT                  -- 'active' | 'closed'
);

CREATE TABLE IF NOT EXISTS observability.retrain_queue (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page          TEXT,
  box_id        TEXT,
  target_lang   TEXT,
  thumbs_down_count INTEGER,
  thumbs_up_count   INTEGER,
  sample_corrections TEXT,                 -- JSON of ✏️ feedback texts
  status        TEXT DEFAULT 'pending'     -- 'pending' | 'reviewed' | 'applied' | 'rejected'
);
```

## Frontend component: observability badge

`chitti_observability.js` (auto-loaded by `chitti_a11y.js`) injects a fixed-position badge bottom-left (mirrors the existing Chitti FAB at bottom-right; doesn't overlap).

Visual style matches MedUPI theme — saffron border, navy text, white background, 12px font, rounded 12px corners.

States:
- **Active (green ✅)**: all 5 checks pass.
- **Degraded (amber ⚠️)**: 1–2 checks breaching.
- **Failed (red ❌)**: LLM endpoint dead OR ≥ 3 checks breaching.

Badge expands on tap to show last 5 alerts + audit_id (tappable to copy).

---

## observable.log

Sire's spec called for a flat `observable.log` file. **Recommendation**: skip the flat file, use Turso `observability.*` tables instead. Reasons:

1. Railway containers have no persistent disk by default — log file would vanish on restart.
2. Tables are queryable (`SELECT * FROM observability.slow_ops WHERE audit_id = ?`).
3. Tables already replicated to backup Turso replica nightly.
4. Sire can still get a flat file: `GET /api/observability/export.log?audit_id=X` streams as plain JSON-lines.

---

## Performance budget

Sire's spec: "All 4 features must work together with zero performance degradation."

| Cost | Where | Budget |
|---|---|---|
| Timer wrap on every translation | Client JS | < 0.1ms per call (microbenchmark `performance.now()`) |
| Verification agent loop | Client JS | 5s interval, < 5ms per tick (counting DOM elements) |
| Badge re-render | Client JS | 5s interval, single `requestAnimationFrame` |
| Backend POST batching | Client → server | Heartbeat batches every 30s, slow_op fires only on breach |
| DB writes | Turso | < 50 writes/min/audit (well under 1k req/s shared limit) |
| Badge render | DOM | One absolute-positioned div, ~200 bytes innerHTML |

Total CPU overhead: **< 0.2% on a 2017 Android**.

---

## Phased build plan (Sire-tunable scope)

| Phase | Scope | Hours | Sire sees |
|---|---|---:|---|
| **A — MVP badge** | Audit ID minting + footer badge + sample count from existing `feedback` table + stubbed Response Time (last LLM call only) + Active status only | **5–6h** | Badge live on every page in one session |
| **B — Real metrics** | Real P50/P95/P99 latency tracking + slow-op logging + full Verification Agent (5 checks + Degraded/Failed states) + alert endpoint | **8–10h** | Live latency numbers + Active ✅ / Degraded ⚠️ / Failed ❌ |
| **C — Learning loop** | Weekly aggregation cron + retrain queue + feedback_summary endpoint + Sire-only `/chitti/observability` dashboard + alert dedup + 5-min rolling counts | **8–13h** | "234 cards · 0 failures" live count + Sire dashboard for past audits |
| **Total** | All 4 features end-to-end | **21–29h** | Full spec delivered |

## What I need from Sire

1. **Approve the stack choice** (FastAPI + Turso, not Node + React).
2. **Pick a phase to start** (A / B / C / all). I recommend **Phase A first** so you see the badge in this session before committing more hours.
3. **Approve the badge position** (bottom-left, fixed, expands on tap) — or specify a different spot.
4. **Approve the audit_id format** `CH-20260529-A7F3` — or specify a different shape.
5. **Confirm "observable.log" → Turso tables swap** is OK (matches existing audit_log pattern).

---

> **World Class Chitti Observability — Commando Discipline. Zero Excuses.**
