🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# OBSERVABILITY — CFOS v2.0 (Level 10)

> What we measure (and what we pointedly don't). Detail in [observability/](observability/).
> Aligned to [SUCCESS_METRICS.md](SUCCESS_METRICS.md). All anonymised, on-device-first,
> tombstoned on `"Chitti forget"`.

## North Star

> **Outfits worn from the user's own wardrobe per active user per week** — un-gameable by
> engagement; rewards trust + sustainability + the hero feature at once.

## Tracked (CFOS v2.0)

| Metric | Definition | Status |
|---|---|---|
| Outfit acceptance rate | % recommendations the user marks worn / 👍 | 🟡 widget signals |
| Recommendation accuracy | gold-eval + per-response 👍 | 🟢 (gold) |
| User satisfaction | per-box 👍 rate (≥ 80%) | 🟢 widget |
| **Accessibility success** | blind/deaf/mute/illiterate journey completion | 🟢 cert journeys |
| **Shopping-reduction %** | advice resolved without a purchase (reuse/repair/borrow) | 🟡 |
| **Cost saved** | ₹ avoided vs. the new/branded alternative | 🟡 |
| **Carbon saved** | est. CO₂e avoided per garment not bought | 🔵 planned |
| Cost-per-wear | item ₹ ÷ wears | 🟢 live (Audit) |
| Body-comment slip | must be 0 | 🟢 escalator |

## Explicitly NOT tracked

Time-in-app, session count, "engagement." These reward addiction, not help (Founder
Tie-Breaker). Their absence is intentional and documented.

## CTO/admin-only on-card overlays

§3 Quality (Quality Score · Hallucination Risk · Source Coverage · Disclaimer · Reversal
Watch) + §4 Observability (Response Time · Verification Agent · Audit ID · Model ·
Confidence) — DOM-gated on `role=cto|admin`, hidden from users
([chitti_fashion_cto.js](../chitti_fashion_cto.js)).

## Trust signals on the page

Risk badge · CO₂/reply · last audit · helped-today — via the feedback-widget trust strip.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
