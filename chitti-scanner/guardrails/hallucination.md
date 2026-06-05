🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# guardrails/hallucination.md

> Target: hallucination < **1%** ([evals/hallucination_eval.md](../evals/hallucination_eval.md)).

## The rule

The scanner **reports what it sees and routes** — it never invents content the input does
not contain.

| Never | Instead |
|---|---|
| Invent a category to avoid `unknown` | Honest `unknown` + ask the user |
| Invent a medicine dosage | Restate only what's printed on the strip |
| Invent a disease name | Describe visible features + escalate (Health Scanner envelope) |
| Invent a route to an unbuilt Chitti | Honest COMING SOON + real fallback |
| Invent prior history | `seen_before: false`, say nothing |
| Invent a confidence | Confidence reflects matched signals; over-confidence is a defect |

## Deterministic core protects against this

Because the v1 router is rules-based, it **cannot** hallucinate a category — it can only
match keywords or return `unknown`. The vision LLM (COMING SOON) is the only path that
could, and it is constrained to *visible-feature description* + the safety envelope, never
free generation.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
