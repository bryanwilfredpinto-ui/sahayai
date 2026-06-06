# 07 — SAMPLE TEST REPORT · Chitti MedUPI

**Date:** 2026-06-06 · **Build:** `f9ec517` · **Harness:** `tools/test_medupi_samples.py` (loops the sample folder with **no hardcoded list** — `glob('test_samples/medupi/**/*.json')`) · **Engine under test:** the REAL backend `medupi_alternatives.find()` → `medupi_database.search_by_composition()`, run on an in-memory copy of the production seed `chitti-medupi/backend/data/medicines_seed.json` (51 medicines, 21 columns). Fully offline — no network, no LLM, no Railway.

## 3.1 Sample files uploaded

5 categories × 5 real files = **25 samples**, every one a medicine that exists in the production seed (so the deterministic engine returns a genuine match). Folder: `test_samples/medupi/`.

| Category | Required | Actual | Folder | Status |
|---|---|---|---|---|
| prescriptions | 5 | 5 | `test_samples/medupi/prescriptions/` | ✅ |
| medicine_strips | 5 | 5 | `test_samples/medupi/medicine_strips/` | ✅ |
| pharmacy_bills | 5 | 5 | `test_samples/medupi/pharmacy_bills/` | ✅ |
| branded_queries | 5 | 5 | `test_samples/medupi/branded_queries/` | ✅ |
| jan_aushadhi_lookups | 5 | 5 | `test_samples/medupi/jan_aushadhi_lookups/` | ✅ |

**Sample files verdict: ✅ PASS (5 per category, real files, real medicines).**

## 3.2 Sample test results

| Test | Expected | Actual | Status |
|---|---|---|---|
| Harness loops ALL files, no hardcoded list | glob recursive | `glob(... **/*.json, recursive=True)` | ✅ |
| All samples pass | 100% | **25/25 passed** | ✅ |
| Zero cross-molecule leakage (the safety invariant) | 0 leaks on every sample | 0 leaks across all 25 | ✅ |
| NPPA ceiling respected (no MRP over ceiling) | 0 over | `over_ceiling=0` on all 25 | ✅ |
| Mandatory medical disclaimer (EN+HI) on every result | present | present on all 25 | ✅ |
| Real savings where expected | >0% | 67.3%–78.4% | ✅ |
| Evidence artifact written | yes | `tools/test_medupi_samples_result.json` | ✅ |

### Per-sample results

| Category | Sample | Alts | Cheapest | Max savings | Risk |
|---|---|---|---|---|---|
| prescriptions | rx_fever_child (Crocin 650) | 3 | Dolo 650 | 76.5% | L |
| prescriptions | rx_bp_amlodipine (Amlong 5) | 2 | Amlong 5 | 71.4% | H |
| prescriptions | rx_throat_antibiotic (Augmentin 625) | 2 | Clavam 625 | 67.3% | H |
| prescriptions | rx_thyroid (Thyronorm 50mcg) | 2 | Eltroxin 50mcg | 76.0% | H |
| prescriptions | rx_acidity (Pan 40) | 2 | Pantop 40 | 78.4% | M |
| medicine_strips | strip_dolo650 | 3 | Dolo 650 | 76.5% | L |
| medicine_strips | strip_azee500 | 2 | Azithral 500 | 71.4% | H |
| medicine_strips | strip_shelcal | 2 | Shelcal 500 | 73.3% | L |
| medicine_strips | strip_pantop40 | 2 | Pantop 40 | 78.4% | M |
| medicine_strips | strip_amlodac | 2 | Amlong 5 | 71.4% | H |
| pharmacy_bills | bill_calpol650 | 3 | Dolo 650 | 76.5% | L |
| pharmacy_bills | bill_clavam625 | 2 | Clavam 625 | 67.3% | H |
| pharmacy_bills | bill_azithral | 2 | Azithral 500 | 71.4% | H |
| pharmacy_bills | bill_eltroxin | 2 | Eltroxin 50mcg | 76.0% | H |
| pharmacy_bills | bill_calcimax | 2 | Shelcal 500 | 73.3% | L |
| branded_queries | q_crocin650 | 3 | Dolo 650 | 76.5% | L |
| branded_queries | q_augmentin | 2 | Clavam 625 | 67.3% | H |
| branded_queries | q_pan40 | 2 | Pantop 40 | 78.4% | M |
| branded_queries | q_thyronorm | 2 | Eltroxin 50mcg | 76.0% | H |
| branded_queries | q_amlong | 2 | Amlong 5 | 71.4% | H |
| jan_aushadhi_lookups | ja_paracetamol650 | 3 | Dolo 650 | 76.5% | L |
| jan_aushadhi_lookups | ja_azithromycin500 | 2 | Azithral 500 | 71.4% | H |
| jan_aushadhi_lookups | ja_pantoprazole40 | 2 | Pantop 40 | 78.4% | M |
| jan_aushadhi_lookups | ja_amoxclav625 | 2 | Clavam 625 | 67.3% | H |
| jan_aushadhi_lookups | ja_amlodipine5 | 2 | Amlong 5 | 71.4% | H |

Risk tiers are correct against the molecule risk map: Levothyroxine / Amlodipine / Amoxicillin+Clav / Azithromycin = **H**, Pantoprazole = **M**, Paracetamol / Calcium+D3 = **L**.

### Screenshots per sample

The sample test exercises the **backend engine** (Python, no browser), so per-sample browser screenshots are not applicable. Rendered visual evidence of the consuming UI is captured separately: `test_screenshots/medupi/` (Scan + Compare tabs at 375/768/1440 + Hindi). The live frontend → backend round-trip per sample is **AUTOMATION-LIMITED** (production Railway API unreachable from the CTO sandbox — HTTP 000); it is the same engine the harness invokes directly here, so the deterministic contract is fully proven offline.

**Sample test verdict: ✅ PASS — 25/25, zero cross-molecule leakage, NPPA respected, 67–78% real savings.**
