🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SWARM — the 8-agent diagnostic vote (THE CQOS gate)

Before any diagnosis reaches the rider, the **whole swarm runs**. The user sees the
**synthesized verdict** — a weighted likelihood, a confidence band, a DIY tier, a
cost band, a can-I-ride call — never one agent's raw guess. This is the Chitti
Quality Operating System (CQOS) gate for Chitti Bike Doctor.

> *"Battery 85% / Starter 10% / Fuel 5% → Battery likely discharged (High confidence)."*

## The panel
| Agent | Judges | Can it lower confidence? | Can it raise confidence? |
|---|---|---|---|
| [Symptom](symptom-agent.md) | what the problem actually is; narrows questions | ✅ | ✅ |
| [Engine](engine-agent.md) | misfire, knock, overheat, oil | ✅ | ✅ |
| [Electrical](electrical-agent.md) | battery, magneto, starter, fuse, reg-rec | ✅ | ✅ |
| [Fuel](fuel-agent.md) | reserve, filter, injector, carb, contamination | ✅ | ✅ |
| [Safety](safety-agent.md) — **supreme** | can the rider ride? brakes/tyres/steering/fork/chain | ✅ | ✅ |
| [DIY](diy-agent.md) | can the rider fix this at home, safely? | ✅ | ✅ |
| [Cost](cost-agent.md) | expected repair band (₹) — feeds Scam Shield | ✅ | ✅ |
| [Trust](trust-agent.md) | over-diagnosis / hallucination guard | ✅ **only lowers** | ❌ never raises |

## Execution
One DeepSeek round-trip returns a strict JSON object: each agent's `{candidate,
weight, why, confidence}`, the Safety verdict, the DIY tier, the cost band, and a
Trust note. The frontend renders the synthesized verdict + an expandable per-agent
breakdown. Grounded on [../skills/MECHANIC_KNOWLEDGE.md](../skills/MECHANIC_KNOWLEDGE.md).

## Weighted vote
- Each fault-agent (Engine/Electrical/Fuel) emits weighted candidate faults that
  sum to ~100% across the swarm. Example: *won't start, self-start cranks slow,
  headlight dim* → `Battery 85 / Starter 10 / Fuel 5` → **Battery, High confidence.**
- **Disagreement floor** — if the top two candidates are within ~15 points OR the
  combined top weight is < 50%, the verdict downgrades to *"diagnosis confidence
  low — recommend inspection"* instead of guessing. Chitti never bluffs a rider.

## Voting rules (non-negotiable)
- **Safety is supreme** — the Safety Agent can override the *display order*: any
  brake/tyre/steering/fork/chain red line forces **DO NOT RIDE** to the top, no
  matter how cheap or "likely" the fault is. Safety accuracy must be **100%**;
  critical safety errors = **0** ([../evals/safety_eval.md](../evals/safety_eval.md)).
- **Trust can only lower** — the [Trust Agent](trust-agent.md) prevents
  over-diagnosis and overconfidence; it can cap confidence or force "recommend
  inspection", but it can **never** raise a score to look more useful.
- **DIY never beats safety** — the DIY Agent may not propose a home fix the Safety
  Agent flagged (brake hydraulics, EV HV battery, fork internals → Professional).
- **Confidence band, always** — every verdict ships Likely/Possible + High/Medium/Low
  ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
  Chitti never says "your engine is destroyed" unless evidence supports it.

## The Mechanic Verification Loop closes it
After a real repair, the rider tells Chitti *what the mechanic actually fixed*. That
ground truth re-weights the swarm over time — predicted-vs-actual raises or lowers
the quality score and feeds Swarm Intelligence ([§2f](../../SAHAYAI_MASTER.md)). See
[../observability/mechanic_verification_loop.md](../observability/mechanic_verification_loop.md).

## Swarm learning ([§2f](../../SAHAYAI_MASTER.md))
High-confidence patterns confirmed by ≥100 real mechanic outcomes are anonymised →
validated → pushed to [../skills/](../skills/). HIGH-risk safety patterns get human
review first. Unsafe-DIY and "you're being cheated by X" are **never learnable**.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
