🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# evals/router_accuracy.md — Level 11

> **Target: router accuracy ≥ 95%.** Measured, never claimed.

## What it measures

Given a labelled input (text or `type`), did the deterministic router send it to the
**correct specialist Chitti** (or correctly to `unknown` / COMING-SOON)?

## Dataset

A hand-labelled set of inputs across all 12+ categories — medicine strips, food labels,
vehicle symptoms, fashion tags, govt forms, legal notices, UPI/fraud messages, crop/leaf
descriptions, education docs, appliance labels, resumes, ambiguous + unknown cases. Stored
under `evals/datasets/` (to be populated; mirrors the chitti-fashion gold-eval pattern).

## Method

```
for each labelled case:
    detected = DetectionEngine(case.input)         # deterministic, no LLM
    route    = RoutingEngine(detected)
    pass     = (route.category == case.expected_category)
              and (route.chitti == case.expected_chitti
                   or (case.expected == 'unknown' and route.state == 'unknown'))
accuracy = passes / total
```

## Honest status

🟡 **Harness designed; numbers NOT yet measured.** The labelled dataset must be built and
run against the engine. We do **not** publish an accuracy number until it does — same
discipline as Fashion (gold eval) and Mechanic (CQOS). Results land in
[RESULTS.md](RESULTS.md).

## Pass bar

≥ 95% correct route · the wrong-routing sub-metric < 1% ([wrong_routing.md](wrong_routing.md)).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
