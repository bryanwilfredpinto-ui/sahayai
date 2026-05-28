# ARCHITECTURE — Chitti Logo & Video

## One-page system diagram

```
                      ┌─────────────────────────────────────────────┐
                      │  Browser  (chitti_logo_video.html, static)  │
                      │  - palette picker (5 swatches)              │
                      │  - logo form  (brand, tagline, style)       │
                      │  - video form (script, language, duration)  │
                      │  - polling loop @ 800 ms                    │
                      └─────────────────┬───────────────────────────┘
                                        │  HTTPS (CORS: sahayai.in)
                                        ▼
              ┌─────────────────────────────────────────────────────┐
              │  Railway free-tier web service                       │
              │  chitti-logo-video-api-production.up.railway.app                 │
              │  gunicorn main:app --workers 2 --timeout 60         │
              │                                                     │
              │  Flask 3.0.3 app                                    │
              │  ├── GET  /                  banner JSON            │
              │  ├── GET  /health            {ok: true}             │
              │  └── Blueprint /api/lv/*                            │
              │      ├── GET  /health                               │
              │      ├── POST /logo/generate ─────► logo_service    │
              │      ├── POST /video/enqueue ─────► video_service   │
              │      └── GET  /video/status/<id> ─► video_service   │
              └─────────────┬─────────────────────────┬─────────────┘
                            │                         │
                            ▼                         ▼
              ┌─────────────────────────┐   ┌─────────────────────────┐
              │ logo_service.py         │   │ video_service.py        │
              │ - PALETTES (5)          │   │ - _JOBS: dict[id, _Job] │
              │ - _initials()           │   │ - _LOCK: threading.Lock │
              │ - _mock_svg()           │   │ - _MOCK_RENDER_S = 3.0  │
              │   ├── monogram          │   │ - enqueue()             │
              │   ├── wordmark          │   │ - status()              │
              │   └── shield            │   │ - _placeholder_url()    │
              │ - _replicate_generate() │   │   (data: SVG card)      │
              │   (stub, NOT wired)     │   │ - real provider branch  │
              └─────────────────────────┘   │   (stub, NOT wired)     │
                                            └─────────────────────────┘
                            ▲                         ▲
                            │                         │
                  REPLICATE_API_TOKEN +     VIDEO_PROVIDER +
                  REPLICATE_LOGO_MODEL      VIDEO_PROVIDER_KEY
                  (env, `sync: false` in render.yaml — set in Railway dashboard)
```

---

## Backend layout

| File | Role |
|---|---|
| [`backend/main.py`](backend/main.py) | Flask `create_app()`, CORS, root + health, registers `lv` blueprint, exposes `app` for gunicorn. |
| [`backend/config.py`](backend/config.py) | `Settings` frozen dataclass — `REPLICATE_API_TOKEN`, `REPLICATE_LOGO_MODEL`, `VIDEO_PROVIDER`, `VIDEO_PROVIDER_KEY`, `ALLOWED_ORIGINS`. All env-driven. |
| [`backend/routes/lv.py`](backend/routes/lv.py) | `Blueprint("lv", url_prefix="/api/lv")` — input validation + thin dispatch to services. |
| [`backend/services/logo_service.py`](backend/services/logo_service.py) | SVG generator + 5-palette table + Replicate stub. |
| [`backend/services/video_service.py`](backend/services/video_service.py) | Thread-safe in-memory job queue + mock state machine. |
| [`backend/requirements.txt`](backend/requirements.txt) | `flask==3.0.3`, `flask-cors==4.0.1`, `gunicorn==22.0.0`. No DB driver, no SDK, no LLM client. |
| [`backend/runtime.txt`](backend/runtime.txt) | `python-3.11.10` (matches `render.yaml` `PYTHON_VERSION`). |
| [`render.yaml`](render.yaml) | Railway web service, `plan: free`, 2 gunicorn workers, 60 s timeout, 5 env vars (4 of them `sync: false`). |

---

## Request lifecycle — logo

```
POST /api/lv/logo/generate
{
  "brand_name": "Saraswati Kirana",
  "tagline":    "Aapka rozana sathi",
  "palette":    "bharat",
  "style":      "monogram"
}
```

1. `lv.logo_generate()` validates: `brand_name` required, ≤ 80 chars; trims `tagline`; defaults `palette="bharat"`, `style="monogram"`.
2. Calls `logo_service.generate_logo(...)`.
3. Service looks up palette in `PALETTES` (falls back to `bharat` if unknown).
4. If `REPLICATE_API_TOKEN` AND `REPLICATE_LOGO_MODEL` are set, calls `_replicate_generate()`. **Today this returns `{ok: False, error: "not_implemented"}` and falls through.**
5. `_mock_svg()` builds the SVG by style:
   - `wordmark` — 480×160 banner with linear gradient + full brand name + tagline.
   - `shield` — 320×320 shield path with initials inside, gradient + accent stroke.
   - `monogram` (default) — 320×320 rounded square + circle medallion + initials + brand name + tagline.
6. Returns:
   ```json
   {
     "ok": true,
     "supplier": "mock",
     "brand_name": "...",
     "tagline": "...",
     "palette_name": "bharat",
     "palette": { "primary": "#E86A17", "secondary": "...", "accent": "...", "ink": "#FFFFFF" },
     "style": "monogram",
     "svg": "<svg ...>...</svg>",
     "disclaimer": "Mock logo generator. Real model (Replicate) wires in when REPLICATE_API_TOKEN + REPLICATE_LOGO_MODEL env vars are set."
   }
   ```

Frontend stuffs the SVG straight into `innerHTML` and offers a `Blob`-based download.

---

## Request lifecycle — video

```
POST /api/lv/video/enqueue                      GET /api/lv/video/status/<id>
{                                                (poll every 800 ms)
  "script": "Saraswati Kirana — ...",
  "language": "hi",                              ┌── elapsed < 1.0 s  → "queued"
  "duration_s": 30                               ├── 1.0 ≤ elapsed < 3.0 → "rendering"
}                                                └── elapsed ≥ 3.0 s  → "VIDEO_READY"
                                                                       + url = data:image/svg+xml,...
```

1. `lv.video_enqueue()` validates: `script` required, ≤ 4000 chars; coerces `duration_s` to int (400 on TypeError/ValueError).
2. `video_service.enqueue()` clamps duration to `[5, 120]`, allocates a `uuid4().hex` job id, builds a `_Job` dataclass, takes `_LOCK`, stores in `_JOBS`. Returns `{ok, job_id, state: "queued", supplier, duration_s, language, disclaimer}`.
3. Each `status(job_id)` call:
   - Looks up under `_LOCK` (404 if missing).
   - Computes `elapsed = time.time() - job.enqueued_at`.
   - State transitions are **lazy** — they happen on poll, not on a timer thread. This works fine for a free-tier 2-worker gunicorn because jobs are sticky to the worker that created them (no shared state across processes; acceptable for stub mode).
   - At `elapsed ≥ 3.0 s` flips to `VIDEO_READY` and sets `url` to a `data:image/svg+xml,...` URL (a 640×360 navy card with "Mock video · job <8-char prefix> · Real renderer wires in when VIDEO_PROVIDER is set").
4. Returns the full state + a human-readable `log` list.

**Known stub limit (acceptable today):** because state is in-process, scaling beyond 2 workers loses job stickiness. When the real renderer arrives we'll move job state to Redis (or to the provider's own job API and stop tracking locally).

---

## CORS / origins

`ALLOWED_ORIGINS` (set in `render.yaml`):

```
https://sahayai.in
https://www.sahayai.in
```

Local dev adds (via `config.py` default):

```
http://localhost:5500
http://127.0.0.1:5500
```

Origins are comma-split and trimmed in `main._origins()`.

---

## Deploy

[`render.yaml`](render.yaml):

```yaml
services:
  - type: web
    name: chitti-logo-video-api
    runtime: python
    rootDir: chitti-logo-video/backend
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.10
      - key: ALLOWED_ORIGINS
        value: https://sahayai.in,https://www.sahayai.in
      - key: REPLICATE_API_TOKEN
        sync: false                  # set in Railway dashboard when key lands
      - key: REPLICATE_LOGO_MODEL
        sync: false
      - key: VIDEO_PROVIDER
        sync: false
      - key: VIDEO_PROVIDER_KEY
        sync: false
```

Public URL: `https://chitti-logo-video-api-production.up.railway.app`. Note: per [`project_render_deploy_status_2026_05_10`](../../../.claude/projects/c--Users-DELL-sahayai-sahayai/memory/MEMORY.md), this service's `render.yaml` exists but the Railway service may not be wired yet — verify with `curl https://chitti-logo-video-api-production.up.railway.app/health` before declaring it live.
