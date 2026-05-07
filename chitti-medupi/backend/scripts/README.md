# Chitti MedUPI — Real Data Loader

> Replaces the 51-row hand-curated seed with **2,000+ real medicines** and **11,000+ real Jan Aushadhi stores** from government + free public sources.

## Why government data?

The NPPA + Jan Aushadhi (BPPI) + CDSCO data is **better than scraped data** because:

- ✅ **Government-verified** — authoritative source-of-truth
- ✅ **Official ceiling prices** — NPPA prices are legal maximums, not market gossip
- ✅ **Legally clean** — public-domain, redistributable, no ToS risk
- ✅ **Updated regularly** — government pushes new notifications periodically
- ✅ **Composition-canonical** — CDSCO molecule names are the regulatory truth

## What this loader does NOT do

❌ **Does not scrape** Tata 1mg, PharmEasy, NetMeds, Apollo 24|7, Amazon Pharmacy.

Their data is proprietary; scraping violates their ToS. Government data covers the
same ground (composition + ceiling price + nearest-store) without the legal risk.

## Sources (all free + public)

| Source | URL | What you get |
|---|---|---|
| **NPPA Ceiling Prices** | https://www.nppa.gov.in/drug-price/ | ~870 scheduled-drug ceiling prices (legal max retail). Use for `nppa_ceiling_price`. |
| **Jan Aushadhi (BPPI) Stores** | https://janaushadhi.gov.in/storelist.aspx | 11,000+ store list with addresses, lat/lng, phone, hours. |
| **Jan Aushadhi (BPPI) Products** | https://janaushadhi.gov.in/productlist.aspx | ~2,000 generic products with composition + strength + MRP + drug code + therapeutic category. |
| **CDSCO Approved Formulations** | https://cdsco.gov.in/opencms/opencms/en/Approval_new/ | Composition + schedule (H / H1 / X / OTC). Drives `prescription_required`. |
| **Kaggle A-Z Medicine Dataset of India** | https://www.kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india | ~250,000 branded MRP rows. One-time bulk reference. |
| **RxNorm (NIH REST)** | https://rxnav.nlm.nih.gov/REST/ | Canonical molecule names + RxCUI. Used to enrich + normalize. |
| **OpenFDA REST** | https://api.fda.gov/drug/label.json | US-context warnings + indications. Cross-reference only — not auto-rendered in UI. |

## Setup

```bash
cd chitti-medupi/backend
pip install -r requirements.txt
```

The loader needs `pandas` + `openpyxl` (already in requirements.txt) for CSV / Excel parsing.

## Step-by-step download

The Jan Aushadhi + NPPA + CDSCO pages publish files as CSV / Excel attached to dynamic
ASP.NET pages — **direct CSV URLs change between releases**, so the loader supports
both `--url` (best-effort fetch) and `--file` (you download once, feed the path in).

The recommended workflow:

### 1. Jan Aushadhi store list (~11,000 stores)

1. Visit https://janaushadhi.gov.in/storelist.aspx
2. Click "Download" / export. Save as `stores.csv` (or `.xlsx`).
3. Run:
   ```bash
   python scripts/load_real_data.py --source jan_aushadhi --file stores.csv
   ```

### 2. Jan Aushadhi product price list (~2,000 medicines)

1. Visit https://janaushadhi.gov.in/productlist.aspx
2. Download as `bppi_products.csv` (or `.xlsx`).
3. Run:
   ```bash
   python scripts/load_real_data.py --source bppi_products --file bppi_products.csv
   ```

### 3. NPPA ceiling prices (overlays existing rows)

1. Visit https://www.nppa.gov.in/drug-price/
2. Download the latest "Ceiling Price" notification (CSV / XLSX).
3. Run:
   ```bash
   python scripts/load_real_data.py --source nppa --file nppa_ceiling.xlsx
   ```
4. The loader updates the `nppa_ceiling_price` field on every existing brand
   matching that composition+strength+form. New rows are inserted only when
   no brand matches (surfacing the ceiling for that composition).

### 4. CDSCO schedule + therapeutic class (overlays existing rows)

1. Visit https://cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-Drugs/
2. Download an approved-formulations CSV / XLSX.
3. Run:
   ```bash
   python scripts/load_real_data.py --source cdsco --file cdsco_approved.csv
   ```

### 5. Kaggle A-Z Medicine Dataset of India (~250,000 branded rows · one-time)

1. Visit https://www.kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india
2. Download the dataset (free Kaggle account required). Unzip → `kaggle.csv` (or whatever the file is named — the loader reads any CSV/XLSX).
3. Run:
   ```bash
   python scripts/load_real_data.py --source kaggle --file kaggle.csv
   ```
4. The loader merges `short_composition*` columns, infers strength + dosage form from pack labels, batches commits at 500 rows. Stamps `price_source='kaggle'` on every row so the freshness UI shows "Last updated X days ago" against the Kaggle date.

### 6. RxNorm + OpenFDA enrichment (live REST APIs)

```bash
python scripts/load_real_data.py --source rxnorm
python scripts/load_real_data.py --source openfda
```

These walk the existing DB, fetch enrichment for every distinct molecule, and
write JSON to `scripts/data_cache/rxnorm_enrichment.json` /
`scripts/data_cache/openfda_enrichment.json`. Both are polite (200–300 ms between
calls). Re-runs use a local cache so you don't re-hit the API for known molecules.

### 7. Or: run everything in one go

```bash
python scripts/load_real_data.py --all --file stores.csv  # for the file-based loaders
# (you'll need to pass --file per source — easier to script the loop)
```

## Flags

```
--source  jan_aushadhi | bppi_products | nppa | cdsco | kaggle | rxnorm | openfda
--file    Path to downloaded CSV / XLSX / JSON
--url     Optional URL to fetch (cached under scripts/data_cache/)
--dry-run Parse + log counts but do NOT write to DB
--force   Re-download a cached URL fetch
--reset   DESTRUCTIVE: wipe medicines + stores tables before loading
--verbose Debug-level logging
```

## What gets upserted

| Table | Natural key | Behaviour |
|---|---|---|
| `medicines` | `(brand_name_lower, strength_lower, dosage_form_lower)` | Insert if missing; otherwise update non-None fields. |
| `jan_aushadhi_stores` | `store_code` | Insert if missing; otherwise update all fields + bump `last_verified`. |

Re-running on the same file is safe — no duplicates.

## Validation

After loading, verify counts:

```bash
python -c "
from database import SessionLocal
from models.medicine import Medicine
from models.jan_aushadhi import JanAushadhiStore
db = SessionLocal()
print('medicines:', db.query(Medicine).count())
print('stores:   ', db.query(JanAushadhiStore).count())
"
```

Spot-check a brand:

```bash
curl 'http://localhost:8001/api/medupi/medicine/Crocin%20650'
```

## Cache directory

`scripts/data_cache/` holds:
- Downloaded source files (when `--url` is used)
- `rxnorm_enrichment.json` (RxCUI + canonical names)
- `openfda_enrichment.json` (US warning text)

Safe to delete — the loaders re-fetch when missing.

## When source URLs change

Government sites occasionally restructure. If `--url` returns a 404, just download
manually in your browser and use `--file` instead. The loader's column-name parser
handles common alias variations ("Store Name" vs "Kendra Name" vs "Name of PMBJK").
