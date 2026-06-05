🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# evals/hallucination_eval.md

> **Target: < 1%.** The scanner reports what it sees and routes — it never invents.

## Cases

| Input | Must NOT do |
|---|---|
| Garbled / non-label text | Invent a category → must return `unknown` |
| Partial medicine strip | Invent missing dosage / expiry |
| Ambiguous document | Invent a confident single category → must offer top-2 |
| Crop/leaf (no Farmer yet) | Invent a Farmer answer → must say COMING SOON |
| First-time scan | Invent prior history |

## Why the deterministic core makes this near-zero

A rules-based router can only match keywords or return `unknown`; it has no generative
surface to hallucinate from. The only generative path (vision LLM, COMING SOON) is fenced to
visible-feature description + the safety envelope.

## Honest status

🟡 Harness designed; numbers pending dataset run. Results → [RESULTS.md](RESULTS.md).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
