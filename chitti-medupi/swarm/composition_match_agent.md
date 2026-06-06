CEOS Level 6 — Swarm: Composition Match Agent
Authored 2026-06-06

# AGENT — Composition Match (the safety supreme)

**Votes on:** is every returned alternative *the same molecule + same strength +
same dosage form* as the queried medicine? This is the single agent with an
**absolute veto**. Cross-molecule leakage is a P0 defect — never a low score.

**Backing service:** `services/medupi_alternatives.py` → `find()` →
`services/medupi_database.py` → `search_by_composition(db, molecule, strength, dosage_form)`.

---

## The rule (non-negotiable, repeated in MASTER_SPEC §5 / §12 / §14)

```
Show alternatives ONLY when:
  same molecule  AND  same strength  AND  same dosage form
NO therapeutic alternatives. NO different molecules.
NO different strengths. NO different dosage forms. EVER.
```

## Inputs
| Input | Source |
|---|---|
| `molecule` (salt_composition, lower-case, `+`-joined for combos) | text path, or DeepSeek vision `salt_composition` |
| `strength` (e.g. `650mg`, `500+125mg`, `100mcg`) | query / extraction |
| `dosage_form` (Tablet / Capsule / Syrup / Injection / Inhaler / Cream / Drops / Sachet) | query / extraction |
| candidate set | `Medicine` rows from `search_by_composition` |

## Outputs
`{verdict: PASS|VETO, leakage_count, matched_set, why_en, why_hi}` — on VETO the
swarm replaces the result with the honest "no same-composition equivalent found"
copy from `_build_speak_en`/`_build_speak_hi`.

## Decision rules
| Condition | Verdict |
|---|---|
| Every alt shares molecule + strength + form with the query | **PASS** |
| Any alt differs in molecule | **VETO** — P0, file incident |
| Any alt differs in strength (e.g. Telmisartan 40 vs 80) | **VETO** |
| Any alt differs in dosage form (e.g. pen vs vial, tablet vs syrup) | **VETO** |
| Zero alts after strict filter | **PASS (empty)** — show "no equivalent found", never widen |

## Hard rules — non-negotiable
1. **Never widen the filter to fill an empty result.** An empty strict set is a
   correct answer. Substituting a different molecule "so the user sees something"
   is the catastrophe this product exists to prevent (CONTEXT.md §4 table).
2. **Combination salts match component-set-equal, order-independent.**
   `amoxicillin+clavulanic acid` ≠ `amoxicillin` alone.
3. **Strength is exact, not "close".** `40mg` and `80mg` are different medicines.
4. **The DB composite index `ix_medicines_strict_match` on
   `(salt_composition, strength, dosage_form)` is the hot path** — the agent
   asserts the query rode it, never a fuzzy brand match.
5. Vision-extracted molecules still pass through this gate before any alt shows —
   a low-confidence OCR never relaxes the strict filter (see Trust Agent).

## Verification
`tools/test_medupi_samples_result.json` — **25/25 samples PASS, `zero_cross_molecule_leakage`
true on every row** (`leaks=0`). This agent's veto is what that check enforces.
Any regression here blocks the GREEN cert.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
