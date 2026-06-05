🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Exhaust & Emissions Domain

The exhaust tells a story through **smoke colour, sound and PUC failure**. Covers
silencer, catalytic converter, BS6 emissions hardware and the smoke-colour
diagnostic map across Activa, Splendor, Pulsar and RE. (EVs have no exhaust.)

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5,
maps to SOP-004 Smoke colour). Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles
- **EVs (Ather/Ola) have no exhaust** — this skill yields immediately for EV profiles.
- **Smoke colour is a high-signal, cheap diagnostic** (SOP-004):
  | Smoke | Smell/behaviour | Meaning | Severity |
  |---|---|---|---|
  | Thin white | only on cold start, clears | water vapour / condensation | none |
  | Thick white | sweet smell, persists | **coolant burning — head gasket** (liquid-cooled) | HIGH |
  | Blue-grey | oily smell | **engine oil burning** — rings/valve seals | MED |
  | Black | fuel smell, sooty | **rich mixture** — choke stuck, dirty air filter, FI fuelling | LOW–MED |
- **BS6 emissions hardware:** modern Activa/Splendor/Pulsar/RE carry a catalytic
  converter + O2 sensor + evap controls. A **flashing** MIL ("check engine") can
  indicate catalyst-damaging misfire — do not ignore (see [obd.md](./obd.md)).
- **PUC (Pollution Under Control)** is a legal requirement in India. Failing PUC
  points to fuelling, a tired catalyst, or oil burning.

## 2. Common failure patterns (Indian fleet specifics)
| Pattern | Typical bikes | Tell-tale |
|---|---|---|
| Black smoke, poor mileage, sooty plug | carb Splendor/Pulsar | rich mixture / clogged air filter / choke stuck |
| Blue smoke on high-odo bikes | old Activa/Splendor | oil burning past rings/valve seals |
| Thick sweet white smoke | liquid-cooled Pulsar | head gasket → cross [cooling.md](./cooling.md) |
| Loud / blowing silencer | RE, modified bikes | corroded silencer, leak at joint, aftermarket "free-flow" |
| PUC test failed (high CO/HC) | older / neglected | tune-up, air filter, plug, or aged catalyst |
| Rotten-egg smell | catalyst-equipped | rich running stressing the catalytic converter |
| Flashing engine lamp + rough run | BS6 Activa/Pulsar | misfire risking catalyst → [obd.md](./obd.md) |

## 3. Symptom → cause mapping (exhaust slice)
- **Smoke present** → branch by colour (table above), cheapest cause first
  (air-filter/choke before rings/head-gasket).
- **PUC failed** → service basics: air filter, spark plug, correct fuelling; if it
  still fails → catalyst/oil-burn investigation.
- **Loud exhaust** → leak at joint or corroded silencer; aftermarket free-flow may
  also be illegal/PUC-failing — advise legal stock setup.
- **Flashing MIL** → treat as urgent (catalyst protection), route to [obd.md](./obd.md).

## 4. Confidence-band output (always)
- Likelihood + Confidence band as always. Smoke-colour from a clear video raises
  confidence; a described colour is decent but verify. Head-gasket (thick sweet
  white) is high-fear — the [Trust Agent](../swarm/trust-agent.md) caps it unless
  cooling signs corroborate.
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md), distinguish
  harmless cold-start vapour from real white smoke before alarming the rider.

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — clean/replace air filter, free a stuck choke, observe + report
  smoke colour, get a fresh PUC. Free–₹300.
- 🟡 **DIY-careful** — spark-plug clean/replace, tighten an exhaust joint clamp
  **(when cold)**.
- 🟠 **Mechanic-preferred** — fuelling/carb tune, O2-sensor check, silencer repair.
- 🔴 **Professional only / DANGER** — touching a **hot exhaust** (burns), top-end
  for oil burn, head-gasket, catalyst replacement. [Safety Agent](../swarm/safety-agent.md)
  warns "exhaust is hot — wait".

## 6. Swarm agents this skill feeds
Feeds the [Engine Agent](../swarm/engine-agent.md) (smoke = combustion evidence) and
shares the head-gasket case with [cooling.md](./cooling.md). The
[Safety Agent](../swarm/safety-agent.md) adds the hot-exhaust burn warning.
[Cost](../swarm/cost-agent.md) bands air-filter/plug/silencer vs the feared top-end;
the [Trust Agent](../swarm/trust-agent.md) blocks a premature "engine overhaul" when a
₹200 air-filter explains black smoke.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
