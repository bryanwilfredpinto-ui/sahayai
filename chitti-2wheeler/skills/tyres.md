🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Tyres & Wheels Domain

Grip, pressure, tread, age and the wheel/bearing assembly — the rubber that keeps
a rider alive. A safety-class domain (under Safety Agent oversight) covering
Activa, Splendor, Pulsar, RE, Ather and Ola.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5).
Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles
- A tyre fails on **tread, pressure, age, or damage**. Any one can be fatal at
  speed, so tyre verdicts lean conservative like brakes.
- **Pressure** is the cheapest safety win in India — most riders run under-inflated.
  Typical 2-wheeler: ~25–30 PSI front, ~28–34 PSI rear (always confirm the bike's
  own sticker; scooters like Activa and heavy bikes like RE differ). Cold reading.
- **Tread depth / Tyre Wear Indicator (TWI):** the small raised bars in the
  grooves. When tread is flush with the TWI, the tyre is **legally and practically
  finished** — replace, especially before monsoon.
- **Age:** rubber hardens and cracks with years even at low km. A 5+ year old tyre
  with sidewall cracks is unsafe regardless of tread (check the DOT week/year code).
- **Tubeless vs tube:** most modern Activa/Pulsar/Ather run tubeless (slow leak,
  pluggable); older Splendor often tube-type (sudden deflation risk).

## 2. Common failure patterns (Indian fleet specifics)
| Pattern | Typical bikes | Tell-tale |
|---|---|---|
| Frequent slow puncture | tubeless Activa/Pulsar | nail/valve leak — pluggable |
| Sudden flat | tube-type Splendor | tube burst — push, don't ride |
| Cupping / uneven front wear | Pulsar, RE | low pressure, fork/alignment, worn bearing |
| Centre-strip bald, edges OK | highway RE/Pulsar | over-inflation or straight-line wear |
| Edges worn, centre OK | city Activa | under-inflation |
| Cracked sidewall, low km | parked/old bike | **age** — replace even if tread looks OK |
| Vibration/wobble at speed | any | imbalance, bent rim, or **wheel bearing** |
| Constant hum/growl (not braking) | high-odo | **wheel bearing** — not a brake noise |

## 3. Symptom → cause mapping (tyre/wheel slice)
- **Pulls to one side** → uneven pressure, alignment, or one worn tyre.
- **Vibration at speed** → imbalance / bent rim / bearing → escalate bearing to
  inspection (a failed bearing can seize a wheel).
- **Constant growl that does NOT change with braking** → wheel bearing, **not**
  brakes (cross-check [brakes.md](./brakes.md) which owns brake-only noise).
- **Won't hold air** → puncture (plug if tubeless) or valve; tube-type = replace tube.
- **Sidewall crack / 5+ yr old** → age-out, replace.

## 4. Confidence-band output (always)
- Likelihood + Confidence band as always. Pressure/tread verdicts from a clear
  photo or a stated PSI reading are **High**; "feels wobbly" with no detail is
  **Low** → recommend a physical check.
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md), never clear a
  tyre as "safe" on a blurry image — say "looks worn, get it checked".

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — check/correct pressure at any petrol pump, visual tread/TWI
  check, read DOT date, plug a tubeless puncture with a kit. Free–₹100.
- 🟡 **DIY-careful** — tubeless plug on the road (temporary, go slow to a shop),
  valve-cap and bead inspection.
- 🟠 **Mechanic-preferred** — tyre replacement, wheel balancing, tube replacement.
- 🔴 **DO NOT DIY / DO NOT RIDE** — riding on a tyre flush with TWI, a blowout, a
  failing wheel bearing, or a damaged sidewall. [Safety Agent](../swarm/safety-agent.md)
  can force DO NOT RIDE here.

## 6. Swarm agents this skill feeds
Feeds the [Safety Agent](../swarm/safety-agent.md) (tyre/wheel red lines) and the
synthesis. Wheel-bearing growl is arbitrated against [brakes.md](./brakes.md) so noise
is attributed correctly. [Cost](../swarm/cost-agent.md) bands tyre/bearing prices
(feeds [scam-shield.md](./scam-shield.md) against "both tyres + balancing" upsells);
the [Trust Agent](../swarm/trust-agent.md) blocks a needless "replace both tyres"
when only the rear is worn.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
