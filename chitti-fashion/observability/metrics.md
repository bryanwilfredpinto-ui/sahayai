🎖️ World Class Chitti Fashion — Observability: Metrics

# OBSERVABILITY — Metrics

> What we measure (and pointedly do not). Aligned to [../SUCCESS_METRICS.md](../SUCCESS_METRICS.md).
> All metrics anonymised, on-device-first, tombstoned on forget.

## North Star
- **Outfits worn from own wardrobe / active user / week.**

## Tracked (Tier-1)
| Metric | Target | Source |
|---|---|---|
| Wardrobe-first ratio | ≥ 70% | advice events tagged `resolved=own_wardrobe` |
| Per-response 👍 rate | ≥ 80% | feedback-widget per box |
| Fashion accuracy (eval) | ≥ 90% | release eval |
| Accessibility pass | 100% | cert + eval |
| Body-comment slip rate | 0 | guardrail classifier on responses |
| Median response time | < 3 s | request timing |
| Mobile pass @375px | 100% | cert screenshots |

## Counter-metrics (kept LOW)
- Purchases pushed when an owned answer existed → 0.
- Trend-overrode-suitability events → 0.
- Sessions ending in unrecovered 👎 → < 5%.

## Explicitly NOT tracked
- Time-in-app, session count, "engagement." These reward addiction, not help
  (Founder Rule). Their absence is intentional and documented.

## Trust signals shown on the page (per [§6 part 7](../../SAHAYAI_MASTER.md))
Risk badge, CO₂/reply, last audit, "helped today" — via feedback-widget trust strip.

## Plumbing
Rides chitti-vaani-api observability (`wrap_llm` + request timing) → Turso
aggregates via the direct-HTTPS shim. CTO/admin-only quality + observability strips
per [chitti-cto/CTO.md §3–§4](../../chitti-cto/CTO.md) (hidden from end users).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
