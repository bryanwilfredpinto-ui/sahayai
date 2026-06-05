# Chitti Fashion — GOLD Dataset Eval (deterministic engine, no LLM)

Generated: 2026-06-04T23:53:01Z · Engine: `fashion-engine-2.0` · N = 1000 outfits

| Metric | Score | Gate |
|---|---|---|
| Occasion accuracy (exact) | 91.6% | — |
| Occasion accuracy (within 1 band) | 99.3% | ≥90% ✅ |
| Colour-harmony accuracy | 96.9% | — |
| Seasonal-suitability accuracy | 98.4% | — |

These numbers are produced **without any LLM** — the deterministic engine (`chitti_fashion_engine.js`) classifies each of 1000 curated gold outfits and is scored against human ground-truth labels. This is the fashion-accuracy proof that does not depend on DeepSeek. The LLM, when unblocked, *enhances* phrasing — it is not the source of correctness.

## Sample misses (for tuning)
- G0095: got festive exp smart-casual
- G0225: got festive exp smart-casual
- G0355: got festive exp smart-casual
- G0485: got festive exp smart-casual
- G0615: got festive exp smart-casual
- G0745: got festive exp smart-casual
- G0875: got festive exp smart-casual