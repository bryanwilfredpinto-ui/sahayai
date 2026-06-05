🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Cost & Quote-Verification Domain

Turns a diagnosis into honest money: a **fair price band** (parts-only and
parts+labour), and the anti-overcharge guard that arms a rider against a
suspicious quote — **without ever accusing a named mechanic**. Covers Activa,
Splendor, Pulsar, RE, Ather and Ola.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5,
PRD F5 Cost Estimator). Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2.
Pairs with [scam-shield.md](./scam-shield.md).

---

## 1. Domain principles
- **Always a band, never one "correct" price.** Indian prices vary by city,
  genuine-vs-aftermarket part, and labour rate. A single number is a lie; a band
  with a city caveat is honest.
- **Split parts vs labour** so the rider can negotiate each. Many overcharges hide
  in inflated labour, not parts.
- **Genuine vs aftermarket vs OEM-equivalent** matters — a genuine Honda Activa
  part costs more than a local equivalent; Chitti states the choice, not a verdict.
- **Cost accuracy target ±10%** (SUCCESS_METRICS) — bands are calibrated to that and
  widened with a caveat when data is thin.
- **Defamation red line:** Chitti judges the **quote vs the band**, never the person.
  It never says "this mechanic is cheating you" — it gives the rider the band and the
  questions to ask ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md)).

## 2. Common cost patterns (Indian fleet, indicative bands)
*Indicative ranges — the live cost service refines by city/model; never printed as exact.*
| Job | Typical fleet | Indicative parts+labour band |
|---|---|---|
| Engine-oil change | Splendor/Activa | ₹350–600 |
| Spark plug replace | Splendor/Pulsar | ₹120–350 |
| Battery replace (lead-acid) | Activa/Pulsar | ₹1,300–2,700 |
| Brake pads (disc) | Pulsar/RE | ₹500–1,400 |
| Chain + sprocket set | Splendor/Pulsar/RE | ₹1,200–3,500 |
| CVT belt | Activa | ₹600–1,500 |
| Tyre (single) | varies by size | ₹1,000–3,500 |
| Reg-rec / stator | Pulsar/RE | ₹600–2,500 |
| EV service (periodic) | Ather/Ola | model-specific — route to authorised |

## 3. Quote → verdict mapping
- Take the **quoted item + amount + bike model + (optional) city** → compare to the
  fair band:
  - ✅ **within band** — fair; proceed.
  - ⚠️ **above band** — ask: genuine or aftermarket? labour breakup? second quote?
  - 🚩 **well above band** — strongly suggest a second quote / buying the part
    separately; still never name-and-accuse.
- If the **underlying work may not be needed** (shaky diagnosis), flag that first —
  the cheapest fix is the repair you don't make.

## 4. Confidence-band output (always)
- The cost band itself carries a **confidence + city caveat** (e.g., *"₹350–600,
  Medium confidence; metro labour can run higher"*).
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md), Chitti widens
  the band rather than fake a precise figure when model/city data is missing.

## 5. DIY safety-tier output (always)
- Cost pairs with the DIY tier so the rider sees the **savings**: 🟢 jobs (oil, air
  filter, chain lube, terminal clean) save labour entirely; 🟠/🔴 jobs justify
  paying a mechanic.
- Never lower a 🔴 safety job to "do it cheap at home" — savings never override
  [safety.md](./safety.md) / the [Safety Agent](../swarm/safety-agent.md).

## 6. Swarm agents this skill feeds
Primary owner of the [Cost Agent](../swarm/cost-agent.md) — it bands every diagnosis
and feeds [scam-shield.md](./scam-shield.md). Constrained by the
[Safety Agent](../swarm/safety-agent.md) (never cheap-out a safety repair) and the
[DIY Agent](../swarm/diy-agent.md) (savings only on safe DIY tiers). The
[Trust Agent](../swarm/trust-agent.md) blocks both over-claiming a "scam" and
under-pricing a needed repair into neglect.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
