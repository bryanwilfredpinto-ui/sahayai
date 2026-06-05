🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Electrical Domain

The 12V (and HV-EV) brain. Owns battery, alternator, starter, fuses, earthing,
ECU/BCM, ABS/SRS codes, lighting, and the wiring/earth gremlins that mimic every
other fault. The single biggest source of "won't start" calls in India. Grounded
on [MECHANIC_KNOWLEDGE.md](MECHANIC_KNOWLEDGE.md); aligns with COSDF F2/F3/F4.

## Domain principles
- **Battery first, always.** A weak 12V battery fakes a dozen faults — slow crank,
  dim dash, flickering lights, random ECU resets, EV "12V system fault."
- **Voltage gates (key off, engine off):** >12.4V good · 11.5–12.4V low (try jump) ·
  <11.5V replace. Charging (engine on): 13.8–14.8V healthy · <13V alternator weak ·
  >15V regulator fault. (SOP-001, [../sop/breakdown-roadside.md](../sop/breakdown-roadside.md).)
- **Earthing is invisible.** Corroded earth strap = symptoms that move around. Check
  terminals + earth before condemning any module.
- **EV HV is untouchable** — orange cables, the HV battery, BMS, motor inverter are
  **🔴 Professional only**, never DIY ([../guardrails/safety-rules.md](../guardrails/safety-rules.md), P0).

## Common failure patterns (Indian cars)
| Pattern | Typical on | Tell-tale | Cause band |
|---|---|---|---|
| Slow crank + dim dash, 3–4 yr battery | Swift / Dzire / WagonR | self slow, AC blower weak | flat/aged battery |
| Battery light on while driving | Creta / Venue / i20 | charge warning, lights dim at idle | alternator / belt |
| Click-click, no crank, lights fine | Baleno / Nexon | rapid clicking | starter solenoid / motor |
| Random no-start, fine next morning | many | intermittent, no pattern | loose terminal / earth / immobiliser |
| EV won't power on, 12V dead | Nexon EV / Tiago EV | no dash, 12V flat | aux 12V battery (DIY-able) NOT HV |
| Blown fuse repeats | any | one circuit dead, fuse pops again | short — needs tracing, 🟠 |

## Symptom → cause mapping
- *Slow crank + dim everything + old battery* → battery. Likely/High.
- *Crank fine but battery light + dimming at idle* → alternator/belt. Likely/High.
- *Single loud click, lights stay bright* → starter solenoid. Likely/Medium.
- *Symptoms wander, intermittent* → loose terminal / earth / immobiliser. Possible/Low.
- *One circuit dead, fuse keeps blowing* → short circuit. Possible/Medium → 🟠 trace.
- *EV dash dead but car charged* → 12V aux battery, not HV. Likely/Medium.

## Outputs this skill must emit
- **Confidence band** — `Likely/Possible × High/Medium/Low`.
- **DIY-safety tier** — 🟢 (terminal clean/tighten, jump-start, swap a fuse, 12V aux) /
  🟡 (test voltage with a meter) / 🟠 (alternator, starter, short tracing) /
  🔴 (any HV-EV orange-cable work — never DIY).
- **Can-I-drive** — battery light alone = limp home soon; ABS/SRS lit = Safety call.
- **Cost band** — battery ₹4,500–7,500 · alternator ₹6,000–14,000 · starter ₹4,000–9,000.

## Swarm agents fed
Primary input to [Electrical Agent](../swarm/electrical-agent.md); receives no-crank
hand-offs from [Engine](../swarm/engine-agent.md); ABS/SRS/airbag codes escalate to the
supreme [Safety Agent](../swarm/safety-agent.md); confidence capped by [Trust](../swarm/trust-agent.md);
home-fix feasibility via [DIY](../swarm/diy-agent.md); cost via [Cost](../swarm/cost-agent.md).

## Roadmap (honest stubs — COSDF §3)
- Live battery-voltage + alternator-output read via OBD2 Web-Bluetooth = LIVE on
  supported devices. Continuous battery-health ML prediction ("6 months left") = roadmap.
- AI photo-read of corroded terminals / blown fuse = roadmap (vision); pick-the-light
  and terminal-checklist flows are LIVE.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
