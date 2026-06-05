🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Cooling & Thermal Domain

Keeps the engine (or EV battery) from overheating. Covers air-cooling, oil-cooling
and liquid-cooling on ICE bikes, plus EV thermal behaviour, across Activa, Splendor,
Pulsar, RE, Ather and Ola.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5,
maps to SOP-003 Overheating). Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles
- Cooling type varies across the Indian fleet and changes the whole diagnosis:
  - **Air-cooled** — Splendor, Activa (most variants), small Pulsar: cooled by
    fins + airflow. No coolant. Overheats in long city idle / heavy traffic.
  - **Oil-cooled** — many Pulsar, RE (some): an oil cooler assists; watch oil
    level/condition.
  - **Liquid-cooled** — Pulsar RS/NS, higher-cc: radiator + coolant + fan +
    thermostat. Has a coolant reservoir and temperature gauge/lamp.
  - **EV (Ather/Ola)** — thermal management for the **battery & motor**, not an
    engine. Over-heat shows as power-cut / "turtle mode" / charge throttling.
- **The cardinal safety rule (SOP-003): if the temperature gauge/lamp is RED,
  STOP and let it cool. NEVER open a hot radiator/coolant cap** — pressurised
  steam causes severe burns. Top up coolant **only when cold**.

## 2. Common failure patterns (Indian fleet specifics)
| Pattern | Typical bikes | Tell-tale |
|---|---|---|
| Overheat in slow traffic, OK at speed | air-cooled Activa/Splendor | low airflow + low oil; check oil first |
| Temp lamp/gauge red, steam | liquid-cooled Pulsar | low coolant, leak, fan, or thermostat |
| Coolant level keeps dropping | liquid-cooled | external leak (hose/radiator) or internal (head gasket) |
| Radiator fan never runs | liquid-cooled | fan motor / sensor / fuse |
| Engine hot + power loss + thick white smoke | any ICE | possible **head gasket** (sweet-smell white smoke) → [exhaust.md](./exhaust.md) |
| Oil very low / black & thin | high-odo bikes | poor lubrication → heat; oil change overdue |
| EV power-cut / turtle in heat or fast charge | Ather, Ola | battery thermal throttling — usually protective, let cool |

## 3. Symptom → cause mapping (thermal slice)
- **Overheats only in traffic (air-cooled)** → normal-ish if extreme; check engine
  oil level/quality first (free), reduce idling.
- **Red temp lamp (liquid-cooled)** → STOP. When cold: coolant level → visible leak
  → fan running? → thermostat. Order cheapest first.
- **Coolant disappears, no visible leak + white sweet smoke** → suspect head
  gasket — high-cost, route to [engine.md](./engine.md) + mechanic; do not over-claim.
- **EV throttles in heat / fast charge** → protective thermal management, usually
  not a fault; if persistent at normal use, capture code → service.

## 4. Confidence-band output (always)
- Likelihood + Confidence band as always. A stated gauge reading or visible coolant
  leak photo raises confidence; "feels hot" alone is Low → recommend a check.
- Head-gasket is a high-fear/high-cost verdict — the [Trust Agent](../swarm/trust-agent.md)
  caps it unless multiple signs agree (overheat + coolant loss + white smoke + oil
  contamination).

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — check engine-oil level/colour, reduce idling, clean cooling fins,
  check coolant reservoir level **when cold**. Free.
- 🟡 **DIY-careful** — top up coolant **(COLD only)** with the correct spec, check
  visible hose clamps.
- 🟠 **Mechanic-preferred** — fan/thermostat/sensor diagnosis, radiator flush, leak
  trace.
- 🔴 **DO NOT DIY / DANGER** — **opening a hot radiator/coolant cap**, head-gasket
  work, EV battery thermal internals. [Safety Agent](../swarm/safety-agent.md) forces
  "let it cool first" and forbids hot-cap removal.

## 6. Swarm agents this skill feeds
Feeds the [Engine Agent](../swarm/engine-agent.md) (thermal context for power loss)
and the [Safety Agent](../swarm/safety-agent.md) (STOP / let-cool / no-hot-cap).
[Cost](../swarm/cost-agent.md) bands coolant/fan/thermostat vs the feared head-gasket
job; the [Trust Agent](../swarm/trust-agent.md) prevents jumping to head-gasket when a
₹0 oil-level check or a cheap coolant top-up explains the heat.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
