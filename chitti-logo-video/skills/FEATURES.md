# Chitti Creative Studio — FEATURES

## 0. Creative Studio — shipped 2026-05-27

`chitti_logo_video.html` is now a **4-tab creative studio** (frontend-only;
no new backend keys required for any LIVE feature below). Everything below
runs on Web Speech + Web Audio + MediaRecorder + Canvas — free, no API keys.

### Tab 1 — Logo Studio (LIVE)
- Backend logo endpoint preserved (LV1 path) **plus** a deterministic local-SVG fallback
  so the page never breaks when the backend is sleeping.
- New **Chitti shield template** card — one tap fills Brand=Chitti, Tagline=Bharat ka Apna AI, palette=bharat, style=shield.
- Indian flag colors are now the default palette (saffron / white / green / Ashoka navy).
- Downloads: **SVG + PNG** (canvas-rasterised, 600×480).

### Tab 2 — Video Studio (LIVE)
- **9:16 vertical stage** with corner Chitti shield, progress dots, subtitle band, green-heartbeat pulse.
- **4 Chitti Viral Stories** (CSS-animated storyboards + Web Speech narration):
  1. **Corruption Killer** (60s · 5 scenes · end: SYSTEM SE MAT DARO, CHITTI KO AAGE KARO)
  2. **Digital Tijori** (60s · 5 scenes · end: CHITTI: BHARAT KA MASTER KEY)
  3. **25th Hour** (60s · 6 scenes · end: Aapka Time, Aapki Life. Chitti Ready Hai)
  4. **North-South Bridge** (90s · 5 scenes · end: Bhasha koi bhi ho, Dil ek hai. SAHAY AI)
- Player: play/pause/restart, **0.75× / 1× / 1.25× speed**, **captions toggle**, **audio-description toggle** (spoken description of each scene for blind users).
- **Download** via `MediaRecorder` (`video/webm`) — honest fallback to storyboard JSON if browser doesn't support captureStream.
- **Customer Success Card** generator — name + city + story + savings → tricolor 1080×1080 PNG with Chitti badge; one-tap WhatsApp share via `navigator.share` (file) or `wa.me` deep link (text).
- **Business Promo** — 15-second 5-scene animated promo for kirana / freelancer; voice-over in any of 10 Indian languages via `SpeechSynthesisUtterance`.
- **Viral Trigger** — at the end of any video, the *"Apni kahani share karein"* prompt opens the success-card form.

### Tab 3 — Share Studio (LIVE for WhatsApp; honest CONNECT stubs for IG/YT/FB)
- WhatsApp Status: **LIVE today**, no API needed (deep link).
- Instagram / YouTube Shorts / Facebook: **CONNECT account** tiles. Tile checks `localStorage` token; if absent → honest alert + caption-to-clipboard + manual post. Wires to real Graph / YouTube Data v3 APIs once `INSTAGRAM_ACCESS_TOKEN` / `YOUTUBE_API_KEY` / `FACEBOOK_ACCESS_TOKEN` are set on Railway.
- **10 hashtag chips** tap-to-append: `#BharatKaApnaChitti`, `#ChittiFamily`, `#DigitalIndia`, `#JanAushadhi`, `#CorruptionKiller`, `#BharatKaMasterKey`, `#SahayAI`, `#AatmanirbharBharat`, `#MakeInIndia`, `#VoiceFirst`.

### Tab 4 — Content Calendar (LIVE static schedule; auto-gen wires later)
- 7-row weekly schedule (Mon → Sun) with theme + sample post + 7am/1pm/7pm IST slots.
- **Regenerate** button is honest — surfaces *"DeepSeek auto-generation wires in when the Railway env var lands"* until backend route exists.
- **Export** as JSON.

### Chitti Sound Identity (LIVE — Web Audio API, no files)
- **Activation chime** (soft digital heartbeat — C5 → E5).
- **Success ding** (warm Sa-Re-Ga — C5 → D5 → E5 triangle).
- **Warning** (gentle two-tone, no harsh siren).
- **Victory motif** (C5-E5-G5-C6 triangle).
- All four are oscillator-generated; AudioContext unlocked on first click.

### Accessibility (per SAHAYAI_MASTER §7 — eight gates)
- Captions on by default; audio-description toggle reads scene descriptions for blind users.
- Speed control 0.75× for elderly users.
- Every button ≥48×48px tap target.
- Tap stage to pause/play.
- 9:16 stage capped to 360px wide → fits 375px mobile.
- All scenes use color **plus** symbol + text (never colour alone).
- Heartbeat-green pulse is decorative — captions + voice carry the message.

---

# Chitti Logo & Video — FEATURES

Honest, code-verified inventory of what the [`chitti_logo_video.html`](../../chitti_logo_video.html) surface actually does today. Same three-section contract as [`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md): **Built & working**, **Planned**, **Future**.

**Scope honest-stub note (locked in [[project_chitti_product_scope_clarifications]]):** Chitti Logo & Video v1 is an **intentional honest stub**. Logo path generates a deterministic SVG monogram from a server-side template. Video path returns a queued mock job that resolves to a 640×360 SVG placeholder. **No external API is wired in v1.** Every JSON response carries `supplier: "mock"` and a `disclaimer` field naming exactly what is and isn't real. Per the [Honest stubs over fake demos](../../SAHAYAI_MASTER.md#3-process--build-rules) rule, the stub stays visible to the user — never hidden behind a fake "coming soon" placeholder.

Last verified against the working tree on **2026-05-14**. When in doubt, re-grep
[`chitti-logo-video/backend/routes/lv.py`](../backend/routes/lv.py),
[`chitti-logo-video/backend/services/logo_service.py`](../backend/services/logo_service.py),
[`chitti-logo-video/backend/services/video_service.py`](../backend/services/video_service.py),
and [`chitti_logo_video.html`](../../chitti_logo_video.html) before claiming "built".

---

## 1. Built and working on the web

End-to-end wired: a real HTTP endpoint OR a frontend handler that produces a visible, externally-observable effect.

### 1.1 Logo monogram generator — `POST /api/lv/logo/generate`

- Takes `{brand_name, tagline?, palette?, style?}`. Returns a
  **real, downloadable SVG** generated deterministically from a
  template — no LLM, no external API. Source:
  [`logo_service.py:generate_logo`](../backend/services/logo_service.py).
- **5 palettes:** `bharat` (default — saffron / navy / cream),
  `modern`, `classic`, `festive`, `calm`.
- **3 styles:** `monogram` (default — first letter), `wordmark`
  (full name), `shield` (letter in a shield).
- Brand-name cap: 80 chars (413 above that).
- Every SVG ships with: `aria-label` (the brand name), gradient defs,
  scalable `viewBox`, the `Inter, system-ui, sans-serif` typeface
  stack.
- Response payload: `{ok: true, supplier: "mock", svg: "<svg…>",
  data_uri, disclaimer}`.

### 1.2 Logo download — frontend

- [`chitti_logo_video.html`](../../chitti_logo_video.html) renders
  the returned SVG inline and offers a Download button that wraps
  the SVG string in a `Blob` and triggers a save dialog. No
  round-trip to the server; works fully client-side.

### 1.3 Video enqueue — `POST /api/lv/video/enqueue`

- Takes `{script, language?, duration_s?}`. Validates: script
  required (max 4000 chars), `duration_s` coerced to int.
- Source:
  [`video_service.py:enqueue`](../backend/services/video_service.py).
- Allocates a `_Job` dataclass in the thread-safe `_JOBS` dict (in-
  process, single worker), starts the mock state machine
  `queued → rendering → VIDEO_READY` with `_MOCK_RENDER_S = 3.0`
  driven by lazy poll-time evaluation. Returns `{ok: true, job_id,
  supplier: "mock", disclaimer}`.

### 1.4 Video status polling — `GET /api/lv/video/status/<job_id>`

- Returns `{ok, state, video_url?, duration_s, supplier, disclaimer}`.
- Frontend polls every **800 ms** until state is `VIDEO_READY`
  (typically 3-4 polls).
- `video_url` is a `data:image/svg+xml,...` 640×360 navy card with
  the script's first 60 chars rendered. Honest: this is **not**
  an MP4; the response says so explicitly via `supplier: "mock"`.

### 1.5 Health endpoint — `GET /api/lv/health`

- Returns logo + video supplier health, including which provider
  keys are configured. Today: `{logo: "mock", video: "mock"}`.

### 1.6 Frontend — `chitti_logo_video.html`

- Single-page HTML/CSS/JS at repo root.
- Palette picker (5 cards) + logo form + video form.
- Polling loop @ 800 ms for video status.
- **Persistent "Stub mode" banner** explaining that real provider
  wiring is pending — never hidden, never apologetic. Honest by
  design.
- Download-SVG via `Blob`.
- Four-user contract chips: 🔊 read brand name, ⌨️ type alternative
  for blind users, captions on the mock video, voice-IN for the
  script.

### 1.7 No DB, no SDK, no LLM client

- `backend/requirements.txt`: `flask==3.0.3`, `flask-cors==4.0.1`,
  `gunicorn==22.0.0`. **No database**, **no SDK**, **no LLM**. The
  stub is intentionally stateless and offline-capable.
- Python 3.11.10.

### 1.8 Railway Blueprint exists (not yet connected)

- [`render.yaml`](../render.yaml) — free tier, gunicorn 2 workers,
  60-s timeout, 4 `sync: false` secret slots ready for the real
  keys (`REPLICATE_API_TOKEN`, `REPLICATE_LOGO_MODEL`,
  `VIDEO_PROVIDER`, `VIDEO_PROVIDER_KEY`). Apply still pending —
  see §2.

### 1.9 SEBI disclaimer + four-user contract

- Sticky `NOT SEBI REGISTERED` bar + full legal modal even though
  Logo & Video is not an investment product — repo-wide
  merge-blocker ([[project_legal_disclaimer]]).
- Symbol + word label, never colour-only
  ([[project_four_user_contract]]).

---

## 2. Planned — queued

Source: [`chitti-logo-video/TODO.md`](../TODO.md) P0 / P1.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| LV1 | **Wire `_replicate_generate()` to Replicate API** | **P0** | Today this function returns `{ok: false, error: "not_implemented"}` and falls through to mock. Real logo generation is the v2 promise. | Pick a model (`stability-ai/sdxl` / `bytedance/sdxl-lightning-4step` / `playgroundai/playground-v2.5-1024px-aesthetic`); build prompt from `brand_name + tagline + palette + style`; add `replicate` to `requirements.txt`. Mock stays as fallback **forever** — free-tier dignity ([[feedback_skeleton_first_pass]]). |
| LV2 | **Real video provider branch** | **P0** | Currently `enqueue()` logs `"Real provider 'X' configured but the wire-up is not yet implemented"` and falls through to mock. | Decision pending: **Remotion + remotion.lambda** (full control, MP4 out, ~$0.05/30 s) vs **Pika 1.5** (waitlisted) vs **Runway Gen-3** (best, $$) vs **Sora API** (no date). |
| LV3 | **Move job state out of `_JOBS` dict** | P0 | In-process state breaks > 1 gunicorn worker. | Redis or the provider's own job API. |
| LV4 | **Replace `_placeholder_url()` with real MP4** | P0 | Today returns `data:image/svg+xml,...` 640×360 navy card. | Pull MP4 from the chosen provider; persist for the job's TTL. |
| LV5 | **TTS narrator via Chitti Voice Factory** | **P0** | Don't build parallel TTS — reuse the [4-supplier cascade](../../chitti-voice-factory/), 26 languages incl. Sanskrit + Oraon. | New `narrator.py` calling `/api/voice/synth` on `chitti-voice-factory`. |
| LV6 | **Custom 3-hex palette** | P1 | Today users pick one of 5 named palettes. | UI: 3 `<input type="color">` swatches. Backend: accept `palette: {primary, secondary, accent}` object alongside `palette_name`. |
| LV7 | **Eye-dropper from uploaded existing logo** (re-brand flow) | P1 | Brands re-skinning legacy material need their existing colours. | Drag-drop file → canvas → click pixel → extract hex. Pure-frontend. |
| LV8 | **"Find palette that matches my shop's wall colour"** | P1 | Hyper-local Tier-2/3 use case. | MediaStream API; dominant-colour extraction; no backend round-trip. |
| LV9 | **Font selector** | P1 | Currently hard-coded `Inter, system-ui, sans-serif` in every SVG. | Allow-list pulled from request body `font_family`: `Inter`, `Poppins`, `Mukta` (Devanagari), `Hind Madurai` (Tamil), `Tiro Devanagari Hindi`, `Lora` (serif), `Bebas Neue` (display). |
| LV10 | **Embed `@font-face` rules inside the SVG** | P1 | Downloaded SVGs render identically offline. Adds 50-100 KB per SVG (TTF subsetted). Worth it. | Inline subsetted TTF in the SVG `<defs>`. |
| LV11 | **Multi-language brand-name rendering** (Devanagari / Tamil / Telugu / Kannada / Malayalam / Bengali / Gujarati / Oriya / Gurmukhi) | **P0** | Today `Inter` doesn't include any Indic glyph — brand names in those scripts render as `□□□` (tofu). This is a four-user-contract regression. | Pull the right script's font into the SVG `<defs>` based on the brand-name's Unicode script range. |
| LV12 | **First Railway deploy** | P0 | Blueprint exists, never connected. | Apply [render.yaml](../render.yaml); paste the 4 secrets ; curl `/api/lv/health`; live-page smoke. |

**How to apply** when implementing:
- The mock `_mock_svg()` path stays as a fallback **forever** — never
  rip it out. Free-tier users still get a real working SVG even when
  Replicate is unreachable / rate-limited. This is the
  [Honest stubs over fake demos](../../SAHAYAI_MASTER.md#3-process--build-rules)
  rule applied: free dignity > paid breakage.
- TTS narrator (LV5) is **not** a new TTS — it reuses the Voice
  Factory cascade. If a future PR adds a parallel TTS pipe to
  chitti-logo-video, that's a refactor target back to one substrate.
- Multi-language rendering (LV11) is a **four-user-contract
  regression** today, not a nice-to-have. Tofu glyphs break the
  illiterate user's ability to spot their own brand by shape.

---

## 3. Future — needs partnership / regulator / asset infra

- **Asset storage on S3 / R2** with signed URLs. Today the generated
  SVG is base64'd into the response; large MP4s won't fit that
  pattern. Needs an `ASSET_STORE` adapter + per-job TTL.
- **Brand-kit export** — logo + variations + favicon + business-card
  template, all in one ZIP. Needs LV6–LV10 first.
- **Animated logo intros** — 3-second logo reveal for video intros.
  Needs LV1 + LV2 + Remotion-style scene composition.
- **Looka / Ideogram** providers — purpose-built logo APIs. $$ per
  generation; B2B contract required.
- **Stability AI direct** API — cheaper per image than Replicate
  markup; would need a separate `_stability_generate()` branch.

---

## Cross-product hooks (planned)

- **Chitti Logo & Video ← Chitti Kirana / Chitti Business** —
  shopkeeper signing up on Chitti Business gets a free SVG monogram
  for their bills + WhatsApp avatar. Wire pending.
- **Chitti Logo & Video → Voice Factory** — narrator audio reuses
  the 4-supplier cascade ([[project_chitti_voice_factory_spec]]).
  Wire is LV5 above.
- **Chitti Logo & Video → Founder dashboard** — health-ping pending
  LV12 (Railway deploy).

---

## How to keep this file honest

1. **The "Stub mode" banner stays visible** until both LV1 (real
   logo) AND LV2 (real video) are in production AND verified live.
   If either is still mocked, the banner stays.
2. `supplier: "mock"` in the JSON response is the source of truth —
   if a feature is moved to §1 but the response still says `mock`,
   this file (and the PR) must be reverted.
3. The mock SVG fallback in `_mock_svg()` is a **policy lock**, not
   a TODO. Removing it after LV1 ships is a relock decision.
4. SEBI sticky banner is required on the page even though Logo &
   Video is not an investment product — repo-wide merge-blocker
   ([[project_legal_disclaimer]]).
---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

### Quality

| # | Item | How to apply |
|---|---|---|
| Q1 | Stub endpoints show **queue position** — *"You are #47 in queue for video generation"*. | Honest counter per stub call; never randomised or invented. Increments only when a real request lands; auto-cleared on stub deploy. |
| Q2 | Stub disclosure **spoken aloud for blind users** — not just shown as text. | Auto-speak via `Chitti.a11y.speak` on first stub response when the Disability Profile has `blind: true`. |
| Q3 | SVG monogram — offer **5 style options** — minimal / bold / traditional (devanagari-aware) / modern / handwritten. | Add `style` param to the SVG generator; per-style font + stroke + colour palette. Preview gallery on `chitti_logo_video.html`. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | WhatsApp Business banner generator — **COMING SOON** (needs the real video / image provider). | P1 | Honest stub. SVG composition path could ship sooner (no video needed); raster banners need a provider. |
| S2 | Festival greeting card generator — Diwali / Eid / Christmas / Pongal / Bihu / Onam / Pohela Boishakh / Gurpurab / Buddha Purnima / Mahavir Jayanti / etc. | P1 | Template-driven (festival ⇒ SVG layout + culturally-appropriate motifs); user adds their business name + greeting. Ships SVG immediately; PNG/JPEG export needs a renderer (**COMING SOON**). |
| S3 | Business visiting card generator. | P1 | Standard 90×54mm SVG template + user data; same SVG-first path as S2. |
| S4 | Shop board design in regional language — *"शर्मा जी की किराना दुकान"* / *"ஷர்மா மளிகை கடை"* — local-script aware. | P1 | Devanagari / Tamil / Telugu / Kannada / Bengali / Gujarati / Malayalam / Punjabi SVG fonts bundled; LLM proposes a layout based on shop type. |

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\|'md'\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.
