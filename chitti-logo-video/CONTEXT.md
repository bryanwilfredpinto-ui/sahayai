# CONTEXT — Why Chitti Logo & Video exists

## The problem

An Indian small-business owner — kirana shopkeeper, tiffin-service aunty, autorickshaw freelancer, sari-blouse tailor, school-fest organiser — needs **a logo and a 30-second explainer video** for:

- WhatsApp Business profile picture
- Instagram bio
- A printed visiting card from the local Xerox shop
- A reel that explains "what we sell"

What they have today:

| Option | Cost | Reality |
|---|---|---|
| Branding agency | ₹15,000 – ₹2,00,000 | Out of reach for someone with ₹40k/month turnover. |
| Canva Pro | ₹500/month | Subscription + needs English literacy + design taste. |
| Fiverr freelancer | ₹2,000 – ₹10,000 | Foreign payment friction, language gap, IP unclear. |
| Looka / Wix logo maker | ~$20 final download | Paywall after preview; no Indian-language brand-name support. |
| Cousin who "knows Photoshop" | Free-ish | Two weeks, three revisions, never finished. |

Chitti Logo & Video collapses all of that into: **type your shop name → tap one button → download a working SVG. Type a one-line script → wait 3 seconds → download a video card.** Free. No sign-up. No paywall. Works on a ₹6,000 Android.

---

## The "honest-stub" pattern (load-bearing)

This product was scoped on **2026-05-09** when Bryan announced the Anthropic → DeepSeek provider switch with credentials pending. Real logo APIs (Replicate / Stability / Looka) and real video APIs (Pika / Runway / Remotion) also do not yet have keys.

We had three options:

1. **Don't ship.** Wait for keys. Loses momentum.
2. **Fake placeholder ("coming soon!").** Insults the user — they typed their brand name and got nothing.
3. **Honest stub.** Ship a real working SVG generator hand-written in Python today. Ship a real video-job queue that returns a real (mock-but-valid) data-URL today. Mark every response with `supplier: "mock"` and a disclaimer naming exactly what is real and what isn't. Build the wire-up point so swapping in Replicate / Pika is a 30-minute job, not a refactor.

We picked option **3**. That is the contract for this product and any future product in the same shape.

What "honest stub" means in code:

- [`logo_service.generate_logo()`](backend/services/logo_service.py) always returns a working downloadable SVG. It also returns `disclaimer: "Mock logo generator. Real model (Replicate) wires in when REPLICATE_API_TOKEN + REPLICATE_LOGO_MODEL env vars are set."`
- [`video_service.enqueue()`](backend/services/video_service.py) returns a real `job_id` the frontend can poll. After ~3 s `status()` flips to `VIDEO_READY` with a `data:image/svg+xml` URL pointing at a mock card that literally says "Mock video — Real renderer wires in when VIDEO_PROVIDER is set."
- The frontend [`chitti_logo_video.html`](../chitti_logo_video.html) shows a persistent yellow banner at top: *"Stub mode · Logos are local SVG mock-ups. Videos return a mock placeholder URL. Real generators wire in once Bryan provides API keys."* — never hidden, never collapsed.

The user never wonders "did this actually work?" The answer is always: **yes, it worked, and here's exactly which bit is real.**

---

## Why the stub is built this carefully

A 14-year-old kid using Chitti for a school project does not have an API key. A grandmother re-branding her papad business does not have a Replicate token. **The free-tier output has to be the dignified output.** If the SVG isn't downloadable, the polling isn't real, or the disclaimer is buried — the product is worse than nothing, because it has implicitly promised more than it delivers.

So:

- The SVG is rendered server-side with proper `aria-label`, gradient defs, `viewBox`, scalable — passes Lighthouse, prints clean on a 600 DPI Xerox.
- The video "placeholder" is a real 640×360 SVG card with the job ID printed on it — downloadable, shareable, embeddable.
- The job queue is **really** a queue — `_LOCK: threading.Lock` + `_JOBS: dict`. When the real renderer drops in, no client code changes.

---

## Accessibility Requirements (Non-Negotiable)
Every Chitti app must be built accessibility first before AI features are added.

### Target Users
- Blind users: Full voice navigation, TalkBack compatible
- Deaf users: Full visual, no audio dependency
- Mute users: Text/gesture input only
- Elderly users: Large touch targets, high contrast

### Android Accessibility Compliance
- Every button must have a text label
- Every image must have alt text
- Logical tab and reading order
- High contrast mode support
- Large touch targets minimum 48x48dp
- Compatible with TalkBack screen reader
- Compatible with BrailleBack for Braille display users
- No image-only content, always have text alternative

### Accountability
Once accessibility is confirmed, AI powers the Chitti.
Chitti is then accountable for keeping all content fresh and updated daily.

### Founder Dashboard
All feature status visible at sahayai.in/founder
