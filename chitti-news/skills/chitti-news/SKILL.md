---
name: chitti-news
description: Chitti News — state-aware multi-language Indian news aggregator. Aggregates 25+ RSS feeds across English and Hindi (regional languages stubbed for v1.1), serves articles by state × language × category, renders DeepSeek-powered "Chitti's Take" 3-bullet summaries, runs a fact-checker that cross-references ≥2 sources, and offers Read Later / Cancelled folders per device.
---

# Chitti News — top-level skill

This skill describes the **Chitti News product** as a whole. It loads
when the user asks about Chitti News, news aggregation, RSS feeds, or
any of the per-category sub-agents below.

## Repo layout

```
chitti-news/
├── frontend/index.html         mirror of workspace-root chitti_news.html
└── backend/
    ├── main.py                 Flask app · CORS · startup hooks
    ├── config.py               settings (DATABASE_URL · DEEPSEEK_API_KEY · CORS · scheduler)
    ├── database.py             SQLAlchemy engine + ensure_schema('news')
    ├── requirements.txt        flask · feedparser · sqlalchemy · httpx (DeepSeek REST) · rapidfuzz · apscheduler
    ├── runtime.txt + .python-version  → Python 3.11
    ├── render.yaml             Render Blueprint
    ├── data/
    │   ├── sources.json        25+ RSS feeds across state × language × category
    │   └── articles_seed.json  6-row welcome seed (EN + HI)
    ├── models/                 Article, Source, ReadLater, BreakingAlert, FactCheck
    ├── services/
    │   ├── news_seed.py        loads JSON seeds on first boot (idempotent)
    │   ├── news_db.py          read paths: feed(), list_breaking(), get_article()
    │   ├── news_ingest.py      feedparser-based RSS poller (per-source, idempotent on link)
    │   ├── news_summary.py     Chitti's Take — DeepSeek 3-bullet, falls back to RSS summary
    │   ├── news_factcheck.py   cross-source fact-check (rapidfuzz title-similarity, cached 6h)
    │   └── news_scheduler.py   APScheduler: rss_poll every 30 min · daily_breaking 06:00 IST
    └── routes/
        └── news.py             Blueprint /api/news/*
```

## Endpoint surface (Flask Blueprint, prefix `/api/news`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/feed?state=&language=&category=&limit=` | Main feed |
| GET | `/<state>/<language>/<category>` | Pretty alias (e.g. `/india/hi/business`) |
| GET | `/breaking` | Active breaking-news alerts (≥3 sources agree) |
| GET | `/article/<id>` | Single article |
| GET | `/article/<id>/take?language=` | Chitti's Take (3 bullets via DeepSeek) |
| GET/POST | `/article/<id>/factcheck` | Cross-source verdict (cached 6h) |
| GET | `/sources?state=&language=` | Source registry slice |
| POST | `/save` | Add to `saved` or `cancelled` folder (X-User-Token header) |
| GET | `/save?folder=` | List a folder |
| DELETE | `/save/<entry_id>` | Remove from folder |
| GET | `/scheduler/status` | Diagnostic |
| POST | `/scheduler/trigger/<job_id>` | Force-run a scheduler job |

## Schema isolation

All News tables live under the `news` schema in the shared Supabase
Postgres (alongside `medupi.*` and `shares.*`). See
`backend/models/_schema.py`. Schema is auto-created on startup via
`database.ensure_schema()`.

## Sub-agents

The `.claude/skills/chitti-news-*/` directories define per-category
agents with their own context + tone:
- `chitti-news-summarizer` — Chitti's Take (3-bullet AI summaries)
- `chitti-news-factcheck` — cross-source verification
- `chitti-news-politics` — political news context + neutrality guardrails
- `chitti-news-sports` — sports news + scores + schedules context
- `chitti-news-business` — business news + market context
- `chitti-news-tech` — technology news + product launches context
- `chitti-news-entertainment` — entertainment news + reviews context

When the user asks a category-specific question, prefer the matching
sub-agent over the generic chitti-news skill.

## Live URLs
- Frontend: https://sahayai.in/chitti_news.html
- Backend: https://chitti-news-api.onrender.com (planned — `render.yaml` ready)
