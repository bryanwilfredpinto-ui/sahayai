🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# EVALS — Chitti Technical

How we prove the engine is right (deterministic, reproducible, no LLM in the judged path). Detail per axis
lives in [`evals/`](evals/).

| Eval | What it proves | Harness | Target |
|---|---|---|---|
| Indicator math | each of the 39 indicators computes correctly; warm-up → `null` (abstain, never 0) | `tools/test_technical.mjs` | exact on fixtures |
| Confluence / signal | ladders resolve; aligned→directional, opposed→WAIT (CEOS §6) | same | deterministic |
| Risk (no-stop→no-signal) | every BUY/SELL carries a stop on the correct side; RR ≥ floor | same | 0 violations |
| Hallucination / honesty | 0 banned phrases ("guaranteed/100% accurate/sure-shot") across all generated strings | `evals/hallucination_eval.md` | 0 |
| Accessibility | axe-core 0 serious/critical WCAG 2.2 AA on 5 devices; four-user journeys | `tools/certify_technical.mjs` | 0 serious |
| Backtest (BO18) | net-of-cost, both directions, no look-ahead | backtest harness | reproducible |
| **Directional accuracy** | calls vs real outcomes | scorecard + calibration | **estimate — NOT yet measured** (labelled honestly) |

Rule: **no number is claimed before a harness produces it** ([`evals/RESULTS.md`](evals/RESULTS.md)).
