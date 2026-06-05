🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# swarm/ — the 8-agent routing swarm · Level 4

> Before any scan is routed, **eight agents vote.** The shown route is the synthesized
> verdict, never one agent's raw opinion. Subordinate to [ROUTING_ENGINE.md](../ROUTING_ENGINE.md).

## The agents

| # | Agent | Question | File | Veto |
|---|---|---|---|---|
| 1 | Classifier | What is it? | [classifier-agent.md](classifier-agent.md) | — |
| 2 | Trust | Is confidence high enough? | [trust-agent.md](trust-agent.md) | can force `unknown` |
| 3 | Safety | Any risk? | [safety-agent.md](safety-agent.md) | **supreme** |
| 4 | Accessibility | How to deliver the answer? | [accessibility-agent.md](accessibility-agent.md) | shapes delivery |
| 5 | Memory | Have we seen this before? | [memory-agent.md](memory-agent.md) | enriches |
| 6 | Learning | Can routing improve? | [learning-agent.md](learning-agent.md) | proposes |
| 7 | Explanation | How do we teach *why*? | [explanation-agent.md](explanation-agent.md) | blocks reasonless routes |
| 8 | Router | Send to the best Chitti | [router-agent.md](router-agent.md) | final synthesis |

## Vote order + precedence

```
Classifier → Trust (gate confidence) → Safety (supreme veto) →
Memory (enrich) → Router (synthesize) → Accessibility (shape delivery) →
Explanation (attach reason — block if none) → Learning (log for improvement)
```

- **Safety is supreme.** A fraud/emergency/health-risk signal overrides any convenience
  route. (e.g. a UPI QR inside an "invoice" routes to Fraud Guard, not commerce.)
- **Trust is the brake.** It can pull any route down to `unknown` if confidence is low.
  Anti-overconfidence is its only job.
- **Explanation is a gate.** A route with no human-readable reason does not ship.

## v1 reality (honest)

The v1 vote is **deterministic** — rules + the fixed precedence above. The **LLM-graded
vote** (each agent scored by DeepSeek) is **COMING SOON**, blocked on DeepSeek funding +
the Vaani relevance-rail allowlist (same standing blocker as Fashion + Mechanic). We do
**not** claim a swarm-vote accuracy number until [evals/router_accuracy.md](../evals/router_accuracy.md)
runs against the labelled set.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
