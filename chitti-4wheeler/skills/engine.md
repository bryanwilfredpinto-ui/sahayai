🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Engine Domain

The petrol/diesel/EV-drivetrain brain of Chitti Car Doctor. Owns combustion,
misfire, knock, overheat-as-engine-cause, oil/compression and the diesel
after-treatment chain (DPF/EGR/turbo). Grounded on
[MECHANIC_KNOWLEDGE.md](MECHANIC_KNOWLEDGE.md); orchestrated by the core reasoner
[symptom-diagnosis.md](symptom-diagnosis.md). Aligns with COSDF L4 F0/F1/F4 and
the platform locks in [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

## Domain principles
- **Air + fuel + spark + compression, in time** — every engine fault is one of
  these four missing or mistimed. Diagnose in cost order: cheapest check first.
- **Cranks-but-no-start ≠ no-crank.** Crank-no-start = fuel/spark/timing (engine
  domain). No-crank = battery/starter ([electrical.md](electrical.md)) — hand off,
  don't guess.
- **Diesel is a different animal.** Glow plugs (cold-start), DPF regen, EGR soot,
  turbo, common-rail injectors, fuel-water contamination. India's diesel Cretas /
  Nexons / Harriers live and die on DPF + injector health.
- A **flashing** check-engine light = active misfire dumping raw fuel into the
  catalyst → **stop driving** (P0 guardrail, [../guardrails/safety-rules.md](../guardrails/safety-rules.md)).

## Common failure patterns (Indian cars)
| Pattern | Typical on | Tell-tale | Cause band |
|---|---|---|---|
| Cold-start rough idle, settles warm | Swift / Baleno (K-series) | shake first 30s, MIL off | dirty injectors / IAC / coil |
| Misfire under load, MIL flashing | Creta / Venue 1.5 petrol | jerk on accel, P0300–P0304 | coil pack / plug / injector |
| Diesel power loss + black smoke | Nexon / Harrier diesel | sluggish, DPF light | clogged DPF / EGR / boost leak |
| Overheat then power cut | Baleno / i20 | temp gauge red | coolant loss → see [cooling.md](cooling.md) |
| Knock on acceleration | older petrol on low-octane | pinging metallic | carbon / timing / bad fuel |
| EV "reduced power" turtle | Nexon EV / Tiago EV | dash turtle icon | thermal de-rate / cell imbalance (HV — Professional only) |

## Symptom → cause mapping
- *Crank, no start, fuel-pump prime heard* → spark/timing > fuel. Possible/Medium.
- *Crank, no start, no prime hum* → fuel pump / relay / immobiliser. Likely/Medium.
- *Misfire code + single cylinder* → coil/plug/injector on that cylinder. Likely/High.
- *Diesel won't start cold, white smoke* → glow plugs / low compression. Possible/Medium.
- *Power loss + DPF light, no smoke* → DPF saturation, needs regen drive. Likely/High.
- *Milky oil cap / sweet white smoke* → head gasket / coolant intrusion → **Safety/HIGH**.

## Outputs this skill must emit
- **Confidence band** — `Likely/Possible × High/Medium/Low` (never bare verdict;
  [../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- **DIY-safety tier** — 🟢 (air filter, plug check) / 🟡 (sensor clean) / 🟠 (coil/
  injector — mechanic) / 🔴 (timing belt, head gasket, EV HV — Professional only).
- **Can-I-drive** — flashing-MIL / overheat / oil-pressure-light → Safety forces 🔴.
- **Cost band** — parts-only + parts+labour ₹ range, feeds Scam Shield.

## Swarm agents fed
Primary input to [Engine Agent](../swarm/engine-agent.md); hands no-crank cases to
[Electrical](../swarm/electrical-agent.md) and fuelling to [Fuel](../swarm/fuel-agent.md);
all verdicts gated by the supreme [Safety Agent](../swarm/safety-agent.md), capped by
[Trust](../swarm/trust-agent.md). DIY feasibility via [DIY](../swarm/diy-agent.md).

## Roadmap (honest stubs — COSDF §3)
- AI camera detection of oil-leak colour/location and smoke colour from video = roadmap
  (vision model, funding-gated §8). Deterministic smoke-colour guide is LIVE.
- ML misfire-from-vibration (phone accelerometer) = roadmap; OBD2 P-code read is LIVE.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
