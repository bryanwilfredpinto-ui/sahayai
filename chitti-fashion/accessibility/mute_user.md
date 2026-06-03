🎖️ World Class Chitti Fashion — Accessibility Review: Mute User

# ACCESSIBILITY — Mute User (Persona P7: Priya)

> The entire product works with **taps and photos**. Voice input is optional,
> **never required** to proceed.

## What she needs
- To build her wardrobe, get advice, and review outfits using only taps + photos.
- Every voice prompt to also have a tap/type alternative.
- The Golden Rule confirm modal to accept a **tap** (Yes/No buttons), not just voice.

## How Chitti serves her
| Need | Implementation |
|---|---|
| Add wardrobe | Camera/upload + dropdown category + tap occasions — zero speech |
| Get advice | Tap occasion + tap "dress me" — zero speech |
| Confirm actions | `chittiConfirmAndDo()` exposes Yes/No **buttons** (mute-safe by design, [§2g](../../SAHAYAI_MASTER.md)) |
| Feedback | 👍/👎 + **type** feedback (mic optional) |

## Failure modes to prevent
- Any step that can only be completed by speaking → defect.
- A confirm gate with voice-only acceptance → defect.

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
Disable the mic. Complete: profile → add items → dress me → review → give feedback →
confirm an action. Must complete fully by tap/type/photo.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
