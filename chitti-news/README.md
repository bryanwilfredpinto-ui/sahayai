# Chitti News

> "Your state. Your language. Your news. Read aloud, fact-checked, and one-tap shareable."

Fourth Chitti product. Sister to **Chitti Shares (Technical + Fundamentals)** and **Chitti MedUPI**.

## Layout

```
chitti-news/
├── frontend/          Single-file HTML SPA (mirror of workspace-root chitti_news.html)
└── backend/           Flask service — RSS ingestion · article DB · Chitti's Take · fact-check · scheduler
```

Same shape as `chitti-medupi/` and `chitti-shares/` (sibling folders).

## Live URL
- Frontend: **https://sahayai.in/chitti_news.html**
- Backend (planned): **https://chitti-news-api.onrender.com**

## Reference apps surveyed
- **NewsBreak** (US) — hyperlocal · community-driven
- **SmartNews** (Japan) — AI curation · reward gamification
- **Dailyhunt** (India) — 14+ Indian languages · vernacular-first
- **Dainik Bhaskar** (India) — Hindi powerhouse
- **Way2News** (India) — hyperlocal short-form
- **CNA Singapore** — FAST button (AI summary + human review)
- **Moneycontrol** (India) — 44.86M unique visitors / month, business benchmark

## Chitti's edge
- **State + Language picker** on first launch (persistent in localStorage)
- **Chitti's Take** — 3-bullet AI summary in user's chosen language (the CNA "FAST" pattern)
- **Read Later / Cancelled** folders — explicit save vs explicit dismiss
- **Fact Checker Agent** — cross-references 2+ sources, badges green/amber/red
- **Sub-agents per category** (Politics · Sports · Business · Tech · Entertainment)
- **TTS read-aloud** in user's chosen language (4-user contract)
- **WhatsApp share** — one-tap, includes "via Chitti News" disclaimer
- **Bharat Premium theme** — saffron / navy / gold (Chitti family parity)

## Architecture
```
RSS feeds (Times of India, Moneycontrol, Bhaskar, Jagran, NDTV, …)
    ↓  hourly scheduler poll
news.articles  (Postgres, news.* schema isolation)
    ↓
GET /api/news/{state}/{language}/{category}  →  card feed
GET /api/news/article/{id}/take              →  Chitti's Take (Anthropic)
GET /api/news/article/{id}/factcheck         →  cross-source verdict
POST /api/news/save / cancel                 →  user folders
```

## Master spec
See `CHITTI_NEWS_MASTER_SPEC.md` (next session).

## Quick start (backend, local)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env       # set ANTHROPIC_API_KEY for Chitti's Take
python -m flask --app main run --port 8002
```

Then: `curl 'http://localhost:8002/api/news/india/en/national'`
