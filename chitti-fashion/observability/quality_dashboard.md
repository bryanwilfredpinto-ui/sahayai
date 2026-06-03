🎖️ World Class Chitti Fashion — Observability: Quality Dashboard

# OBSERVABILITY — Quality Dashboard

> The single board a CTO/Sire reads to know if Chitti Fashion is healthy. Renders
> in chitti-founder's daily slice + the CTO/admin-only on-card overlays.

## Top-line health (must all be green)
| Signal | Green when | Source |
|---|---|---|
| Fashion accuracy | ≥ 90% | [../evals/fashion_accuracy.md](../evals/fashion_accuracy.md) |
| Accessibility pass | = 100% | [../evals/accessibility_eval.md](../evals/accessibility_eval.md) |
| Hallucination | < 1% | [../evals/hallucination_eval.md](../evals/hallucination_eval.md) |
| Inclusivity flags | = 0 | [../evals/inclusivity_eval.md](../evals/inclusivity_eval.md) |
| Critical bugs | = 0 | regression suite |
| Performance | > 90 | [metrics.md](metrics.md) |
| Mobile @375px | = 100% | cert screenshots |
| Body-comment slip | = 0 | [feedback.md](feedback.md) |

## Trend panels
- Wardrobe-first ratio over time (target ≥ 70%, rising).
- Per-response 👍 rate by feature card.
- Top 👎 cards this week + root cause.
- Accessibility floor-breach count (should trend to 0).
- Phantom-item rate (hero-feature integrity → 0).

## CTO/admin-only on-card overlays (never shown to users)
Per [chitti-cto/CTO.md §3–§4](../../chitti-cto/CTO.md): Quality Score, Hallucination
Risk, Source Coverage, Disclaimer Check, Reversal Watch, Response Time,
Verification Agent, Audit ID, Model, Confidence. DOM-gated on `role=cto|admin`.

## Release gate
A release ships GREEN only when **every** top-line signal is green AND the 8 CTO
gates ([chitti-cto/SOP.md](../../chitti-cto/SOP.md)) pass. Any red blocks GREEN.

## Cert artifacts
`tools/cert_fashion.mjs` → screenshots in `tools/cert_screenshots/chitti_fashion_*.png`;
log appended to `CERT_LOG.md`.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
