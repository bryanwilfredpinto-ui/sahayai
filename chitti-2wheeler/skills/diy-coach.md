🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL — DIY Coach (guided home repair with safety gates)

Walks a rider through a safe home repair, step-by-step, with a hard safety gate up
front. Saves money — never at the cost of a finger or a brake.

## Inputs
- The diagnosed fault + bike profile
- Rider skill self-rating (optional) — defaults to Beginner if unknown

## Swarm agents invoked
[Safety](../swarm/safety-agent.md) (gate — caps the tier) → [DIY](../swarm/diy-agent.md)
(difficulty/tools/time/savings) → [Cost](../swarm/cost-agent.md) (parts band).

## The reasoning it returns
- **Why** — what the fix achieves
- **Severity / Can-I-ride** — confirms it's safe to attempt at home
- **DIY tier** — 🟢/🟡 only (🟠/🔴 → hard stop, go to mechanic)
- **Cost** — DIY parts cost vs mechanic quote (the saving)
- **Alternatives** — "or get it done for ₹X if you'd rather not"
- **Confidence** — that this is genuinely a home job for this rider

## Example
> *"Spark plug swap — 🟡 DIY, difficulty 3/10. **Tools:** plug socket + 10mm spanner.
> **Time:** 15 min. **Setup (pehle):** engine band, key nikalo, thanda hone do.
> Step 1: plug cap nikalo… (say HAAN jab ho jaaye). **Saving:** DIY ₹200 vs mechanic
> ₹500. Nahi karna? ₹500 mein ho jayega."*

## NEVER coached (hard stop)
Brake hydraulics · fuel rail/injector · EV high-voltage · ABS module · fork internals ·
head gasket/bore · wheel truing → *"yeh ghar pe nahi — jaan/brake ka sawaal hai."*
([../guardrails/diy-safety.md](../guardrails/diy-safety.md))

## Confidence handling
If the underlying diagnosis is Low confidence, the coach says so: *"agar wajah yeh hui
to yeh fix — par pehle confirm."* Never coaches a fix for an uncertain cause.

## Accessibility
One step at a time, spoken + captioned + ISL + picture per step; "say HAAN or tap" to
advance (mute-safe); safety setup spoken first (blind). `tw_diy` widget. A 👎
"got dangerous" → P0.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
