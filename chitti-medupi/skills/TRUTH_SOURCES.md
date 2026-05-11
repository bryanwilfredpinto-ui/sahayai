# TRUTH_SOURCES — Verified Sources

Every fact MedUPI surfaces traces back to one of these sources. Each entry lists: where it lives, refresh cadence, fallback behaviour, and how a loader run is recorded.

---

## 1. Apollo Pharmacy CSV (the catalogue base)
- **What it provides:** Brand name, salt composition, strength, dosage form, MRP, manufacturer, pack size. The dataset that seeds the strict-match index.
- **Volume:** 211,207 rows currently loaded into `medupi.medicines`.
- **URL / file:** Bryan-curated CSV (not a live URL — file-based snapshot).
- **Refresh cadence:** Annual or on Bryan's request; logged in `medupi.loader_run`.
- **Fallback:** None — this is the catalogue base. If a medicine is not in this table, the strict-match returns empty and the user is routed to voice/text search.
- **Loader:** [`scripts/load_real_data.py --source apollo_csv`](../backend/scripts/load_real_data.py).

---

## 2. Jan Aushadhi product list (BPPI)
- **What it provides:** Official BPPI generic prices — the `jan_aushadhi_price` column.
- **URL:** https://janaushadhi.gov.in (BPPI product catalogue — Bryan downloads the CSV/XLSX).
- **Volume:** ~2,000 medicines expected when fully loaded.
- **Refresh cadence:** Quarterly or whenever BPPI publishes an update; tracked in `medupi.loader_run.source='bppi_products'`.
- **Fallback:** When a medicine has no `jan_aushadhi_price` row, the alternative card simply omits the Jan Aushadhi line — never extrapolates from MRP.
- **Loader:** `python scripts/load_real_data.py --source bppi_products --file <path>`.

---

## 3. Jan Aushadhi store list (BPPI)
- **What it provides:** ~11,000 store rows with lat/lng + state + district + pincode. Drives the haversine geo lookup and by-state fallback.
- **URL:** https://janaushadhi.gov.in (store-locator export).
- **Stored table:** `medupi.jan_aushadhi`.
- **Refresh cadence:** Quarterly; logged in `medupi.loader_run.source='jan_aushadhi'`.
- **Fallback:** When haversine finds zero stores within radius, the response is empty list — never a synthesised entry. By-state list shown as a secondary panel.
- **Loader:** `python scripts/load_real_data.py --source jan_aushadhi --file <path>`.

---

## 4. NPPA ceiling-price list
- **What it provides:** Drug Price Control Order (DPCO 2013) ceiling prices — the `nppa_ceiling_price` column.
- **URL:** https://nppa.gov.in (NPPA-notified ceiling prices, periodic SO/notifications).
- **Refresh cadence:** Quarterly; NPPA publishes via official notifications.
- **Fallback:** When a medicine has no NPPA ceiling, the field is `null` and the UI omits the line — never extrapolates.
- **Loader:** `python scripts/load_real_data.py --source nppa --file <path>` (updates existing rows; does not insert new molecules).

---

## 5. CDSCO scheduled-drug list
- **What it provides:** Schedule H / H1 / X classification — drives the `prescription_required` flag.
- **URL:** https://cdsco.gov.in (Drugs & Cosmetics Rules schedules).
- **Refresh cadence:** Annual or on CDSCO update.
- **Fallback:** Unknown schedule defaults to "treat as prescription-only" (safe side).
- **Loader:** `python scripts/load_real_data.py --source cdsco --file <path>`.

---

## 6. RxNorm enrichment (US National Library of Medicine)
- **What it provides:** Canonical salt names and RxCUI cross-reference for cleaner strict-match keys.
- **URL:** https://rxnav.nlm.nih.gov (RxNorm API).
- **Stored:** Enrichment cache at `backend/data_cache/rxnorm_enrichment.json`; pending fold into `medupi.medicines.rxcui` column (see [TODO.md](../TODO.md) §12).
- **Refresh cadence:** Annual (RxNorm is monthly upstream; we cache).
- **Fallback:** Salts without RxCUI still work for strict matching — RxCUI is enrichment, not a hard dependency.

---

## 7. OpenFDA cross-reference
- **What it provides:** Cross-references to FDA drug labels (where relevant for international travellers / NRIs).
- **URL:** https://open.fda.gov.
- **Stored:** Enrichment cache at `backend/data_cache/openfda_enrichment.json`.
- **Refresh cadence:** Annual.
- **Fallback:** Cosmetic only; no UI hard-dependency.

---

## 8. Kaggle Indian medicines dataset (~250k branded rows)
- **What it provides:** Wide-coverage branded catalogue to complement the Apollo base.
- **URL:** Kaggle community-curated dataset (Bryan-vetted before load).
- **Refresh cadence:** Ad-hoc.
- **Fallback:** Treated as enrichment over Apollo; Apollo wins on conflict.
- **Loader:** `python scripts/load_real_data.py --source kaggle --file <path>` (~5 min batch-committed).

---

## 9. Brave Search API (live pharmacy snippets)
- **What it provides:** Snippet-only price discovery across 1mg / PharmEasy / NetMeds / Apollo Pharmacy online / MedPlus / TrueMeds. **We never visit the URL — only the snippet.**
- **URL:** https://api.search.brave.com.
- **Refresh cadence:** On-demand per user query; cached briefly in `medupi.price_cache` with a freshness timestamp.
- **Fallback:** When Brave quota is exhausted (HTTP 429) or the API is down, the freshness pill shows "live prices unavailable — showing last known" in EN / HI, and the cached snippet is displayed with its original age. After the cache window, the live-prices panel is hidden entirely rather than showing stale data as current.
- **See:** [`services/medupi_brave.py`](../backend/services/medupi_brave.py).

---

## 10. Insurance coverage seed (Ayushman / CGHS / ESI / private)
- **What it provides:** Therapeutic-class coverage flags for the insurance match endpoint.
- **Source:** `backend/data/insurance_coverage_seed.json` — seed data, currently a therapeutic-class proxy.
- **Refresh cadence:** Pending — to be replaced by the official Ayushman empanelled-medicine list once available (see [TODO.md](../TODO.md) §9).
- **Fallback:** When a molecule has no coverage row, response is `{"covered": null, "reason_en": "Coverage not on record", "reason_hi": "बीमा की जानकारी उपलब्ध नहीं है"}` — never inferred from class alone without surfacing the proxy nature.

---

## Loader audit trail

Every data load is recorded in `medupi.loader_run` with:
- `source` (one of: `apollo_csv`, `bppi_products`, `jan_aushadhi`, `nppa`, `cdsco`, `kaggle`, `rxnorm`, `openfda`)
- `started_at`, `finished_at`
- `rows_loaded`, `rows_skipped`, `rows_errored`
- `notes`

A row in the application table without a corresponding loader run is a violation — the database is the truth, the loader run is the receipt.
