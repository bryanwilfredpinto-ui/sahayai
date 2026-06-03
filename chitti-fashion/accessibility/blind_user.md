🎖️ World Class Chitti Fashion — Accessibility Review: Blind User

# ACCESSIBILITY — Blind User (Persona P5: Lakshmi)

> The blind user is a **first-class** Chitti Fashion user. The hero feature for her
> is **"Describe My Outfit."** No fashion app serves her — we do.

## What she needs
- To know **what she is wearing** and whether it suits where she's going — by voice.
- To build and browse her wardrobe by voice + spoken labels.
- Every result spoken; no information locked in an image.

## How Chitti serves her
| Need | Implementation |
|---|---|
| Describe my outfit | Chitti speaks: "blue cotton kurta, black leggings, brown sandals — suitable for office." |
| Build wardrobe | Voice-add ("add a blue cotton shirt for office"); camera capture with spoken confirmation of detected colour |
| Outfit advice | Full swarm verdict spoken; per-axis read on request |
| Page navigation | Auto-announce on open; every box has 🔊; `chitti_a11y.js` read-page |
| Errors | Every error spoken — never visual-only ([§5c](../../SAHAYAI_MASTER.md) BLIND P0) |

## Failure modes to prevent
- Any colour/result shown but not spoken → defect.
- A wardrobe item with no spoken label → defect.
- An outfit collage with no narrated description → defect.

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
TalkBack pass on: first-visit profile → add 3 items → "dress me" → hear 3 outfits →
"describe what I'm wearing." Must complete with **zero** sighted assistance.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
