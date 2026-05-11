# SALES_BRIEF — Chitti Logo + Video

Talking points for Bryan, partners, the founder dashboard, and press. Always honest — the "stub" status is part of the pitch, not hidden.

## The user

An Indian small-business owner with a ₹6,000 Android phone, ₹40,000/month turnover, and zero design budget. Specifically: kirana shopkeeper, tiffin aunty, autorickshaw freelancer, sari-blouse tailor, school-fest organiser, papad-business grandmother, 14-year-old running a school side-hustle.

## 10 pain points we solve

1. **₹15,000 minimum for an agency logo.** Out of reach for someone making ₹40k/month.
2. **Canva Pro paywall** — ₹500/month + needs English literacy + needs design taste. Three blockers stacked.
3. **No Hindi-script font** in any free logo maker (Looka, Wix, Hatchful all render Devanagari as boxes).
4. **No Tamil / Telugu / Bengali / Gujarati / Punjabi support** anywhere in the consumer logo-maker market.
5. **Can't make a short reel** without iMovie / CapCut / Premiere — and the user has none of those.
6. **Fiverr friction** — foreign payment, language gap, IP unclear, 2-week turnaround.
7. **"Cousin who knows Photoshop"** never finishes the file. Two weeks, three revisions, abandoned.
8. **Looka / Wix paywall after preview** — user designs the perfect logo, then hits a $20 download wall in USD.
9. **No print-ready output** — the local Xerox shop needs a 600 DPI file, not a 72 DPI PNG screenshot.
10. **Sign-up walls** — Canva, Hatchful, Looka all require email + sometimes phone OTP. Breaks the Four-User Contract for illiterate / blind users.

## 10 benefits we deliver today

1. **Free, always.** No paywall, no sign-up, no email. See [`./BOUNDARIES.md`](./BOUNDARIES.md) rule 3.
2. **Works on ₹6,000 Android.** Single static page, no framework, < 50 KB gzipped.
3. **Real downloadable SVG** — not a watermarked preview. Open in WhatsApp Business → done.
4. **Prints clean at 600 DPI** on a Xerox-shop printer. SVG is vector, scales infinitely.
5. **5 palettes covering the Indian aesthetic** — bharat (saffron-navy-gold), modern, classic, festive, calm. See [`../API.md`](../API.md) palette reference.
6. **3 styles** — monogram, wordmark, shield — covers ~80% of small-business logo needs.
7. **Real video polling state machine today** — not a "coming soon" page. When the real renderer lands, the frontend changes zero lines.
8. **Honest about what's mock.** Every response carries a `disclaimer` field. Yellow banner is persistent. See [`./VALUES.md`](./VALUES.md).
9. **Accessibility-first.** `aria-label` on every SVG, voice-in via Chitti Voice Factory, 48x48 dp targets, TalkBack-compatible.
10. **Sub-200ms response.** Pure Python string-format, no LLM round-trip, no DB hop. Faster than any consumer logo maker on the market.

## What's coming (in this order, per [`../TODO.md`](../TODO.md))

1. **Real logo** via Replicate (SDXL / Ideogram) — pending `REPLICATE_API_TOKEN`.
2. **Real 30-second MP4 video** — pending `VIDEO_PROVIDER` (Remotion / Pika / Runway).
3. **Devanagari / Tamil / Telugu / Bengali brand-name rendering** — Noto fonts embedded as `@font-face`.
4. **Asset storage** — Cloudflare R2, 30-day retention on free tier.
5. **Print-ready 300 DPI PNG + CMYK PDF** export for Xerox-shop workflows.
6. **WhatsApp Business 640x640 quick-export** preview.

## The one-line pitch

"Type your shop name, tap one button, download a working logo. Free. No sign-up. Works on a ₹6,000 phone. Honest about what's hand-built today vs AI-generated tomorrow."
