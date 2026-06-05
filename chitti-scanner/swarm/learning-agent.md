🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# Learning Agent — "Can routing improve?"

## Job

Watch the feedback signals and **propose** routing improvements — never push them silently.
Implements the [Swarm Intelligence](../../SAHAYAI_MASTER.md) cycle for the router.

## Signals

- 👎 on a route card = "wrong Chitti" → a candidate mis-route.
- 👎 → correction → 👍 reversal = a learned keyword→category fix.
- Repeated `unknown` on the same kind of input = a missing keyword rule.

## Cycle (per [§2f](../../SAHAYAI_MASTER.md))

| Cadence | Step |
|---|---|
| Daily | collect route 👍/👎 + corrections (anonymised) |
| Weekly | validate — ≥ 100 confirmations + cross-region sanity |
| Monthly | propose keyword/route changes to [routing/routing_table.md](../routing/routing_table.md) (PR) |
| Quarterly | full review for drift / conflicts with locks |

## Hard rules

- **Proposes only.** Routing changes land via PR to the routing table, reviewed by Sire.
- **Anonymised.** No PII enters the swarm; "Chitti forget" removes the contribution.
- **Locked decisions are not learnable** — the router can never learn to auto-dial cops,
  diagnose, or bypass the Golden Rule.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
