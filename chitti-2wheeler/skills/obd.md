🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — OBD & Diagnostic-Code Domain

Reads the bike's electronic brain: fault codes (DTCs), live sensor data and the
dashboard MIL. Covers BS6 fuel-injected ICE bikes (Activa 6G, Splendor BS6,
Pulsar BS6, RE BS6) and EV fault codes (Ather/Ola), via the deterministic snapshot
interpreter and the Web-Bluetooth ELM327 path.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5,
PRD F3 OBD2 + F2 Dashboard). Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles (and the honest-stub line)
- **Two live paths exist today (deterministic, LIVE — not faked):**
  1. **Manual / snapshot interpreter** — rider types or taps a code (or live
     values: volts, RPM, coolant °C). `POST /api/2w/obd/snapshot` decodes each DTC
     from a local library and flags live params vs red-lines.
  2. **Web-Bluetooth ELM327** — on supported devices, a paired ELM327 dongle streams
     live RPM / coolant / voltage / DTCs (PRD F3, motorcycle modes).
- **Camera AUTO-DETECT of a dashboard light is roadmap / COMING SOON** (needs a
  vision provider). Sending `{image:true}` returns an honest `mode:"pick_or_describe"`
  (HTTP 200) — **never a fabricated reading** (§3 honest-stubs).
- **Dashboard-code interpretation targets 100% accuracy** because it is a database
  lookup, not a guess (SUCCESS_METRICS). The code's *meaning* is exact; the *root
  cause* still carries a confidence band.
- Note: 2-wheeler DTCs are **not fully standardised** like car OBD2 — many use
  manufacturer-specific codes / blink-patterns. Chitti states when a code is
  generic (e.g., P0XXX style) vs manufacturer-specific and avoids over-precision.

## 2. Common failure patterns (Indian fleet specifics)
| Code/Signal class | Typical bikes | Plain meaning |
|---|---|---|
| MIL steady on, runs OK-ish | Activa 6G, Pulsar BS6 | a sensor/emissions fault logged — get scanned |
| **MIL flashing** | BS6 ICE | misfire risking catalyst — **urgent**, ride gently → service |
| O2 / fuel-trim related | FI bikes | mixture off — air filter, injector, sensor |
| Throttle-position / idle-air | Activa 6G, Pulsar | rough idle, stalling at lights |
| Coolant-temp sensor | liquid-cooled Pulsar | false overheat reading or fan logic |
| Low battery voltage (live <11.8 V) | any FI | charging/battery → [electrical.md](./electrical.md) |
| EV BMS / motor-controller fault | Ather, Ola | range/no-go/charge fault — authorised service, no HV DIY |

## 3. Symptom → cause mapping (OBD slice)
- **MIL on** → pull the code (snapshot or ELM327) → decode meaning → map to the
  owning domain (fuel→[engine.md](./engine.md), charging→[electrical.md](./electrical.md),
  emissions→[exhaust.md](./exhaust.md), thermal→[cooling.md](./cooling.md)).
- **MIL flashing** → treat as urgent (catalyst protection); advise gentle riding to
  service.
- **Live volts < 11.8 V at idle** → charging/battery fault → [electrical.md](./electrical.md).
- **No code but symptom present** → fall back to No-OBD probabilistic diagnosis
  ([symptom-diagnosis.md](./symptom-diagnosis.md) + swarm).
- **EV fault code** → capture, explain in plain language, route to service (no HV DIY).

## 4. Confidence-band output (always)
- **Code meaning:** stated as exact (database) — *"P0XXX = catalyst efficiency"*.
- **Root cause behind the code:** carries the usual Likely/Possible + High/Med/Low,
  because one code can have several causes.
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md), Chitti never
  turns a single code into a guaranteed expensive repair; it lists causes by likelihood.

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — read/clear a stored code (where allowed), note live values,
  basic resets (air filter, loose connector) for simple codes.
- 🟡 **DIY-careful** — sensor connector re-seat, ELM327 pairing and live monitoring.
- 🟠 **Mechanic-preferred** — sensor replacement, fuelling recalibration.
- 🔴 **DO NOT DIY** — clearing a code to **hide** a safety/emissions fault, EV BMS/
  controller work. [Safety Agent](../swarm/safety-agent.md) forbids masking a real
  fault and any HV DIY.

## 6. Swarm agents this skill feeds
OBD is an **evidence source for every agent** — a decoded code raises or lowers the
weights of [Engine](../swarm/engine-agent.md), [Electrical](../swarm/electrical-agent.md)
and [Fuel](../swarm/fuel-agent.md). The [Safety Agent](../swarm/safety-agent.md)
escalates flashing-MIL and HV fault codes; [Cost](../swarm/cost-agent.md) bands the
indicated repair; the [Trust Agent](../swarm/trust-agent.md) prevents over-reading a
single generic code as a definitive expensive fix.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
