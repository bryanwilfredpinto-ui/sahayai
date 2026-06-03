🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Blind User (first-class rider)

> A blind rider's bike breaks down too — and they have **no app** to help them. Chitti
> does. The hero path for them is **sound-first, voice-out diagnosis**: "Chitti, meri
> bike se awaaz aa rahi" → spoken diagnosis, spoken safety call, spoken DIY steps.

## What they need
- To know **what's wrong** and **whether it's safe to ride** — entirely by voice.
- A sound-first diagnosis path (describe or record the noise; hear the candidates).
- "Describe my dashboard" — point the camera, Chitti narrates the warning lights.
- Every result spoken; no diagnosis, cost, or safety call locked in an image.

## How Chitti serves them
| Need | Implementation |
|---|---|
| Describe my dashboard | camera capture → Chitti speaks: *"engine-check light on, fuel low, temperature normal"* |
| Sound-first diagnosis | [sound-doctor](../skills/sound-doctor.md) — describe/record the noise → ranked candidates spoken |
| Full diagnosis spoken | swarm verdict + DIY tier + cost band **all read aloud**, per-axis on request |
| Safety call first | the 🔴/🟠 ride-decision is spoken **before** anything else |
| Guided DIY | each step spoken, "say HAAN when done" before the next step |
| Page navigation | auto-announce on open; every box has 🔊; `chitti_a11y.js` read-page |
| Errors | every error spoken — never visual-only ([§5c BLIND P0](../../SAHAYAI_MASTER.md)) |

## Failure modes to prevent
- A dashboard light shown but not narrated → defect.
- A 🔴 DO-NOT-RIDE verdict that isn't **spoken first** → safety defect.
- A cost band or DIY step shown on screen but not read aloud → defect.

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
TalkBack pass: onboard a bike by voice → "engine se awaaz" → hear ranked causes +
confidence → hear safety call → hear DIY tier + cost. Must complete with **zero**
sighted assistance.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
