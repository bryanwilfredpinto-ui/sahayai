🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Sound Recognition Domain

The bike "speaks" through noise — knock, tick, grind, whine, rattle, hiss. This
skill maps a sound to a likely component with severity and a DIY tier. Covers
Activa, Splendor, Pulsar, RE, Ather and Ola.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5,
PRD F1 Audio + F12 Sound Library). Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles (and the honest-stub line)
- **The deterministic sound-picker is LIVE — not faked.** `GET /api/2w/sound/catalogue`
  lists ~8 bike sounds; the rider picks the closest, and `POST /api/2w/sound/check
  {sound_key}` returns 2–4 ranked candidate causes with DIY tier + cost band +
  confidence + safety note.
- **Audio AUTO-DETECT (record a clip → AI classifies) is roadmap / COMING SOON** —
  it needs an on-device/edge audio model (DeepSeek is the sole LLM; an audio model is
  funding-gated §8). Sending `{audio:true}` returns an honest `mode:"pick_or_describe"`
  (HTTP 200) — never a fabricated classification (§3 honest-stubs).
- **WHEN a sound happens is half the diagnosis** — at idle vs under load, when
  braking vs constant, cold vs hot. The picker captures this context.
- Sound recognition target **>85%** (SUCCESS_METRICS) — for the deterministic path
  this means the picker's ranked causes match a mechanic's finding ≥85% of the time;
  it is validated by the Mechanic Verification Loop, not asserted.

## 2. Common sound patterns (Indian fleet specifics)
| Sound | When | Likely cause | Typical bikes |
|---|---|---|---|
| **Knock / pinking** | under acceleration | low-octane fuel, carbon, timing → [engine.md](./engine.md) | Pulsar, RE |
| **Tappet tick** | idle, cold start | valve clearance — usually adjustment | RE, high-odo |
| **Grind (metal)** | only when braking | pads/shoes finished → [brakes.md](./brakes.md) **DO NOT RIDE** | Pulsar/RE disc |
| **Constant growl/hum** | not braking, with speed | wheel bearing → [tyres.md](./tyres.md) | high-odo any |
| **Chain slap / rattle** | acceleration/decel | slack/dry/worn chain → [transmission.md](./transmission.md) | Splendor/Pulsar/RE |
| **CVT whine / judder** | scooter pickup | belt/rollers → [transmission.md](./transmission.md) | Activa |
| **Hiss / steam** | hot engine | coolant leak/overheat → [cooling.md](./cooling.md) | liquid-cooled Pulsar |
| **Self-start whirr, no crank** | starting | starter/battery → [electrical.md](./electrical.md) | Activa/Pulsar |
| **Controller/motor whine** | EV drive | usually normal; if new/loud → service | Ather, Ola |

## 3. Symptom (sound) → cause mapping
- Branch first on **WHEN**: braking-only grind = brakes; constant growl = bearing;
  acceleration knock = engine/fuel; idle tick = valves; scooter pickup judder = CVT.
- A "grinding/metal" sound that coincides with braking is escalated to
  [brakes.md](./brakes.md) and can trigger a **DO NOT RIDE** safety call.
- For deaf riders, the same catalogue is used **visually** — they pick the described
  sound; no audio dependency ([accessibility.md](./accessibility.md)).

## 4. Confidence-band output (always)
- Picked sounds return ranked causes with Likely/Possible + High/Med/Low. A clearly
  matched, time-specific sound is **High**; a vague "weird noise" is **Low** →
  recommend a mechanic listen / inspection.
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md), Chitti never
  turns one ambiguous noise into a guaranteed expensive component.

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — chain lube/adjust for chain slap, fuel-quality fix for light
  knock, terminal check for starter whirr.
- 🟡 **DIY-careful** — spark-plug for misfire tick, identify CVT-service-due.
- 🟠 **Mechanic-preferred** — valve-clearance (tappet), bearing replace, CVT service.
- 🔴 **DO NOT RIDE** — brake grind (metal-on-metal), bearing growl at speed.
  [Safety Agent](../swarm/safety-agent.md) owns these.

## 6. Swarm agents this skill feeds
Acts as an **evidence source** that re-weights [Engine](../swarm/engine-agent.md),
[Electrical](../swarm/electrical-agent.md), [Fuel](../swarm/fuel-agent.md) and feeds
the [Safety Agent](../swarm/safety-agent.md) (grind/growl red lines).
[Cost](../swarm/cost-agent.md) bands the indicated repair; the
[Trust Agent](../swarm/trust-agent.md) caps over-reading an ambiguous sound. Feeds the
sound-catalogue half of [sound-doctor.md](./sound-doctor.md).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
