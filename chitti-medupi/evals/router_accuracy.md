CEOS Level 11 — Evals: Router / Composition Accuracy

Authored 2026-06-06

> MedUPI has no free-text "intent router" in the chatbot sense — its routing is
> **composition routing**: a named/scanned medicine → its strict same-composition
> set → risk band → savings. The eval that matters is therefore *correctness of
> the strict match* with **zero cross-molecule leakage as a HARD gate**.

Companion docs: [evals/accessibility_eval.md](accessibility_eval.md) · [guardrails/safety.md §2](../guardrails/safety.md) · [guardrails/hallucination.md](../guardrails/hallucination.md) · harness `tools/test_medupi_samples.py` · result `tools/test_medupi_samples_result.json`.

---

## 1. What is being evaluated

| Routing decision | Correct behaviour |
|---|---|
| Brand/salt → primary row | fuzzy-match the named medicine to the canonical catalogue row |
| Primary → alternatives | return **only** rows with the same `(salt, strength, form)` |
| Alternatives → cheapest | pick the genuinely cheapest (Jan Aushadhi preferred), within the NPPA ceiling |
| Molecule → risk band | classify H / M / L and attach the correct EN+HI warning |
| Result → savings | compute savings only against a real cheaper price; honest `null` otherwise |

The HARD invariant across all of the above: **no row from a different molecule, strength, or form ever appears in the alternatives.** A single leak is a P0.

---

## 2. The real harness

**`tools/test_medupi_samples.py`** runs sample queries (under `test_samples/medupi/` — `branded_queries/` + `prescriptions/`) through the real backend engine: `medupi_alternatives.find` → `search_by_composition` against an in-memory seed of **51 medicines**. Each sample is scored on six per-sample checks:

| Check | Gate |
|---|---|
| `min_alternatives >= 2` | enough equivalents surfaced |
| `zero_cross_molecule_leakage` | **HARD** — leaks must be 0 |
| `nppa_ceiling_respected` | **HARD** — over_ceiling must be 0 |
| `cheapest_present_savings >= 0` | a real cheapest is identified |
| `real_savings_present` | a positive saving exists where applicable |
| `disclaimer_en+hi_present` | EN **and** HI disclaimer attached |

---

## 3. Current measured baseline (do not invent others)

From **`tools/test_medupi_samples_result.json`** — the authoritative artifact:

| Result | Value |
|---|---|
| Total samples | **25** |
| Passed | **25** |
| Failed | **0** |
| Cross-molecule leakage | **0** across every sample |
| NPPA ceiling respected | **over_ceiling = 0** across every sample |
| Savings range (Jan-Aushadhi-vs-branded) | **67.3% – 78.4%** |
| Seed catalogue | 51 medicines |

Representative rows: `q_amlong` (amlodipine, risk **H**, 71.4% saving, leaks=0) · `q_augmentin` (amoxicillin+clavulanic acid, risk **H**, 67.3%, leaks=0) · `rx_thyroid` (levothyroxine, risk **H**, 76.0%, leaks=0). Note that the high-savings molecules are predominantly **HIGH-risk** — which is exactly why each carries the ⛔ doctor-sign-off warning ([guardrails/safety.md §4](../guardrails/safety.md)).

These are the **only** router/composition numbers MedUPI claims today. Any other figure is a target, labelled as such.

---

## 4. The hard gate, restated

```
zero_cross_molecule_leakage == true  for EVERY sample   →  required to ship
nppa_ceiling_respected      == true  for EVERY sample   →  required to ship
```

A regression that introduces even one leak or one over-ceiling row blocks the merge. The strict-match index `ix_medicines_strict_match (salt_composition, strength, dosage_form)` is the mechanism; this eval is the proof.

---

## 5. Roadmap (labelled targets, not measured)

- Expand the seed beyond 51 medicines toward the full 211,207-row catalogue for a production-scale leakage sweep.
- Add a vision-path router eval (strip photo → extracted fields → reconciled DB row) once `DEEPSEEK_API_KEY` is funded — today the vision path returns honest-unavailable, so there is nothing to score against ([guardrails/hallucination.md §6](../guardrails/hallucination.md)).
- Add a fuzzy-spelling robustness set (common misspellings → correct primary row).
