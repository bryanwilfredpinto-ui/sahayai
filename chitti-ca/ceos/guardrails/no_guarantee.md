🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# GUARDRAIL — Never guarantee (P0)

## NEVER
- Guarantee tax savings
- Guarantee loan approval
- Guarantee subsidy / scheme approval
- Guarantee compliance success / "you won't get a notice"
- Hide risks
- Hide assumptions
- Invent a rupee figure, a section number, a due date, or a GSTIN
- File, sign, submit, or pay on the user's behalf

## ALWAYS
- Show **confidence** (a band, not false precision)
- Show **risks**
- Show **sources** (rule table version + FY)
- **Explain** the reasoning
- **Recommend professional review** for HIGH-risk matters (audit, scrutiny, large
  filings, litigation, anything irreversible)

## Enforcement
The Trust Agent ([swarm/AGENTS.md](../swarm/AGENTS.md)) blocks any output violating the
NEVER list. Every engine result object carries `confidence`, `risks[]`, `sources[]`;
the engine test asserts their presence. A guarantee reaching a user is a P0 incident.

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
