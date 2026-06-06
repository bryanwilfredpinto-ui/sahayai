🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# SUCCESS_METRICS — Chitti Government (CEOS v1.0)

> The numbers Sire tracks. Everything else is supporting telemetry. These are the
> **certification bars** ([CONSTITUTION.md](CONSTITUTION.md) §Certification) — below
> any of these is a defect, not a feature gap.

## Certification metrics (release gates)

| Metric | Target | How measured |
|---|---|---|
| **Scheme accuracy** (every scheme real + correctly described + sourced) | **99%** | [evals/scheme_accuracy.md](evals/scheme_accuracy.md) — sample vs official portal |
| **Eligibility accuracy** | **95%** | [evals/eligibility_accuracy.md](evals/eligibility_accuracy.md) — gold cases vs rule-engine |
| **Document detection accuracy** | **95%** | [evals/document_detection.md](evals/document_detection.md) |
| **Fraud detection accuracy** | **95%** | [evals/fraud_detection.md](evals/fraud_detection.md) — labelled scam/genuine corpus |
| **Accessibility coverage** | **100%** | [evals/accessibility_eval.md](evals/accessibility_eval.md) — 4 users × every feature |
| **Hallucination rate** | **< 1%** | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| **Privacy compliance** | **100%** | no PII leaves device except anonymous eligibility JSON |
| **User satisfaction** (per-response 👍) | **> 90%** | feedback-widget.js → Founder dashboard |

## North-star metric

**Benefits Claimed Rate** — of the schemes a citizen is *eligible* for, what % do
they actually go on to apply for (measured by checklist-completion + "I applied"
follow-up). Every other metric is in service of moving this number.

## Citizen Readiness Score (the user-facing metric)

The product surfaces an individual readiness number so the abstract becomes concrete:

```
Documents:        85%   (have 11 of 13 core documents)
Schemes Claimed:  42%   (claimed 5 of 12 eligible)
Benefits Missed:  6     (₹ value estimated where known)
Readiness:        72%   ← the headline number
```

This is computed **deterministically on-device** from the Citizen Digital Twin —
see [skills/eligibility-calculation.md](skills/eligibility-calculation.md) and
[memory/citizen_digital_twin.md](memory/citizen_digital_twin.md).

## Supporting telemetry (Observability)

Tracked per [observability/](observability/):

- Failed applications (where the citizen reported a rejection — feeds the eval set)
- Missing documents (most common gaps → prioritise document help)
- Broken official links (auto-flag for refresh)
- Scheme usage (which schemes are searched/claimed most)
- Fraud reports (confirmed scams → feed the Fraud Shield pattern DB)
- Citizen satisfaction (per-response 👍/👎)
- Language distribution (which of the 26 langs are actually used)
- Per-disability-profile task completion (blind/illiterate success ≥ 95%)

## Honest measurement rule

No metric above is *claimed* until the harness has run. Where DeepSeek phrasing is
gated on funding + the Vaani relevance-rail, the **deterministic** number is reported
and the LLM-phrasing number is marked `AUTOMATION-LIMITED` — never fabricated.
(Doctrine from chitti-fashion / chitti-news-ai: rules are the product.)

---
> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
