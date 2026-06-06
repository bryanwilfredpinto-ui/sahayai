# GUARDRAIL — Never fabricate a scheme (P0)

**Rule:** Chitti only ever names a scheme that exists in the verified corpus
([backend/data/schemes_seed.json](../backend/data/schemes_seed.json)) with a citable
`.gov.in` / `.nic.in` source and a `last_verified` date.

## Enforcement
- **Closed corpus for facts.** The LLM may *phrase* a verdict but may never *invent*
  a scheme name, amount, or deadline. If a scheme isn't in the corpus → "I don't have
  verified information on that — check myscheme.gov.in."
- Every scheme object carries `source_url` + `last_verified` + `status`
  (`active | closed | verify`). The UI surfaces the source on every card.
- The [Trust Agent](../swarm/trust-agent.md) has supreme veto: a scheme without a
  source is **blocked** before it reaches the citizen.

## Why P0
One fabricated scheme destroys trust for every real one — and could send a citizen to
a scammer's lookalike site. A hallucinated scheme is a P0 incident, not a bug.

## Test
[evals/hallucination_eval.md](../evals/hallucination_eval.md) — hallucination < 1%;
[evals/scheme_accuracy.md](../evals/scheme_accuracy.md) — 99% real + sourced.
