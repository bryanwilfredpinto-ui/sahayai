# Architecture

The Chitti MedUPI backend is a **Flask + SQLAlchemy + Postgres** service with in-process APScheduler cron, served by gunicorn on Render free tier. It shares its Neon Postgres host with Chitti Shares but keeps every table under a dedicated `medupi.*` schema for isolation. All AI vision (image scan) currently runs through Anthropic Claude — slated for migration to DeepSeek-VL per the 2026-05-11 *"DeepSeek for all"* decision.

---

## 1. The stack

| Layer | Choice | Why |
|---|---|---|
| Web framework | **Flask 3** + flask-cors + gunicorn | Render free-tier slim image lacks Rust toolchain → pydantic-core can never compile → FastAPI v2 ruled out. Flask is pure Python. See [9b55dac](#) commit. |
| ORM | SQLAlchemy 2.0 (Declarative + Session) | Same as Chitti Shares for cross-product muscle memory. |
| DB driver | `psycopg2-binary==2.9.10` | Binary distro — never compiles libpq from source. |
| Migrations | Hand-rolled idempotent ALTER TABLE in [`services/medupi_migrations.py`](backend/services/medupi_migrations.py) | No alembic dep. Dialect-aware (SQLite + Postgres). |
| Scheduler | **APScheduler 3.10** in `BackgroundScheduler` mode | In-process — no external cron service needed. Same pattern as Chitti Shares. |
| Vision (image scan) | **Anthropic Claude** via `anthropic==0.39.0` SDK | Vision-capable models read medicine strips directly. No Tesseract install pain. **Migration to DeepSeek-VL pending.** |
| Live pharmacy prices | **Brave Search API** (free 2,000 q/mo) — snippet-only | ToS-safe alternative to scraping 1mg/PharmEasy/NetMeds. |
| Fuzzy search | `rapidfuzz==3.6.1` | Pre-built manylinux wheels for Python 3.11. |
| Config | `python-dotenv` + plain `os.environ` | No pydantic-settings (dropped with FastAPI). |
| Runtime | Python 3.11 (pinned via `runtime.txt`) | Render-supported + has wheels for everything we need. |

Full dependency list in [`requirements.txt`](backend/requirements.txt). Pinned at every layer to keep Render builds deterministic on the free tier.

---

## 2. Boot order

Defined in [`backend/main.py`](backend/main.py) — runs **once per gunicorn worker** on module import, before the app is exposed to traffic.

```
gunicorn imports main.py
       │
       ▼
   _bootstrap()
       │
       ├── 1. medupi_migrations.ensure_schema()
       │      → CREATE SCHEMA IF NOT EXISTS medupi  (Postgres only — no-op on SQLite)
       │
       ├── 2. Base.metadata.create_all(bind=engine)
       │      → creates medupi.medicines · medupi.jan_aushadhi_stores · etc.
       │      → idempotent — SQLAlchemy SKIPs existing tables
       │
       ├── 3. medupi_migrations.run_all()
       │      → ALTER TABLE medupi.medicines ADD COLUMN price_source VARCHAR(40)
       │      → ALTER TABLE medupi.medicines ADD COLUMN updated_at  TIMESTAMP + backfill
       │      → guarded by inspector → safe on every startup
       │
       ├── 4. medupi_database.seed_if_empty()       → 51 medicines (skipped if table non-empty)
       ├── 4. medupi_jan_aushadhi.seed_if_empty()   → 25 Jan Aushadhi stores
       │
       └── 5. medupi_scheduler.start()
              → registers 4 cron jobs (next section)
              → SCHEDULER_ENABLED=false env var skips this entirely (for tests)

   _create_app()  → Flask app + CORS + blueprint + error handlers → exposed as `app`
```

Every step in `_bootstrap()` is wrapped in a try/except that **logs and continues** — a single failure (e.g. scheduler can't start, seed file missing) never blocks the others. The bootstrap log lines are the operator's smoke-test on every deploy.

---

## 3. Schema isolation under `medupi.*`

Implemented in [`models/_schema.py`](backend/models/_schema.py). Every model attaches `__table_args__ = TABLE_KW` so SQLAlchemy puts the table in the right schema. Cross-table FKs use `fk_target("family_profiles")` which expands to `medupi.family_profiles.id` on Postgres but plain `family_profiles.id` on SQLite (which has no schemas).

```python
SCHEMA = "medupi" if DATABASE_URL.startswith("postgres") else None
TABLE_KW = {"schema": SCHEMA} if SCHEMA else {}
```

This lets us share the Neon database with Chitti Shares (which lives under `shares.*`) without colliding on table names — they each get their own `medicines`-equivalent. Local dev with SQLite remains a flat namespace.

---

## 4. The scheduler (APScheduler · Asia/Kolkata)

Implementation in [`services/medupi_scheduler.py`](backend/services/medupi_scheduler.py). Four cron jobs:

| Job ID | Cron (IST) | What it does |
|---|---|---|
| `monthly_jan_aushadhi` | 1st of month, 03:00 | Downloads BPPI product list, upserts ~2,000 generic rows |
| `weekly_nppa` | Mondays, 04:00 | Checks NPPA ceiling-price notifications |
| `daily_top100_brave` | Daily, 02:00 | Refreshes top-100 most-searched medicines via Brave Search |
| `cache_evict` | Daily, 02:55 | Drops expired `price_cache` rows |

Every run:
- Logs start + outcome
- Writes a row to `medupi.loader_runs` for the audit trail (source · status · rows_upserted · rows_skipped · rows_errors · note · started_at · finished_at)
- Catches every exception so a single failure doesn't silence future runs

The operator can introspect via `GET /api/medupi/scheduler/status` and force a job via `POST /api/medupi/scheduler/trigger/<job_id>` (light auth: `X-User-Token` header required).

---

## 5. The recognition pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ INPUT — one of:                                                 │
│   • image upload (multipart "image")                            │
│   • typed medicine name                                         │
│   • Web Speech API voice → text                                 │
│   • QR / GS1 Datamatrix scan                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ medupi_recognition.py                                           │
│   recognise_image() — Anthropic vision → strict JSON            │
│   recognise_text()  — rapidfuzz brand-name match against DB     │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ medupi_database.search_by_composition()                         │
│   STRICT: same molecule + strength + dosage form                │
│   Sorted ASC by jan_aushadhi_price then mrp                     │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ medupi_pricing.annotate_savings()                               │
│   Stamps savings_pct + above_nppa_ceiling on every alt          │
│ medupi_price_freshness.annotate()                               │
│   Stamps freshness_jan_aushadhi / freshness_nppa / freshness_mrp│
│ medupi_risk.classify()                                          │
│   Returns {class, symbol, label_en/hi, warning_en/hi}           │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response                                                        │
│   { ok, query, primary, matches, risk, alternatives, cheapest,  │
│     max_savings_pct, disclaimer_en/hi, speak_en/hi,             │
│     caption_en/hi, purpose_en/hi }                              │
└─────────────────────────────────────────────────────────────────┘
```

The text path bumps `search_log.count` for the normalized query (drives the daily 02:00 IST Brave refresh job). The image path lands in the same matcher.

---

## 6. Service layer (one purpose per file)

| File | Purpose |
|---|---|
| [`medupi_database.py`](backend/services/medupi_database.py) | Master drug DB access · fuzzy brand search · STRICT composition lookup · `seed_if_empty()` |
| [`medupi_alternatives.py`](backend/services/medupi_alternatives.py) | Strict matcher entry point · risk-banded response · EN/HI speak + caption + disclaimer |
| [`medupi_recognition.py`](backend/services/medupi_recognition.py) | Anthropic vision for image scan + fuzzy text path |
| [`medupi_pricing.py`](backend/services/medupi_pricing.py) | `cheapest_price` · `annotate_savings` · `chronic_projection` |
| [`medupi_risk.py`](backend/services/medupi_risk.py) | 80+ molecule → H/M/L map · symbol · label_en/hi · warning_en/hi |
| [`medupi_jan_aushadhi.py`](backend/services/medupi_jan_aushadhi.py) | Haversine geo lookup · by-state fallback · `seed_if_empty()` |
| [`medupi_family.py`](backend/services/medupi_family.py) | Profile CRUD + wallet entries + monthly/annual report |
| [`medupi_reminders.py`](backend/services/medupi_reminders.py) | Refill / expiry / dose / appointment CRUD + Twilio voice stub |
| [`medupi_insurance.py`](backend/services/medupi_insurance.py) | Coverage lookup by therapeutic class × scheme |
| [`medupi_brave_search.py`](backend/services/medupi_brave_search.py) | Brave Search snippet fetch · 24h cache · ALLOWED_DOMAINS guard |
| [`medupi_community.py`](backend/services/medupi_community.py) | User-reported prices · sanity bounds · median + IQR + by-city |
| [`medupi_search_log.py`](backend/services/medupi_search_log.py) | Per-query count tracker · drives top-100 refresh |
| [`medupi_price_freshness.py`](backend/services/medupi_price_freshness.py) | Age-based badges with EN/HI captions on every surfaced price |
| [`medupi_scheduler.py`](backend/services/medupi_scheduler.py) | APScheduler 4-job orchestration + audit trail |
| [`medupi_migrations.py`](backend/services/medupi_migrations.py) | `ensure_schema()` + idempotent column-level migrations |

---

## 7. The two-database story (live state as of 2026-05-11)

- The **standalone Apollo Pharmacy loader** ([`scripts/load_apollo_oneshot.py`](backend/scripts/load_apollo_oneshot.py)) loaded **211,207 rows** into Neon's `medupi.medicines` table.
- The live API at `chitti-medupi-api-production.up.railway.app` reads from the same Neon Postgres. (Earlier render.yaml briefly pointed to Supabase; switched back to Neon in commit `313bb2e`.)
- Schema isolation under `medupi.*` lets Chitti Shares share the same host without collision.
- The 51-row seed in [`data/medicines_seed.json`](backend/data/medicines_seed.json) only loads when the table is empty — production is well past that.

---

## 8. CORS + error handling

- CORS allowed origins are env-driven (`ALLOWED_ORIGINS` comma-separated). Defaults cover localhost + sahayai.in + the Render-hosted frontend.
- Flask error handlers are registered for 400 / 404 / 405 / 413 / 415 / 500. All return JSON shape `{"error": "<code>", "detail": "..."}`.
- Upload cap: **8 MB** on `/api/medupi/scan` (configured via `MAX_CONTENT_LENGTH`).
- Light auth on family-wallet / reminder / scheduler-trigger routes via the `X-User-Token` request header (must be ≥8 chars). Frontend generates a UUID per device and stores in localStorage.
