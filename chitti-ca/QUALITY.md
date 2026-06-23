## Quality gates (nothing ships below these — see [EVALS.md](EVALS.md))

Tax accuracy ≥ **95%** · GST accuracy ≥ **95%** · Accounting accuracy ≥ **95%** ·
Audit accuracy ≥ **90%** · Fraud detection ≥ **90%** · Government-scheme match ≥
**90%** · Accessibility = **100%** · Hallucination < **1%** · Compliance-reminder
success ≥ **95%** · Critical money-math errors = **0** · Mobile @375px = **100%**.

**No release without passing all gates.** Money math is HIGH-risk: a single wrong
rupee figure shown as certain is a P0 incident, not a feature gap.
