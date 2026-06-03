🎖️ World Class Chitti Fashion — Accessibility Review: Illiterate User

# ACCESSIBILITY — Illiterate User (Persona P8: Kamala, rural)

> Voice-first, picture-first, **zero reading required**, works on 2G.

## What she needs
- To hear everything and tap pictures — no text she must read to proceed.
- Picture menus for categories and occasions.
- Spoken confirmation ("Say HAAN to confirm" + a tap option).
- To work on a slow connection.

## How Chitti serves her
| Need | Implementation |
|---|---|
| No reading | Every label spoken; auto-read on open; picture menus for categories/occasions |
| Picture menus | Category + occasion pickers use icons/photos, not text-only lists |
| Voice confirm | Spoken "say HAAN" **and** a big tap button (mute-safe too) |
| 2G | Small payloads, deferred images, offline cache + replay ([§5b/§5c](../../SAHAYAI_MASTER.md)) |
| Language | Her language auto-detected; one pure language, no Hinglish |

## Failure modes to prevent
- Any step requiring reading to proceed → defect.
- A text-only category/occasion picker → defect.
- A flow that breaks on 2G / times out without an offline fallback → defect.

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
Throttle to 2G, language = a regional language, reading "disabled" (reviewer must
not read text). Complete the wedding-outfit flow by ear + pictures only.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
