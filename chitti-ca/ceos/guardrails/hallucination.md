🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# GUARDRAIL — Anti-hallucination (money math)

**The LLM never produces a number. The engine does.**

- Every rupee figure shown is computed by `chitti_ca_os_engine.js` from the user's own
  inputs + a versioned rule table, and is **provenance-tagged** (`{value, source}`).
- The LLM (DeepSeek) only rewrites engine output into the user's language with the
  expert lens — it is given the computed numbers and forbidden to change them.
- If DeepSeek is 429/offline, the engine's own plain-language strings ship (honest
  stub). A number is **never** fabricated to fill a gap.
- Section numbers, scheme names, due dates and GSTIN validity come from the rule
  tables / deterministic checks, never from free-text generation.
- Target: hallucination < 1%. Any user-visible figure without engine provenance is a
  defect — logged and escalated ([observability/](../observability/)).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
