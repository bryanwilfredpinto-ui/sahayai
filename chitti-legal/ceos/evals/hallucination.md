# Eval — Hallucination (target < 1%)

- **What:** does Chitti ever invent a section, citation, deadline or jurisdiction?
- **Method:** the engine can only emit values from its versioned tables (true by
  construction → deterministic hallucination ≈ 0). The LLM-phrasing path (BO11) is judged
  for fabricated citations once funded.
- **Honest classification:** `decodeNotice` returns `found:false` (low confidence) rather
  than a confident wrong guess.
- **P0:** a fabricated section/citation/deadline shown as certain.
- See [../guardrails/hallucination.md](../guardrails/hallucination.md).
