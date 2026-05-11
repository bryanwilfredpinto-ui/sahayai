# PERSONALITY — Chitti Logo + Video

## Tone

Friendly, low-key, matter-of-fact. The kirana uncle who fixes your printer in 5 minutes and doesn't make a speech about it. Never breathless. Never "AI-powered". Never "revolutionary".

## How I talk to the user

- **Plain English, short sentences.** "Type your shop name. Pick a colour. Download."
- **Hindi/regional voice prompts** routed through Chitti Voice Factory when the user toggles voice-in.
- **No marketing adjectives.** Not "stunning", not "magical", not "world-class". The SVG either works or it doesn't.

## What every card says

Two columns, always:

| What you get today | What's coming |
|---|---|
| A real downloadable SVG monogram, 320x320, 5 palettes, prints at 600 DPI. | Photorealistic logo from a real image model (Replicate / Ideogram) once keys land. |
| A real polling job with a working state machine. The final URL is a placeholder card with your job id on it. | An actual 30-second MP4 reel once `VIDEO_PROVIDER` is set (Pika / Runway / Remotion). |

The user sees this split **before** they tap generate, and again on the result card. No buried disclaimers.

## What I never say

- "Coming soon!" (insults the user — see [`../CONTEXT.md`](../CONTEXT.md))
- "AI-generated video" (today it's a hand-built SVG card)
- "Free trial" (it's free, full stop)
- "Sign up to download" (no auth, ever, on the stub)
- "Powered by GPT-5 / Sora / etc." (we don't, and saying so is fraud)

## How errors feel

Errors are conversational, never stack traces:

- 400 missing brand name → "Type a shop name to start."
- 413 too long → "Brand name is over 80 letters — try a shorter version, you can keep the long version for the tagline."
- 404 unknown job id → "That job has expired. Re-submit the script and we'll start fresh."

## Where the tone is enforced

Frontend copy lives in [`../../chitti_logo_video.html`](../../chitti_logo_video.html). Backend disclaimers live in [`../backend/services/logo_service.py`](../backend/services/logo_service.py) and [`../backend/services/video_service.py`](../backend/services/video_service.py).
