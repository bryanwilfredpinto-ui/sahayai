🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SWARM — the 8-agent diagnostic vote (THE CQOS gate)

Before any diagnosis reaches the driver, the **whole swarm runs**. The user sees the
**synthesized verdict** — a weighted likelihood, a confidence band, a DIY tier, a
cost band, a can-I-drive call — never one agent's raw guess. This is the Chitti
Quality Operating System (CQOS) gate for Chitti Car Doctor.

> *"Alternator 70% / Battery 25% / Loose terminal 5% → Charging-system fault likely (High confidence)."*

## The panel
| Agent | Judges | Can it lower confidence? | Can it raise confidence? |
|---|---|---|---|
| [Symptom](symptom-agent.md) | what the problem actually is; narrows questions; reads the DTC | ✅ | ✅ |
| [Engine](engine-agent.md) | misfire, knock, overheat, coolant, oil, DPF/EGR/turbo (diesel) — **OBD2-aware** | ✅ | ✅ |
| [Electrical](electrical-agent.md) | battery, alternator, starter, fuse, ECU, ABS/SRS codes — **OBD2-aware** | ✅ | ✅ |
| [Fuel](fuel-agent.md) | fuel-trim, filter, injector, pump, contamination, EV range/SoH — **OBD2-aware** | ✅ | ✅ |
| [Safety](safety-agent.md) — **supreme** | can the driver drive? brakes/steering/airbag-SRS/tyre/overheat/EV-HV | ✅ | ✅ |
| [DIY](diy-agent.md) | can the driver fix this at home, safely? | ✅ | ✅ |
| [Cost](cost-agent.md) | expected repair band (₹) — feeds Scam Shield | ✅ | ✅ |
| [Trust](trust-agent.md) | over-diagnosis / hallucination guard | ✅ **only lowers** | ❌ never raises |

## Execution
One DeepSeek round-trip returns a strict JSON object: each agent's `{candidate,
weight, why, confidence}`, the Safety verdict, the DIY tier, the cost band, and a
Trust note. When an [OBD2 / Mode-2 snapshot](../skills/MECHANIC_KNOWLEDGE.md) is
present (live DTC + freeze-frame + coolant/RPM/fuel-trim), the fault agents read it
as hard evidence — a confirmed P-code outranks a described symptom. The frontend
renders the synthesized verdict + an expandable per-agent breakdown. Grounded on
[../skills/MECHANIC_KNOWLEDGE.md](../skills/MECHANIC_KNOWLEDGE.md).

## Weighted vote
- Each fault-agent (Engine/Electrical/Fuel) emits weighted candidate faults that
  sum to ~100% across the swarm. Example: *won't start, no crank, headlights/horn
  dim, dashboard dim on key-on* → `Battery 80 / Starter 12 / Charging 8` →
  **Battery, High confidence.** With OBD2: a live `P0300` + rough idle → `Misfire
  90`, **High**, because the code is hard evidence.
- **Disagreement floor** — if the top two candidates are within ~15 points OR the
  combined top weight is < 50%, the verdict downgrades to *"diagnosis confidence
  low — recommend inspection"* instead of guessing. Chitti never bluffs a driver.

## Voting rules (non-negotiable)
- **Safety is supreme** — the Safety Agent can override the *display order*: any
  brake/steering/airbag-SRS/tyre/overheat/EV-HV red line forces **DO NOT DRIVE** to
  the top, no matter how cheap or "likely" the fault is. Safety accuracy must be
  **100%**; critical safety errors = **0** ([../evals/safety_eval.md](../evals/safety_eval.md)).
- **Trust can only lower** — the [Trust Agent](trust-agent.md) prevents
  over-diagnosis and overconfidence; it can cap confidence or force "recommend
  inspection", but it can **never** raise a score to look more useful.
- **DIY never beats safety** — the DIY Agent may not propose a home fix the Safety
  Agent flagged (brake hydraulics/ABS, airbag/SRS, fuel rail, EV HV → Professional).
- **Confidence band, always** — every verdict ships Likely/Possible + High/Medium/Low
  ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
  Chitti never says "your engine is destroyed" unless evidence supports it.

## The Mechanic Verification Loop closes it
After a real repair, the driver tells Chitti *what the mechanic actually fixed*. That
ground truth re-weights the swarm over time — predicted-vs-actual raises or lowers
the quality score and feeds Swarm Intelligence ([§2f](../../SAHAYAI_MASTER.md)). See
[../observability/mechanic_verification_loop.md](../observability/mechanic_verification_loop.md).

## Swarm learning ([§2f](../../SAHAYAI_MASTER.md))
High-confidence patterns confirmed by ≥100 real mechanic outcomes are anonymised →
validated → pushed to [../skills/](../skills/). HIGH-risk safety patterns get human
review first. Unsafe-DIY and "you're being cheated by X" are **never learnable**.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
