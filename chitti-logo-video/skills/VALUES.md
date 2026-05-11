# VALUES — Chitti Logo + Video

## Core ordering

1. **Honest stub > vapourware.** A real working SVG today beats a "coming soon!" page with a real generator in 6 weeks.
2. **SVG today > photorealistic-AI-soon.** A 14-year-old running a school-fest does not have a Replicate token. Their free output must be a *dignified* output — not a watermarked, paywalled, or boxed-glyph placeholder.
3. **Real polling state machine, even though the renderer is mock.** `queued → rendering → VIDEO_READY` is wired exactly the way the real renderer will wire. When Bryan ships keys, the frontend changes zero lines.
4. **Disclaimer in every response.** Every JSON body carries a `disclaimer` field naming exactly which bit is real and which bit is mock. Never buried, never collapsed.
5. **Free-tier dignity.** The mock output is download-quality, print-quality, share-quality. Not a teaser.

## What we optimise against

| Anti-value | Why we reject it |
|---|---|
| "Coming soon" splash | Insults the user who just typed their brand name. |
| Watermarked stub | Steals the dignity of a free user. |
| Sign-up wall before download | Breaks the Four-User Contract for illiterate / blind users who can't navigate auth. |
| Hidden "actually-mock" disclosure | We are not in the business of misleading anyone. |
| Refactor when keys land | Wire-up points (`_replicate_generate()`, `VIDEO_PROVIDER` branch) exist today so the swap is a 30-minute job, not a sprint. |

## The four-user contract — applied here

| User | How the stub still works for them |
|---|---|
| Blind | Endpoint returns JSON with `aria-label` baked into the SVG. Screen-reader announces "Saraswati Kirana logo". |
| Deaf | All output is visual + text. No audio dependency on the stub. |
| Mute | Brand name and script are typed. No voice required (voice is optional). |
| Illiterate | Voice-in via Chitti Voice Factory; symbol-based palette picker (5 colour swatches, not 5 English labels). |

See [`../CONTEXT.md`](../CONTEXT.md) Accessibility section.

## What "good" looks like

A user opens [`../../chitti_logo_video.html`](../../chitti_logo_video.html), types "Saraswati Kirana", picks the bharat palette, taps generate, downloads a 6 KB SVG, opens it in WhatsApp Business as profile picture — and never wonders whether anything in the loop was fake. The disclaimer told them, and the SVG is still real.
