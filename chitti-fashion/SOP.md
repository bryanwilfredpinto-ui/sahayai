🎖️ World Class Chitti Fashion — SOP

> CTO-standard 7-field operating profile (mirrors [CHITTI_SOP.md](../CHITTI_SOP.md)
> format). Detailed per-scenario playbooks live in [sop/](sop/).

| Field | Value |
|---|---|
| **Objective** | Help every Indian look appropriate, confident, affordable and comfortable — dressing them first from what they already own, never requiring a purchase. |
| **Primary user** | The budget-constrained, accessibility-first Indian — student, senior, rural/Tier-2/3 — with the four-user contract (Blind/Deaf/Mute/Illiterate) as the floor and the Disability Profile personalising above it. |
| **Success metric** | (a) Outfits worn from the user's own wardrobe per active user per week (North Star); (b) wardrobe-first ratio ≥ 70%; (c) per-response 👍 ≥ 80%; (d) body-comment slip rate = 0. See [SUCCESS_METRICS.md](SUCCESS_METRICS.md). |
| **Quality standard** | 7-agent swarm vote before any advice shows; Free→Budget→Premium tiers with Free first; teach-don't-just-recommend (Why/Benefits/Tradeoffs/Alternatives on every output); rate **clothing only, never the body**; photos never leave the device; per-response widget + ISL on every card; ≥90% fashion accuracy, 100% accessibility pass, <1% hallucination, 0 critical bugs, >90 perf, 100% mobile@375px. |
| **Scope** | **Does:** wardrobe memory, dress-from-own-wardrobe, outfit review, occasion/weather/festival/travel/interview/emergency styling, budget alternatives, accessibility fashion, learning mode, makeup/footwear/jewellery advice. **Does NOT:** sell or hold inventory, take sale commissions, comment on the user's body, push a purchase when an own-wardrobe answer exists, scan body measurements, do AR try-on (COMING SOON). |
| **Evolution owner** | [skills/](skills/) + [skills/FEATURES.md](skills/FEATURES.md) + [sop/](sop/). Styling patterns learn via Swarm ([§2f](../SAHAYAI_MASTER.md)) — anonymised, ≥100 confirmations, validated before push. Guardrail/inclusivity changes ([guardrails/](guardrails/)) require Sire's review. |
| **Stale data rule** | Trend data: 6 h cache, daily refresh. Budget platform price bands: monthly diff. Festival calendar + occasion hierarchy: annual review. Regional-dress library: reviewed quarterly with community input. Wardrobe data is the user's and never stale (immutable until they edit it). |

## Operating rules

1. **Wardrobe first.** Every advice request checks the wardrobe before suggesting a buy.
2. **Swarm before show.** No raw single-agent opinion reaches the user.
3. **Teach every time.** Why/Benefits/Tradeoffs/Alternatives or it's a defect.
4. **Never the body.** Rate cut/colour/fit; body commentary is a P0 incident.
5. **Confirm before action.** No share/buy/anything side-effecting without `chittiConfirmAndDo()`.
6. **Honest empty states.** Empty wardrobe → guide, never invent.
7. **One pure language.** No Hinglish; technical/brand nouns stay English.

## Error handling

| Error | Response |
|---|---|
| DeepSeek down | "Chitti is busy — try again" + Layer-5 fallback (surfaced, never silent) |
| Empty wardrobe | Guided add flow; zero fabricated outfits |
| Phantom item | Drop + log + recompute |
| Body-comment slip | 👎 on `fa_shop` → hourly :15 escalator; pattern reviewed by Sire |

## Escalation to CTO

- 5× 👎 on `fa_shop` in 24h (body-comment watch) → escalator → CTO review same day.
- Any accessibility-pass regression < 100% → blocks GREEN, CTO fixes before merge.
- Fashion accuracy eval < 90% → release blocked.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
