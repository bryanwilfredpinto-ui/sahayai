# Database

All tables live under the `medupi.*` schema on Postgres (Neon). On SQLite (local dev) the schema is `None` and tables live in the flat default namespace. Schema decision is centralised in [`models/_schema.py`](backend/models/_schema.py).

```python
SCHEMA  = "medupi" if DATABASE_URL.startswith("postgres") else None
TABLE_KW = {"schema": SCHEMA} if SCHEMA else {}
```

Cross-schema foreign keys are resolved via `fk_target("family_profiles")` which expands to `medupi.family_profiles.id` on Postgres and `family_profiles.id` on SQLite.

---

## Table catalogue

| Table | Purpose | Rows in production |
|---|---|---|
| `medupi.medicines` | Master drug DB | **211,207** (Apollo Pharmacy dataset, loaded 2026-05-09) |
| `medupi.jan_aushadhi_stores` | PMBJP store locations | ~25 seeded · 11,000+ when full loader runs |
| `medupi.family_profiles` | Family wallet multi-profile | per-user |
| `medupi.wallet_entries` | Logged medicine purchases | per-user |
| `medupi.reminders` | Refill / expiry / dose / appointment | per-user |
| `medupi.price_cache` | Brave Search snippet cache (24h TTL) | populated by scheduler |
| `medupi.community_prices` | User-reported prices | per-user crowdsourced |
| `medupi.search_log` | Per-query search count | drives top-100 refresh |
| `medupi.loader_runs` | Scheduler + manual loader audit trail | append-only |

---

## 1. `medupi.medicines` — master drug DB

Defined in [`models/medicine.py`](backend/models/medicine.py). One row per Indian retail medicine SKU.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | autoincrement |
| `brand_name` | VARCHAR(140) NOT NULL · indexed | retail brand (e.g. "Crocin 650") |
| `salt_composition` | VARCHAR(240) NOT NULL · indexed | molecule string, joined with `+` for combos |
| `salt_components` | TEXT NULL | JSON list of `{molecule, strength, unit}` |
| `strength` | VARCHAR(60) NOT NULL · indexed | "650mg", "100mcg", "500+125mg" |
| `dosage_form` | VARCHAR(40) NOT NULL · indexed | tablet / capsule / syrup / injection / cream / drops / sachet |
| `pack_size` | VARCHAR(60) NULL | "15 tabs", "100 ml" |
| `manufacturer` | VARCHAR(160) NULL |  |
| `mrp` | FLOAT NULL | branded MRP |
| `nppa_ceiling_price` | FLOAT NULL | maximum legal price per DPCO |
| `jan_aushadhi_price` | FLOAT NULL | official PMBJP price |
| `jan_aushadhi_code` | VARCHAR(40) NULL | PMBJP product code |
| `risk_class` | VARCHAR(2) NOT NULL · indexed · default `'L'` | H / M / L |
| `schedule` | VARCHAR(8) NULL | H / H1 / X / OTC |
| `prescription_required` | INTEGER NOT NULL · default `0` | 0/1 bool |
| `therapeutic_class` | VARCHAR(80) NULL · indexed | "antibiotic", "antihypertensive", ... |
| `purpose_en` | TEXT NULL | plain-English purpose — never advice |
| `purpose_hi` | TEXT NULL | Hindi purpose |
| `price_source` | VARCHAR(40) NULL | jan_aushadhi / nppa / kaggle / brave / community / manual / apollo_dataset |
| `created_at` | TIMESTAMP NOT NULL | default `now()` |
| `updated_at` | TIMESTAMP NOT NULL | default `now()` · `onupdate=now()` |

### Indexes
- Primary: `id`
- Single-column: `brand_name` · `salt_composition` · `strength` · `dosage_form` · `risk_class` · `therapeutic_class`
- **Composite:** `ix_medicines_strict_match` on `(salt_composition, strength, dosage_form)` — powers the hot-path STRICT matcher

### Unique constraint (Postgres only)
```sql
CONSTRAINT uniq_medicines_lower_bsf UNIQUE (brand_name, strength, dosage_form)
```
Created by [`scripts/load_apollo_oneshot.py`](backend/scripts/load_apollo_oneshot.py) → `ensure_unique_index()`. The Apollo loader and any future loaders use `ON CONFLICT ON CONSTRAINT uniq_medicines_lower_bsf DO UPDATE` for idempotent upserts. Idempotent: the DO-block skips if already present.

### Migration history
- `price_source` column added at v1.7 via [`services/medupi_migrations.py`](backend/services/medupi_migrations.py) → `_PATCHES_MEDICINES`
- `updated_at` column added at v1.7 with NULL backfill to `now()` for legacy rows

---

## 2. `medupi.jan_aushadhi_stores` — PMBJP stores

Defined in [`models/jan_aushadhi.py`](backend/models/jan_aushadhi.py). 11,000+ stores nationwide (public CSV at janaushadhi.gov.in).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `store_code` | VARCHAR(40) UNIQUE NOT NULL · indexed | natural key for idempotent upserts |
| `name` | VARCHAR(200) NOT NULL | |
| `address` | VARCHAR(400) NULL | |
| `district` | VARCHAR(80) NULL · indexed | |
| `state` | VARCHAR(80) NULL · indexed | |
| `pincode` | VARCHAR(10) NULL · indexed | |
| `phone` | VARCHAR(40) NULL | |
| `hours` | VARCHAR(120) NULL | |
| `lat` | FLOAT NOT NULL | |
| `lng` | FLOAT NOT NULL | |
| `last_verified` | TIMESTAMP NOT NULL · default `now()` | |

---

## 3. `medupi.family_profiles` — multi-profile wallet

Defined in [`models/family.py`](backend/models/family.py). Auth-light: keyed by `user_token` (frontend-generated UUID stored in localStorage).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `user_token` | VARCHAR(80) NOT NULL · indexed | per-device opaque string |
| `name` | VARCHAR(120) NOT NULL | |
| `relation` | VARCHAR(40) NOT NULL · default `'self'` | self / mother / father / spouse / child / ... |
| `dob` | VARCHAR(12) NULL | ISO date string |
| `conditions` | TEXT NULL | JSON list (e.g. `["diabetes", "BP"]`) |
| `created_at` | TIMESTAMP NOT NULL · default `now()` | |

---

## 4. `medupi.wallet_entries` — purchases

Defined in [`models/wallet.py`](backend/models/wallet.py). One row per medicine purchase logged against a family profile.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `profile_id` | INTEGER NOT NULL · indexed · **FK** → `family_profiles.id` | |
| `user_token` | VARCHAR(80) NOT NULL · indexed | duplicated for fast filtering |
| `medicine_name` | VARCHAR(160) NOT NULL | |
| `salt_composition` | VARCHAR(240) NULL | |
| `qty` | INTEGER NOT NULL · default `1` | |
| `price_paid` | FLOAT NOT NULL · default `0.0` | |
| `cheapest_equivalent_price` | FLOAT NULL | |
| `savings_realized` | FLOAT NOT NULL · default `0.0` | server-computed: `(price_paid - cheapest_eq) * qty` |
| `purchased_at` | TIMESTAMP NOT NULL · indexed · default `now()` | drives this-month / 12-month report aggregation |

---

## 5. `medupi.reminders` — refill / expiry / dose / appointment

Defined in [`models/reminder.py`](backend/models/reminder.py).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `profile_id` | INTEGER NOT NULL · indexed · **FK** → `family_profiles.id` | |
| `user_token` | VARCHAR(80) NOT NULL · indexed | |
| `medicine_name` | VARCHAR(160) NOT NULL | |
| `kind` | VARCHAR(20) NOT NULL · default `'refill'` | refill / expiry / dose / appointment |
| `next_due` | TIMESTAMP NOT NULL · indexed | |
| `recurrence` | VARCHAR(40) NULL | daily / weekly / monthly / once |
| `note` | VARCHAR(240) NULL | |
| `status` | VARCHAR(16) NOT NULL · default `'active'` | active / done / dismissed |
| `created_at` | TIMESTAMP NOT NULL · default `now()` | |

---

## 6. `medupi.price_cache` — Brave Search snippet cache

Defined in [`models/price_cache.py`](backend/models/price_cache.py). Cache TTL = **24 hours** per `(medicine_query, source_domain)` pair. Snippet text only — we never visit the pharmacy URL.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `medicine_query` | VARCHAR(160) NOT NULL · indexed | lowercased search term |
| `source_domain` | VARCHAR(80) NOT NULL | 1mg.com / pharmeasy.in / netmeds.com / apollopharmacy.in / ... |
| `price` | FLOAT NULL | extracted via rupee regex from title+description |
| `title` | VARCHAR(300) NULL | |
| `snippet` | TEXT NULL | up to 1000 chars |
| `url` | VARCHAR(500) NULL | |
| `fetched_at` | TIMESTAMP NOT NULL · indexed · default `now()` | |
| `expires_at` | TIMESTAMP NOT NULL · indexed | `fetched_at + 24h` |

### Index
- `ix_price_cache_medicine_source` on `(medicine_query, source_domain)` — natural lookup key

Daily `cache_evict` job at 02:55 IST deletes rows where `expires_at <= now()`.

---

## 7. `medupi.community_prices` — user-reported prices

Defined in [`models/community_price.py`](backend/models/community_price.py). Crowdsourced. Always rendered with a *"User reported — verify before purchase"* badge.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `user_token` | VARCHAR(80) NOT NULL · indexed | |
| `medicine_name` | VARCHAR(160) NOT NULL · indexed | |
| `salt_composition` | VARCHAR(240) NULL | |
| `strength` | VARCHAR(60) NULL | |
| `dosage_form` | VARCHAR(40) NULL | |
| `price_paid` | FLOAT NOT NULL | sanity bounds: 0.5 ≤ x ≤ 100,000 |
| `pharmacy_name` | VARCHAR(200) NULL | |
| `city` | VARCHAR(120) NULL · indexed | |
| `state` | VARCHAR(80) NULL | |
| `pincode` | VARCHAR(10) NULL | |
| `lat` | FLOAT NULL | |
| `lng` | FLOAT NULL | |
| `status` | VARCHAR(16) NOT NULL · indexed · default `'active'` | active / flagged / removed |
| `reported_at` | TIMESTAMP NOT NULL · indexed · default `now()` | |

### Index
- `ix_community_prices_lookup` on `(medicine_name, city, status)`

### Rate limit (application-level)
Same `user_token` can submit at most **20 reports/minute** — enforced in [`services/medupi_community.py`](backend/services/medupi_community.py) → `add_report()`.

---

## 8. `medupi.search_log` — search-frequency tracker

Defined in [`models/search_log.py`](backend/models/search_log.py). One row per distinct medicine query — each search bumps `count` and `last_searched_at`. **No per-search rows.** Drives the daily 02:00 IST top-100 Brave refresh job.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `query_normalized` | VARCHAR(160) UNIQUE NOT NULL · indexed | lowercased + whitespace-collapsed |
| `display_query` | VARCHAR(160) NOT NULL | original user input |
| `count` | INTEGER NOT NULL · default `1` | |
| `last_searched_at` | TIMESTAMP NOT NULL · indexed · default `now()` | |

Read by `top_n(100)` ordered by `count DESC, last_searched_at DESC`.

---

## 9. `medupi.loader_runs` — audit trail

Defined in [`models/loader_run.py`](backend/models/loader_run.py). One row per scheduler-triggered or manual loader run. Append-only.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `source` | VARCHAR(40) NOT NULL · indexed | jan_aushadhi / nppa / top100_brave / cache_evict / manual / apollo_dataset / community |
| `status` | VARCHAR(16) NOT NULL · default `'ok'` | ok / failed / partial |
| `rows_upserted` | INTEGER NOT NULL · default `0` | |
| `rows_skipped` | INTEGER NOT NULL · default `0` | |
| `rows_errors` | INTEGER NOT NULL · default `0` | |
| `note` | TEXT NULL | up to 2000 chars |
| `started_at` | TIMESTAMP NOT NULL · indexed · default `now()` | |
| `finished_at` | TIMESTAMP NULL | |

Writes are best-effort (failures inside `_record_run` are logged but never raised — a metrics failure must not silence the scheduler).

---

## Schema bootstrap order

Defined in [`backend/main.py`](backend/main.py) → `_bootstrap()`:

1. `medupi_migrations.ensure_schema()` → `CREATE SCHEMA IF NOT EXISTS medupi` (Postgres only)
2. `Base.metadata.create_all(bind=engine)` → SQLAlchemy creates every missing table (idempotent)
3. `medupi_migrations.run_all()` → idempotent `ALTER TABLE … ADD COLUMN` for v1.7 patches (`price_source`, `updated_at`)
4. `medupi_database.seed_if_empty()` → loads `data/medicines_seed.json` (51 rows) **only if `medicines` is empty**
5. `medupi_jan_aushadhi.seed_if_empty()` → loads `data/jan_aushadhi_seed.json` (25 rows) **only if empty**

Step 4 is a no-op in production (the Apollo loader populated 211k rows).
