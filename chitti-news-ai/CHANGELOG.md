# Chitti News AI — CHANGELOG

## 0.2.0 — 2026-05-14 — RSS poller wired (17 seeded sources)

Backend (Flask · APScheduler)

- `services/rss_fetcher.poll_all()` — real implementation: 17 sources, feedparser-driven RSS path, two scrape adapters (Hugging Face JSON API + GitHub Trending HTML), per-source error isolation, dedupe by URL, FETCH_PER_SOURCE_CAP = 50, AI-keyword filter on community firehose feeds (HN / Reddit) so the DB stays focused. Skips sources marked `ai_crawl_blocked=True` (Layer 2 contract).
- `services/scorer.classify_article()` — deterministic regex classifier sets `is_launch` / `is_pricing_change` / `is_free_tier_change`. LLM importance scorer remains 0.0 (honest stub — DeepSeek pass queued).
- Three routes promoted **501 → LIVE**:
  - `GET /api/news-ai/sources` — DB-backed, trust-ordered, surfaces `last_fetched_utc` and `ai_crawl_blocked`.
  - `GET /api/news-ai/today` — last 24 h, ordered by source trust then recency, every article carries `importance_note: "LLM importance scorer pending"` so the front end stays honest about ranking.
  - `GET /api/news-ai/launches` — last 7 days where `is_launch=1`, includes classifier identifier so we never imply LLM ranking.
- New `POST /api/news-ai/admin/rss/poll-now` — token-gated via `METRICS_TOKEN`, returns the same stats dict the scheduler logs. Lets us verify on Render without waiting 6 hours.

Seed (`backend/data/sources.json`)

- Honest URL fixes for three vendor feeds whose public RSS surfaces were retired:
  - **Google AI Blog** → `https://blog.google/technology/ai/rss/` (verified 200 + xml).
  - **Anthropic News** → switched to `kind=scrape`, `active=false`, reason field notes that the scrape adapter is queued. We do NOT poll a 404.
  - **Meta AI Blog** → same pattern. `active=false` until scrape adapter ships.
- New `active_seed` field on each row, honoured by `_seed_sources_if_empty()` in `main.py`.

Frontend (`chitti_news_ai.html`)

- Today / Launches / Sources tabs now consume the LIVE endpoints with honest fallback messaging when the backend is unreachable (never invents demo data).
- Per-card metadata pills: source name, trust band, age, classifier flags (🚀 Launch / 💰 Pricing change / 🎁 Free-tier change).
- Sources directory surfaces inactive sources with reason — the user sees *why* Anthropic + Meta show no fetches yet.

Smoke test (local SQLite)

- 15 active sources, **0 errors**, **322 articles inserted** in 42 s on first poll, 4 new on a second consecutive poll (dedupe verified).
- `/api/news-ai/today` returned 40 trust-ordered articles. `/api/news-ai/launches` returned 60 classifier-detected launches. Admin endpoint correctly rejects missing / wrong tokens (403) and accepts correct token (200).

Queued for 0.3.0

- Scrape adapter for `anthropic.com/news` + `ai.meta.com/blog` (then flip both back to `active=true`).
- DeepSeek importance scorer (0-100, cross-source corroboration).
- DeepSeek topic extractor (no hardcoded profession list) wiring `POST /api/news-ai/tools-for-me`.
- 4-layer trust score recompute (Sunday 04:00 IST cron is already in place — just needs the Layer 1 + Layer 4 calculator).
- Turso libSQL embedded-replica adapter (replaces local SQLite fallback in `database.py`).

---

## 0.1.0 — 2026-05-14 — Skeleton commit

- Folder created: `chitti-news-ai/`.
- 14 skill files written: FEATURES, IDENTITY, PERSONALITY, VALUES, GUARDRAILS, BOUNDARIES, DEVILS_ADVOCATE, TRUTH_SOURCES, LANGUAGE_BEHAVIOR, TRUST_VERIFICATION, SOURCE_DISCOVERY, RANKING_FORMULA, IMPORTANCE_SCORING, OBSERVABILITY, SALES_BRIEF.
- Backend Flask skeleton: `main.py`, `config.py`, `database.py`, 5 SQLAlchemy models, 1 route module (`news_ai.py`) with 10 endpoints, 6 service stubs, APScheduler wiring.
- `data/sources.json` — 17 verified RSS / scrape seeds with trust-score seeds.
- `render.yaml` blueprint (Render free tier, gunicorn).
- Root frontend `chitti_news_ai.html` — full feature surface, COMING SOON badges, all mandatory plugins wired (chitti_a11y.js, feedback-widget.js, chitti_features.js auto-loaded, ISL dictionary auto-attached, disclaimer bar, camera substrate, per-response widget).
- `CHITTI_NEWS_AI_MASTER_SPEC.md` at repo root.
- `SAHAYAI_MASTER.md` §4a frontend↔folder map updated.

### Endpoints in this commit

- `GET /health` — **LIVE** — self-ping target.
- `GET /` — **LIVE** — service banner.
- `GET /api/news-ai/languages` — **LIVE** — 26 languages, no default.
- `GET /api/news-ai/disclaimer` — **LIVE** — server-enforced text.
- `GET /api/news-ai/today` — **501 COMING SOON**.
- `GET /api/news-ai/launches` — **501 COMING SOON**.
- `POST /api/news-ai/tools-for-me` — **501 COMING SOON** (400 if `language` missing).
- `GET /api/news-ai/free-tier-tracker` — **501 COMING SOON**.
- `POST /api/news-ai/trust-check` — **501 COMING SOON**.
- `GET /api/news-ai/sources` — **501 COMING SOON**.
- `POST /api/news-ai/sources/submit` — **501 COMING SOON**.
- `GET /api/news-ai/leaderboard` — **501 COMING SOON**.
- `GET /api/news-ai/models` — **501 COMING SOON**.

### Honest stubs in this commit

Per the [Honest stubs over fake demos](../SAHAYAI_MASTER.md#3-process--build-rules) rule, none of the COMING SOON endpoints return fake data. Each returns a structured payload with `feature`, `eta`, `why`, and the server-enforced disclaimer so the frontend can render an accurate stub card.

### Queued for 0.2.0

- Wire `rss_fetcher.poll_all()` against the 17 seeded RSS sources.
- Implement `trust_scorer.verify_url()` Layer 1 + Layer 4 logic.
- Implement `topic_extractor.extract_topics_from_profession()` via DeepSeek.
- Implement `ranker.rank_tools_for_topics()` per RANKING_FORMULA.md.
- Turso libSQL embedded-replica adapter (replaces local SQLite fallback).
