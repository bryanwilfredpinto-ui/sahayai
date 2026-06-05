🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# EVALS — CFOS v2.0 (Level 11)

> Mandatory. Fashion apps usually skip this. Every target maps to a reproducible
> harness in `tools/`. Detail per dimension in [evals/](evals/). Gate-status in
> [QUALITY.md](QUALITY.md).

## Targets (merge-blockers)

| Eval | Target | Harness | Current |
|---|---|---|---|
| **Fashion accuracy** | **≥ 95%** (within-band) | `tools/fashion_gold_eval.mjs` (1000 gold) | **99.3%** within / 91.6% exact |
| Colour harmony | ≥ 95% | same | 96.9% |
| Seasonal suitability | ≥ 95% | same | 98.4% |
| **Accessibility** | **100%** | `tools/fashion_eval_harness.mjs` + cert | **100/100** |
| **Hallucination** | **< 1%** | engine never emits a non-owned item | ~0 |
| **Safety** | **100%** | refusal + privacy + Golden-Rule checks | pass |
| **Body shaming** | **0%** | guardrail classifier on responses | 0 |
| **Inclusivity** | **100%** | [evals/inclusivity_eval.md](evals/inclusivity_eval.md) (red-team) | 0 flags |
| **Blind-user success** | **≥ 95%** | journey: describe-my-outfit + voice-only flow (`tools/cert_fashion_journeys.mjs`) | journey pass |
| **Illiterate-user success** | **≥ 95%** | journey: icon/voice-only, 2G, no reading | journey pass |

## How fashion accuracy is judged (no LLM needed)

A 1000-case GOLD set of outfit + context → ground-truth formality band + colour family +
season. The **deterministic engine** classifies each; accuracy = match rate. This number
is real and LLM-independent — the doctrine that rules are the product.

## Honest gaps (not yet GREEN)

- Gold labels are synthetic/curated, **not yet stylist-rated** or real-user-acceptance.
- Blind/illiterate success is **automated** journey cert, not a real AT-user on a device.
- **Garment-vision accuracy** can't be evaluated until the DeepSeek/vision unblock.

## Cadence

Run on every change (engine/page); block GREEN below gate. Regression set grows from
every confirmed 👎. Body-shaming + accessibility are absolute (any miss blocks release).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
