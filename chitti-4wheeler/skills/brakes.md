🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Brakes Domain (SAFETY-CRITICAL)

The highest-stakes domain. COSDF L3 sets **brake accuracy >95%** and
**missed-safety-warning = 0%**. Owns pads, rotors/discs, calipers, fluid (DOT 3/4),
hydraulics, ABS, brake-by-wire and EV regenerative braking. The [Safety
Agent](../swarm/safety-agent.md) can VETO anything here. SOP-002.

## Domain principles
- **Metal-on-metal → STOP DRIVING.** A continuous harsh grind while braking means
  pads are gone and rotors are being destroyed. This is a 🔴 do-not-drive call,
  spoken first ([../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md)).
- **Never DIY brake hydraulics untrained.** Bleeding, caliper, master cylinder, ABS
  module = 🔴 Professional. Air in the line = no brakes. P0 guardrail.
- **Soft/sinking pedal = hydraulic, not pad.** Air, fluid leak, or failing master
  cylinder. Treat as emergency-adjacent.
- **When the noise happens tells you the cause** (SOP-002): braking-only = pads ·
  constant = bearing/debris · turning = suspension/CV ([tyres.md](tyres.md) overlaps).

## Common failure patterns (Indian cars)
| Pattern | Typical on | Tell-tale | Severity |
|---|---|---|---|
| Squeal on light braking | Swift / i20 / Baleno | high-pitch when pads warm | 🟡 wear indicator — pads soon |
| Harsh grind while braking | any neglected car | metal scrape, vibration | 🔴 metal-on-metal — STOP |
| Steering-wheel shudder on braking | Creta / Verna at highway speed | wobble at 80+ km/h | 🟠 warped rotor |
| Soft/spongy pedal, sinks to floor | any | pedal goes low | 🔴 air/leak/master cyl — DO NOT DRIVE |
| Brake warning + ABS light | Nexon / Venue | dash lights, pedal pulse | 🔴 hydraulic / ABS fault |
| EV regen feels weak / car coasts | Nexon EV / Tiago EV | less engine-braking | 🟠 regen de-rate (cold/full battery often normal) |

## Symptom → cause mapping
- *Squeal only when braking, light* → pad wear indicator. Likely/High. 🟡.
- *Grind + vibration when braking* → pads gone, rotor damage. Likely/High. 🔴 STOP.
- *Shudder through wheel at speed when braking* → warped rotor / uneven pad. Likely/Medium. 🟠.
- *Pedal soft / sinking* → hydraulic (air/leak/master). Likely/High. 🔴 DO NOT DRIVE.
- *Pulls to one side braking* → seized caliper / uneven pad. Possible/Medium. 🟠.
- *Handbrake won't hold / EV creep* → cable / EPB fault. Possible/Low.

## Outputs this skill must emit
- **Can-I-drive FIRST** — any grind, soft pedal, brake/ABS warning = 🔴 spoken before
  anything else. This is the one domain where severity always leads.
- **Confidence band** — `Likely/Possible × High/Medium/Low`.
- **DIY-safety tier** — 🟡 (visual pad/rotor inspection only) /
  🟠 (pad replacement — for the skilled) / 🔴 (ALL hydraulics, ABS, fluid, caliper,
  master cylinder — Professional only, never DIY).
- **Cost band** — pads ₹1,500–4,000/axle · discs ₹2,500–6,000 · caliper ₹3,000–8,000.

## Swarm agents fed
Feeds the supreme [Safety Agent](../swarm/safety-agent.md) — **this domain's verdict
can force DO-NOT-DRIVE to the top of the display regardless of cost/likelihood**.
[DIY Agent](../swarm/diy-agent.md) is forbidden from proposing any hydraulic/ABS home
fix Safety flagged. [Trust](../swarm/trust-agent.md) never raises; [Cost](../swarm/cost-agent.md)
feeds Scam Shield (brakes are a common overcharge target).

## Roadmap (honest stubs — COSDF §3)
- AI pad-thickness estimate from a wheel photo = roadmap (vision). Deterministic
  pad-wear-by-symptom + visual-checklist is LIVE.
- Brake-grind sound auto-classify = roadmap; sound-picker (grind/squeal/scrape) is LIVE.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
