🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# evals/trust_eval.md

> **Target: 100% of low-confidence cases honestly surfaced as `unknown`** + calibrated
> confidence. The Trust Layer is a first-class product surface.

## Two things measured

1. **Honest-unknown.** For every input the engine *should* be unsure about (below the 0.55
   threshold), did it return `unknown` and ask the user — rather than guessing? Must be 100%.
2. **Confidence calibration.** Bucket routes by stated confidence; within each bucket, the
   actual correct-rate should match the stated confidence (±10%). Systematic
   over-confidence is a **defect** (the [Trust Agent](../swarm/trust-agent.md) exists to
   prevent it).

## Method

```
low_conf_cases = cases where expected == 'unknown' or signals are weak/conflicting
honest_unknown = fraction of low_conf_cases that returned 'unknown'   # target 100%

for bucket in [0.55-0.7, 0.7-0.85, 0.85-1.0]:
    calibration[bucket] = correct_rate(bucket) vs stated_confidence(bucket)
```

## Explainability

Every shipped route carries a reason ([Explanation Agent](../swarm/explanation-agent.md)
gate). Track 🤖-click-through + 👍 on the explanation box.

## Honest status

🟡 Harness designed; numbers pending dataset run. Results → [RESULTS.md](RESULTS.md).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
