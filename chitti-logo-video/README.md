🎖️ **World Class Chitti Logo & Video — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Intentional honest stub — SVG monogram + queued mock video. NEVER claims to ship AI-generated video. Graduates to 🟢 only when real provider API key lands in Railway env.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_logo_video.html |
| Health | https://chitti-logo-video-production.up.railway.app/health |
| Status | 🟡 YELLOW by design — Observability=None is correct until product graduates |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, ISL panel |
| Languages | EN + HI |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §14](../CHITTI_SOP.md) |

---

# Chitti Logo & Video

Small-business **logo + short explainer video** generator for Indian shops, freelancers, kirana counters, Insta brands, and kids' school projects. Free, no sign-up, zero design skill required.

> **Honest-stub mode (active today, per the 2026-05-09 AI-provider memo).**
> Logos return a real, working, downloadable SVG monogram. Videos return a real polling job whose final URL is a hand-built SVG placeholder card. Every response includes `supplier: "mock"` and a disclaimer. We do not show fake "coming soon" placeholders — we ship a working thing today and swap in the real generator the moment API keys arrive.

---

## What this product is

| Surface | Today (stub) | After keys land |
|---|---|---|
| Logo | Deterministic SVG monogram / wordmark / shield in 5 palettes | Replicate model (`REPLICATE_API_TOKEN` + `REPLICATE_LOGO_MODEL`) |
| Video | In-memory job queue, ~3 s `queued → rendering → VIDEO_READY`, returns SVG placeholder | Remotion / Pika / Runway via `VIDEO_PROVIDER` + `VIDEO_PROVIDER_KEY` |

The wire-up points are already in code — see [`logo_service._replicate_generate()`](backend/services/logo_service.py) and the `VIDEO_PROVIDER` branch in [`video_service.enqueue()`](backend/services/video_service.py).

---

## Stack

- **Backend**: Flask 3 + flask-cors + gunicorn, Python 3.11.10
- **Frontend**: single static page [`chitti_logo_video.html`](../chitti_logo_video.html) (HTML/CSS/JS, no framework)
- **Hosting**: Railway free tier (`chitti-logo-video-api-production.up.railway.app`) + GitHub Pages
- **State**: stateless. Video jobs live in-process in `_JOBS: dict[str, _Job]`. No DB.

---

## Run locally

```bash
cd chitti-logo-video/backend
pip install -r requirements.txt
python main.py                           # http://localhost:8003
```

Then open the frontend:

```bash
# from repo root
python -m http.server 5500
# visit http://localhost:5500/chitti_logo_video.html
```

If you want the frontend to talk to local backend, set `window.CHITTI_LV_API = "http://localhost:8003"` before the script runs (or edit the constant in [`chitti_logo_video.html`](../chitti_logo_video.html) line 156).

---

## API quick-ref

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/`                              | banner + env-driven supplier names |
| `GET`  | `/health`                        | `{ok: true}` (Railway health-check) |
| `GET`  | `/api/lv/health`                 | logo + video supplier status |
| `POST` | `/api/lv/logo/generate`          | `{brand_name, tagline?, palette?, style?}` → `{svg, ...}` |
| `POST` | `/api/lv/video/enqueue`          | `{script, language?, duration_s?}` → `{job_id, state, ...}` |
| `GET`  | `/api/lv/video/status/<job_id>`  | poll job state → `{state, url?, log, elapsed_s}` |

Full schema in [API.md](API.md).

---

## File map

```
chitti-logo-video/
├── README.md            ← this file
├── render.yaml          ← Railway service config (free tier, gunicorn 2 workers)
├── CONTEXT.md           ← why this product, four-user contract, honest-stub pattern
├── ARCHITECTURE.md      ← Flask + SVG generator + mock queue
├── CHANGELOG.md         ← git history
├── TODO.md              ← path to v2 (real APIs)
├── API.md               ← every HTTP endpoint
├── DATABASE.md          ← N/A (stateless)
├── PROMPTS.md           ← N/A today (no LLM in stub)
└── backend/
    ├── main.py          ← Flask entry, `create_app()`, registers blueprint
    ├── config.py        ← `Settings` dataclass, env-driven
    ├── requirements.txt ← flask 3.0.3, flask-cors 4.0.1, gunicorn 22.0.0
    ├── runtime.txt      ← python-3.11.10
    ├── routes/
    │   ├── __init__.py  ← empty
    │   └── lv.py        ← Blueprint `/api/lv/*`
    └── services/
        ├── __init__.py  ← empty
        ├── logo_service.py    ← SVG monogram/wordmark/shield + Replicate stub
        └── video_service.py   ← in-memory job queue + SVG placeholder URL
```

---

## Build phases

1. **v1 (shipped 2026-05-09 in commit `db18427`)** — stubs for logo + video, deploy-ready, frontend wired.
2. **v2** — real logo via Replicate; Bryan provides `REPLICATE_API_TOKEN` + a model slug.
3. **v3** — real video; Bryan provides `VIDEO_PROVIDER` (`pika` / `runway` / `remotion-render`) + key.
4. **v4** — asset storage (S3 / Cloudflare R2), brand-color picker, multi-language brand-name rendering (Devanagari / Tamil / Telugu glyphs in the SVG, not just placeholder Latin).

See [TODO.md](TODO.md) for the full punch list.
