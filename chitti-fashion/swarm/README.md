🎖️ World Class Chitti Fashion — Swarm

# SWARM — the 7-agent vote (+ 1 advisor)

Before any recommendation is shown to the user, the swarm votes. The user sees
the **synthesized verdict** plus an expandable per-agent breakdown — never a single
agent's raw opinion (ROLE.md Principle 6).

## The panel
| Agent | Judges | Can it lower score? | Can it raise score? |
|---|---|---|---|
| [Fashion](stylist-agent.md) | style quality | ✅ | ✅ |
| [Color](color-agent.md) | colour harmony | ✅ | ✅ |
| [Occasion](occasion-agent.md) | suitability | ✅ | ✅ |
| [Comfort](comfort-agent.md) | wearability | ✅ | ✅ |
| [Accessibility](accessibility-agent.md) | disability-friendliness | ✅ | ✅ |
| [Budget](budget-agent.md) | cost effectiveness | ✅ | ✅ |
| [Confidence](confidence-agent.md) | presentation polish | ✅ | ✅ |
| [Trend](trend-agent.md) | relevance/freshness | ❌ advisory only | ❌ advisory only |

## Execution
One DeepSeek round-trip returns a strict JSON object with all 7 scores + a teach
block + Free/Budget/Premium tiers + a trend note ([../ARCHITECTURE.md](../ARCHITECTURE.md)).
`overall = mean(7 agent scores)`. The Trend note is attached but excluded from the mean.

## Voting rules
- **Suitability beats trend** — Trend can flag "this is current" but can never raise the score (ROLE.md Principle 1).
- **Accessibility has a floor** — if the Accessibility Agent scores < 6 (an audio-only/visual-only/uncomfortable-for-the-profile result), the verdict is held and rephrased; accessibility is non-negotiable.
- **Budget rewards reuse** — an own-wardrobe (₹0) solution scores 10 on Budget.
- **No body in any vote** — every agent rates the garment/outfit, never the body.

## Swarm learning ([§2f](../../SAHAYAI_MASTER.md))
High-👍 patterns are anonymised → validated (≥100 confirmations) → pushed to
[../skills/](../skills/). Body-comment slips are never learnable (locked guardrail).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
