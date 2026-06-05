🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Electrical Domain

Battery, charging, starting, lighting and — for EVs — the high-voltage power-train.
The "won't start, lights dim, fuse blown, battery dead" specialist for Chitti
Bike Doctor across Activa, Splendor, Pulsar, RE, Ather and Ola.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5).
Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.

---

## 1. Domain principles
- The 12 V system on an ICE bike has three jobs: **store** (battery), **charge**
  (magneto/stator → rectifier-regulator), **consume** (lights, horn, self-start,
  FI/ECU). A fault sits in store, charge, or a wire/fuse between them.
- **Battery voltage is the first free number.** Resting (engine off):
  **≥12.4 V healthy · 11.5–12.4 V low → jump/charge · <11.5 V replace.**
  Charging (engine ~3–4k rpm): ~13.5–14.5 V good; <12.5 V means reg-rec/stator
  not charging; >15 V means over-charging reg-rec fault (boils battery).
- **EV is a different world (LOCKED safety line):** Ather / Ola carry a **48–60 V+
  Lithium pack** — orange HV cabling, BMS, motor controller. **NEVER instruct a
  user to open, probe, or DIY anything HV.** The [Safety Agent](../swarm/safety-agent.md)
  hard-vetoes HV DIY. EV electrical = diagnose symptoms (range drop, no-go, BMS
  fault code, charger handshake), then route to authorised service.

## 2. Common failure patterns (Indian fleet specifics)
| Pattern | Typical bikes | Tell-tale |
|---|---|---|
| Self-start clicks, lights dim, won't crank | Activa, Pulsar, RE | classic **discharged/dead battery** — High confidence |
| Cranks fine on kick but self dead | Splendor, Activa | starter relay / starter motor / button — battery OK |
| Battery keeps dying overnight | any | parasitic drain, reg-rec leak, or aged battery (>3 yr) |
| Battery boiling / frequent top-up | Pulsar, RE | over-charging reg-rec (>15 V) |
| Headlight/horn weak only at idle, fine when revved | Splendor, older | weak charging / loose earth — magneto side |
| Blown fuse repeatedly | any FI bike | shorted wire / accessory (illegal HID, USB charger) |
| MIL + no-start (FI) | Activa 6G, Pulsar BS6 | ECU/sensor — bridge to [obd.md](./obd.md) |
| Range collapse, "limp" / turtle mode | Ather, Ola | **EV** — BMS/cell-balance/controller; authorised service only |
| EV won't charge / charger not detected | Ather, Ola | charger handshake / port / BMS — never DIY HV |

## 3. Symptom → cause mapping (electrical slice)
- **No crank, slow crank, dim lights** → battery first (measure resting V) →
  terminals (loose/corroded, free fix) → starter relay → starter motor.
- **Dies after a few km, lights flicker** → charging fault (reg-rec / stator) —
  battery is draining because it isn't being topped up.
- **Repeated dead battery** → parasitic drain (clock/alarm/accessory) or
  end-of-life battery; check age (lead-acid ~2.5–4 yr typical in Indian heat).
- **EV no-go / range loss / charge fault** → BMS or controller code; capture the
  fault, **do not open the pack**, route to service.

## 4. Confidence-band output (always)
- Likelihood Likely/Possible + Confidence High/Med/Low, per
  [never-claim-certainty](../guardrails/never-claim-certainty.md).
- Battery verdicts are usually **High** when self-slow + dim-lights + age agree.
- A measured voltage raises confidence; "phone-only, no meter" lowers it →
  recommend a multimeter check or shop test.
- Disagreement floor applies (top-two within ~15 pts → recommend inspection).

## 5. DIY safety-tier output (always)
- 🟢 **DIY-easy** — clean/tighten battery terminals, check fuse, re-seat
  connectors, jump-start (ICE). Free–₹50.
- 🟡 **DIY-careful** — battery swap (lead-acid, ICE), fuse replace (correct amp
  only — never foil/wire bypass). ₹1,300–2,700 part band for a 2-wheeler battery.
- 🟠 **Mechanic-preferred** — reg-rec / stator diagnosis, parasitic-drain hunt.
- 🔴 **DO NOT DIY (Safety veto)** — **any EV HV work** (Ather/Ola pack, orange
  cabling, BMS, controller, charger internals). [Safety Agent](../swarm/safety-agent.md)
  forces "authorised service only".

## 6. Swarm agents this skill feeds
Primary owner of the [Electrical Agent](../swarm/electrical-agent.md) — it claims
**no-crank/charging/EV-HV** away from [Engine](../swarm/engine-agent.md). The
[Safety Agent](../swarm/safety-agent.md) (supreme) hard-vetoes HV DIY;
[Cost](../swarm/cost-agent.md) bands battery/reg-rec; the
[Trust Agent](../swarm/trust-agent.md) blocks over-claiming an expensive "stator
failure" when a ₹0 terminal-clean would have fixed it.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
