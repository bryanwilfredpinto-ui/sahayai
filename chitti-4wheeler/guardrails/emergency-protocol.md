🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# GUARDRAIL — Emergency Protocol (P0, LOCKED)

> Per the [Vaani locked emergency protocol §2](../../SAHAYAI_MASTER.md): on a roadside
> breakdown or accident, Chitti runs the **family cascade**. It **NEVER auto-dials**
> 100 / 108 / 112. Every dial is a Golden-Rule confirmed action.

## The cascade (in order)
1. **Confirm with the driver** — *"Sire, kya main madad bhejun?"* Wait for an explicit
   *haan* (voice) **or** a tap. Silence = wait, forever. Never defaults to Yes.
2. **Ring the alarm** — loud, bypassing silent mode, so passers-by notice.
3. **Escalate to spouse / family** — auto-message + call the saved family chain with
   GPS location + RC plate + car make/model/colour.
4. **Chitti-to-Chitti relay** — fire the offline P2P emergency tier to nearby Chitti
   users if the family chain doesn't pick up.
5. **RSA numbers are INFO ONLY** — Chitti *shows* the brand roadside-assistance number;
   **dialling it requires Golden-Rule confirm** (a tap or *haan*), never automatic.

## Can the vehicle move? (the first decision)
| State | Action |
|---|---|
| Driver hurt / car can't move / on a live carriageway | family cascade + alarm + "stay safe, help coming"; hazards on, get out on the safe side |
| Car won't run but driver is fine | breakdown coach ([../sop/breakdown-roadside.md](../sop/breakdown-roadside.md)) + RSA number (confirm to dial) |
| Car is **unsafe to drive** (🔴 Safety — brakes/steering/overheat/tyre) | DO NOT DRIVE → move to a safe spot if possible → mechanic/tow; cascade if stranded/unsafe |

## Roadside-assistance numbers (info only — dial needs confirm)
Maruti Suzuki 1800-102-1800 · Hyundai 1800-102-4645 · Tata 1800-209-8282 ·
Mahindra 1800-209-6006 · Honda 1800-113-121 · Toyota 1800-425-0001 ·
Kia 1800-108-5000 · MG 1800-100-6464 · Skoda 1800-102-6464 · VW 1800-209-0909 ·
Renault 1800-103-5353 · Nissan 1800-209-2002 · Generic highway RSA 1033.
(Source of truth: `_RSA` in [../backend/routes/wheels.py](../backend/routes/wheels.py).)

## Hard rules (LOCKED — do not relitigate)
- **Never auto-dial cops / ambulance** (100 / 108 / 112). Family cascade only
  ([SAHAYAI_MASTER §2](../../SAHAYAI_MASTER.md)).
- Every side-effecting action (call / SMS / WhatsApp / alarm) gates on
  `chittiConfirmAndDo()` — Chitti speaks *"shall I do X?"*, waits for explicit haan
  or tap, never times out into Yes.
- Cross-Chitti: accident response surfaces nearest hospital + family medicine cabinet
  via [Chitti MedUPI](../../chitti_medupi.html); FIR / accident / insurance-claim
  template via [Chitti Legal](../../chitti_legal.html).

## Accessibility
The confirm gate accepts **voice (haan) OR tap (big Yes/No button)** — mute-safe,
blind-safe, illiterate-safe. The alarm is audible **and** the screen flashes for deaf
drivers. Spoken + captioned + symbol throughout.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
