🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Mechanic Verification Loop (THE secret weapon)

> Every diagnostic AI guesses. **Only Chitti finds out if it was right.** After a real
> repair, the rider tells Chitti what the mechanic *actually* fixed. That ground truth
> is the highest-quality signal in the whole system — it turns Chitti from a guesser
> into a learner.

## The flow
1. Chitti gives a diagnosis with a confidence band (e.g. *"Likely battery — High"*).
2. The rider goes to a mechanic / fixes it.
3. Later, Chitti asks **one** simple, tappable question:
   > *"Mechanic ne kya theek kiya?"*
   > 🔋 Battery · 🔌 Starter · ⛽ Fuel pump · 🕯️ Spark plug · ⛓️ Chain · 🛞 Tyre · 🔧 Other
4. The rider taps (or speaks) the real fix — and optionally the real cost.
5. Chitti compares **predicted vs actual** and updates its quality score.

## What predicted-vs-actual does
| Outcome | Effect |
|---|---|
| Predicted = actual, High confidence | quality score ↑; pattern reinforced for the swarm |
| Predicted = actual, Low confidence | Chitti was honestly unsure and right — small ↑ |
| Predicted ≠ actual, High confidence | **biggest penalty** — over-confident wrong; becomes a regression case |
| Predicted ≠ actual, Low confidence | small ding; the case feeds the eval set |
| Real cost vs predicted band | tightens / widens the cost bands ([cost_accuracy](../evals/cost_accuracy.md)) |

## Feeds Swarm Intelligence ([§2f](../../SAHAYAI_MASTER.md))
Confirmed predicted=actual pairs are anonymised → aggregated → after ≥100 confirmations
a pattern (e.g. "Activa + slow-crank + 3yr battery ⇒ battery") is validated and pushed
to [../skills/](../skills/). HIGH-risk safety patterns get human review first.
Every Chitti Bike Doctor instance then benefits from one rider's real outcome.

## Privacy (non-negotiable)
- Fully **anonymised** — no rider identity, no plate, no location in the aggregate.
- Stored on-device first; only the anonymised predicted/actual/cost tuple leaves.
- `"Chitti forget"` tombstones the rider's contribution.
- Mechanic name (if ever given) is **never** stored against a quality verdict — no
  defamation, ever ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md)).

## Accessibility
The follow-up is **one tap on an icon menu** (mute/illiterate-safe), spoken aloud
(blind-safe), with symbols + words + ISL (deaf-safe). Never a text form. The rider can
always decline — it's an offer, never a nag.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
