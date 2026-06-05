🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Brakes Domain

The single most safety-critical skill. A bad brake call can kill a rider, so this
domain runs under the **Safety Agent's supreme veto** and targets **>95% / zero
critical-error** accuracy. Covers drum, disc, CBS and ABS across Activa, Splendor,
Pulsar, RE, Ather and Ola.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5,
SUCCESS_METRICS brakes >95%). Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles
- Brakes are **never** treated as "maybe later". Any brake red line forces
  **DO NOT RIDE** to the top of the verdict regardless of cost or convenience —
  the [Safety Agent](../swarm/safety-agent.md) overrides display order.
- Indian 2-wheeler brake systems: **drum** (Splendor rear, base Activa),
  **disc** (Pulsar front, RE, premium scooters), **CBS** (Combined Braking —
  mandatory <125cc since 2019: Activa 6G, Splendor), **ABS** (mandatory ≥125cc:
  Pulsar, RE, premium). EVs (Ather/Ola) add **regenerative braking** layered on
  a friction system.
- **Metal-on-metal grinding = STOP DRIVING.** Pads/shoes are gone; the rotor/drum
  is being destroyed and braking distance is unsafe. This is a hard line.

## 2. Common failure patterns (Indian fleet specifics)
| Pattern | Typical bikes | Tell-tale |
|---|---|---|
| Squeal when braking | Pulsar/RE disc | glazed/worn pads, dust, or new-pad bed-in |
| Grinding metal-on-metal | any worn disc/drum | **pads/shoes finished → DO NOT RIDE** |
| Spongy / soft lever, sinks | disc bikes | air in line, low/old DOT fluid, leak |
| Lever pulls to bar, no bite | Pulsar/RE | fluid loss / seal leak → **DO NOT RIDE** |
| Brake pulls/judder under braking | disc bikes | warped rotor or uneven pad |
| Rear drum locks / drags | Activa/Splendor | over-tight cable, seized cam, rusted shoe |
| ABS warning lamp on | Pulsar BS6, RE | ABS sensor/ring — friction brake still works, but get it checked |
| Regen feels weak / inconsistent | Ather, Ola | controller/BMS regen logic — friction brake still primary |

## 3. Symptom → cause mapping (brake slice)
- **Noise *only* when braking** → pads/shoes (wear or glaze).
- **Noise *constant* (not braking)** → wheel bearing or debris, not pads →
  cross-check [tyres.md](./tyres.md) bearing notes.
- **Noise *when turning*** → suspension / wheel side, not brake friction.
- **Soft/spongy lever** → hydraulic: air, old fluid, or a leak. A leak = **STOP**.
- **Grinding** → friction material gone = **STOP DRIVING** immediately.
- **ABS lamp** → sensor/ring fault; warn the rider ABS may not assist in a panic
  stop, but base braking remains — ride gently to service.

## 4. Confidence-band output (always)
- Likelihood + Confidence band as always, BUT brakes bias toward **caution**: if
  evidence is thin, the safe verdict ("get brakes inspected before riding") wins
  over a low-confidence "probably fine". Never tell a rider brakes are OK on a guess.
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md): a brake "all
  clear" requires strong, specific evidence; default is conservative.

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — rear-drum cable free-play adjust, clean brake dust, check fluid
  *level* through the sight glass (look, don't open).
- 🟡 **DIY-careful** — drum brake-shoe inspect, disc-pad visual check.
- 🟠 **Mechanic-preferred** — disc-pad replacement, fluid top-up with correct DOT.
- 🔴 **DO NOT DIY (hard Safety veto)** — **brake-line bleeding, hydraulic seal/
  master-cylinder, ABS module, riding with a known leak or metal-on-metal.**
  [Safety Agent](../swarm/safety-agent.md) forbids any "fix brakes while driving"
  or fluid-system work by an untrained rider.

## 6. Swarm agents this skill feeds
Feeds the [Safety Agent](../swarm/safety-agent.md) **first and supreme** — this is
its highest-priority domain; it can force DO NOT RIDE and veto every DIY proposal.
[Cost](../swarm/cost-agent.md) bands pads/fluid (feeds [scam-shield.md](./scam-shield.md)
against fake "full brake overhaul" quotes); the [Trust Agent](../swarm/trust-agent.md)
prevents both over-claim (needless overhaul) and the far worse under-claim
("you can ride") — for brakes, under-claiming is the cardinal sin.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
