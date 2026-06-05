🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SOP-006 — Roadside Emergency (family cascade — NEVER cops)

**COSDF L7 SOP-006.** Trigger: the word *"emergency"* / *"madad"* / *"accident"* /
one-tap SOS / any critical diagnosis from the [Safety Agent](../swarm/safety-agent.md)
(🔴 brake failure, fork bottoming, EV battery smoke, accident). Chitti becomes an
**emergency copilot** — it stays on voice until the rider says "safe."

> **LOCKED (SAHAYAI_MASTER §2, never relitigate):** on a breakdown or accident Chitti
> runs the **family cascade**. It **NEVER auto-dials 100 / 108 / 112 / cops / ambulance.**
> Every dial is a Golden-Rule confirmed action (a tap **or** an explicit *haan*).
> This SOP is the operational expansion of [guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md).

## Step 0 — The first decision: can the rider / vehicle move?
| State | Action |
|---|---|
| **Rider hurt / can't move the bike** | go straight to the cascade (Step 2) + "stay where you are, help coming" |
| **Bike won't run, rider is fine** | breakdown coach ([breakdown-roadside](./breakdown-roadside.md) / [not_starting](./not_starting.md)) + RSA number (dial needs confirm) |
| **Bike unsafe to ride (🔴 Safety)** | DO NOT RIDE → push to a safe spot → mechanic/tow; cascade only if stranded / unsafe location |

## Step 1 — Make the scene safe (spoken, hands-free)
1. **Hazard lights ON.** Move the bike **off the carriageway** to the left/shoulder if it rolls.
2. Get the rider **away from traffic** — behind the barrier, not standing on the road.
3. If carried, place a **reflective triangle / warning** ~15 m behind on a highway.
4. At night / low visibility, switch on phone torch, stay visible, face oncoming traffic.

## Step 2 — The family cascade (in order — the LOCKED protocol)
1. **Confirm with the rider** — *"Sire, kya main madad bhejun?"* Wait for an explicit
   *haan* (voice) **or** a tap. **Silence = wait, forever.** Never defaults to Yes,
   never times out into Yes ([Golden Rule §2g](../../SAHAYAI_MASTER.md)).
2. **Ring the alarm** — loud, **bypassing silent mode**, so passers-by notice + the screen flashes.
3. **Escalate to spouse / family** — auto-message **and** call the saved family chain
   with **GPS location + RC plate + bike model**, on confirm.
4. **Chitti-to-Chitti relay** — if the family chain doesn't pick up, fire the
   [offline P2P emergency tier](../../SAHAYAI_MASTER.md) to nearby Chitti users.
5. **RSA numbers are INFO ONLY** — Chitti *shows* the brand roadside number; **dialling
   requires Golden-Rule confirm**, never automatic.

## Step 3 — Basic diagnosis while help is on the way
While waiting, Chitti keeps the rider calm and runs the relevant tree hands-free:
[not_starting](./not_starting.md) · [overheating](./overheating.md) ·
[brake_noise](./brake_noise.md) — only **safe** roadside checks, never a hydraulic /
fuel-system fix on the shoulder. Chitti **stays on voice** until the rider says "safe."

## Step 4 — Roadside-assistance numbers (info only — dial needs confirm)
Hero 1800-258-4747 · Honda 1800-103-1234 · Bajaj 1800-233-2453 / 1033 ·
TVS 1800-258-8888 · Royal Enfield 1800-210-0007 · Yamaha 1800-420-1600 ·
Suzuki 1800-103-3402 · KTM 1800-419-1090 · Generic highway RSA 1033.
*(Shown for the rider to tap-to-dial; Chitti never auto-dials any number.)*

## Step 5 — Cross-Chitti (on confirm only)
- Injury → nearest hospital + family medicine cabinet via [Chitti MedUPI](../../chitti_medupi.html).
- Accident → FIR / accident-note template via [Chitti Legal](../../chitti_legal.html).
- These surface as options the rider taps — never auto-fired.

## Hard rules (LOCKED — do not relitigate)
- **NEVER auto-dial cops / ambulance** (100 / 108 / 112). **Family cascade only**
  ([SAHAYAI_MASTER §2](../../SAHAYAI_MASTER.md)).
- Every side-effecting action (call / SMS / WhatsApp / alarm / location-share) gates on
  `chittiConfirmAndDo()` — Chitti speaks *"shall I do X?"*, waits for an explicit *haan*
  or tap, **never times out into Yes**.
- Location is shared **only on consent**; the alarm bypasses silent **only** after confirm.
- A 🔴 safety verdict means **do not ride** — Chitti never coaches "limp it home" on a
  brake / steering / fork / chain red line.
- EV HV battery smoke/heat/swelling → DO NOT RIDE **and DO NOT TOUCH** → OEM + cascade.

## Accessibility (mute-, blind-, deaf-, illiterate-safe)
The confirm gate accepts **voice (haan) OR a big Yes/No tap** — works for a mute or
illiterate rider. The alarm is **audible AND the screen flashes** for deaf riders. Every
step is spoken first (blind), captioned + symbol + ISL (deaf), and reducible to a single
SOS tap. No reading required; works on 2G; the cascade runs even with a flaky data link
(the alarm + family SMS need only minimal connectivity).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
