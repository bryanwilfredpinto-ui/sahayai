🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# EVALS — Chitti Universal Scanner · Level 11 (index)

> Per-eval specs live in [evals/](evals/). Live numbers live in [evals/RESULTS.md](evals/RESULTS.md).
> **No release until the gates pass** ([CONSTITUTION.md](CONSTITUTION.md) quality gates).

## The eval suite

| Eval | Target | Spec |
|---|---|---|
| Router accuracy | ≥ 95% | [evals/router_accuracy.md](evals/router_accuracy.md) |
| Wrong routing | < 1% | [evals/wrong_routing.md](evals/wrong_routing.md) |
| Safety critical | = 0 | [evals/safety_eval.md](evals/safety_eval.md) |
| Trust / honest-unknown | = 100% | [evals/trust_eval.md](evals/trust_eval.md) |
| Hallucination | < 1% | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| Accessibility | = 100% | [evals/accessibility_eval.md](evals/accessibility_eval.md) |

## How evals run (mirrors chitti-fashion gold-eval)

1. `evals/datasets/router_gold.json` — hand-labelled ~500–1000 cases across all categories.
2. A Node harness (mirrors `tools/fashion_gold_eval.mjs`) runs the **deterministic** engine
   over the dataset — no LLM, no network.
3. A Playwright cert (mirrors `tools/cert_fashion.mjs`) verifies the route card's 5 gates +
   375/768/1280 responsiveness + the `aria-live` route announcement.
4. Real numbers + commit hash land in [evals/RESULTS.md](evals/RESULTS.md).

## Honest status

🟡 Harness **designed**, dataset **pending**. The base page is certified GREEN 18/18 on the
platform gates. Router-eval numbers are blank until the dataset runs — and the docs say so
everywhere, on purpose.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
