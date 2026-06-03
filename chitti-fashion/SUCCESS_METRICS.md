🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Fashion

The North Star is chosen to be **un-gameable by engagement**. We do not measure
time-in-app or sessions; those reward addiction, not help (Founder Rule).

## North Star

> **Outfits worn from the user's own wardrobe per active user per week.**

Every time Chitti dresses a user from what they already own — and the user marks
it worn — that is the product working. It rewards trust + sustainability + the
hero feature simultaneously. It cannot be inflated by ads or shopping.

## Tier-1 metrics (Sire tracks)

| Metric | Target | Why |
|---|---|---|
| **Wardrobe-first ratio** | ≥ 70% of advice resolves with **₹0 / own-wardrobe** | Proves budget-first principle |
| **Fashion accuracy** | ≥ 90% (eval) | [evals/fashion_accuracy.md](evals/fashion_accuracy.md) |
| **Accessibility pass** | 100% | [evals/accessibility_eval.md](evals/accessibility_eval.md) |
| **Per-response 👍 rate** | ≥ 80% | feedback-widget per box |
| **Body-comment slip rate** | **0** (hard) | [guardrails/body_shaming.md](guardrails/body_shaming.md) |

## Tier-2 metrics (supporting telemetry)

| Metric | Target |
|---|---|
| Recommendation relevance (eval) | ≥ 85% |
| Hallucination risk | < 1% |
| Occasion-correctness (wedding/office/festival) | ≥ 90% |
| Free-tier presence (every shop verdict shows an own-wardrobe alternative) | 100% |
| Median response time | < 3 s |
| Mobile pass @375px | 100% |
| ISL panel present on every response | 100% |

## Counter-metrics (we want these LOW)

| Counter-metric | Ceiling |
|---|---|
| Purchases pushed when an own-wardrobe answer existed | → 0 |
| Sessions ending in a 👎 with no recovery turn | < 5% |
| Body / age / gender / disability bias flags | 0 |
| Trend-driven advice that overrode suitability | 0 |

## Leading indicators of trust

- % of users who add ≥ 1 wardrobe item after first session (intent to reuse).
- % of "Dress Me From What I Own" requests vs "should I buy this" requests
  (we want the former to dominate over time).
- Repeat use before an occasion (wedding/festival/interview) — the moment trust pays off.

## How metrics are computed

All counters are anonymised, on-device-first. Aggregates follow the
[Camera Intelligence](../SAHAYAI_MASTER.md) + [Swarm](../SAHAYAI_MASTER.md)
ownership contract: user-token stripped, GPS rounded to pincode, `"Chitti forget"`
tombstones every row. See [observability/metrics.md](observability/metrics.md).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
