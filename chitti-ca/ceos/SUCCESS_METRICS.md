🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti CA OS

> The number Sire tracks. Everything else is supporting telemetry. Targets are
> merge-blockers via [EVALS.md](EVALS.md) — below target is a defect, not a gap.

## Quality targets

| Metric | Target | How measured |
|---|---|---|
| Tax accuracy | ≥ 95% | Gold eval set vs deterministic engine ([evals/tax_accuracy.md](evals/tax_accuracy.md)) |
| GST accuracy | ≥ 95% | Gold eval set ([evals/gst_accuracy.md](evals/gst_accuracy.md)) |
| Accounting accuracy | ≥ 95% | Ledger/reconciliation gold set |
| Audit accuracy | ≥ 90% | Anomaly/variance gold set |
| Fraud detection | ≥ 90% | Labelled fake/genuine invoice set ([evals/fraud_detection.md](evals/fraud_detection.md)) |
| Government-scheme match accuracy | ≥ 90% | Labelled persona→scheme set ([evals/scheme_match.md](evals/scheme_match.md)) |
| Accessibility success | 100% | axe-core 0 critical + four-user journeys ([evals/accessibility.md](evals/accessibility.md)) |
| Hallucination rate | < 1% | Money-figure provenance audit ([evals/hallucination.md](evals/hallucination.md)) |
| Compliance-reminder success | ≥ 95% | Deadline-engine date correctness |
| User satisfaction | ≥ 90% | Per-response 👍 rate (feedback-widget.js) |

## Impact metrics (Observability — see [OBSERVABILITY.md](OBSERVABILITY.md))

Track, per user (on-device) and in anonymised aggregate:

- **Tax saved** (legal deductions/regime the user wasn't using)
- **GST errors prevented** (ITC mismatches caught before filing)
- **Fraud cases detected** (fake GST / duplicate / overbilling flagged)
- **Schemes discovered** (and the ₹ the user was losing by not claiming)
- **Penalties avoided** (deadlines hit because Chitti reminded)
- **Compliance tasks completed**
- **User satisfaction** (👍 rate, by language and by persona)

## North-star

**₹ of value created per user per year** = tax saved + penalties avoided + schemes
claimed + fraud losses prevented − any money Chitti suggested the user spend.
A higher north-star with **lower** suggested spend is always the better quarter.

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
