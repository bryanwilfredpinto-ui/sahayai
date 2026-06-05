🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Transmission & Drivetrain Domain

Owns the clutch, gearbox (manual / AMT / torque-converter AT / CVT / DCT), gear
fluid, and the EV single-speed reducer. India's gearbox mix is wide — manual Swifts,
AMT Magnitos/Altos, CVT Hyryders, DCT Vernas, e-motor Nexon EVs — and each fails
differently. Aligns with COSDF F0/F1/F4.

## Domain principles
- **Match the diagnosis to the gearbox type.** "Jerky shifts" is *normal-ish* on AMT,
  a *fault* on a torque-converter AT, and a *known DCT trait* when cold. Never apply a
  manual-clutch diagnosis to an automatic.
- **Slipping = revs rise, speed doesn't.** Worn clutch (manual) or low/burnt fluid +
  worn clutch packs (auto). A burnt smell + slip = act soon.
- **Fluid is the cheapest fix.** Many AT/CVT "faults" are overdue/wrong fluid. Check
  level/colour/smell before condemning a gearbox.
- **EV has no gearbox to slip** — a "jerk" on an EV is usually motor/inverter or
  regen calibration ([electrical.md](electrical.md)/HV — Professional), not clutch.

## Common failure patterns (Indian cars)
| Pattern | Typical on | Tell-tale | Cause band |
|---|---|---|---|
| Clutch slips, revs flare on accel | manual Swift / WagonR (city) | RPM up, speed lags, burnt smell | worn clutch plate |
| Hard/notchy shifting, grind into gear | older manuals | crunch into 1st/2nd/reverse | clutch not disengaging / synchro |
| Big lag then a thud on AMT shifts | Alto / Celerio / S-Presso AMT | head-nod between gears | normal AMT trait — reassure first |
| AT slips / flares / shudder | Creta AT, City CVT | delayed engagement, jerk | low/old fluid → then internal |
| DCT jerk/shudder at low speed | Verna / Seltos DCT | clutch judder crawling | DCT clutch heat / known trait |
| EV jerk / clunk on tip-in | Nexon EV / Tiago EV | sudden surge or knock | motor/inverter calibration (HV) |

## Symptom → cause mapping
- *Revs rise without speed, burnt smell (manual)* → worn clutch. Likely/High. 🟠.
- *Crunch into gear, clutch pedal feels off* → clutch hydraulics / cable / synchro. Possible/Medium.
- *AT delayed engagement + dirty/burnt fluid* → fluid first, then internal. Likely/Medium. 🟠.
- *AMT head-nod between shifts* → normal characteristic. Likely/High (reassure). 🟢.
- *DCT low-speed judder when cold* → known DCT trait, monitor. Possible/Medium.
- *EV surge/clunk* → motor/inverter (HV). Possible/Low. 🔴 Professional.

## Outputs this skill must emit
- **Confidence band** — `Likely/Possible × High/Medium/Low`, **plus the gearbox type**
  it assumed (so a wrong-gearbox diagnosis is caught).
- **DIY-safety tier** — 🟢 (check AT/CVT fluid level/colour where dipstick exists) /
  🟡 (note shift behaviour, drive log) / 🟠 (clutch replacement, fluid service —
  mechanic) / 🔴 (gearbox internals, DCT mechatronics, EV motor/inverter — Professional).
- **Cost band** — clutch kit ₹6,000–18,000 · AT/CVT fluid service ₹3,000–9,000 ·
  DCT clutch ₹25,000–60,000 (warranty-check first).

## Swarm agents fed
Feeds the [Engine Agent](../swarm/engine-agent.md) cluster (drivetrain sits beside it),
the supreme [Safety Agent](../swarm/safety-agent.md) (a clutch that won't disengage in
traffic is a hazard), [DIY](../swarm/diy-agent.md), and [Cost](../swarm/cost-agent.md) +
[Trust](../swarm/trust-agent.md) — gearbox is a high-overcharge area, so Trust caps a
"full gearbox replacement" verdict unless evidence is strong.

## Roadmap (honest stubs — COSDF §3)
- AI shift-quality scoring from phone-accelerometer / sound = roadmap. Deterministic
  symptom triage (by gearbox type) + AMT/DCT "this is normal" reassurance is LIVE.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
