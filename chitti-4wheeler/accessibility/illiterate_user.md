🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Illiterate User (first-class driver / car-owner)

> Voice-first, picture-first, **zero reading required**, works on 2G. The cab/taxi
> driver, the small-business owner, the family with one shared car — they are the heart
> of Chitti Car Doctor's user base, not an afterthought.

## What they need
- To hear everything and tap pictures — no text they must read to proceed.
- Picture menus for symptoms (🔋 dead dashboard, ⛽ no fuel, 💨 smoke, 🌡️ overheat, 🔊 noise).
- Spoken confirmation ("Say HAAN to confirm" + a big tap option).
- To work on a slow connection on a cheap phone.

## How Chitti serves them
| Need | Implementation |
|---|---|
| No reading | every label spoken; auto-read on open; picture menus for symptoms/parts |
| Picture symptom menu | icons/photos (dashboard light, smoke, leak, noise, overheat) — not text-only lists |
| Voice diagnosis | spoken cause + spoken safety call + spoken DIY steps + spoken cost band |
| OBD2 code spoken | even the P-code's *meaning* is spoken plainly — never "go read what P0420 means" |
| Voice confirm | spoken *"say HAAN"* **and** a big tap button (mute-safe too) |
| Breakdown / SOS | picture decision tree, spoken step-by-step, *"say HAAN to call family"* |
| 2G | small payloads, deferred images, offline cache + replay ([§5b/§5c](../../SAHAYAI_MASTER.md)) |
| Language | their language auto-detected; one pure language, no Hinglish-only walls |

## Failure modes to prevent
- Any step requiring reading to proceed → defect.
- A text-only symptom/part picker → defect.
- A safety verdict delivered only as text → **safety defect** (must be spoken + symbol).
- A flow that breaks on 2G / times out without an offline fallback → defect.

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
Throttle to 2G, language = a regional language, reading "disabled" (reviewer must not
read text). Complete the breakdown flow ("gaadi start nahi ho rahi") by ear + pictures
only, including a tap/voice-confirmed family SOS.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
