🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP-006 — Roadside Emergency (family cascade — NEVER cops)

**COSDF L7 SOP-006.** Trigger: *"Emergency"* voice keyword (always-on spotting) / accident
/ a 🔴 critical diagnosis from any SOP / one-tap SOS → `POST /api/4w/breakdown` +
[../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md). This is the
operating procedure; the **guardrail** is the LOCKED law it executes.

> **LOCKED (SAHAYAI_MASTER §2 / §2g):** on a roadside emergency Chitti runs the **family
> cascade**. It **NEVER auto-dials 100 / 108 / 112 / cops / ambulance.** Every dial is a
> Golden-Rule confirmed action (explicit *haan* or tap; silence = wait, forever). This is
> not relitigable.

## Step 0 — Safety + location (spoken first, before anything)
1. *"Aap safe ho? Hazard lights on karo, gaadi side mein lao, sab log barrier ke peeche."*
   — get everyone **off the live carriageway** first.
2. Reflective warning **triangle ~50 m behind** (more on a highway / blind curve).
3. Exit on the **safe (non-traffic) side**; don't stand behind the car.

## Step 1 — Can the vehicle move? (the first decision)
| State | Action |
|---|---|
| **Driver hurt / car can't move / on a live carriageway** | go straight to the **family cascade** (Step 2) + alarm; "stay safe, help is coming" |
| Car won't run but **driver is fine** | breakdown coach ([./breakdown-roadside.md](./breakdown-roadside.md) / [./not_starting.md](./not_starting.md)) + brand RSA number (dial needs confirm) |
| Car is **unsafe to drive** (🔴 brakes / steering / overheat / tyre) | **DO NOT DRIVE** → move to a safe spot if possible → mechanic / tow → cascade if stranded |

## Step 2 — The family cascade (in order — NEVER cops)
1. **Confirm with the driver** — *"Sire, kya main madad bhejun?"* Wait for explicit *haan*
   (voice) **or** a tap. **Silence = wait, forever. Never defaults to Yes.**
2. **Ring the alarm** — loud, bypassing silent mode, so passers-by notice (screen flashes
   for deaf drivers).
3. **Escalate to spouse / family** — auto-message + call the saved family chain with **GPS
   location + RC plate + make/model/colour**.
4. **Chitti-to-Chitti relay** — if the family chain doesn't pick up, fire the offline P2P
   emergency tier to nearby Chitti users ([../../CHITTI_OFFLINE_TRANSFER_SPEC.md](../../CHITTI_OFFLINE_TRANSFER_SPEC.md)).
5. **RSA numbers are INFO ONLY** — Chitti *shows* the brand roadside-assistance number;
   **dialling requires a tap or haan**, never automatic.

## Step 3 — Stay on voice (emergency copilot)
Chitti stays on voice until the driver says *"safe"* — basic diagnosis while waiting,
reassurance, repeating location to the family, and the cross-Chitti links below. It does
not hang up the moment help is dispatched.

## Roadside-assistance numbers (info only — dial needs confirm)
Maruti Suzuki 1800-102-1800 · Hyundai 1800-102-4645 · Tata 1800-209-8282 ·
Mahindra 1800-209-6006 · Honda 1800-113-121 · Toyota 1800-425-0001 · Kia 1800-108-5000 ·
MG 1800-100-6464 · Skoda 1800-102-6464 · VW 1800-209-0909 · Renault 1800-103-5353 ·
Nissan 1800-209-2002 · Generic highway RSA 1033.
(Source of truth: `_RSA` in [../backend/routes/wheels.py](../backend/routes/wheels.py).)

## Step 4 — Cross-Chitti (accident)
- Nearest hospital + the family medicine cabinet → [Chitti MedUPI](../../chitti_medupi.html).
- FIR / accident report / insurance-claim template → [Chitti Legal](../../chitti_legal.html).
- These are **surfaced**, not auto-fired — same Golden-Rule confirm.

## Hard rules (LOCKED — do not relitigate)
- **NEVER auto-dial cops / ambulance (100 / 108 / 112).** Family cascade only
  ([SAHAYAI_MASTER §2](../../SAHAYAI_MASTER.md)).
- Every side-effecting action (call / SMS / WhatsApp / alarm / dial) gates on
  `chittiConfirmAndDo()` — speaks *"shall I do X?"*, waits for haan or tap, **never times
  out into Yes.**
- Overheat / 🔴 safety → never "drive a bit to reach help" — tow / wait.
- Roadside-assistance call = **family-cascade + maps deep-link**, opt-in and confirmed —
  the COSDF "call roadside assistance" item is implemented this way, not as an auto-call
  ([../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) Platform adaptation).

## Accessibility
The confirm gate accepts **voice (haan) OR tap** (big Yes/No) — mute-safe, blind-safe,
illiterate-safe. The alarm is **audible AND the screen flashes** (deaf). Every step is
spoken + captioned + symbol. The "Emergency" keyword works hands-free for a trapped or
injured driver. `fw_emergency` widget carries 🔊/🤖/👍/👎.

## Cross-links
[../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md) (the LOCKED law) ·
[./breakdown-roadside.md](./breakdown-roadside.md) · [./not_starting.md](./not_starting.md) ·
[./overheating.md](./overheating.md) · [./brake_noise.md](./brake_noise.md) ·
[../swarm/safety-agent.md](../swarm/safety-agent.md) ·
[../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2 / §2g.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
