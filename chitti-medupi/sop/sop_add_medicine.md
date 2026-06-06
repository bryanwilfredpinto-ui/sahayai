CEOS Level 7 — SOP: Add a Medicine to the Catalog
Authored 2026-06-06

# SOP — Adding a new medicine to the MedUPI catalog

**Trigger:** a prescribed medicine isn't in the seed/master DB (the user scans or
types it and gets "recognised X but not in our DB yet"), or a periodic loader run
brings in new rows.

**Backing:** `backend/data/medicines_seed.json` (51 seed meds) ·
`backend/scripts/` real-data loaders (Jan Aushadhi · NPPA · CDSCO · Kaggle ·
RxNorm · OpenFDA · Apollo one-shot) · `services/medupi_database.py::seed_if_empty`.
Production DB carries **211,207 rows in `medupi.medicines`** (Apollo dataset).

---

## Required fields (every new row)
| Field | Rule |
|---|---|
| `brand_name` | exact retail name |
| `salt_composition` | lower-case, `+`-joined for combos (e.g. `amoxicillin+clavulanic acid`) — **the strict-match key** |
| `salt_components` | JSON array of component salts |
| `strength` | exact (e.g. `650mg`, `500+125mg`, `100mcg`) — never "approx" |
| `dosage_form` | one of Tablet / Capsule / Syrup / Injection / Inhaler / Cream / Drops / Sachet |
| `mrp` | branded retail price |
| `nppa_ceiling_price` | NPPA NLEM ceiling, if the molecule is scheduled |
| `jan_aushadhi_price` + `jan_aushadhi_code` | if the molecule is in the PMBJP catalog |
| `risk_class` | H / M / L — must agree with `medupi_risk.RISK_MAP` (see step 3) |
| `purpose_en` / `purpose_hi` | plain-language purpose (illiterate-user contract) |

## Steps
1. **Capture provenance.** Record where each price came from (`price_source`:
   jan_aushadhi / nppa / kaggle / apollo / manual). Freshness badges depend on it.
2. **NPPA cross-check.** Confirm `mrp <= nppa_ceiling_price` where a ceiling exists.
   If MRP exceeds the ceiling, keep the row but it will surface
   `above_nppa_ceiling=true` (Pricing Agent) — that is intentional user protection.
3. **Jan Aushadhi cross-check.** Look up the molecule + strength + form in the
   PMBJP catalog; attach `jan_aushadhi_price` + `jan_aushadhi_code` if listed.
4. **Risk band.** Ensure the molecule exists in `medupi_risk.RISK_MAP`. A new
   molecule's risk class is a **Sire-approved change**
   (see [sop_swarm_skill_update.md](sop_swarm_skill_update.md)) — never default a
   HIGH-category drug to LOW.
5. **Strict-match smoke test.** Query the new molecule via
   `search_by_composition` and confirm it returns **only** same-molecule +
   strength + form rows (zero cross-molecule leakage).
6. **Seed/loader idempotency.** `seed_if_empty` only loads into an empty table;
   bulk loaders upsert. Never double-insert.

## Hard rules — non-negotiable
- **Composition is immutable.** Medicine composition is matched on the master DB,
  **never inferred from the brand name** (CHITTI_SOP §2 stale-data rule).
- **Never add a row without a risk class** — unknown molecules default LOW but are
  logged for expansion; a HIGH-category drug must be mapped before it ships.
- **Provenance is mandatory** — a price with no source cannot carry an honest
  freshness badge.

## Output
A catalog row that passes strict matching, carries an NPPA + Jan Aushadhi
cross-check, has a correct risk band, and is bilingual on `purpose_*`.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
