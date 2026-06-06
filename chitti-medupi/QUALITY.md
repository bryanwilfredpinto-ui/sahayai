# Chitti MedUPI — QUALITY (CQOS) · Authored 2026-06-06

The merge-blocker quality contract for Chitti MedUPI. Below this bar is a defect, not a feature gap. Companion to `SUCCESS_METRICS.md` (targets), `evals/` (how we measure), and `observability/` (what we log).

## The 5 quality layers (measured 2026-06-06, commit `f9ec517`)

| # | Layer | Bar | Measured | Source |
|---|---|---|---|---|
| 1 | **Same-composition safety** | Zero cross-molecule leakage — HARD 100% | **0 leaks / 25 samples** | `tools/test_medupi_samples_result.json` |
| 2 | **NPPA ceiling** | No alternative priced above its ceiling | `over_ceiling=0` on all 25 | same |
| 3 | **Accessibility** | axe-core 0 serious/critical; four-user floor | **0 serious × 9 profiles**; 12/13 matrix | `tools/medupi_a11y_result.json` |
| 4 | **Language** | ≥26 langs, no raw-key leaks, RTL correct | **26/26 at 99%** | `tools/medupi_lang26_result.json` |
| 5 | **Hallucination** | <1%; no invented medicines/prices; honest unavailable | engine never emits a non-seed item by construction; vision honest-`unavailable` until key funded | by design + `04_BUG_REPORT` |

## Non-negotiables (from CONSTITUTION.md + CHITTI_SOP §2)
- STRICT same-composition: same molecule **AND** strength **AND** dosage form. Never approximate, never therapeutic substitution, never inferred from a brand name.
- Server-enforced medical disclaimer (EN + HI) on **every** response. Present on all 25 samples.
- Risk-tier molecules (insulin / cardiac / psychiatric / antibiotics = HIGH) never auto-substituted without a doctor.
- Per-response widget (🔊 / 🤖 / 👍 / 👎) on every response box — 74 boxes carry it.
- Golden Rule: every side-effecting action confirms before firing.
- Honest stubs over fake demos: AI vision returns `unavailable` until the DeepSeek key is funded.

## Quality gate before any merge / handover
1. `python tools/test_medupi_samples.py` → 25/25, 0 leaks.
2. `node tools/medupi_a11y.mjs` → axe 0 serious × 9 profiles.
3. `node tools/medupi_lang26.mjs` → 26/26.
4. `node tools/medupi_crossplatform.mjs` → 9/9 engines×viewports, edge cases green.
5. Five frontend gates present (feedback-widget + a11y + disability profile + lang auto-detect + ISL).

A page/PR that regresses layer 1, 2, or 3 is **blocked** — same status as a missing per-response widget or a missing disclaimer.
