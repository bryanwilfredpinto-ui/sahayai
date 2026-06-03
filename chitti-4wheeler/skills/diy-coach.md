🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL — DIY Coach (guided home repair with safety gates)

Walks a driver through a safe home repair, step-by-step, with a hard safety gate up
front. Saves money — never at the cost of a finger, an airbag to the face, or a brake.

## Inputs
- The diagnosed fault + car profile
- Driver skill self-rating (optional) — defaults to Beginner if unknown

## Swarm agents invoked
[Safety](../swarm/safety-agent.md) (gate — caps the tier) → [DIY](../swarm/diy-agent.md)
(difficulty/tools/time/savings) → [Cost](../swarm/cost-agent.md) (parts band).

## The reasoning it returns
- **Why** — what the fix achieves
- **Severity / Can-I-drive** — confirms it's safe to attempt at home
- **DIY tier** — 🟢/🟡 only (🟠/🔴 → hard stop, go to mechanic)
- **Cost** — DIY parts cost vs mechanic quote (the saving)
- **Alternatives** — "or get it done for ₹X if you'd rather not"
- **Confidence** — that this is genuinely a home job for this driver

## Example
> *"AC cabin filter swap — 🟢 DIY, difficulty 2/10. **Tools:** haath se / screwdriver.
> **Time:** 20 min. **Setup (pehle):** engine band, key nikalo. Step 1: glovebox ke
> peeche filter cover kholo… (say HAAN jab ho jaaye). **Saving:** DIY ₹400 vs
> service-centre ₹1 200. Nahi karna? ₹1 200 mein ho jayega."*

## NEVER coached (hard stop)
Airbag/SRS · ABS hydraulics · brake lines/bleed · fuel injector rail · timing belt
(interference) · EV high-voltage / orange cables · AC refrigerant · suspension
strut/spring · steering rack · head gasket/bore → *"yeh ghar pe nahi — jaan/brake/airbag
ka sawaal hai."* ([../guardrails/diy-safety.md](../guardrails/diy-safety.md))

## Confidence handling
If the underlying diagnosis is Low confidence, the coach says so: *"agar wajah yeh hui
to yeh fix — par pehle confirm."* Never coaches a fix for an uncertain cause.

## Accessibility
One step at a time, spoken + captioned + ISL + picture per step; "say HAAN or tap" to
advance (mute-safe); safety setup spoken first (blind). `fw_diy` widget. A 👎 "got
dangerous" → P0.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
