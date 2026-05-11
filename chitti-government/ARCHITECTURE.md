# Chitti Government — Architecture

```
                    ┌────────────────────────────────────────────────┐
                    │  chitti_government.html  (workspace root)      │
                    │  - SPA: 9 tabs, voice IN + voice OUT           │
                    │  - profile, checklist tick state in localStorage│
                    │  - 6-button accessibility plugin               │
                    │  - sticky NOT-A-SARKARI-SEVA disclaimer        │
                    └───────────────┬────────────────────────────────┘
                                    │ fetch /api/government/*
                                    ▼
        ┌────────────────────────────────────────────────────────────┐
        │ Render service: chitti-government-api  (Flask + gunicorn)  │
        │                                                            │
        │ main.py ─ Flask app, CORS, error handlers, /, /health      │
        │  └─ _bootstrap()                                           │
        │       1. ensure_schema()    CREATE SCHEMA government       │
        │       2. create_all()       4 tables                       │
        │       3. seed_if_empty()    30 curated schemes             │
        │       4. scheduler.start()  PIB poll + cleanup + heartbeat │
        │                                                            │
        │ routes/government.py ── Blueprint at /api/government/*     │
        │                                                            │
        │ services/                                                  │
        │  ├─ government_database.py    seed + list_schemes          │
        │  ├─ government_eligibility.py rule engine (pure Python)    │
        │  ├─ government_deepseek.py    voice-first explainer        │
        │  ├─ government_pib.py         PIB RSS poller               │
        │  ├─ government_locator.py     Nominatim + GMaps fallback   │
        │  └─ government_scheduler.py   APScheduler (background)     │
        │                                                            │
        │ models/                                                    │
        │  ├─ _schema.py        schema = government (Postgres)       │
        │  ├─ scheme.py         catalog row                          │
        │  ├─ pib_announcement.py                                    │
        │  ├─ feedback.py       anonymous up/down                    │
        │  └─ ingest_log.py     one row per scheduler run            │
        └──────────────┬─────────────────────────────────────────────┘
                       │
            ┌──────────┼────────────────────────────────┐
            ▼          ▼                                ▼
    Supabase Postgres  DeepSeek                External: PIB RSS (10 feeds)
    schema=government  api.deepseek.com         Nominatim (OSM)
    (shared w/ shares  (optional —              Google Maps deep-link
     + medupi)         rule-engine fallback)   (fallback)
```

---

## Runtime

| Layer | Choice | Why |
| --- | --- | --- |
| Python | 3.11.10 ([runtime.txt](backend/runtime.txt)) | Render free tier; no Rust toolchain needed. |
| Web framework | Flask 3.0.3 | Pure Python; matches chitti-medupi + chitti-legal. FastAPI requires pydantic-core (Rust) which Render free tier can't compile from source. |
| ORM | SQLAlchemy 2.0.35 | Same as every other Chitti backend. |
| DB driver | psycopg2-binary 2.9.10 (Postgres) / sqlite3 (local dev) | manylinux wheels — no compile step. |
| Scheduler | APScheduler 3.10.4 (BackgroundScheduler, MemoryJobStore) | In-process so Render free tier doesn't need a separate cron worker. Idempotent jobs make per-worker duplication safe. |
| HTTP client | httpx 0.27.2 (DeepSeek) · requests 2.31.0 (PIB, Nominatim) | httpx supports keep-alive sessions cleanly; requests is battle-tested for short server-to-server calls. |
| RSS parser | feedparser 6.0.11 | Pure Python, no native deps; tolerates malformed PIB XML. |
| Fuzzy match | rapidfuzz 3.6.1 | Ships in requirements for future scheme-name fuzzy lookup ("pradhan mantri kisaan" → `pm-kisan`). |
| Server | gunicorn 22.0.0 — `--workers 2 --timeout 60` (from [render.yaml](render.yaml)). | |

Process model: 2 gunicorn workers, each running its own APScheduler thread.
Every job is idempotent (PIB dedupes by GUID, seed is no-op when rows
exist, cleanup is a DELETE on age), so double-execution is safe.

---

## Boot sequence

[`backend/main.py::_bootstrap()`](backend/main.py) runs once per gunicorn
worker on import:

1. **`government_database.ensure_schema()`** —
   `CREATE SCHEMA IF NOT EXISTS government` on Postgres; no-op on SQLite.
2. **`Base.metadata.create_all(bind=engine)`** — creates 4 tables in
   the `government` schema:
   `schemes`, `pib_announcements`, `feedback`, `ingest_logs`.
   See [DATABASE.md](DATABASE.md).
3. **`government_database.seed_if_empty()`** — loads 30 schemes from
   [`backend/data/schemes_seed.json`](backend/data/schemes_seed.json)
   only if the table is empty. Idempotent across boots.
4. **`government_scheduler.start()`** — wires three jobs on the
   `Asia/Kolkata` timezone:
   - `pib_poll` every `PIB_POLL_HOURS` hours (default 6 h); first run 45 s
     after boot to avoid blocking the health-check probe.
   - `cleanup_old_pib` cron @ 03:00 IST — deletes `PIBAnnouncement` rows
     older than 90 days.
   - `heartbeat` cron @ 04:00 IST — writes a `heartbeat` row to
     `ingest_logs` so `/freshness` always has a fresh entry.

Errors at any step are logged and swallowed — a broken scheduler must
never crash the web tier.

---

## Schema isolation

[`backend/models/_schema.py`](backend/models/_schema.py):

```python
SCHEMA = "government" if DATABASE_URL startswith postgres else None
TABLE_KW = {"schema": SCHEMA} if SCHEMA else {}
```

Every model declares `__table_args__ = TABLE_KW`, so on Postgres they
become `government.schemes`, `government.pib_announcements`, etc., while
on SQLite they remain plain table names (SQLite has no schemas). This
lets the same code run unmodified on local dev (`sqlite:///./chitti_government.db`)
and on the shared Supabase instance.

The shared Supabase Postgres is laid out as:

| Schema | Owner |
| --- | --- |
| `public.*` | chitti-shares (default) |
| `medupi.*` | chitti-medupi |
| `government.*` | this product |

There is no `databases:` block in [render.yaml](render.yaml) — the
Blueprint deliberately reuses the chitti-shares Supabase URL.

---

## Eligibility rule engine

[`backend/services/government_eligibility.py`](backend/services/government_eligibility.py).

Pure Python. No LLM call. Why: deterministic verdicts the user can dispute.

```
profile = {age, gender, income_annual_inr, bpl, secc_deprived, occupation,
           landholding_ha, caste, disability, rural_urban, state_code}
scheme  = Scheme(age_min, age_max, gender, income_max_annual_inr, ...)

evaluate(scheme, profile) → {
  "verdict": "eligible | partial | ineligible | unknown",
  "rules":   [ { "rule": "age", "label": "Age >= 18", "verdict": "pass" }, ... ],
  "exclusions": [ "income-tax payer", ... ],
  ... scheme metadata copied through ...
}
```

Per-predicate verdict vocabulary:

| Return | Meaning |
| --- | --- |
| `pass` | predicate satisfied |
| `fail` | predicate explicitly violated |
| `unknown` | scheme constrains the predicate, but the user hasn't shared the value |
| `skip` | scheme does not constrain this predicate; the rule is omitted from output |

Aggregation:

```
any 'fail'                    → "ineligible"
all 'pass'                    → "eligible"
any 'unknown', no 'fail'      → "partial"
no rules at all               → "unknown"
```

`evaluate_many()` calls `evaluate()` over a list and sorts by
`(eligible=0, partial=1, unknown=2, ineligible=3, scheme_name)`.

---

## DeepSeek voice-first explainer

[`backend/services/government_deepseek.py`](backend/services/government_deepseek.py).

The rule-engine output is structured. A 65-year-old caller wants prose.
This service wraps the structured verdict in an 80–120-word spoken summary
in the user's chosen language (Hindi default, English supported, 10 more
language names listed for the prompt — actual TTS handoff is the frontend's
job via Web Speech / future Voice Factory).

Behaviour:

1. `_format_rules_for_llm()` flattens the verdict into a structured
   `VERDICT: / SCHEME: / RULES:` block.
2. POSTs to `{DEEPSEEK_URL}` with the system prompt in `CHITTI_GOV_PROMPT`
   (see [PROMPTS.md](PROMPTS.md)).
3. Calls `_enforce_disclaimer()` to ensure the reply ends with the exact
   `यह government AI है। Official source se confirm karo. Chitti government scheme guide hai, sarkari seva nahi.`
4. If `DEEPSEEK_API_KEY` is unset OR the call raises (HTTP error, network
   blip, malformed JSON) → returns `_fallback_reply()` which synthesises a
   short deterministic reply from the same verdict object.
5. The verdict itself is never overwritten; the route returns `verdict`
   AND `voice` separately so the frontend renders the rule-by-rule
   pass/fail card alongside the prose.

The DeepSeek call uses `httpx.Client(timeout=30.0)` with a 700-token cap
(`DEEPSEEK_MAX_TOKENS`) and `temperature=0.2`.

---

## PIB poller

[`backend/services/government_pib.py`](backend/services/government_pib.py).

10 feeds (English + Hindi for All-India + PMO + 6 line ministries):

| reg | lang | ministry |
| --- | --- | --- |
| 3 | en/hi | All-India |
| 1 | en/hi | PMO |
| 8 | en | Agriculture & Farmers Welfare |
| 63 | en | Rural Development |
| 51 | en | Health & Family Welfare |
| 83 | en | Women & Child Development |
| 33 | en | Finance |
| 14 | en | Labour & Employment |

Each feed URL: `https://www.pib.gov.in/ViewRss.aspx?reg={reg}&lang={lang}`.

PIB blocks the default `python-requests` UA, so the poller sends the
Nominatim UA string (`ChittiGovernment/1.0 ...`) with a 12 s timeout.

Filtering: an item is stored only if its title or summary contains one of
the `SCHEME_KEYWORDS` (`scheme`, `yojana`, `awas`, `kisan`, `pension`,
`pmjay`, `nrega`, `scholarship`, `aushadhi`, `ujjwala`, `ladli`, `sukanya`,
`atal pension`, `mudra`, `svanidhi`, `vishwakarma`, `bima`, `saubhagya`,
`swachh bharat`, `ration`, `bpl`, `skill india`, `kaushal`, etc.).

Dedupe: GUID column on `pib_announcements`; second pass of the same GUID
is silently skipped.

Each item is `_match_scheme()`-d against the catalog (substring search
over `slug`, `short_code`, `name_en`); a matched item gets
`matched_scheme_slug` populated so the frontend can offer a one-tap
"Check eligibility" handoff.

One run = one row in `ingest_logs` with `job_name="pib_poll"` and
`rows_in / rows_new` counts.

---

## Nominatim locator + Google Maps fallback

[`backend/services/government_locator.py`](backend/services/government_locator.py).

9 supported office kinds (`csc`, `post_office`, `aadhaar`, `passport`,
`ration`, `jan_aushadhi`, `panchayat`, `bank`, `police_station`). For each
the service stores:

- `query` — the OSM-friendly free-text query
- `official_locator` — the government's own locator URL (deep-link surface)

Per call:

1. Sleep 250 ms to honour Nominatim's 1 req/s policy.
2. GET `{NOMINATIM_URL}/search` with viewbox of ±`radius_km / 111°`,
   `bounded=1`, `countrycodes=in`, `limit=5`, valid UA, contact email.
3. If status != 200 OR the call raises → return empty `results` but ALWAYS
   include the Google Maps deep-link so the feature is never a dead end.
4. Response shape: `{ok, kind, label, results[], official_locator_url,
   google_maps_search_url, attribution}`.

---

## APScheduler jobs

[`backend/services/government_scheduler.py`](backend/services/government_scheduler.py).

| id | trigger | function | purpose |
| --- | --- | --- | --- |
| `pib_poll` | every `PIB_POLL_HOURS` h, first run +45 s after boot | `_job_pib_poll` → `government_pib.poll_all()` | Ingest fresh PIB announcements. |
| `cleanup_old_pib` | cron @ 03:00 IST | `_job_cleanup_old_pib` | Delete `PIBAnnouncement` older than 90 days; log row to `ingest_logs`. |
| `heartbeat` | cron @ 04:00 IST | `_job_heartbeat` | Write one `ok` row to `ingest_logs` so `/freshness` always has a recent timestamp. |

Job-level safety: `replace_existing=True`, `max_instances=1`,
`coalesce=True`. Timezone: `Asia/Kolkata`.

`SCHEDULER_ENABLED=false` (used in local dev) short-circuits `start()`.

---

## Data directory

[`backend/data/schemes_seed.json`](backend/data/schemes_seed.json) — 30
curated schemes. Slugs (full list):

```
pm-kisan · pmjay-ayushman-bharat · pmay-g · pmay-u · ujjwala-pmuy
sukanya-samriddhi · atal-pension-yojana · mgnrega
nsp-scholarship-pre-matric-sc · nsp-post-matric-st · nsp-post-matric-obc
stand-up-india · pmegp · mudra-shishu · pm-svanidhi
ladli-behna-mp · saubhagya · swachh-bharat-mission-toilet
pm-vishwakarma · ews-reservation-cert
pradhan-mantri-suraksha-bima · pradhan-mantri-jeevan-jyoti
national-old-age-pension-iginoaps · indira-gandhi-widow-pension
national-disability-pension · udid-disability-card
ration-card-nfsa · kisan-credit-card · pmfby-fasal-bima
skill-india-pmkvy
```

Per-row schema:

```jsonc
{
  "slug": "pm-kisan",
  "short_code": "PM-Kisan",
  "name_en": "Pradhan Mantri Kisan Samman Nidhi",
  "name_hi": "प्रधानमंत्री किसान सम्मान निधि",
  "ministry": "Ministry of Agriculture & Farmers Welfare",
  "level": "central | state",
  "state_code": "MP" /* present only for state-level rows */,
  "category": ["agriculture","income-support"],
  "benefit_amount_inr": 6000,
  "benefit_type": "cash | insurance | subsidy | service",
  "benefit_summary_en": "...", "benefit_summary_hi": "...",
  "age_min": 18, "age_max": 60,
  "gender": "f | m | any",
  "income_max_annual_inr": 100000,
  "bpl_required": true,
  "secc_deprivation_required": true,
  "occupation": ["farmer","artisan",...],
  "landholding_min_ha": 0.01, "landholding_max_ha": 2.0,
  "caste": ["SC","ST","OBC","GEN"],
  "disability_required": true,
  "rural_urban": "rural | urban | both",
  "exclusions": [ "income-tax payer", "MP / MLA / Mayor", ... ],
  "eligibility_notes_en": "...", "eligibility_notes_hi": "...",
  "documents_required": ["Aadhaar","Bank passbook","..."],
  "application_url": "https://pmkisan.gov.in/...",
  "status_check_url": "https://pmkisan.gov.in/...",
  "source_url": "https://pmkisan.gov.in/",
  "helpline": "155261 / 011-24300606"
}
```

---

## Configuration

[`backend/config.py`](backend/config.py) is a thin `os.environ` reader
(no pydantic; Render free tier can't compile pydantic-core's Rust backend).

| Key | Default | Used by |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./chitti_government.db` | [database.py](backend/database.py), [_schema.py](backend/models/_schema.py) |
| `DEEPSEEK_API_KEY` | `""` (empty → rule-engine fallback) | [government_deepseek.py](backend/services/government_deepseek.py) |
| `DEEPSEEK_MODEL` | `deepseek-chat` | same |
| `DEEPSEEK_URL` | `https://api.deepseek.com/chat/completions` | same |
| `DEEPSEEK_MAX_TOKENS` | `700` | same |
| `DEEPSEEK_TEMPERATURE` | `0.2` | same |
| `ALLOWED_ORIGINS` | local hosts + `sahayai.in` | [main.py](backend/main.py) CORS |
| `BACKEND_URL` | `http://localhost:8003` | logs / status |
| `NOMINATIM_URL` | `https://nominatim.openstreetmap.org` | [government_locator.py](backend/services/government_locator.py) + [government_pib.py](backend/services/government_pib.py) UA |
| `NOMINATIM_CONTACT_EMAIL` | `chittigovernment@gmail.com` | Nominatim policy |
| `NOMINATIM_USER_AGENT` | `ChittiGovernment/1.0 ...` | Nominatim policy + PIB UA |
| `PIB_POLL_HOURS` | `6` | [government_scheduler.py](backend/services/government_scheduler.py) |
| `SCHEDULER_ENABLED` | `true` | same |

---

## CORS + error envelope

CORS allowlist in [main.py](backend/main.py): comma-split `ALLOWED_ORIGINS`,
methods `*`, headers `*`, credentials disabled.

Error shape (every handler):

```json
{ "error": "bad_request | not_found | method_not_allowed | payload_too_large
            | unsupported_media_type | internal_server_error",
  "detail": "human-readable string" }
```
