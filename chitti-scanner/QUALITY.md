🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# QUALITY — Chitti Universal Scanner (CUSOS quality contract)

> The merge-blocker bar. Below this is a defect, not a feature gap. Sits **on top of** the
> platform five frontend gates ([QUALITY_STATUS.md §1a](../QUALITY_STATUS.md)) + the CTO
> eight gates. Numbers are **measured, never claimed.**

## Quality layers

| Layer | Gate | Target | Eval |
|---|---|---|---|
| 1 | Router accuracy | ≥ 95% | [evals/router_accuracy.md](evals/router_accuracy.md) |
| 2 | Wrong routing | < 1% | [evals/wrong_routing.md](evals/wrong_routing.md) |
| 3 | Safety critical | = 0 | [evals/safety_eval.md](evals/safety_eval.md) |
| 4 | Trust / honest-unknown + calibration | 100% / ±10% | [evals/trust_eval.md](evals/trust_eval.md) |
| 5 | Hallucination | < 1% | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| 6 | Accessibility | = 100% | [evals/accessibility_eval.md](evals/accessibility_eval.md) |
| 7 | Mobile @375px | = 100% | CTO visual cert |

## The five platform frontend gates (inherited via substrate — must stay GREEN)

G1 feedback-widget + `data-chitti-response` (route card carries it) · G2 `chitti_a11y.js` ·
G3 Disability Profile on first visit · G4 language auto-detect · G5 ISL plugin.
The page is **certified GREEN 18/18** on the base gates (2026-05-27); the new router card
re-certs on the next deploy.

## Doctrine (LOCKED)

- **Deterministic core is the product.** The LLM is an enhancement. Quality is measured
  against the rules engine, which works with DeepSeek down.
- **Honest > confident.** A high `unknown` rate is healthy; a high `wrong_route` rate is a
  P1; a single safety-critical miss is a P0 and blocks release.
- **No number without a harness.** Every metric in [evals/RESULTS.md](evals/RESULTS.md) is
  blank until the labelled dataset runs. We never publish a target as if it were measured.

## CO₂ / carbon

The deterministic router spends ≈ 0 model tokens, so CO₂/scan ≈ 0 for the common path.
Any vision-LLM spend is flagged on the dashboard and cost-disclosed to the user (opt-in).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
