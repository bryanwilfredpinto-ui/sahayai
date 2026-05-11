# DATABASE — Chitti News

All tables live under the `news` schema on Postgres (Supabase, shared with `medupi.*` and `shares.*`). On SQLite (local dev) the same models map to schemaless tables — see [`models/_schema.py`](backend/models/_schema.py).

Schema is auto-created at boot by [`database.ensure_schema()`](backend/database.py).

---

## Schema isolation

Defined in [`backend/models/_schema.py`](backend/models/_schema.py):

```python
def _detect_schema() -> str | None:
    url = (settings.DATABASE_URL or "").lower()
    if url.startswith("postgres://") or url.startswith("postgresql"):
        return "news"
    return None

SCHEMA: str | None = _detect_schema()
TABLE_KW: dict = {"schema": SCHEMA} if SCHEMA else {}
```

Every model passes `TABLE_KW` into `__table_args__`. Foreign keys resolve via `fk_target("articles")` which prefixes `news.` only on Postgres.

This lets the same code run on SQLite (`./chitti_news.db`) for dev tests and on Postgres-with-schemas in production.

---

## Tables

### `news.articles`

One row per ingested news item. Natural identity key is `link` (unique). Model in [`models/article.py`](backend/models/article.py).

| Column | Type | Nullable | Default | Index / constraint | Notes |
|---|---|---|---|---|---|
| `id` | `Integer` | no | (auto) | PK | |
| `title` | `String(500)` | no | — | | source-provided headline |
| `title_hash` | `String(64)` | yes | null | indexed | SHA-256 of normalised title (cross-source dedup) |
| `link` | `String(900)` | no | — | UNIQUE, indexed | natural identity; idempotency key for ingest |
| `summary` | `Text` | yes | null | | RSS summary, HTML-stripped, ≤2000 chars |
| `content` | `Text` | yes | null | | full text where available (future) |
| `source_slug` | `String(60)` | no | — | indexed | e.g. `"toi"`, `"moneycontrol"`, `"bhaskar"` |
| `source_name` | `String(120)` | yes | null | | display name for the card |
| `source_url` | `String(300)` | yes | null | | publisher homepage |
| `image_url` | `String(500)` | yes | null | | hero image (best-effort RSS extraction) |
| `author` | `String(160)` | yes | null | | byline if present |
| `state` | `String(40)` | no | `"india"` | indexed (composite) | `india`, `mp`, `mh`, `ka`, `tn`, `wb`, … |
| `language` | `String(8)` | no | `"en"` | indexed (composite) | `en`, `hi`, `bn`, `te`, `ta`, `mr`, `kn`, `od`, `ml`, `gu`, `pa`, `ur` |
| `category` | `String(32)` | no | `"national"` | indexed (composite) | `national`, `state`, `business`, `tech`, `sports`, `entertainment`, `politics`, `science`, `breaking` |
| `is_breaking` | `Integer` | no | `0` | | 1 = surfaced as breaking |
| `sentiment` | `String(8)` | yes | null | | `pos` / `neg` / `neu` (reserved for v1.1) |
| `importance` | `Integer` | no | `5` | | 1–10, drives feed sort tie-breaker |
| `published_at` | `DateTime` | yes | null | indexed (`ix_articles_published_recent`) | from RSS `published_parsed` |
| `fetched_at` | `DateTime` | no | `utcnow` | indexed | when our poller wrote the row |

**Composite indexes**

- `ix_articles_state_lang_cat` on `(state, language, category)` — drives the feed query.
- `ix_articles_published_recent` on `(published_at)` — drives ordering.

**Relationships (referenced by)**

- `news.read_later.article_id` → `news.articles.id`
- `news.breaking_alerts.article_id` → `news.articles.id`
- `news.fact_checks.article_id` → `news.articles.id`

---

### `news.sources`

RSS source registry. One row per `(slug, state, language, category)` feed. Loaded from [`data/sources.json`](backend/data/sources.json) on first boot via [`news_seed.seed_sources_if_empty()`](backend/services/news_seed.py).

Model in [`models/source.py`](backend/models/source.py).

| Column | Type | Nullable | Default | Index / constraint | Notes |
|---|---|---|---|---|---|
| `id` | `Integer` | no | (auto) | PK | |
| `slug` | `String(60)` | no | — | indexed | e.g. `"toi-top"`, `"bhaskar-natl"` |
| `display_name` | `String(120)` | no | — | | e.g. `"Times of India · Top Stories"` |
| `rss_url` | `String(500)` | no | — | | feed URL |
| `homepage_url` | `String(300)` | yes | null | | publisher homepage |
| `state` | `String(40)` | no | `"india"` | indexed | feed scoping |
| `language` | `String(8)` | no | `"en"` | indexed | feed scoping |
| `category` | `String(32)` | no | `"national"` | indexed | feed scoping |
| `enabled` | `Integer` | no | `1` | | 0 = skip during poll |
| `last_fetched_at` | `DateTime` | yes | null | | updated by each `fetch_source` call |
| `last_error` | `String(500)` | yes | null | | error message from last failed fetch |
| `created_at` | `DateTime` | no | `utcnow` | | |

**Relationships**

- Logical FK from `news.articles.source_slug` → `news.sources.slug` (not enforced; `source_slug` is a string copy on the article so re-renaming a source doesn't break old rows).

---

### `news.read_later`

Per-device "Read Later" + "Cancelled" folders. Auth via the `X-User-Token` header (UUID generated client-side and stored in `localStorage`).

Model in [`models/read_later.py`](backend/models/read_later.py).

| Column | Type | Nullable | Default | Index / constraint | Notes |
|---|---|---|---|---|---|
| `id` | `Integer` | no | (auto) | PK | |
| `user_token` | `String(80)` | no | — | indexed | device UUID; ≥8 chars |
| `article_id` | `Integer` | no | — | indexed, FK → `news.articles.id` | |
| `folder` | `String(16)` | no | `"saved"` | indexed | `saved` or `cancelled` |
| `note` | `String(240)` | yes | null | | optional user note |
| `added_at` | `DateTime` | no | `utcnow` | indexed | |

**Uniqueness** — enforced in application logic (not in the schema). The `POST /api/news/save` route does an upsert by `(user_token, article_id, folder)`.

**Relationships**

- `article_id` → `news.articles.id`

---

### `news.breaking_alerts`

Breaking-news ribbon entries. Generated by the daily `_job_breaking` scheduler job (and ad-hoc by the poller cycle) when ≥3 trusted sources publish similar headlines within 4 hours.

Model in [`models/breaking_alert.py`](backend/models/breaking_alert.py).

| Column | Type | Nullable | Default | Index / constraint | Notes |
|---|---|---|---|---|---|
| `id` | `Integer` | no | (auto) | PK | |
| `headline` | `String(400)` | no | — | | the cluster's representative title |
| `article_id` | `Integer` | yes | null | FK → `news.articles.id` | exemplar article in the cluster |
| `state` | `String(40)` | no | `"india"` | indexed | matches the article's state |
| `language` | `String(8)` | no | `"en"` | indexed | matches the article's language |
| `sources_count` | `Integer` | no | `1` | | distinct outlets in the cluster (must be ≥3 to insert) |
| `note` | `Text` | yes | null | | optional explanation |
| `expires_at` | `DateTime` | no | — | indexed | usually `created_at + 4h` |
| `created_at` | `DateTime` | no | `utcnow` | indexed | |

**Lifecycle**

- Inserted by [`news_scheduler._job_breaking()`](backend/services/news_scheduler.py).
- Stale rows (`expires_at <= now`) are deleted at the start of every breaking-cluster run.
- Surfaced via `GET /api/news/breaking` filtered to `expires_at > now`.

---

### `news.fact_checks`

Cached fact-check results. Computed on demand by [`services/news_factcheck.py:factcheck()`](backend/services/news_factcheck.py); cache TTL is 6 hours.

Model in [`models/fact_check.py`](backend/models/fact_check.py).

| Column | Type | Nullable | Default | Index / constraint | Notes |
|---|---|---|---|---|---|
| `id` | `Integer` | no | (auto) | PK | |
| `article_id` | `Integer` | no | — | UNIQUE, FK → `news.articles.id` | one cache row per article |
| `verdict` | `String(16)` | no | `"unverified"` | | `verified` / `partial` / `disputed` / `unverified` |
| `confidence` | `Integer` | no | `50` | | 0–100 |
| `matched_sources` | `Text` | yes | null | | JSON-encoded list of matched `source_slug` values |
| `rationale` | `Text` | yes | null | | English rationale line (template-generated in v1) |
| `rationale_hi` | `Text` | yes | null | | Hindi rationale line |
| `checked_at` | `DateTime` | no | `utcnow` | indexed | cache key timestamp |

**Verdict thresholds** (from `news_factcheck.py`)

| `len(matched_sources)` | `verdict` | `confidence` |
|---|---|---|
| ≥3 | `verified` | `min(95, 60 + n*8)` |
| 2 | `partial` | `70` |
| 1 | `disputed` | `45` |
| 0 | `unverified` | `25` |

---

## Entity-relationship diagram

```
                               ┌─────────────────────┐
                               │   news.sources      │
                               │   (registry)        │
                               └─────────┬───────────┘
                                         │  slug (string copy)
                                         ▼
                               ┌─────────────────────┐
   ┌───────────────────────────│   news.articles     │───────────────────┐
   │                           │   id (PK)           │                   │
   │                           │   link UNIQUE       │                   │
   │                           └─────────┬───────────┘                   │
   │                                     │                               │
   │ article_id                          │ article_id                    │ article_id
   ▼                                     ▼                               ▼
┌──────────────────┐         ┌─────────────────────────┐       ┌──────────────────────┐
│  news.read_later │         │  news.breaking_alerts   │       │  news.fact_checks    │
│  (user folders)  │         │  (active ribbon)         │       │  (cached verdicts)   │
│  user_token + id │         │  expires_at             │       │  article_id UNIQUE   │
└──────────────────┘         └─────────────────────────┘       └──────────────────────┘
```

---

## Index audit

| Index | Table | Columns | Purpose |
|---|---|---|---|
| (PK) | every table | `id` | natural |
| (unique) | `articles` | `link` | idempotent RSS ingest |
| (unique) | `fact_checks` | `article_id` | one cache row per article |
| `ix_articles_state_lang_cat` | `articles` | `(state, language, category)` | feed query |
| `ix_articles_published_recent` | `articles` | `(published_at)` | feed sort |
| — | `articles` | `title_hash` | cross-source dedup |
| — | `articles` | `source_slug` | per-source debug |
| — | `articles` | `state`, `language`, `category` individually | filter |
| — | `articles` | `fetched_at` | scheduler prune cutoff |
| — | `sources` | `slug`, `state`, `language`, `category` | registry filter |
| — | `read_later` | `user_token`, `article_id`, `folder`, `added_at` | folder list |
| — | `breaking_alerts` | `state`, `language`, `expires_at`, `created_at` | ribbon query |
| — | `fact_checks` | `checked_at` | cache TTL probe |

---

## Retention

| Table | Retention | Where enforced |
|---|---|---|
| `articles` | 90 days | [`news_ingest.fetch_all()`](backend/services/news_ingest.py) deletes `fetched_at < now - 90d` after each poll cycle |
| `breaking_alerts` | until `expires_at` (4h default) | [`news_scheduler._job_breaking()`](backend/services/news_scheduler.py) deletes stale rows at start |
| `fact_checks` | indefinite | recomputed if `checked_at` older than 6h (cache, not deletion) |
| `read_later` | indefinite | user-owned; survives until DELETE |
| `sources` | indefinite | curated registry |

---

## Migrations

There are no Alembic migrations in v1 — schema is built via `Base.metadata.create_all()` at boot. Plan for v2 is to introduce Alembic before the next breaking schema change.

---

## Backups

Supabase free-tier hosts the database. Backup posture is whatever Supabase provides on that tier; no application-level backup job. Bryan owns DR planning.
