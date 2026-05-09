# Chitti Logo & Video Creator

Two stub-mode services in one Flask backend:

- **Logo** — deterministic SVG monogram / wordmark / shield in 5 palettes (`bharat`, `modern`, `classic`, `festive`, `calm`). Real model wires via `REPLICATE_API_TOKEN` + `REPLICATE_LOGO_MODEL`.
- **Video** — in-memory async job queue. Returns `state: queued → rendering → VIDEO_READY` over ~3 s. Real renderer wires via `VIDEO_PROVIDER` + `VIDEO_PROVIDER_KEY`.

Stubs are honest: every response carries `supplier: "mock"` and a disclaimer naming what is and isn't real.

## Run

```bash
cd backend
pip install -r requirements.txt
python main.py                           # http://localhost:8003
```

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/` | — | banner |
| GET | `/health` | — | `{ok:true}` |
| GET | `/api/lv/health` | — | logo + video supplier status |
| POST | `/api/lv/logo/generate` | `{brand_name, tagline?, palette?, style?}` | `{ok, supplier, svg, palette, style, disclaimer}` |
| POST | `/api/lv/video/enqueue` | `{script, language?, duration_s?}` | `{ok, job_id, state, duration_s, language, disclaimer}` |
| GET | `/api/lv/video/status/<job_id>` | — | `{ok, job_id, state, url, log, elapsed_s}` |

## Build phases

1. v1 (this commit) — stubs for logo + video, frontend canvas editor, deploy-ready.
2. v2 — real logo via Replicate (Bryan provides `REPLICATE_API_TOKEN` + model slug).
3. v3 — real video via Remotion / Pika / Runway (Bryan provides `VIDEO_PROVIDER` + key).
