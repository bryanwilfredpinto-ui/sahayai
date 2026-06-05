🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# evals/RESULTS.md — Chitti Universal Scanner eval ledger

> **Honest ledger.** Numbers are filled in **only after** the harness runs. Empty cells mean
> *not yet measured* — never assume a target is met.

## Status (as of CUSOS v1.0 doc-set authoring · 2026-06-05)

| Gate | Target | Measured | Status |
|---|---|---|---|
| Router accuracy | ≥ 95% | — | 🟡 harness designed, dataset pending |
| Wrong routing | < 1% | — | 🟡 pending |
| Accessibility | = 100% | base 5-gate **18/18 GREEN** (2026-05-27) | 🟢 base · 🟡 route-card cert pending |
| Trust / honest-unknown | = 100% | — | 🟡 pending |
| Safety critical | = 0 | — (fraud-first + non-diagnostic encoded by construction) | 🟡 automated assertion pending |
| Hallucination | < 1% | — (deterministic core → near-0 by construction) | 🟡 pending |
| Mobile @375px | = 100% | page certified GREEN | 🟢 base · 🟡 router card re-cert pending |

## Standing blockers (same as Fashion + Mechanic)

1. **DeepSeek funding + Vaani relevance-rail allowlist** — unblocks vision auto-detect +
   LLM-graded swarm vote + live Vaani-routed answers. Until then the deterministic core is
   the product and the numbers above are measured against *it*, not the LLM.
2. **Turso shim verification on chitti-scanner** (RED) — unblocks cross-device Memory +
   Family Graph + predictive reminders.

## How to fill this in

1. Build `evals/datasets/router_gold.json` (hand-labelled, ~500–1000 cases).
2. Run the deterministic engine over it (Node harness, mirrors `tools/fashion_gold_eval.mjs`).
3. Paste real numbers here with the commit hash + date. **Never** publish a number the
   harness did not produce.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
