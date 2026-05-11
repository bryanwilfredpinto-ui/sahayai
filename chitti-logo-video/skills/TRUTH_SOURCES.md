# TRUTH_SOURCES — Chitti Logo + Video

## Today

**None.** The product has zero external data sources. Specifically:

- **No LLM** — see [`../PROMPTS.md`](../PROMPTS.md). No DeepSeek, no Anthropic, no OpenAI client in [`../backend/requirements.txt`](../backend/requirements.txt).
- **No database** — see [`../DATABASE.md`](../DATABASE.md). Video jobs live in `_JOBS: dict[str, _Job]` in-process. No Postgres, no SQLite, no Redis.
- **No image-generation provider** — Replicate / Stability / Ideogram clients are absent.
- **No video-generation provider** — Pika / Runway / Remotion clients are absent.
- **No object storage** — no S3, no R2, no Render disk write.
- **No analytics, no telemetry, no logging service.** The Render-default stdout log is the only observability surface.

The entire output is deterministic Python string-formatting in [`../backend/services/logo_service.py`](../backend/services/logo_service.py) `_mock_svg()` and [`../backend/services/video_service.py`](../backend/services/video_service.py) `_placeholder_url()`.

This is the **whole point** of the honest stub. Zero failure modes from external services.

## Future (wire-up points already in code)

| Concern | Provider candidates | Wire-up location | Env var |
|---|---|---|---|
| Logo generation | **Replicate** (SDXL / Ideogram / Playground) — primary. **Stability AI** direct — backup. **Looka API** — B2B contract option. | [`../backend/services/logo_service.py`](../backend/services/logo_service.py) `_replicate_generate()` stub | `REPLICATE_API_TOKEN`, `REPLICATE_LOGO_MODEL` |
| Video generation | **Remotion + Lambda** — primary (full control, MP4 out). **Pika 1.5** — when public API opens. **Runway Gen-3** — premium quality. **Sora** — when OpenAI opens it. | [`../backend/services/video_service.py`](../backend/services/video_service.py) `enqueue()` `VIDEO_PROVIDER` branch | `VIDEO_PROVIDER`, `VIDEO_PROVIDER_KEY` |
| Asset storage | **Cloudflare R2** (recommended — zero egress fees) > AWS S3 > Render disk. | New `backend/services/storage.py` (does not exist yet) | TBD |
| Narrator TTS | **Chitti Voice Factory** — reuse the 4-supplier cascade (Bhashini / ULCA / suppliers), 26 langs incl. Sanskrit + Oraon. Do NOT build parallel TTS. | New `backend/services/narrator.py` calling `/api/voice/synth` | None (delegated) |
| Brand-name script detection | Unicode block tables (no API) — Devanagari `ऀ-ॿ`, Tamil `஀-௿`, Telugu `ఀ-౿`, etc. | New `_detect_script()` helper in `logo_service.py` | None |
| Fonts for Indic | **Google Fonts Noto subsets** — Noto Sans Devanagari, Tamil, Telugu, Bengali, Gujarati, Gurmukhi, Malayalam, Oriya. Subsetted + embedded as `@font-face` in SVG. | `logo_service.py` SVG template | None |

## When a future source ships, this file gets:

1. The supplier name (e.g. `replicate`).
2. The exact env var that turns it on.
3. The model slug / endpoint URL.
4. The cost per generation.
5. The fall-through behaviour (do we still emit a mock SVG on supplier failure? **Yes** — see [`./VALUES.md`](./VALUES.md) point 2 — free-tier dignity).

See [`../TODO.md`](../TODO.md) P0 sections for the exact change list.
