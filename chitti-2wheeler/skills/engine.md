🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Engine Domain

The combustion-and-power knowledge core for Chitti Bike Doctor. Covers the
2-wheeler engine: cranking, ignition, fuelling, compression, lubrication and
thermal behaviour across India's real fleet — Honda Activa, Hero Splendor,
Bajaj Pulsar, Royal Enfield (RE), Ather and Ola.

See the canonical framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md)
(LEVEL 5). Platform locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles
- An engine needs four things in balance: **air + fuel + spark + compression**,
  each at the right time. Diagnose by elimination, cheapest free check first.
- **ICE vs EV split (LOCKED reality):** Activa / Splendor / Pulsar / RE are
  petrol ICE — they "crank, fire, idle". Ather / Ola are EV — there is **no
  engine**, no spark, no oil. EV power-train faults route to
  [electrical.md](./electrical.md) and the motor/controller, never here. If the
  bike profile is Ather/Ola, this skill returns *"EV — no combustion engine;
  routing to electrical/motor"* and yields.
- Carburettor (older Splendor, Pulsar pre-BS6) vs **Fuel Injection / FI** (all
  BS6 — Activa 6G, Splendor BS6, Pulsar BS6) changes the fuelling diagnosis
  completely: carb = choke / jet / float; FI = sensor / pump / injector + MIL.
- Never declare "engine seized" or "head gasket gone" on thin evidence. That is
  a high-cost, high-fear verdict — it must clear the [Trust Agent](../swarm/trust-agent.md).

## 2. Common failure patterns (Indian fleet specifics)
| Pattern | Typical bikes | Tell-tale |
|---|---|---|
| Cold-start hard / won't fire on choke | carb Splendor, older Pulsar | needs choke; fires then dies when choke off → idle/jet |
| FI MIL ("engine" lamp) on, limp idle | Activa 6G, Pulsar BS6, RE BS6 | dashboard MIL + rough idle → sensor/throttle-body — route to [obd.md](./obd.md) |
| Engine knocking / pinking under load | Pulsar, RE | low-octane fuel, carbon, or advanced timing |
| Excess oil burn, blue-grey smoke | high-odo Splendor/Activa | worn rings/valve seals → see [exhaust.md](./exhaust.md) smoke-colour map |
| Overheat after long city idle | Activa (air-cooled CVT), Pulsar | route thermal to [cooling.md](./cooling.md) |
| Won't crank at all, self clicks, lights dim | any ICE | **not engine** — battery/starter → [electrical.md](./electrical.md) |
| RE "tappet" rattle on cold start | Royal Enfield | valve-clearance / hydraulic — usually adjustment, not failure |
| CVT whine / no drive (scooter) | Activa, Ola | belt/roller or EV motor → [transmission.md](./transmission.md) |

## 3. Symptom → cause mapping (engine slice)
- **Cranks but won't fire** → spark (plug/coil) **or** fuel (no petrol, clogged
  jet, FI pump/relay) **or** compression. Order: fuel-in-tank (free) → spark at
  plug → fuelling → compression.
- **Fires then stalls** → idle too low, choke stuck, dirty carb pilot jet, FI
  idle-air/throttle-position fault.
- **Misfire / jerks at speed** → fouled or wrong-gap plug, weak coil, lean/rich
  mixture, water in fuel ([fuel contamination](./obd.md)).
- **Knocking under acceleration** → poor fuel quality, carbon deposits, timing.
- **Power loss + smoke** → branch by smoke colour (see [exhaust.md](./exhaust.md)).
- **No crank / slow crank** → hand off to [electrical.md](./electrical.md) (battery
  ≥12.4 V good / 11.5–12.4 low → jump / <11.5 replace).

## 4. Confidence-band output (always)
Every engine verdict ships a band — never a bare claim
([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)):
- **Likelihood:** Likely / Possible (weighted vote vs other agents).
- **Confidence:** High (≥90%) / Medium (70–89%) / Low (<70%).
- **Disagreement floor:** top-two within ~15 pts OR top weight <50% →
  *"diagnosis confidence low — recommend inspection"*, never a bluff.
- Phrasing per [GUARDRAILS L8](../../CHITTI_MECHANIC_COSDF.md): 90–100% "highly
  likely" · 70–89% "probably" · 50–69% "could be… or…" · <50% "not sure — to
  diagnose better, please…".

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — fuel top-up, choke check, spark-plug clean/gap, air-filter
  clean. Tools: basic. Savings: ₹150–400 labour.
- 🟡 **DIY-careful** — spark-plug replace, idle-RPM screw adjust (carb), throttle
  free-play. Needs care, engine cold/off.
- 🟠 **Mechanic-preferred** — valve-clearance (RE tappets), carb strip-clean,
  FI sensor swap.
- 🔴 **Professional only / DO NOT DIY** — top-end (rings/valves), suspected
  seizure, head-gasket, FI fuel-rail under pressure. [Safety Agent](../swarm/safety-agent.md)
  vetoes any home fix here.

## 6. Swarm agents this skill feeds
Feeds the [Engine Agent](../swarm/engine-agent.md) (primary fault + weight) and
the synthesis. Cross-checks with [Electrical](../swarm/electrical-agent.md) (no-crank
ownership), [Fuel](../swarm/fuel-agent.md) (mixture/contamination). The
[Safety Agent](../swarm/safety-agent.md) (supreme) can force DO NOT RIDE on
seizure/smoke-fire risk; [Cost](../swarm/cost-agent.md) bands the repair; the
[Trust Agent](../swarm/trust-agent.md) caps any high-fear seizure/head-gasket claim.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
