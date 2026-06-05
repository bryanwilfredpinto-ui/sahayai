🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Quality dashboard

A CTO/admin-only view (never shown to end users, per [CTO.md §3/§4](../../chitti-cto/CTO.md))
that surfaces Chitti Technical's live quality at a glance.

## Panels
| Panel | Shows |
|---|---|
| **Signal funnel** | generated → accepted/rejected → HOLD rate → Trust-blocked rate |
| **Accuracy** | win rate, RR promised vs realised, split by trade-type + confidence |
| **Calibration** | HIGH vs MEDIUM realised hit-rate (must be monotonic) |
| **Explain health** | DeepSeek vs template fallback rate, hallucination catches |
| **Accessibility** | last cert result (5 gates + 375px + lang-switch proof) |
| **Performance** | p50/p95 time-to-signal, payload size, CO₂/reply |
| **Feedback** | 👍 rate, top 👎 reasons by box, reversal patterns |

## Per-card overlays (CTO/admin only — DOM-gated)
Per [CTO.md §3/§4](../../chitti-cto/CTO.md), each response card can render (only for
`role=cto|admin`, absent for normal users):
- **Quality Check** — quality score, hallucination risk, source coverage,
  disclaimer check, reversal watch.
- **AI Observability** — response time, verification agent, audit ID, model, confidence.

These are read-only diagnostic surfaces — never accept input, never appear in user
screenshots.

## Honesty
- The dashboard shows **measured** numbers or "no data yet." Today (2026-06-06) most
  panels are "no data yet" because the page isn't built — [../evals/RESULTS.md](../evals/RESULTS.md).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
