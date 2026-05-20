# ARCHITECTURE — Chitti News

End-to-end architecture for the Chitti News product. Mirrors the chitti-medupi + chitti-shares pattern so anyone fluent in those siblings can navigate this one in minutes.

---

## 1. High-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser                                                          │
│  ─────────                                                        │
│  chitti_news.html (mirror at frontend/index.html)                 │
│   ├── State + Language onboarding modal (localStorage)            │
│   ├── 8-tab category nav                                          │
│   ├── Sticky picker bar + breaking-news ribbon                    │
│   ├── Card feed renderer                                          │
│   └── Per-article actions: ✨ Take · 🛡 Fact · 🔊 Read · ⭐ Save ·  │
│       🗑 Cancel · 📤 Share · ↗ Source                              │
└──────────────────────────────────────────────────────────────────┘
                            │   HTTPS (CORS)
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  Flask Backend (chitti-news-api-production.up.railway.app)                     │
│  ────────────────────────────────────────                         │
│  main.py  →  _bootstrap()  →  _create_app()                       │
│    ├── ensure_schema('news')                                      │
│    ├── Base.metadata.create_all()                                 │
│    ├── seed_sources_if_empty()  ← data/sources.json               │
│    ├── seed_articles_if_empty() ← data/articles_seed.json         │
│    ├── news_scheduler.start()                                     │
│    │     ├── rss_poll job   (every RSS_POLL_MINUTES, default 30)  │
│    │     └── daily_breaking (06:00 IST cron)                      │
│    └── Flask app + CORS + 5 error handlers + Blueprint            │
│                                                                   │
│  routes/news.py  →  /api/news/*  (13 endpoints)                   │
│                                                                   │
│  services/                                                        │
│    news_db        — feed / list_breaking / get_article / sources  │
│    news_ingest    — feedparser RSS poller, idempotent on link     │
│    news_summary   — Chitti's Take via DeepSeek, RSS fallback      │
│    news_factcheck — rapidfuzz cross-source verdict, 6h cache      │
│    news_scheduler — APScheduler wrapper                           │
│    news_seed      — first-boot JSON seed loaders                  │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  Postgres (Supabase, shared with medupi + shares)                 │
│  ──────────────                                                   │
│  news.articles                                                    │
│  news.sources                                                     │
│  news.read_later                                                  │
│  news.breaking_alerts                                             │
│  news.fact_checks                                                 │
└──────────────────────────────────────────────────────────────────┘

                            │
                            ▲   (external)
┌──────────────────────────────────────────────────────────────────┐
│  DeepSeek API    — Chitti's Take + Explain Simply (OpenAI-compat) │
│  RSS feeds (×26+) — Times of India, Hindu, Moneycontrol, Bhaskar  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend / backend split

| Layer | Where | Responsibility |
|---|---|---|
| **Frontend** | `chitti_news.html` at workspace root (mirror at [`frontend/index.html`](frontend/index.html)) | Single-file HTML SPA — onboarding modal, category nav, card renderer, TTS, share, fact-check overlay |
| **Backend** | [`backend/`](backend/) | RSS ingestion, article storage, AI overlays, scheduler, blueprint API |
| **Data** | [`backend/data/`](backend/data/) — `sources.json`, `articles_seed.json` | Static seed loaded once on first boot |
| **Skills** | [`skills/`](skills/) — 8 sub-agent `SKILL.md` files | Editorial guardrails + sub-agent prompts (loaded by Claude Code at runtime) |

The frontend is intentionally a **single file** so it can be served by any static host (currently the same nginx that serves `sahayai.in`). The backend is the only stateful component.

---

## 3. Flask app boot order

Defined in [`main.py`](backend/main.py). Runs **once per gunicorn worker on import**, before the first request.

```python
def _bootstrap() -> None:
    ensure_schema()                       # 1. CREATE SCHEMA IF NOT EXISTS news
    Base.metadata.create_all(bind=engine) # 2. CREATE TABLE news.articles, news.sources, ...
    news_seed.seed_sources_if_empty()     # 3. load 26 sources from data/sources.json
    news_seed.seed_articles_if_empty()    # 4. load welcome articles
    news_scheduler.start()                # 5. APScheduler kicks in

_bootstrap()
app = _create_app()
```

Each step is wrapped in `try / except` with a `log.warning` — boot never fails the worker. The scheduler in particular is guarded by `SCHEDULER_ENABLED` (set to `"false"` in unit tests).

### Flask app construction

[`_create_app()`](backend/main.py) wires:

1. `CORS(app, origins=allowed)` — origins read from `ALLOWED_ORIGINS` env (`sahayai.in` + localhost).
2. `JSON_SORT_KEYS = False` so the `items, count, speak_en, speak_hi, …` ordering stays stable for the frontend.
3. Routes:
   - `GET /` → `{"app": "Chitti News API", "version": "1.0.0", "status": "ok"}`
   - `GET /health` → `{"ok": true}` (Render health-check path).
4. Error handlers for 400 / 404 / 405 (generic JSON envelope) + a 500 handler that logs the exception.
5. `app.register_blueprint(news_bp)` for the `/api/news/*` surface.

---

## 4. Scheduler

[`services/news_scheduler.py`](backend/services/news_scheduler.py). Built on `APScheduler` `BackgroundScheduler` with `Asia/Kolkata` timezone.

| Job ID | Trigger | Function | Purpose |
|---|---|---|---|
| `rss_poll` | `IntervalTrigger(minutes=max(5, RSS_POLL_MINUTES))` | `news_ingest.fetch_all()` | Fetch every enabled source, upsert articles |
| `daily_breaking` | `CronTrigger(hour=6, minute=0, timezone=IST)` | `_job_breaking()` | Cluster recent articles by similar title; insert breaking-news alerts where ≥3 sources agree |

Both jobs are wrapped in `_wrap(name, fn)` which logs START / OK / FAILED with `log.exception` so a one-off failure never kills the scheduler thread.

### Misfire grace

- `rss_poll`: 600s (10 min) — covers a Render dyno warm-up.
- `daily_breaking`: 1800s (30 min) — if the worker was down at 06:00 IST, it'll fire when it comes back.

### Diagnostic surface

- `GET /api/news/scheduler/status` returns `{running, tz, jobs: [{id, next_run, trigger}]}`.
- `POST /api/news/scheduler/trigger/<job_id>` force-runs a job synchronously (gated by `X-User-Token` so random callers can't trigger).

---

## 5. RSS poller

[`services/news_ingest.py`](backend/services/news_ingest.py). Pure Python: `requests` + `feedparser`.

### Per-source flow

```
fetch_source(db, source):
  1. requests.get(source.rss_url, timeout=20, UA="ChittiNews/1.0")
  2. feedparser.parse(resp.content)
  3. for entry in feed.entries[:50]:        ← cap to keep poll fast
       - extract link, title (idempotency key = link)
       - if Article.link exists → skip
       - else build Article row with:
           title_hash (SHA-256 of normalised title)
           summary (HTML-stripped + clamped to 2000 chars)
           image_url (media_content / enclosures / first <img> in summary)
           published_at (parsed from published_parsed / updated_parsed)
           state / language / category (inherited from Source)
  4. source.last_fetched_at = now; source.last_error = None
  5. commit
```

### Per-poll cycle (`fetch_all`)

1. Iterate every `Source.enabled == 1`.
2. Sum stats: `sources / inserted / skipped / errors`.
3. Prune articles with `fetched_at < now - 90 days`.
4. Log totals.

### Error isolation

A single bad feed (HTTP 5xx, malformed XML, slow response) stores `last_error` on the `Source` row and continues to the next source. Stored errors surface via `/api/news/sources`.

---

## 6. AI overlays

### Chitti's Take ([news_summary.py](backend/services/news_summary.py))

- Pulls the article, builds a strict 3-bullet prompt (see [PROMPTS.md](PROMPTS.md)).
- Calls DeepSeek `deepseek-chat` (configurable via `DEEPSEEK_MODEL`) over the OpenAI-compatible REST endpoint at `api.deepseek.com/chat/completions`.
- Parses lines starting with `•` into a bullets list; if zero parsed, falls back to splitting on newlines.
- If `DEEPSEEK_API_KEY` is unset OR the HTTP call throws → returns `_fallback(article, language)` which surfaces the trimmed RSS summary with a "Chitti's Take is unavailable" note.

### Fact Checker ([news_factcheck.py](backend/services/news_factcheck.py))

- v1: no LLM required for the matching step.
- Algorithm:
  1. Cache lookup on `news.fact_checks` (6h TTL).
  2. Query last 48h of articles in same language (limit 500).
  3. `rapidfuzz.fuzz.token_set_ratio` ≥ 70 → cluster match (excluding the original `source_slug`).
  4. Count distinct matched `source_slug` values → 4-tier verdict.
  5. Confidence: `min(95, 60 + n*8)` for verified; 70 / 45 / 25 for partial / disputed / unverified.
  6. Rationale lines built by a fixed-template generator (EN + HI) — no LLM call in v1.
  7. Upsert into `news.fact_checks`.

---

## 7. Sub-agent skills (8 SKILL.md files)

Located in [`skills/`](skills/). Each is loaded by Claude Code as a runtime skill — the per-category guardrails are enforced when Claude generates a Take or fact-check rationale for an article in that category.

| Folder | Purpose |
|---|---|
| [`skills/chitti-news/SKILL.md`](skills/chitti-news/SKILL.md) | Product-level overview, repo map, endpoint table |
| [`skills/chitti-news-summarizer/SKILL.md`](skills/chitti-news-summarizer/SKILL.md) | Chitti's Take format rules (3-bullet, 12-year-old language) |
| [`skills/chitti-news-factcheck/SKILL.md`](skills/chitti-news-factcheck/SKILL.md) | 4-tier verdict algorithm + trust assumption |
| [`skills/chitti-news-politics/SKILL.md`](skills/chitti-news-politics/SKILL.md) | No labels · no opinion verbs · equal coverage · ECI deference |
| [`skills/chitti-news-sports/SKILL.md`](skills/chitti-news-sports/SKILL.md) | Cricket-first · scoreboard format · no controversy framing |
| [`skills/chitti-news-business/SKILL.md`](skills/chitti-news-business/SKILL.md) | Unit-citation rules · no buy/sell calls |
| [`skills/chitti-news-tech/SKILL.md`](skills/chitti-news-tech/SKILL.md) | AI/startup focus · no fanboy tone · neutral on crypto |
| [`skills/chitti-news-entertainment/SKILL.md`](skills/chitti-news-entertainment/SKILL.md) | Tasteful celebration · no paparazzi · sourced box-office only |

Workflow expectation: per category, when a Take or rationale would be generated, the matching skill's frontmatter `description` is what triggers the per-category sub-agent in Claude Code's skill machinery.

---

## 8. Schema isolation under `news.*`

[`models/_schema.py`](backend/models/_schema.py) inspects `DATABASE_URL`:

- starts with `postgres://` or `postgresql` → `SCHEMA = "news"`.
- anything else (SQLite for local dev) → `SCHEMA = None` (SQLite has no schemas).

Every model passes `TABLE_KW = {"schema": SCHEMA} if SCHEMA else {}` into its `__table_args__`. Foreign keys are resolved via `fk_target("articles")` which prefixes `news.` when on Postgres.

This means **the same code path works in both environments**: local SQLite for dev tests and Postgres-with-schemas in production. The `ensure_schema()` helper in [`database.py`](backend/database.py) runs `CREATE SCHEMA IF NOT EXISTS news` on Postgres only.

Sibling products use the same pattern with `medupi.*` and `shares.*` — three products in one Supabase free-tier DB, isolated by schema.

---

## 9. Configuration surface

[`config.py`](backend/config.py). All settings come from environment with sensible defaults.

| Env var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./chitti_news.db` | SQLAlchemy connection string |
| `DEEPSEEK_API_KEY` | empty | Chitti's Take + Explain Simply — fact-check rationale uses templates |
| `DEEPSEEK_MODEL` | `deepseek-chat` | Model passed in the chat-completions body |
| `DEEPSEEK_URL` | `https://api.deepseek.com/chat/completions` | OpenAI-compatible endpoint |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:8002,https://sahayai.in,https://www.sahayai.in` | CORS allowlist |
| `BACKEND_URL` | `http://localhost:8002` | Self-URL used in logs |
| `SCHEDULER_ENABLED` | `true` | Toggle for tests |
| `RSS_POLL_MINUTES` | `30` | Poll cadence (clamped to ≥5) |
| `BRAVE_SEARCH_API_KEY` | empty | Reserved for v1.1 search-augmented fact-check |

Loaded via `python-dotenv` so a local `.env` works out-of-the-box.

---

## 10. Deployment

### Render Blueprint ([render.yaml](render.yaml))

```yaml
services:
  - type: web
    name: chitti-news-api
    runtime: python
    plan: free
    rootDir: chitti-news/backend
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app --bind 0.0.0.0:$PORT
    healthCheckPath: /health
    envVars:
      - DATABASE_URL          (sync: false — paste in dashboard)
      - DEEPSEEK_API_KEY      (sync: false)
      - DEEPSEEK_MODEL        (deepseek-chat)
      - DEEPSEEK_URL          (https://api.deepseek.com/chat/completions)
      - ALLOWED_ORIGINS       (https://sahayai.in,https://www.sahayai.in)
      - BACKEND_URL           (https://chitti-news-api-production.up.railway.app)
      - SCHEDULER_ENABLED     (true)
      - RSS_POLL_MINUTES      (30)
      - BRAVE_SEARCH_API_KEY  (sync: false)
```

### Python 3.11

Pinned via `runtime.txt` + `.python-version` to ensure psycopg2-binary wheels resolve cleanly on Render free-tier (no Rust toolchain, no native build).

### Dependencies (pinned)

See [`requirements.txt`](backend/requirements.txt) — `flask 3.0.3`, `flask-cors 4.0.0`, `gunicorn 21.2.0`, `sqlalchemy 2.0.35`, `psycopg2-binary 2.9.10`, `requests 2.31.0`, `python-dotenv 1.0.0`, `feedparser 6.0.11`, `httpx 0.27.2` (DeepSeek REST client), `rapidfuzz 3.6.1`, `apscheduler 3.10.4`, `tzdata 2024.2`.

---

## 11. Non-goals (architectural)

- No background workers other than the APScheduler in-process scheduler. No Celery, no Redis queue, no SQS.
- No frontend build step. The frontend is one HTML file with inline JS.
- No login / session / OAuth. The only "auth" is a per-device UUID in `X-User-Token` for Read Later / Cancelled — and that's only to scope folders, not to identify the user.
- No analytics SDK. No third-party scripts at all.
