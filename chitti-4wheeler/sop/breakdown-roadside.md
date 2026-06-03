🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP — Roadside Breakdown ("car won't start / stopped")

**Trigger:** *"meri gaadi band ho gayi"* / *"start nahi ho rahi"* / one-tap breakdown
button → `POST /api/4w/breakdown` ([../backend/routes/wheels.py](../backend/routes/wheels.py)).

## Step 0 — Safety + location first
1. *"Aap safe ho? Hazard lights on karo, gaadi side mein karo, sab log barrier ke
   peeche."* — get them off the carriageway first; reflective triangle 50 m behind.
2. If the driver is **hurt or stranded in an unsafe spot** → jump straight to the
   [family-cascade SOS](../guardrails/emergency-protocol.md) (confirm → alarm → family
   → Chitti relay). **Never auto-dial cops.**

## Step 1 — Won't-start decision tree (free checks first)
| Ask | If… | Then |
|---|---|---|
| Self-start crank hota hai? | **No crank, dashboard dim/dead** | battery / terminal — clean terminal, check connections |
| | **No crank, dashboard fine, click only** | starter motor / immobiliser |
| | **Cranks, won't fire** | fuel + spark / crank-cam sensor |
| Fuel hai? Gauge? | empty | the #1 cause — emergency fuel delivery available |
| Check-engine light ON? Koi code? | yes | DTC tab → `GET /api/4w/dtc/<code>` → plain meaning |
| Battery light driving ke time aaya tha? | yes | alternator — battery slowly drained → jump start to reach a shop |
| Temperature red / steam? | yes | 🔴 STOP — overheat, do not crank repeatedly, let it cool |

## Step 2 — Verdict
- **Fixed roadside (free/cheap)** → log it, offer prevention tip.
- **Can't fix, car is safe to wait/tow** → nearest mechanic (geo) + brand
  [RSA number](../guardrails/emergency-protocol.md) (dial needs Golden-Rule confirm).
  `breakdown` returns the brand-matched RSA from `_RSA`.
- **Unsafe (🔴 Safety red line)** → DO NOT DRIVE → tow → cascade if stranded.

## Hard rules
- Free checks (fuel, terminals, kill light, code) **before** any "go to mechanic."
- RSA numbers are info; **dialling requires a tap or haan** ([§2g](../../SAHAYAI_MASTER.md)).
- Never auto-dial 100 / 108 / 112 — family cascade only.
- Overheat → never "drive a bit to the shop"; stop and cool first.

## Accessibility
Spoken step-by-step + picture decision tree + tap answers (mute/illiterate). Safety
verdict spoken first (blind) and shown as symbol+word+flash (deaf). "Say HAAN or tap
to call family." `fw_breakdown` widget.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
