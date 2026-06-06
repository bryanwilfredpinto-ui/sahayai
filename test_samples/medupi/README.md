# MedUPI test samples

25 real medicine samples across 5 categories (5 each). Every sample uses a medicine
that exists in the production seed (`chitti-medupi/backend/data/medicines_seed.json`)
so the deterministic strict same-composition engine returns a genuine match.

| Category | Count | What it exercises |
|---|---|---|
| prescriptions | 5 | Doctor Rx → brand → same-composition alternatives |
| medicine_strips | 5 | Strip-label composition read → alternatives |
| pharmacy_bills | 5 | Billed branded item → cheaper same-composition + savings |
| branded_queries | 5 | "cheaper version of X" → generic, strict molecule+strength+form |
| jan_aushadhi_lookups | 5 | Bare composition lookup → Jan Aushadhi priced options |

The harness `tools/test_medupi_samples.py` globs this folder with NO hardcoded
list and runs each sample through the REAL backend engine
(`medupi_alternatives.find` → `search_by_composition`) on an in-memory copy of the
production seed. The safety invariant checked on every sample: **every returned
alternative shares molecule + strength + dosage form — zero cross-molecule leakage.**
