🎖️ World Class Chitti Fashion — Swarm

# SWARM — the 7-agent vote (+ 1 advisor)

Before any recommendation is shown to the user, the swarm votes. The user sees
the **synthesized verdict** plus an expandable per-agent breakdown — never a single
agent's raw opinion (ROLE.md Principle 6).

## The panel — 9 voting agents (CFOS v2.0) + Trend advisor

CFOS v2.0 expands the swarm to **9 voting specialists** (Level 6). The deterministic
engine scores them; the page shows the synthesized verdict + an expandable per-agent
breakdown in the user's language.

| Agent | Judges | Can it lower / raise score? |
|---|---|---|
| [Stylist (Fashion)](stylist-agent.md) | style quality | ✅ / ✅ |
| [Accessibility](accessibility-agent.md) | disability-friendliness (**floor** — held if < 6) | ✅ / ✅ |
| [Color](color-agent.md) | colour harmony + **real undertone/value** | ✅ / ✅ |
| [Sustainability](sustainability-agent.md) | reuse-before-buy, cost-per-wear (CFOS v2.0) | ✅ / ✅ |
| [Budget](budget-agent.md) | cost effectiveness | ✅ / ✅ |
| [Occasion](occasion-agent.md) | suitability — decisive | ✅ / ✅ |
| [Climate](climate-agent.md) | weather/season/fabric (CFOS v2.0) | ✅ / ✅ |
| [Cultural](cultural-agent.md) | festival/region/religion respect (CFOS v2.0) | ✅ / ✅ |
| [Teacher](teacher-agent.md) | teaches the *why* (CFOS v2.0) | ✅ / ✅ |
| [Comfort](comfort-agent.md) / [Confidence](confidence-agent.md) | wearability / polish (retained) | ✅ / ✅ |
| [Trend](trend-agent.md) | relevance/freshness | ❌ advisory only (trust over virality) |

**Final recommendation only after the vote.** The live verdict panel currently surfaces
7 agents; the 3 CFOS-v2.0 additions (Sustainability/Climate/Cultural) are 🟡 being surfaced
on the panel — their logic already runs in the engine (`fabricSeason`, reuse-ladder,
cultural judge codes). See [ROADMAP.md](../ROADMAP.md).

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
