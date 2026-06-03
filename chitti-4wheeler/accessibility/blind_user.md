🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Blind User (first-class driver / car-owner)

> A blind person owns a car too — a family car driven by a relative, or one they rely
> on daily. When it breaks down, they have **no app** to help them. Chitti does. The
> hero path is **sound-first, voice-out diagnosis**: "Chitti, gaadi se awaaz aa rahi" →
> spoken diagnosis, spoken safety call, spoken DIY steps.

## What they need
- To know **what's wrong** and **whether it's safe to drive** — entirely by voice.
- A sound-first diagnosis path (describe or record the noise; hear the candidates).
- "Describe my dashboard" — point the camera, Chitti narrates the warning lights + the
  OBD2 code in plain Hinglish.
- Every result spoken; no diagnosis, cost, or safety call locked in an image.

## How Chitti serves them
| Need | Implementation |
|---|---|
| Describe my dashboard | camera capture → Chitti speaks: *"check-engine light on, coolant temp normal, fuel low"* |
| Read the DTC aloud | a P-code from `/api/4w/dtc/<code>` spoken in plain Hinglish + severity + cost band |
| Sound-first diagnosis | [sound-doctor](../skills/sound-doctor.md) — describe/record the noise → ranked candidates spoken |
| Full diagnosis spoken | swarm verdict + DIY tier + cost band **all read aloud**, per-axis on request |
| Safety call first | the 🔴/🟠 drive-decision is spoken **before** anything else |
| Guided DIY | each step spoken, "say HAAN when done" before the next step |
| Page navigation | auto-announce on open; every box has 🔊; `chitti_a11y.js` read-page |
| Errors | every error spoken — never visual-only ([§5c BLIND P0](../../SAHAYAI_MASTER.md)) |

## Failure modes to prevent
- A dashboard light / OBD2 code shown but not narrated → defect.
- A 🔴 DO-NOT-DRIVE verdict (e.g. overheat) that isn't **spoken first** → safety defect.
- A cost band or DIY step shown on screen but not read aloud → defect.

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
TalkBack pass: onboard a car by voice → "engine se awaaz" → hear ranked causes +
confidence → hear safety call → hear DIY tier + cost. Must complete with **zero**
sighted assistance.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
