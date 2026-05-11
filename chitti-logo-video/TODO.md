# TODO — Path beyond the honest stub

Status today (2026-05-11): **stub-mode v1 only.** All items below convert "fake-but-honest" surfaces into "real-thing-shipped" surfaces. Wire-up points are already in code — every item lists the exact function that needs to change.

---

## P0 — Real logo generation (next commit)

| # | Item | File to edit | Status |
|---|---|---|---|
| 1 | Wire `_replicate_generate()` to Replicate API (`replicate` PyPI client or raw `requests`) | [`backend/services/logo_service.py`](backend/services/logo_service.py) lines 85–92 | Stub returns `{ok: False, error: "not_implemented"}`. |
| 2 | Pick a logo-generation model on Replicate (candidates: `stability-ai/sdxl`, `bytedance/sdxl-lightning-4step`, `playgroundai/playground-v2.5-1024px-aesthetic`) | — | Decision pending. |
| 3 | Build prompt template from `brand_name + tagline + palette + style` (see [PROMPTS.md](PROMPTS.md)) | new function in `logo_service.py` | Doesn't exist yet — stub doesn't use LLM at all. |
| 4 | Add `replicate==<pinned>` to `requirements.txt` | [`backend/requirements.txt`](backend/requirements.txt) | Missing. |
| 5 | Add Replicate timeout + retry + error pass-through (so frontend still falls back to mock instead of error-stating) | `logo_service.py` | Pattern already exists — the `if result.get("ok"):` branch on line 101 falls through to mock when real call fails. Just needs the real call. |
| 6 | Decide: keep `_mock_svg()` as fallback **forever** (good — free-tier dignity) or rip it out (bad). | — | Keep. Free users still get a real working SVG. |

Alternative providers to evaluate before locking Replicate:

- **Stability AI** direct (`stability-ai.com` API) — cheaper per-image, no Replicate markup.
- **Looka API** — purpose-built for logo, but $$ per generation, B2B contract.
- **Ideogram** API — best Latin/Devanagari typography rendering of any current model.

---

## P0 — Real video generation

| # | Item | File to edit | Status |
|---|---|---|---|
| 7 | Implement real-provider branch | [`backend/services/video_service.py`](backend/services/video_service.py) `enqueue()` lines 72–76 and a new `_real_status()` helper | Currently logs `"Real provider 'X' configured but the wire-up is not yet implemented"` and falls through to mock. |
| 8 | Pick a video provider — candidates ordered by feasibility today: <br> 1. **Remotion + remotion.lambda** — full control, MP4 out, ~$0.05 per 30 s. <br> 2. **Pika 1.5 API** — when Pika opens public API (waitlisted 2026-04). <br> 3. **Runway Gen-3** API — best quality, $$. <br> 4. **Sora API** — when OpenAI opens it (no date). | — | Decision pending Bryan. |
| 9 | Move job state out of `_JOBS: dict` (in-process) into Redis or the provider's own job API | `video_service.py` | Required when scaling > 1 gunicorn worker reliably. |
| 10 | Replace `_placeholder_url()` mock SVG with real MP4 / mp4-streaming URL | `video_service.py` lines 42–57 | Returns `data:image/svg+xml` today. |
| 11 | Add TTS layer for narrator — should reuse [Chitti Voice Factory](../chitti-voice-factory/) (4-supplier cascade, 26 languages incl. Sanskrit + Oraon) rather than building parallel TTS. | new `narrator.py` calling Voice Factory's `/api/voice/synth` | Voice Factory is already deployed and live. |

---

## P1 — Brand color picker

| # | Item | Notes |
|---|---|---|
| 12 | Custom palette: let user pick 3 hex codes instead of choosing one of 5 named palettes. | UI: 3 `<input type="color">` swatches in [`chitti_logo_video.html`](../chitti_logo_video.html). Backend: accept `palette: {primary, secondary, accent}` object alongside `palette_name`. |
| 13 | Eye-dropper from uploaded existing logo (re-brand flow). | Drag-drop file → canvas → click pixel → extract hex. Pure-frontend. |
| 14 | "Find palette that matches my shop's wall colour" — phone-camera → dominant-color extraction. | Uses MediaStream API; no backend round-trip. |

---

## P1 — Font selector

| # | Item | Notes |
|---|---|---|
| 15 | Currently hard-coded `Inter, system-ui, sans-serif` in every SVG ([`logo_service.py`](backend/services/logo_service.py) lines 51, 64–66, 79–81). Pull from request body `font_family`. | Allow-list: `Inter`, `Poppins`, `Mukta` (Devanagari), `Hind Madurai` (Tamil), `Tiro Devanagari Hindi`, `Lora` (serif), `Bebas Neue` (display). |
| 16 | Embed `@font-face` rules inside the SVG so downloaded files render identically off-platform. | Adds ~50–100 KB per SVG (TTF subsetted). Worth it for offline use. |

---

## P1 — Multi-language brand-name rendering

Today the SVG uses `Inter` which **does not** include Devanagari, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Oriya, Gurmukhi, or any Indic glyph. Brand names typed in those scripts render as `□□□` boxes (tofu).

| # | Item | Notes |
|---|---|---|
| 17 | Detect script of `brand_name` via Unicode block (`ऀ-ॿ` Devanagari, `஀-௿` Tamil, etc.) | New helper `_detect_script(name)` in `logo_service.py`. |
| 18 | Map script → font family. Use Google Fonts Noto subset (Noto Sans Devanagari, Noto Sans Tamil, Noto Sans Telugu, Noto Sans Bengali, etc.). | Embed subsetted `@font-face` in the SVG. |
| 19 | Re-test `_initials()` for Indic — splitting on whitespace works for Hindi but "Initials" concept doesn't translate cleanly. Consider: for Indic names, monogram falls back to first syllable (akshara) instead of first letter. | Open design question. |
| 20 | Test with: सरस्वती किराना (Hindi), சரஸ்வதி கடை (Tamil), সরস্বতী দোকান (Bengali). | All currently break. |

---

## P1 — Asset storage backend

Today SVGs are returned inline in JSON. Videos are `data:` URLs (small SVG today, multi-MB MP4 tomorrow). This doesn't scale past v2.

| # | Item | Notes |
|---|---|---|
| 21 | Pick object storage: **Cloudflare R2** (recommended — zero egress fees) > AWS S3 > Render disk (no good for free tier). | — |
| 22 | After generation, upload to `r2://chitti-logo-video/<job_id>.svg` (or `.mp4`), return public URL. | New `services/storage.py`. |
| 23 | 30-day expiry on free-tier generations (cron / lifecycle rule). Paid tier = permanent. | — |
| 24 | Persistent "my generations" — when we ship auth, list per-user assets. | Depends on Chitti-wide auth, which doesn't exist yet. |

---

## P2 — Polish

| # | Item |
|---|---|
| 25 | Logo variants — same generation, 4 outputs: square, horizontal, dark-on-light, light-on-dark. |
| 26 | Favicon + Open Graph image auto-derive from the logo. |
| 27 | Video templates — "kirana intro", "freelancer pitch", "school-fest reel", "wedding invite" — pre-built Remotion compositions, user fills in fields. |
| 28 | "Make it Diwali / Holi / Eid / Christmas" — palette + decoration overlay generator. |
| 29 | Print-ready outputs — 300 DPI PNG, CMYK PDF (for Xerox-shop printing). |
| 30 | WhatsApp Business profile-picture quick-export (640×640, square crop preview). |

---

## In-code TODO / FIXME audit

`grep -nE "TODO|FIXME|XXX|HACK"` across `chitti-logo-video/` → **no matches.** The wire-up gaps are documented via the `_replicate_generate()` stub function + the `job.notes` field in `video_service.enqueue()` rather than inline comments.
