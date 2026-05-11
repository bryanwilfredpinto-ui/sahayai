# Chitti Government — Database

Schema isolation is handled in
[`backend/models/_schema.py`](backend/models/_schema.py):

```python
SCHEMA = "government" if DATABASE_URL startswith postgres else None
TABLE_KW = {"schema": SCHEMA} if SCHEMA else {}
```

| Backend | Schema | Notes |
| --- | --- | --- |
| Postgres / Supabase (prod) | `government` | Created by `ensure_schema()` on first boot. |
| SQLite (`sqlite:///./chitti_government.db`, local dev) | none | SQLite has no schema concept. |

The shared Supabase Postgres lays out as:

```
public.*       ← chitti-shares
medupi.*       ← chitti-medupi
government.*   ← this product
```

`Base.metadata.create_all(bind=engine)` is invoked in
[`backend/main.py::_bootstrap()`](backend/main.py) immediately after
`ensure_schema()`. All four tables below are imported by
[`backend/models/__init__.py`](backend/models/__init__.py) so they register
with `Base.metadata`.

---

## Table summary

| Table | Source file | Purpose |
| --- | --- | --- |
| `government.schemes` | [`models/scheme.py`](backend/models/scheme.py) | Curated catalog (30 seeded rows). |
| `government.pib_announcements` | [`models/pib_announcement.py`](backend/models/pib_announcement.py) | PIB RSS items deduped by GUID. |
| `government.feedback` | [`models/feedback.py`](backend/models/feedback.py) | Anonymous up/down + optional 240-char note. |
| `government.ingest_logs` | [`models/ingest_log.py`](backend/models/ingest_log.py) | One row per scheduler run; powers `/freshness`. |

---

## `government.schemes`

The catalog. One row per central or state scheme.

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `Integer PRIMARY KEY AUTOINCREMENT` | NO | |
| `slug` | `VARCHAR(120) UNIQUE INDEX` | NO | URL-safe identifier (e.g. `pm-kisan`). |
| `name_en` | `VARCHAR(240)` | NO | English name. |
| `name_hi` | `VARCHAR(240)` | YES | Devanagari name. |
| `short_code` | `VARCHAR(40) INDEX` | YES | `PM-Kisan`, `PMAY-G`, `PMJAY`, … |
| `ministry` | `VARCHAR(160)` | YES | |
| `level` | `VARCHAR(16) DEFAULT 'central'` | NO | `central` or `state`. |
| `state_code` | `VARCHAR(8) INDEX` | YES | ISO 3166-2:IN code, e.g. `MP`. Only present for `level='state'`. |
| `category` | `JSON DEFAULT []` | NO | Array of tags: `agriculture`, `health`, `insurance`, `housing`, `pension`, `disability`, `education`, `income-support`, etc. |
| `benefit_amount_inr` | `Integer` | YES | Annual or one-time INR benefit. |
| `benefit_type` | `VARCHAR(24)` | YES | `cash`, `insurance`, `subsidy`, `service`. |
| `benefit_summary_en` | `Text` | YES | |
| `benefit_summary_hi` | `Text` | YES | |
| `age_min` | `Integer` | YES | NULL = unconstrained. |
| `age_max` | `Integer` | YES | NULL = unconstrained. |
| `gender` | `VARCHAR(8)` | YES | `any` / `f` / `m` / `other`. |
| `income_max_annual_inr` | `Integer` | YES | Cap on family annual income. |
| `bpl_required` | `Boolean` | YES | NULL = unconstrained. |
| `secc_deprivation_required` | `Boolean` | YES | Required for PMJAY etc. |
| `occupation` | `JSON DEFAULT []` | NO | Array of strings (`farmer`, `artisan`, `street_vendor`, `widow`, ...). |
| `landholding_max_ha` | `Float` | YES | |
| `landholding_min_ha` | `Float` | YES | |
| `caste` | `JSON DEFAULT []` | NO | Subset of `['SC','ST','OBC','GEN']`. |
| `disability_required` | `Boolean` | YES | |
| `rural_urban` | `VARCHAR(8)` | YES | `rural` / `urban` / `both`. |
| `exclusions` | `JSON DEFAULT []` | NO | Free-text exclusion clauses rendered to the user verbatim. |
| `eligibility_notes_en` | `Text` | YES | One-paragraph plain-English caveat. |
| `eligibility_notes_hi` | `Text` | YES | Hindi version. |
| `documents_required` | `JSON DEFAULT []` | NO | Array of document names. |
| `application_url` | `VARCHAR(400)` | YES | Apply portal. |
| `status_check_url` | `VARCHAR(400)` | YES | Status check portal (if any). |
| `source_url` | `VARCHAR(400)` | YES | Authoritative source. |
| `helpline` | `VARCHAR(48)` | YES | Phone numbers, slash-separated when multi. |
| `is_active` | `Boolean DEFAULT true` | NO | List endpoint filters `is_active=true`. |
| `last_synced_at` | `DateTime DEFAULT utcnow` | NO | Used by `/freshness`. |
| `created_at` | `DateTime DEFAULT utcnow` | NO | |

### Seed

[`backend/data/schemes_seed.json`](backend/data/schemes_seed.json) — 30 rows.

```text
pm-kisan · pmjay-ayushman-bharat · pmay-g · pmay-u · ujjwala-pmuy
sukanya-samriddhi · atal-pension-yojana · mgnrega
nsp-scholarship-pre-matric-sc · nsp-post-matric-st · nsp-post-matric-obc
stand-up-india · pmegp · mudra-shishu · pm-svanidhi
ladli-behna-mp · saubhagya · swachh-bharat-mission-toilet
pm-vishwakarma · ews-reservation-cert
pradhan-mantri-suraksha-bima · pradhan-mantri-jeevan-jyoti
national-old-age-pension-iginoaps · indira-gandhi-widow-pension
national-disability-pension · udid-disability-card
ration-card-nfsa · kisan-credit-card · pmfby-fasal-bima · skill-india-pmkvy
```

Inserted by
[`backend/services/government_database.py::seed_if_empty()`](backend/services/government_database.py)
only if `SELECT count(*) FROM government.schemes = 0`. The function is
idempotent across gunicorn worker boots.

### Eligibility predicate semantics

`NULL` means "not constrained" → the rule engine treats the predicate as
`skip` (the row never appears in the rules array).
`[]` for JSON columns means "not constrained" too. See
[ARCHITECTURE.md#eligibility-rule-engine](ARCHITECTURE.md) for the
aggregation rules.

---

## `government.pib_announcements`

PIB RSS items polled every 6 h by
[`backend/services/government_pib.py`](backend/services/government_pib.py).

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `Integer PK` | NO | |
| `guid` | `VARCHAR(400) UNIQUE INDEX` | NO | RSS `<guid>` (falls back to `<link>`). Dedupe key. |
| `title_en` | `VARCHAR(600)` | NO | English title; Hindi-feed rows fold `title` into this too so the frontend always has a safe label. |
| `title_hi` | `VARCHAR(600)` | YES | Original Hindi title. |
| `summary` | `Text` | YES | First 1 500 chars of the RSS description. |
| `link` | `VARCHAR(600)` | NO | PIB press release URL. |
| `ministry` | `VARCHAR(160)` | YES | From `PIB_FEEDS` table in code. |
| `feed_id` | `VARCHAR(48) INDEX` | NO | The `reg=` query value (e.g. `8` = Agriculture). |
| `language` | `VARCHAR(4) DEFAULT 'en'` | NO | `en` or `hi`. |
| `matched_scheme_slug` | `VARCHAR(120) INDEX` | YES | Set by the substring-match heuristic in `_match_scheme()`; `NULL` if no curated scheme matched. |
| `published_at` | `DateTime DEFAULT utcnow` | NO | Parsed from RSS `pubDate`. |
| `fetched_at` | `DateTime DEFAULT utcnow` | NO | When the poller stored the row. |

Indexes: `ix_pib_announcements_published` on `published_at` (declared in
`__table_args__`).

Cleanup: rows older than 90 days are deleted nightly at 03:00 IST by the
`cleanup_old_pib` job in
[`backend/services/government_scheduler.py`](backend/services/government_scheduler.py).

---

## `government.feedback`

Anonymous up/down on a Chitti Government interaction. **No user
identifier**, no IP, no name. The privacy contract is on the model
docstring.

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `Integer PK` | NO | |
| `feature` | `VARCHAR(64) INDEX` | NO | One of `eligibility_checker`, `alerts`, `locator`, `checklist`, `status_tracker`, `form_filler`, `digilocker_upload`, `general`. |
| `scheme_slug` | `VARCHAR(120) INDEX` | YES | Optional. |
| `verdict` | `VARCHAR(8)` | NO | `up` or `down`. |
| `note` | `Text` | YES | Trimmed to 240 chars by the route. |
| `created_at` | `DateTime DEFAULT utcnow` | NO | |

The route also rejects unknown `feature` values with `400 bad_request` —
see [`backend/routes/government.py`](backend/routes/government.py).

---

## `government.ingest_logs`

One row per scheduled job run. Surfaced verbatim by `/freshness`.

| Column | Type | Null | Notes |
| --- | --- | --- | --- |
| `id` | `Integer PK` | NO | |
| `job_name` | `VARCHAR(48) INDEX` | NO | `pib_poll`, `cleanup_old_pib`, `heartbeat`. |
| `status` | `VARCHAR(16)` | NO | `ok` or `error`. |
| `rows_in` | `Integer DEFAULT 0` | NO | Items scanned (for `pib_poll`) or deleted (for `cleanup_old_pib`). |
| `rows_new` | `Integer DEFAULT 0` | NO | Items newly persisted. |
| `detail` | `Text` | YES | Error string (truncated to 500 chars) when `status='error'`. |
| `started_at` | `DateTime DEFAULT utcnow` | NO | |
| `finished_at` | `DateTime` | YES | |

The `/api/government/freshness` route in
[`backend/routes/government.py`](backend/routes/government.py) walks the
last 50 rows ordered by `started_at desc` and reports the most recent
entry per `job_name`.

---

## ER diagram

```
schemes (1) ─────────── (0..N) pib_announcements   via matched_scheme_slug
                                                   (logical FK, no constraint)

schemes (1) ─────────── (0..N) feedback            via scheme_slug
                                                   (logical FK, no constraint)

ingest_logs                                        standalone — operational telemetry
```

There are no SQL foreign-key constraints — `pib_announcements.matched_scheme_slug`
and `feedback.scheme_slug` are stored as strings, not FK relations, so the
poller can record a scheme keyword we don't (yet) have a row for. This
keeps `schemes` rewrites (MyScheme nightly refresh) cheap.

---

## Migrations

There is no Alembic / migration tooling for chitti-government — it relies
on `Base.metadata.create_all()` which only adds tables that don't exist.
Schema changes are handled manually via SQL `ALTER` against the shared
Supabase DB. The seed loader is one-time-only (`seed_if_empty()`), so
catalog edits to [`backend/data/schemes_seed.json`](backend/data/schemes_seed.json)
do not propagate to an existing Supabase row without a manual
`UPDATE`/`INSERT`.

If a column needs to change in production:

```sql
ALTER TABLE government.schemes ADD COLUMN new_col VARCHAR(40);
```

Apply manually; redeploy picks it up via the model definition on the next
boot.
