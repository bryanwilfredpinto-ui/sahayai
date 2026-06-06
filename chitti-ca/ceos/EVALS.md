🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# EVALS — Chitti CA OS quality gates

> No release without passing **all** gates. Money math is HIGH-risk — one wrong rupee
> figure shown as certain is a P0 incident. Reproduce: `node tools/ca_os_engine_test.mjs`.

## Quality gates (merge-blockers)

| Metric | Required | Eval doc |
|---|---|---|
| Accounting accuracy | ≥ 95% | [evals/accounting_accuracy.md](evals/accounting_accuracy.md) |
| Tax accuracy | ≥ 95% | [evals/tax_accuracy.md](evals/tax_accuracy.md) |
| GST accuracy | ≥ 95% | [evals/gst_accuracy.md](evals/gst_accuracy.md) |
| Audit accuracy | ≥ 90% | [evals/audit_accuracy.md](evals/audit_accuracy.md) |
| Fraud detection | ≥ 90% | [evals/fraud_detection.md](evals/fraud_detection.md) |
| Government-scheme match | ≥ 90% | [evals/scheme_match.md](evals/scheme_match.md) |
| Accessibility | 100% | [evals/accessibility.md](evals/accessibility.md) |
| Hallucination | < 1% | [evals/hallucination.md](evals/hallucination.md) |

## How money math is gated (the most important eval)

Every rupee the UI shows is computed by `chitti_ca_os_engine.js`. The engine test
asserts known-good outputs against hand-computed gold values from the FY24-25 / FY25-26
rule tables. Examples in the harness:

- ₹12,00,000 salaried, new regime FY25-26 → tax computed to the rupee.
- Old vs new regime crossover for a user with ₹2.5L 80C + ₹50k 80D.
- LTCG on equity > ₹1.25L taxed at 12.5%; debt at slab.
- GST health: 18% on ₹1,00,000 supply → ₹18,000; ITC eligible vs blocked.
- GSTIN checksum: a valid 15-char GSTIN passes; a tampered one fails (fraud gate).
- Govt Benefits: a Maharashtra manufacturing MSME, ₹2 Cr turnover, 25 employees →
  Udyam + CGTMSE + state subsidy surfaced with ₹ impact.

## Always / Never (guardrail evals)

**Always:** show confidence · show risks · show sources · explain reasoning ·
recommend professional review for HIGH-risk.
**Never:** guarantee tax savings · guarantee loan/subsidy approval · guarantee
compliance success · hide risks · hide assumptions · invent a rupee figure · file or
sign on the user's behalf.

The guardrail evals live in [guardrails/](guardrails/) and are asserted in the engine
test (e.g. every result object carries `confidence`, `risks[]`, `sources[]`).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
