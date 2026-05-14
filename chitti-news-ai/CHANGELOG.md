# Chitti News AI — CHANGELOG

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
