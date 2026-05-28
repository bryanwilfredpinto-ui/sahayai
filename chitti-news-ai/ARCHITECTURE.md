# Chitti News AI — ARCHITECTURE

```
                       ┌────────────────────────────────────┐
                       │  chitti_news_ai.html (GitHub Pages) │
                       │  + chitti_a11y.js                   │
                       │  + feedback-widget.js               │
                       │  + chitti_features.js (auto)        │
                       │  + chitti_isl_dictionary.json (auto)│
                       │  + chitti_disclaimer.js             │
                       │  + chitti_camera.js                 │
                       └─────────────┬──────────────────────┘
                                     │ HTTPS · JSON
                                     ▼
                       ┌────────────────────────────────────┐
                       │  chitti-news-ai-api  (Railway)       │
                       │  Flask + APScheduler                │
                       │                                    │
                       │  /health  (self-ping target)        │
                       │  /api/news-ai/*                     │
                       │     today · launches · tools-for-me │
                       │     free-tier-tracker · trust-check │
                       │     sources · leaderboard · models  │
                       │     languages · disclaimer          │
                       └─────────────┬──────────────────────┘
                                     │
            ┌────────────────────────┼───────────────────────────┐
            ▼                        ▼                           ▼
   ┌─────────────────┐      ┌─────────────────┐         ┌─────────────────┐
   │  Turso libSQL    │      │  DeepSeek API   │         │  Voice Factory  │
   │  chitti-news-ai  │      │  (topics +      │         │  (26 langs,     │
   │  (embedded      │      │   scoring +     │         │   swappable     │
   │   replica)      │      │   summary)      │         │   supplier)     │
   └─────────────────┘      └─────────────────┘         └─────────────────┘
                                                                ▲
                                                                │ Layer 5
                                                                │ fallback
                                                          ┌─────┴─────┐
                                                          │  Claude   │
                                                          │  Gemini   │
                                                          └───────────┘
```

## Boot path (one-time per worker)

1. `ensure_schema()` — `CREATE TABLE IF NOT EXISTS` for sources, articles,
   tools, ai_models, trust_score_history, trust_checks, discovery_queue,
   free_tier_history.
2. `_seed_sources_if_empty()` — loads `backend/data/sources.json` (17
   verified seeds) into the `sources` table.
3. `news_scheduler.start()` — APScheduler boots with 4 jobs in
   `Asia/Kolkata`:
   - **`rss_poll`** — every `RSS_POLL_MINUTES` (default 360 = 6h).
   - **`source_discovery`** — Sunday `SOURCE_DISCOVERY_HOUR_IST` (default 03:00).
   - **`trust_recompute`** — Sunday `TRUST_RECOMPUTE_HOUR_IST` (default 04:00).
   - **`daily_briefing`** — daily `DAILY_BRIEFING_HOUR_IST` (default 07:00 — queued).

## On every request

```
HTTP request
  → Flask blueprint /api/news-ai/*
    → Body validation (language required, no default)
      → DeepSeek call (Layer 5 fallback chain on 5xx)
        → Trust score post-process (Layer 3 verification)
          → Railway in user's selected language
            → Attach server-enforced disclaimer
              → 200 / 501 (honest stub) response
```

## On every cron

```
APScheduler tick
  → rss_fetcher.poll_all()
    → feedparser.parse(source.url)
      → Skip sources marked ai_crawl_blocked=True
        → For each new entry:
          → topic_extractor.extract_topics_from_profession (DeepSeek)
            → scorer.importance_for_article
              → INSERT INTO articles
                → If is_launch=1 → also create tools row
                  → If is_pricing_change=1 → also create free_tier_history row
```

## Failure modes (per §2e Business Continuity Plan)

| Failure | Layer | Response |
|---|---|---|
| `chitti-news-ai-api` non-200 | 1 | chitti-founder self-ping (every 4 min) emails Sire (1h debounce). |
| `chitti-news-ai-api` cold start (Railway free-tier idle) | 1 | Self-ping is also the keep-alive (4 min < 15 min idle threshold). |
| Turso unreachable | — | Embedded replica keeps local SQLite hot. Writes queue; sync resumes. |
| DeepSeek 5xx ×3 | 5 | Auto-fallback Claude → Gemini. Honest failure if all three down. |
| All RSS feeds error | — | INFO log + scheduler keeps retrying every 6h. No fake fill-in. |
| Bhashini ULCA unavailable | — | Voice Factory cascades to next supplier; never silently morphs language. |
