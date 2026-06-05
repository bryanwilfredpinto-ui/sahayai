🎖️ World Class Chitti Fashion — Swarm

# SWARM — the 9-agent vote (+ 1 advisor)

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

**Final recommendation only after the vote.** ✅ **As of 2026-06-05 the live verdict panel
surfaces all 9 voting agents** — the 3 CFOS-v2.0 additions (Sustainability/Climate/Cultural)
are now shown, scored deterministically from real engine signals (versatility/`fabricSeason`/
cultural judge codes). `overall = mean(9 voters)`; Trend stays advisory-only. Native labels +
why-text in all 9 languages. Verified by `tools/fashion_qa.mjs` (asserts 9 rows render).

## Execution
The **deterministic engine** scores all 9 voters with zero LLM dependency
(`faEngineSwarmJSON` in `chitti_fashion.html`): Style/Colour/Occasion/Comfort/Accessibility
from harmony+occasion+season+judge; Sustainability from versatility; Climate from
`fabricSeason`; Cultural from cultural judge flags. `overall = mean(9 voters)`; the Trend
note is attached but excluded from the mean. When the DeepSeek key is funded, one round-trip
can enrich the same 9-score shape — the panel renders identically either way.

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
