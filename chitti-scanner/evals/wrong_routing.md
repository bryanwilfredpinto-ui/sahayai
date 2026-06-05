🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# evals/wrong_routing.md

> **Target: wrong-routing rate < 1%.** The most dangerous failure: confidently sending a
> user to the *wrong* specialist.

## What it measures

Of all routed cases, what fraction went to a **wrong live specialist** (not `unknown`, not
COMING-SOON — an actual wrong destination)? A medicine sent to Fashion is a wrong-route; a
medicine correctly held as `unknown` is **not**.

## Why it's separate from accuracy

A high `unknown` rate hurts accuracy but is *safe* (honest). A wrong-route is *unsafe* — it
sends a vulnerable user down the wrong path with false confidence. So we track it on its own
and hold it to a tighter bar.

## Worst-case wrong-routes (must be 0)

- A fraud/UPI signal routed to commerce instead of Fraud Guard.
- A health/wound scan routed anywhere but the Health Scanner.
- An emergency scene routed anywhere but the Vaani cascade.

These are caught by the supreme [Safety Agent](../swarm/safety-agent.md) and double-counted
in [safety_eval.md](safety_eval.md).

## Honest status

🟡 Harness designed; numbers pending the labelled dataset run. Results → [RESULTS.md](RESULTS.md).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
