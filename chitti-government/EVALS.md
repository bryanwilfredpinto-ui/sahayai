🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# EVALS — Chitti Government (CEOS v1.0)

> Certification suite. Nothing ships below these bars
> ([CONSTITUTION.md](CONSTITUTION.md)). Doctrine: the **deterministic** numbers are
> measured + reported; LLM-phrasing numbers gated on DeepSeek funding + the Vaani
> relevance-rail are marked `AUTOMATION-LIMITED`, never fabricated.

| Eval | Gate | File |
|---|---|---|
| Scheme accuracy | 99% | [evals/scheme_accuracy.md](evals/scheme_accuracy.md) |
| Eligibility accuracy | 95% | [evals/eligibility_accuracy.md](evals/eligibility_accuracy.md) |
| Document detection | 95% | [evals/document_detection.md](evals/document_detection.md) |
| Fraud detection | 95% (low FP) | [evals/fraud_detection.md](evals/fraud_detection.md) |
| Accessibility | 100% | [evals/accessibility_eval.md](evals/accessibility_eval.md) |
| Hallucination | < 1% | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| Privacy compliance | 100% | [guardrails/privacy.md](guardrails/privacy.md) |
| Mobile @375px | 100% | CTO visual cert |
| Blind / Illiterate task success | ≥ 95% | [evals/accessibility_eval.md](evals/accessibility_eval.md) |
| Critical bugs | 0 | regression suite |

## Datasets
Under [evals/datasets/](evals/datasets/): `eligibility_cases.json`,
`fraud_cases.json`, `document_cases.json`, `accessibility_cases.json`. Deterministic,
reproducible, LLM-independent.

## Harness
Frontend cert mirrors `tools/qa_full_vaani.mjs` / `tools/cert_fashion.mjs` (Playwright
+ axe-core, 375/768/1280, 26-language dropdown sweep). Backend via Flask test client
+ `lib/evaluators.py`. Reproduce: `node tools/cert_government.mjs` (to be added in the
build) + the dataset runners.
