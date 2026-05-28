# OBSERVABILITY — Chitti Logo + Video

What we measure, why, and where the signal comes from today.

## Today's signal surfaces

| Surface | Source | What it tells us |
|---|---|---|
| Railway stdout log | gunicorn default | Request lines, traceback on crash. |
| `GET /` banner | [`../backend/main.py`](../backend/main.py) `root()` | Which suppliers are active (`mock` vs `replicate` vs `pika`). |
| `GET /api/lv/health` | [`../backend/routes/lv.py`](../backend/routes/lv.py) `health()` | Per-service supplier + `jobs_in_memory` count for the responding worker. |

No Sentry, no Datadog, no PostHog today. The founder dashboard at `sahayai.in/founder` pulls from `/api/lv/health`.

## Metrics worth tracking (when we wire a real observability stack)

### 1. Job queue depth

**Why:** A growing `_JOBS` dict on one worker means jobs are not being garbage-collected (today they aren't — see [`./DEVILS_ADVOCATE.md`](./DEVILS_ADVOCATE.md) critique 4).

**Where:** `len(video_service._JOBS)` under `_LOCK`.

**Threshold:** alarm at `> 500` per worker on free tier.

### 2. SVG generation latency

**Why:** `_mock_svg()` is pure string-format and should be < 5 ms. If it climbs, something blocked the worker (likely the future Replicate call held the lock).

**Where:** time.perf_counter() wrap around `generate_logo()` in [`../backend/services/logo_service.py`](../backend/services/logo_service.py).

**Threshold:** p95 < 50 ms in stub mode; < 8 s in real-Replicate mode.

### 3. Mock-video polling rate

**Why:** Frontend polls every 800 ms. If we see > 5 polls/sec from one client, the polling loop has a bug.

**Where:** count `GET /api/lv/video/status/<job_id>` per client per minute.

**Threshold:** alarm at > 200 polls/min per IP.

### 4. Brand-name uniqueness check (informational)

**Why:** Even though we don't store brand names today, the frontend can hash-and-count locally to flag "this is the 47th 'Saraswati Kirana' generated today" — useful market signal for Bryan, not a block.

**Where:** new `_brand_hash_counter` keyed on `sha256(brand_name.lower().strip())[:8]`. Reset daily.

**Threshold:** none — this is a dashboard chart, not an alarm.

### 5. State-transition timing

**Why:** Confirm the mock state machine is actually transitioning `queued (< 1 s) → rendering (1–3 s) → VIDEO_READY (>= 3 s)`. If a worker is under load, transitions slip and the disclaimer about "3 s render" becomes a lie.

**Where:** record `state_transitioned_at - enqueued_at` per job; emit as a histogram.

**Threshold:** p95 `VIDEO_READY` reached within 5 s.

### 6. Supplier mismatch flag

**Why:** If `VIDEO_PROVIDER` is set but the wire-up isn't implemented, response carries `supplier: "mock_pending_real_wireup"` — that flag should never appear in production for more than 24 hours after Bryan flips the env var.

**Where:** count responses with `supplier == "mock_pending_real_wireup"`.

**Threshold:** alarm if non-zero > 24 h.

### 7. CORS rejections

**Why:** Unknown origin trying to call the API → either a new legitimate frontend (needs adding to `ALLOWED_ORIGINS`) or abuse.

**Where:** Flask-CORS logs preflight rejections. Pipe to stdout.

## What we deliberately do NOT measure

- **User brand names** — privacy. See [`./BOUNDARIES.md`](./BOUNDARIES.md) rule 4.
- **User IPs** in long-term storage — same reason. Short-term rate-limit counters only.
- **Script content** — same.
