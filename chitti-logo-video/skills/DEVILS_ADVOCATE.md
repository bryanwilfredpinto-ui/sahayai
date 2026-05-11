# DEVILS_ADVOCATE — Chitti Logo + Video

Eight critiques worth taking seriously. Each one names the risk + the current mitigation + the gap that still hurts.

## 1. Users may think the mock video is real and share it with customers

**Risk:** A tiffin aunty enqueues a video, gets back a navy SVG card with "Mock video · job 9a4f8e1c" on it, doesn't notice the disclaimer, and posts it to her WhatsApp Status. Customer confusion + brand damage.

**Mitigation today:** The placeholder card itself **says** "Mock video — Real renderer wires in when VIDEO_PROVIDER is set." The yellow banner in [`../../chitti_logo_video.html`](../../chitti_logo_video.html) is persistent and uncollapsable.

**Gap:** Aunty might not read English. The on-card text is currently Latin-only.

## 2. SVG monogram limited to ~6 chars — Hindi / Devanagari font support TBD

**Risk:** Type "सरस्वती किराना" → tofu (`□□□`) because `Inter` doesn't ship Indic glyphs.

**Mitigation today:** None.

**Gap:** P1 item 17-20 in [`../TODO.md`](../TODO.md). Noto Sans Devanagari / Tamil / Telugu / Bengali subsets need to be embedded as `@font-face` in the SVG.

## 3. No asset storage backend means SVGs disappear on Render restart

**Risk:** SVGs are inlined in JSON response. Video placeholder URLs are `data:` URLs. Nothing is uploaded anywhere. A user who closes the tab loses the asset unless they explicitly downloaded.

**Mitigation today:** Big "Download" button on the result card.

**Gap:** P1 item 21-24 in [`../TODO.md`](../TODO.md). Need Cloudflare R2 or S3 + 30-day lifecycle rule.

## 4. In-process job queue breaks past 2 gunicorn workers

**Risk:** Render free tier runs 2 workers. Job enqueued on worker A; user polls via worker B → 404 unknown_job_id. Frustrating + looks broken.

**Mitigation today:** Job is "sticky to the originating worker", which on a 2-worker setup works most of the time due to keep-alive.

**Gap:** P0 item 9 in [`../TODO.md`](../TODO.md). Move state to Redis or the provider's own job API.

## 5. Free-tier cold-start drops queued jobs

**Risk:** Render free dyno sleeps after 15 min idle. A queued job on a sleeping dyno is lost.

**Mitigation today:** Polling round-trip itself wakes the dyno; jobs complete in 3 s, well inside the awake window.

**Gap:** Persistent queue (Redis) makes this disappear.

## 6. No rate limiting

**Risk:** A single client can hammer `/api/lv/logo/generate` infinitely. The SVG render is CPU-light but not free.

**Mitigation today:** Render free-tier dyno limit caps the blast radius.

**Gap:** Add Flask-Limiter (token bucket) before public launch.

## 7. The "honest stub" disclaimer is in English only

**Risk:** A Tamil-only user reads the disclaimer as visual noise and assumes the video is real.

**Mitigation today:** Yellow banner is in English.

**Gap:** Translate the banner into Hindi + 8 regional via Chitti Voice Factory's translation cache.

## 8. Brand-name profanity / trademark check is absent

**Risk:** User types a competitor's registered trademark and downloads a logo using it. Sahay AI is not liable, but the user might be.

**Mitigation today:** None — see [`./GUARDRAILS.md`](./GUARDRAILS.md) rule 1 (we echo verbatim).

**Gap:** Add a soft warning (not a block) for known Indian trademarks — "This name may be registered, check with a lawyer before commercial use." Bryan should sign off on the wording.
