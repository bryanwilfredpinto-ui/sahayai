🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# GUARDRAIL — Hallucination

## Why Chitti Fashion structurally cannot hallucinate outfits
The product is a **deterministic engine** (`chitti_fashion_engine.js`), not an LLM, for its core value:

- **Never invents garments.** `buildOutfits()` only combines items that exist in the user's on-device
  wardrobe (IndexedDB). It is mathematically incapable of suggesting clothes the user does not own —
  verified by the unit test *"simulator: never emits a non-owned id (no hallucination)"*.
- **Colour/occasion/fabric are computed, not guessed** — real HSL colour science, deterministic
  formality bands, fabric→season maps. 1000-case gold eval = 91.6% exact / 99.3% within-band.
- **The LLM is enhancement-only.** When DeepSeek is down/unfunded, the engine still works — so an
  LLM hallucination can never reach a styling decision. The LLM only *explains*, never *decides*.

## Measured
`tools/fashion_gold_eval.mjs` (1000 cases) · `tools/fashion_engine_test.mjs` (66 unit tests) ·
[../evals/hallucination_eval.md](../evals/hallucination_eval.md). Target hallucination < 1% → met by design (own-wardrobe-only).
