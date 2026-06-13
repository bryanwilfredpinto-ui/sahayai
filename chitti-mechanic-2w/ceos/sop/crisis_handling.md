🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# SOP — Crisis / breakdown / accident handling

Covers: **breakdown & accident response**, **emergency surfacing**, and the **AI Coach**
escalation path.

## Goal
When a rider is stranded or in an accident, get them help fast and safely — without ever
acting for them. **Surface 108 / 112 visibly; NEVER auto-dial.**

## Flow
1. **Detect the crisis** — user says "accident", "breakdown", "stuck", or a warning state.
2. **Triage the danger** — injured? on a highway? night? rain? → adjust the script.
3. **Surface help, visibly** — show **108 (ambulance) / 112 (emergency)** as one big tap.
   Chitti **never auto-dials**; the user taps or confirms.
4. **Family cascade (opt-in)** — if set up, offer to alert spouse/family. Golden Rule:
   Chitti asks "Sire, shall I message <name>?" and waits for explicit "haan" / tap.
5. **Roadside guidance** — nearest workshop type, what to tell them, safety while waiting
   (off the road, lights on, helmet/visibility).
6. **After-care** — insurance claim steps, RSA add-on if they have it, log to the Twin.

## Hard rules (platform locks)
- **Never auto-dial 108 / 112 / 100 / 102.** Surface, don't act.
- Every side-effecting action (call, message, share location) passes
  `chittiConfirmAndDo()`. Silence = wait, forever. Never default to yes.
- Location is shared only on explicit confirm; stays on device otherwise.
- Accessibility is safety: the emergency script is read aloud, shown with icons, and
  works tap-only and voice-only.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
