CEOS Level 7 — SOP: Incident — Cross-Molecule / Wrong Match
Authored 2026-06-06

# SOP — A wrong (cross-molecule) match is reported

**Severity: P0.** This is the single failure mode the entire product exists to
prevent. A user being shown a *different molecule, strength, or dosage form* as a
"same-composition alternative" is a safety incident — for a cardiac, insulin,
psychiatric, or antibiotic molecule it can be catastrophic (CONTEXT.md §4 table).

**By construction this should be impossible** — `search_by_composition` filters on
`(salt_composition, strength, dosage_form)` and the Composition Match Agent holds
an absolute veto. This SOP is the **safety backstop + rollback** for the day the
impossible is nonetheless reported.

---

## Immediate response (within the hour)
1. **Reproduce.** Re-run the exact query (text or the same strip) against the
   backend `medupi_alternatives.find`. Capture the returned `alternatives` set.
2. **Classify the leak.** Different molecule? Different strength? Different form?
   Combination-salt mismatch (e.g. `amoxicillin` shown for
   `amoxicillin+clavulanic acid`)?
3. **Contain.** If a real cross-molecule leak is confirmed, **disable the affected
   molecule's alternatives surface** (feature-flag to "no equivalent found — type
   to confirm with pharmacist") rather than serve a wrong result. An empty honest
   answer is always safer than a wrong one.
4. **Notify CTO.** This is an SOP.md escalation trigger ("HIGH-risk pattern in
   Swarm review (e.g. wrong dosage form match)").

## Root-cause checklist
| Suspect | Check |
|---|---|
| `ilike("%mol%")` substring over-match | a substring molecule (e.g. `aspirin` inside a combo string) leaking — tighten to exact component-set match |
| missing `strength` / `dosage_form` filter | the molecule-only "show everything" path was hit when strict was required |
| bad catalog row | a row with a mistyped `salt_composition` / `strength` (see [sop_add_medicine.md](sop_add_medicine.md)) |
| vision mis-extraction | DeepSeek returned a wrong salt; Trust Agent should have softened — verify confidence handling |
| swarm-learned mapping | a recently merged `skills/*.md` mapping introduced it — roll it back (see below) |

## Rollback
1. If a swarm patch caused it, **revert the `skills/*.md` line** and re-open the PR
   for Sire — never re-merge without approval.
2. If a catalog row caused it, correct/quarantine the row and re-run the
   strict-match smoke test.
3. Re-run `tools/test_medupi_samples.mjs` and confirm
   `tools/test_medupi_samples_result.json` returns **25/25 PASS,
   `zero_cross_molecule_leakage` true on every row** before lifting the feature flag.

## Hard rules — non-negotiable
- **Wrong is never acceptable; empty is.** When in doubt, serve "no same-composition
  equivalent found", not a guess.
- **Never widen the strict filter to "find something".** That is exactly the bug.
- **A cross-molecule leak blocks every GREEN cert** until the sample suite is back to
  25/25 with zero leakage.

## Post-incident
- Add the failing case as a permanent regression sample under
  `test_samples/medupi/`.
- Record the incident + fix with an honest provenance note; if a swarm pattern was
  implicated, raise the confirmation bar for that pattern class.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
