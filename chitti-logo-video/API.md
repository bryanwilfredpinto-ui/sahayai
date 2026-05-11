# API — Chitti Logo & Video

Base URL (production): `https://chitti-logo-video-api.onrender.com`
Base URL (local dev):  `http://localhost:8003`

All endpoints return `application/json`. Errors are also JSON (`{ok: false, error: "..."}`). CORS is restricted to `ALLOWED_ORIGINS` — see [render.yaml](render.yaml).

Routes live in [`backend/routes/lv.py`](backend/routes/lv.py) (blueprint, `url_prefix="/api/lv"`) plus the two top-level routes defined inline in [`backend/main.py`](backend/main.py).

---

## 1. `GET /`

**Source:** [`backend/main.py`](backend/main.py) `root()`

Banner / discovery endpoint. Useful for `curl`-ing to confirm the deploy is alive and which suppliers are active.

### Response — 200

```json
{
  "name": "chitti-logo-video",
  "version": "1.0",
  "logo_supplier":  "mock",
  "video_supplier": "mock",
  "endpoints": [
    "GET /", "GET /health", "GET /api/lv/health",
    "POST /api/lv/logo/generate",
    "POST /api/lv/video/enqueue",
    "GET /api/lv/video/status/<job_id>"
  ]
}
```

`logo_supplier` is `"replicate"` if `REPLICATE_API_TOKEN` is set (truthy), else `"mock"`. `video_supplier` is whatever `VIDEO_PROVIDER` env var contains, or `"mock"` if empty.

---

## 2. `GET /health`

**Source:** [`backend/main.py`](backend/main.py) `health()`

Render's health-check endpoint. Bryan should curl this in production before declaring a deploy "live" (per [`feedback_verify_before_handover`](../../../.claude/projects/c--Users-DELL-sahayai-sahayai/memory/MEMORY.md)).

### Response — 200

```json
{ "ok": true }
```

---

## 3. `GET /api/lv/health`

**Source:** [`backend/routes/lv.py`](backend/routes/lv.py) `health()`

Sub-service health — exposes the per-service health blocks so the founder dashboard at `sahayai.in/founder` can render supplier status separately for logo vs video.

### Response — 200

```json
{
  "ok": true,
  "logo": {
    "ok": true,
    "service": "logo",
    "supplier": "mock",
    "palettes": ["bharat", "modern", "classic", "festive", "calm"],
    "styles":   ["monogram", "wordmark", "shield"]
  },
  "video": {
    "ok": true,
    "service": "video",
    "supplier": "mock",
    "provider_configured": false,
    "jobs_in_memory": 0
  }
}
```

`jobs_in_memory` reflects only the queue inside **the single gunicorn worker that handled this request** — there is no cross-worker accounting today (acceptable for stub mode; see [ARCHITECTURE.md](ARCHITECTURE.md)).

---

## 4. `POST /api/lv/logo/generate`

**Source:** [`backend/routes/lv.py`](backend/routes/lv.py) `logo_generate()` → [`backend/services/logo_service.py`](backend/services/logo_service.py) `generate_logo()`

Generates a deterministic SVG logo and returns it inline. **No state is persisted** — call again to get the same SVG.

### Request body

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `brand_name` | string | yes | — | `.strip()`'d; must be non-empty; ≤ 80 chars. |
| `tagline`    | string | no  | `""` | `.strip()`'d. |
| `palette`    | string | no  | `"bharat"` | One of `bharat`, `modern`, `classic`, `festive`, `calm`. Unknown values silently fall back to `bharat`. |
| `style`      | string | no  | `"monogram"` | One of `monogram`, `wordmark`, `shield`. Unknown values render as monogram. |

### Response — 200

```json
{
  "ok": true,
  "supplier": "mock",
  "brand_name": "Saraswati Kirana",
  "tagline": "Aapka rozana sathi",
  "palette_name": "bharat",
  "palette": {
    "primary":   "#E86A17",
    "secondary": "#0E2344",
    "accent":    "#D4AF37",
    "ink":       "#FFFFFF"
  },
  "style": "monogram",
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 320\" role=\"img\" aria-label=\"Saraswati Kirana logo\">...</svg>",
  "disclaimer": "Mock logo generator. Real model (Replicate) wires in when REPLICATE_API_TOKEN + REPLICATE_LOGO_MODEL env vars are set."
}
```

### Errors

| Status | Body | When |
|---|---|---|
| 400 | `{"ok": false, "error": "missing_brand_name"}` | Empty or whitespace-only `brand_name`. |
| 413 | `{"ok": false, "error": "brand_name_too_long", "max": 80}` | `len(brand_name) > 80`. |

### Palette reference (live in code)

| Name | Primary | Secondary | Accent | Ink |
|---|---|---|---|---|
| `bharat`  | `#E86A17` saffron | `#0E2344` navy | `#D4AF37` gold | `#FFFFFF` |
| `modern`  | `#6366F1` indigo  | `#0F172A` slate-950 | `#22D3EE` cyan | `#FFFFFF` |
| `classic` | `#1F2937` gray-800 | `#F3F4F6` gray-100 | `#B45309` amber-700 | `#FFFFFF` |
| `festive` | `#DC2626` red-600 | `#15803D` green-700 | `#FACC15` yellow-400 | `#FFFFFF` |
| `calm`    | `#0F766E` teal-700 | `#0C4A6E` sky-900 | `#67E8F9` cyan-300 | `#FFFFFF` |

### cURL

```bash
curl -X POST https://chitti-logo-video-api.onrender.com/api/lv/logo/generate \
  -H "Content-Type: application/json" \
  -d '{"brand_name":"Saraswati Kirana","tagline":"Aapka rozana sathi","palette":"bharat","style":"monogram"}'
```

---

## 5. `POST /api/lv/video/enqueue`

**Source:** [`backend/routes/lv.py`](backend/routes/lv.py) `video_enqueue()` → [`backend/services/video_service.py`](backend/services/video_service.py) `enqueue()`

Submits a video-generation job and returns a `job_id` to poll. **State is in-process** (per-gunicorn-worker) so always poll from the same browser session and accept that a Render free-tier cold restart drops queued jobs.

### Request body

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `script` | string | yes | — | `.strip()`'d; non-empty; ≤ 4000 chars. |
| `language` | string | no  | `"en"` | ISO 639-1 hint; passed through to (future) TTS. Today only stored on the job. |
| `duration_s` | int | no | `30` | Coerced via `int(...)` — bad input → 400. Clamped server-side to `[5, 120]`. |

### Response — 200

```json
{
  "ok": true,
  "job_id": "9a4f8e1c3b7d4f1ea2f6c0e8b5a3d7c2",
  "state": "queued",
  "supplier": "mock",
  "duration_s": 30,
  "language": "hi",
  "disclaimer": "Mock video generator. Real video synthesis (Remotion / Pika / Runway) wires in when VIDEO_PROVIDER + VIDEO_PROVIDER_KEY env vars are set."
}
```

When `VIDEO_PROVIDER` is set but the real wire-up isn't implemented yet, `supplier` will be `"mock_pending_real_wireup"` (so the founder dashboard can flag the discrepancy).

### Errors

| Status | Body | When |
|---|---|---|
| 400 | `{"ok": false, "error": "missing_script"}` | Empty or whitespace-only `script`. |
| 400 | `{"ok": false, "error": "invalid_duration_s"}` | `duration_s` not coerceable to int. |
| 413 | `{"ok": false, "error": "script_too_long", "max": 4000}` | `len(script) > 4000`. |

### cURL

```bash
curl -X POST https://chitti-logo-video-api.onrender.com/api/lv/video/enqueue \
  -H "Content-Type: application/json" \
  -d '{"script":"Saraswati Kirana — every Indian household.","language":"hi","duration_s":30}'
```

---

## 6. `GET /api/lv/video/status/<job_id>`

**Source:** [`backend/routes/lv.py`](backend/routes/lv.py) `video_status()` → [`backend/services/video_service.py`](backend/services/video_service.py) `status()`

Polls the state of a queued job. Frontend polls every 800 ms. State transitions are evaluated **lazily on every poll** against `time.time() - job.enqueued_at`.

### Path params

| Param | Type | Notes |
|---|---|---|
| `job_id` | string | The `uuid4().hex` returned by `/video/enqueue`. |

### Response — 200

```json
{
  "ok": true,
  "job_id": "9a4f8e1c3b7d4f1ea2f6c0e8b5a3d7c2",
  "state": "VIDEO_READY",
  "url": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20640%20360%27%3E...",
  "notes": "",
  "log": [
    "enqueued at 11:14:02",
    "rendering at 11:14:03",
    "VIDEO_READY at 11:14:05 (mock, 3.1s)"
  ],
  "elapsed_s": 3.12
}
```

### State machine (mock mode)

| `elapsed_s` | `state` | `url` |
|---|---|---|
| `< 1.0`  | `"queued"`       | `null` |
| `1.0 ≤ e < 3.0` | `"rendering"` | `null` |
| `≥ 3.0`  | `"VIDEO_READY"`  | `data:image/svg+xml;utf8,...` (640×360 navy SVG card) |

Future states (real-provider mode): `"failed"` (with `error` field, currently never emitted by the stub).

### Errors

| Status | Body | When |
|---|---|---|
| 404 | `{"ok": false, "error": "unknown_job_id", "job_id": "<id>"}` | Job missing from this worker's `_JOBS` dict (never created, or this is a different worker than the one that enqueued, or the worker restarted). |

### cURL

```bash
curl https://chitti-logo-video-api.onrender.com/api/lv/video/status/9a4f8e1c3b7d4f1ea2f6c0e8b5a3d7c2
```
