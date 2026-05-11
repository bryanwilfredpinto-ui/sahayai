# CHANGELOG — Chitti Logo & Video

Derived from `git log --oneline --reverse -- chitti-logo-video/`.

## 2026-05-09 — `db18427` — feat(chitti): Voice Factory (26 langs) + CA + Legal + Logo & Video

**The only commit so far. v1 ships in a single change.**

Shipped together with three sibling Chitti products in the broader 2026-05-09 feature drop announced in the Anthropic → DeepSeek provider-switch memo.

Contents of this commit, scoped to `chitti-logo-video/`:

- `backend/main.py` — Flask app factory, CORS from `ALLOWED_ORIGINS`, registers `lv` blueprint, exposes `app` for gunicorn. Local dev binds `8003`.
- `backend/config.py` — env-driven `Settings` dataclass (frozen). Five keys: `REPLICATE_API_TOKEN`, `REPLICATE_LOGO_MODEL`, `VIDEO_PROVIDER`, `VIDEO_PROVIDER_KEY`, `ALLOWED_ORIGINS`.
- `backend/routes/lv.py` — Blueprint `/api/lv/*` with `GET /health`, `POST /logo/generate`, `POST /video/enqueue`, `GET /video/status/<job_id>`. Input validation (brand-name ≤ 80, script ≤ 4000, duration-int coercion).
- `backend/services/logo_service.py` — 5 palettes (`bharat`, `modern`, `classic`, `festive`, `calm`), 3 styles (`monogram`, `wordmark`, `shield`), deterministic SVG generator with `aria-label`, gradient defs, scalable `viewBox`. `_replicate_generate()` stub in place — returns `not_implemented` and falls through to mock.
- `backend/services/video_service.py` — `_Job` dataclass + thread-safe `_JOBS` dict + `_LOCK`. State machine `queued → rendering → VIDEO_READY` driven by `_MOCK_RENDER_S = 3.0` on lazy poll-time evaluation. `_placeholder_url()` returns a `data:image/svg+xml,...` 640×360 navy card. Real-provider branch in place but unwired.
- `backend/requirements.txt` — `flask==3.0.3`, `flask-cors==4.0.1`, `gunicorn==22.0.0`. (No DB, no SDK, no LLM client.)
- `backend/runtime.txt` — `python-3.11.10`.
- `render.yaml` — Render web service, free tier, gunicorn 2 workers, 60 s timeout, 4 `sync: false` secret slots ready for the real keys.
- `README.md` — v1 readme (now superseded by the expanded one in this folder).
- Frontend (at repo root): [`chitti_logo_video.html`](../chitti_logo_video.html) — single-page HTML/CSS/JS, palette picker, logo form, video form, polling loop @ 800 ms, persistent "Stub mode" banner, four-user contract chips, download-SVG via `Blob`.

**Stub-mode contract honoured throughout:** every JSON response carries `supplier: "mock"` and a `disclaimer` field naming exactly what is and isn't wired. No fake "coming soon" placeholders.

---

## Unreleased / planned

See [TODO.md](TODO.md). Next commits will be:

1. v2 — wire `_replicate_generate()` to a real Replicate model.
2. v3 — wire the video real-provider branch to Pika / Runway / Remotion-render.
3. v4 — asset storage (S3 / R2), brand-color picker, Devanagari/Tamil glyph rendering in the SVG.
