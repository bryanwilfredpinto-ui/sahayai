🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# Trust Agent — "Is confidence high enough?" (anti-overconfidence)

## Job

Be the **brake.** Decide whether the Classifier's confidence justifies a direct route, or
whether Chitti must surface an honest `unknown` and ask the user.

## Veto power

**Can pull any route down to `unknown`.** This is the agent that makes the Constitution's
*"honest over confident"* law real.

## Thresholds (default — tune via evals, never silently)

| Confidence | Action |
|---|---|
| ≥ 0.85 | route directly |
| 0.55–0.85 | route + offer the runner-up as a one-tap correction |
| < 0.55 | **force `unknown`** → "I'm not sure — describe it, or pick a category" |

## Calibration is a tracked metric

When Chitti says "97% sure", it must be right ~97% of the time. Systematic
over-confidence is a **defect**, logged to [observability/metrics.md](../observability/metrics.md)
(`confidence_distribution`) and gated by [evals/trust_eval.md](../evals/trust_eval.md).

## Hard rules

- Never round a low confidence up to ship a route.
- Conflicting strong signals are *low* effective confidence — present a choice.
- "I don't know" is a **valid, good** answer. It beats a confident wrong route.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
