🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Transmission & Drive Domain

How power reaches the rear wheel: clutch + gearbox + chain (motorcycles), CVT
belt + variator (scooters), and direct-drive motor (EVs). Covers Activa, Splendor,
Pulsar, RE, Ather and Ola.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5).
Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles
- Three very different drive types in the Indian fleet — never mix the diagnosis:
  - **Geared motorcycle** (Splendor, Pulsar, RE) — wet clutch + sequential
    gearbox + **chain-and-sprocket**. Faults: clutch slip/drag, gear hard/jump,
    chain slack/wear, sprocket teeth.
  - **CVT scooter** (Activa) — automatic **V-belt + variator + rollers + clutch
    shoes**. Faults: belt wear/slip, worn rollers (judder), clutch-shoe slip.
  - **EV direct-drive** (Ather, Ola) — **no gears, no clutch, no belt** (hub or
    mid-motor + controller). "Transmission" symptoms = motor/controller/BMS →
    route to [electrical.md](./electrical.md).
- **Chain maintenance is the #1 neglected item** on Indian geared bikes — a slack,
  dry, rusted chain hurts mileage, can snap, or lock the rear wheel.

## 2. Common failure patterns (Indian fleet specifics)
| Pattern | Typical bikes | Tell-tale |
|---|---|---|
| Revs rise but speed doesn't | Pulsar/RE (geared) | **clutch slipping** — worn plates / wrong cable free-play |
| Hard to find neutral / gear jumps | Splendor/RE | clutch drag, linkage, or gearbox wear |
| Chain noise / slap / rust | Splendor/Pulsar/RE | slack or dry/worn chain — lube & adjust |
| Jerky pickup, low-speed judder | Activa (CVT) | worn rollers / belt / clutch shoes |
| Whine + weak drive (scooter) | Activa | CVT belt worn/glazed |
| Grinding from drive side | geared | sprocket teeth hooked / chain badly worn |
| No drive at all but motor spins | EV Ather/Ola | controller/motor — **route to electrical**, not "gearbox" |
| RE "false neutral" between gears | Royal Enfield | known trait — selector/clutch adjustment |

## 3. Symptom → cause mapping (drive slice)
- **Engine revs, bike doesn't accelerate** → clutch slip (geared) or belt/clutch-shoe
  (CVT). Geared: clutch free-play first (cheap), then plates.
- **Hard/notchy gear change** → clutch not fully disengaging (drag) — cable/lever
  adjust first.
- **Chain noise / chain too slack or too tight** → lube, clean, adjust to spec slack;
  if links are stiff/hooked sprocket → replace chain+sprocket as a set.
- **CVT judder/whine** → rollers/belt service interval (Activa belt ~every ~20–24k km
  guidance; confirm per model).
- **EV no-drive** → not a transmission fault — hand to [electrical.md](./electrical.md)
  (controller/motor/BMS).

## 4. Confidence-band output (always)
- Likelihood + Confidence band as always. Clutch-slip from "revs-up-no-speed" is
  often **High**; vague "feels weak" is **Low** → recommend a test ride/inspection.
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md), don't jump to
  "gearbox overhaul" (expensive) when a clutch-cable adjust or chain service fits.

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — clean + lube + adjust chain slack, set clutch/gear cable
  free-play, visual sprocket check. Tools: basic. Savings: ₹150–500.
- 🟡 **DIY-careful** — clutch-cable replace, chain tension to spec with rear-wheel
  re-alignment marks.
- 🟠 **Mechanic-preferred** — clutch-plate replace, chain+sprocket set, CVT belt/
  roller service.
- 🔴 **Professional only** — gearbox internals, variator/CVT teardown, EV motor/
  controller. [Safety Agent](../swarm/safety-agent.md) flags a snapped/locked chain
  risk as DO NOT RIDE.

## 6. Swarm agents this skill feeds
Feeds the [Engine Agent](../swarm/engine-agent.md) (drive-line context) and the
[Safety Agent](../swarm/safety-agent.md) (chain-snap / rear-lock risk). EV "no-drive"
is explicitly handed to the [Electrical Agent](../swarm/electrical-agent.md).
[Cost](../swarm/cost-agent.md) bands clutch/chain/CVT jobs (feeds
[scam-shield.md](./scam-shield.md) against premature "full clutch overhaul" quotes);
the [Trust Agent](../swarm/trust-agent.md) caps expensive gearbox claims.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
