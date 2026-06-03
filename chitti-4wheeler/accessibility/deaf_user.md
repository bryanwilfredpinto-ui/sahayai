🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Deaf User (first-class driver / car-owner)

> Everything Chitti says by voice must also be **text + symbols + ISL**. A deaf driver
> can't hear the engine *or* the spoken diagnosis — so Chitti's whole output must be
> visual, and a safety verdict must be impossible to miss.

## What they need
- Visual diagnosis cards; symbols paired with words (✅/⚠️/🔴), never colour alone.
- An **ISL animation panel** alongside every response (Indian Sign Language).
- A sound-diagnosis path that **doesn't depend on hearing** — describe the symptom by
  picking from visual options ("jhatke", "dhuaan", "warning light", "leak") + photo, not
  "listen and tell me."
- Visual confirmation for every step.

## How Chitti serves them
| Need | Implementation |
|---|---|
| Captions | every spoken line rendered as text on the card |
| Symbols + words | verdicts use 🔴 "DO NOT DRIVE" / 🟠 "drive gently" / 🟢 "safe" — symbol **+ word**, never colour-only |
| ISL | `chitti_isl.js` (auto via chitti_a11y.js) renders an ISL panel per `data-chitti-response` box; tap-word-to-sign |
| Sound diagnosis without hearing | visual symptom picker + photo/video of the part — no "listen" step required |
| 🔴 hazard unmissable | red symbol + word + **screen flash** + ISL — a deaf driver cannot miss a DO-NOT-DRIVE (overheat / brake) call |
| OBD2 / dashboard read | the photo→code→meaning flow is fully visual; no audio step required |
| No audio-only | voice is additive, never the only channel |

## Failure modes to prevent
- A safety verdict delivered only by voice → **safety defect**.
- A colour-only status (red/green chip with no word/symbol) → defect.
- A diagnosis path that requires the driver to listen to the engine → defect (offer the
  AI-listening clip-upload + a visual picker instead).
- A response box without an ISL panel → defect (G5).

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
Mute the device. Run a full diagnosis using only text + symbols + ISL. Confirm a 🔴
verdict (e.g. overheat) is unmistakable visually (symbol + word + flash) and the ISL
panel renders on every response.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
