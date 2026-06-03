🎖️ World Class Chitti Fashion — Accessibility Review: Deaf User

# ACCESSIBILITY — Deaf User (Persona P6: Imran)

> Everything Chitti says by voice must also be **text + symbols + ISL**. No
> audio-only step ever.

## What he needs
- Captions on every result; symbols paired with words (✅/⚠️/❔), never colour alone.
- An **ISL animation panel** alongside every response (Indian Sign Language, not ASL).
- Visual confirmation for every step.

## How Chitti serves him
| Need | Implementation |
|---|---|
| Captions | Every spoken line rendered as text on the card |
| Symbols + words | Verdicts use ✅ "just right" / ⚠️ "too casual" — never colour-only |
| ISL | `chitti_isl.js` (auto via chitti_a11y.js) renders an ISL panel per `data-chitti-response` box; tap-word-to-sign |
| No audio-only | Voice is additive, never the only channel |

## Failure modes to prevent
- A result delivered only by voice → defect.
- Colour-only status (red/green chip with no word/symbol) → defect.
- A response box without an ISL panel → defect (G5).

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
Mute the device. Complete the full hero flow using only text + symbols + ISL.
Confirm ISL panel renders on every response and tap-word-to-sign works.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
