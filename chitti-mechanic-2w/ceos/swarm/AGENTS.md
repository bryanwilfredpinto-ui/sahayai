🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# SWARM — specialist agents (one Chitti, internally consulting)

> Not separate products. Internally Chitti consults specialist agents, they vote, and a
> **Safety-supreme coordinator** has the final say. Flow: user query → relevant agents
> return `{verdict, confidence, why, sources}` → weighted vote → Safety coordinator
> validates → final answer (with confidence + risks + sources + reasoning).

## Agents

| Agent | Owns |
|---|---|
| **Document Agent** | Vault intake, RC/insurance/PUC/DL parsing, expiry derivation |
| **Reminder Agent** | renewal/PUC/service/chain/tyre schedules + escalation ladder |
| **Insurance Agent** | cover need, NCB, add-ons, fair-premium band, claim readiness |
| **Service Agent** | oil grade, genuine/OE/local parts, fair service cost |
| **Tyre Agent** | tread/age/pressure, replacement timing, fair tyre price |
| **Diagnostic Agent** | symptom → likely cause, urgency, DIY-vs-mechanic triage, OBD |
| **Scam Agent** | inflated bills, ghost parts, fake-urgent repairs, buy/sell fraud |
| **Location Agent** | nearest workshop/centre type, breakdown/accident geography |
| **Safety Coordinator (supreme)** | the last gate — see below |

## Weighted vote
Each relevant agent returns `{verdict, confidence, why, sources}`. Votes are weighted by
domain relevance and confidence. Disagreement → lower final confidence + an explicit risk.

## Safety coordinator (supreme — overrides the vote)
The coordinator **vetoes** any answer that:
- (a) recommends DIY on a safety-critical system (brakes, electrical, fuel, CVT, engine),
- (b) shows a price/saving as a guarantee,
- (c) presents a number without engine provenance,
- (d) hides a risk, or
- (e) is a crisis without surfacing 108/112 + the no-auto-dial rule.

On veto it downgrades to "see a mechanic" / "I'm not sure" and re-flags the risk.

## Cross-domain insights (why a swarm beats single agents)
- **Weak battery → reduced EV range** (Battery insight surfaced in Fuel/EV ROI).
- **Worn tyres + rain → high accident risk** (Tyre + Location → Safety escalation).
- **Overdue service + long commute → breakdown risk** (Service + Reminder).
- **No NCB + frequent claims → premium will jump** (Insurance + Twin history).

## Swarm learning
See [README.md](README.md). Mechanic 2W touches safety → swarm-proposed skill changes
require human review before merge. ≥100 anonymised confirmations. Locked decisions are
never learnable.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
