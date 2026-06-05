🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# CERTIFICATION — the release gate

> **A release cannot ship until every gate below is GREEN, on production, with
> proof.** No GREEN without visual + functional verification ([CTO.md rule #2](../../chitti-cto/CTO.md)).

## Release gates

| Gate | Bar | Proof artifact |
|---|---|---|
| **Signal accuracy** | **≥ 70%** | [../evals/signal_accuracy.md](../evals/signal_accuracy.md) — live + backtest |
| **Risk accuracy** | **≥ 90%** | [../evals/risk_accuracy.md](../evals/risk_accuracy.md) |
| **Hallucination** | **< 1%** | [../evals/hallucination_eval.md](../evals/hallucination_eval.md) |
| **Explainability** | **= 100%** | [../evals/explainability_eval.md](../evals/explainability_eval.md) |
| **Accessibility** | **= 100%** | [../evals/accessibility_eval.md](../evals/accessibility_eval.md) |
| **Mobile (375px)** | **= 100%** | Playwright `tools/cert_technical.mjs` + screenshots |
| **Performance** | **< 2 s/scan** | [../observability/metrics.md](../observability/metrics.md) |

## Platform gates (also required — on top of the above)
- **5 frontend gates** ([QUALITY_STATUS.md §1a](../../QUALITY_STATUS.md)): feedback-widget +
  `data-chitti-response`, `chitti_a11y.js`, Disability Profile prompt, language
  auto-detect, ISL plugin.
- **CTO cert hooks** ([CTO.md §8](../../chitti-cto/CTO.md)): 5-element strip present,
  quality/observability overlays hidden for normal users, **no-Hinglish scanner**,
  technical-terms-preserved (RSI/SEBI/NSE), card order.
- **Product-specific cert hooks** (this product):
  - `assert_sebi_bar_present()` + `assert_sebi_modal_present()`
  - `assert_no_guarantee_language()` (multi-language)
  - `assert_stop_present_on_directional_signal()`
  - `assert_no_invented_numbers()`
  - `assert_language_switch_rerenders()` (en→bn/te/ta title proof, 0 English fallback)
  - `assert_indicator_pane_toggle()` (RSI/Williams %R/Stochastic overlay↔separate)
  - `assert_responsive(375, 768, 1280)`

## Rule
Any single failing gate **blocks GREEN** for the release. A gate is GREEN only when
its check passes **on the production URL** with a saved artifact. "Code-wired" is
🟡, not 🟢 ([QUALITY_STATUS.md legend](../../QUALITY_STATUS.md)).

## Current state
See [CERTIFICATION_REPORT.md](CERTIFICATION_REPORT.md) — today: **doc set authored,
page not built, no gate GREEN yet.** Honest stubs over fake demos.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
