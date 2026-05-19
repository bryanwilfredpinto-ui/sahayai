# Chitti News

> "Your state. Your language. Your news. Read aloud, fact-checked, and one-tap shareable."

Fourth Chitti product. Sister to **Chitti Shares (Technical + Fundamentals)** and **Chitti MedUPI**. State-aware multi-language Indian news aggregator.

- **Frontend (live):** https://sahayai.in/chitti_news.html
- **Backend (planned):** https://chitti-news-api.up.railway.app (`render.yaml` ready; deploy pending)
- **Master spec:** [CHITTI_NEWS_MASTER_SPEC.md](../CHITTI_NEWS_MASTER_SPEC.md) at workspace root

---

## What Chitti News is

A **read-only news aggregator** that pulls headlines from 25+ Indian RSS feeds, sorts them by `state × language × category`, and surfaces each article with three AI-assisted overlays:

1. **Chitti's Take** — 3-bullet plain-language summary in the user's chosen Indian language (DeepSeek-powered, falls back to the RSS summary when `DEEPSEEK_API_KEY` is unset).
2. **Fact Check verdict** — 4-tier cross-source check (`verified` / `partial` / `disputed` / `unverified`) computed by fuzzy-matching the headline against every other article in the database from the last 48 hours.
3. **Read aloud** — browser-native TTS in the picked language so blind / illiterate users can listen instead of read.

Chitti News is **not** a publisher. It never writes news. Every article card links back to the source.

---

## Who it is for

| User | What Chitti News gives them |
|---|---|
| Tier-2/3 city families | News in their state in their language, not just English headlines from Delhi |
| Vernacular-language readers | First-class Hindi, Bangla, Telugu, Tamil, Marathi, Kannada, Odia, Malayalam, Gujarati, Punjabi, Urdu (regional sources expanding in v1.1) |
| Elderly + low-literacy users | TTS read-aloud, plain words, 3-bullet summaries, picture-led cards |
| Professionals tracking biz/tech | Moneycontrol / Hindu BusinessLine / NDTV Profit aggregated into one feed |
| Anyone tired of paywalls | Pure RSS, no login, no tracking, no ads |
| Anyone unsure if a headline is true | Per-article fact-check verdict with a source-count rationale |

Maps to the [four-user accessibility contract](../CHITTI_NEWS_MASTER_SPEC.md) — blind / deaf / mute / illiterate users all get a usable path through every screen.

---

## Key features

### Aggregation
- 25+ RSS feeds across English + Hindi, with regional-language coverage growing each session (see [data/sources.json](backend/data/sources.json)).
- Hourly RSS polling via APScheduler (configurable: `RSS_POLL_MINUTES`, default 30).
- Per-source idempotent ingestion (skips on duplicate `link`).
- 50-entry cap per feed per poll to keep cycles fast.
- 90-day auto-prune to bound DB growth.

### Targeting
- `state × language × category` is the core query shape — see `/api/news/<state>/<language>/<category>`.
- 8 categories: National · State · Business · Tech · Sports · Entertainment · Read Later · Cancelled.
- 5-state slice today (india / mp / mh / ka / tn / …) expanding to 10+ priority states.

### "Chitti's Take" LLM summary
- 3-bullet structure (What happened · Why it matters · What's next) — inspired by CNA Singapore's FAST button.
- DeepSeek (`deepseek-chat` by default) over the OpenAI-compatible REST endpoint.
- Plain-language target: a 12-year-old should understand each bullet.
- Falls back gracefully to the RSS summary if `DEEPSEEK_API_KEY` is missing.
- See [services/news_summary.py](backend/services/news_summary.py).

### Fact Checker
- Cross-references each article against every other article from the last 48h (same language).
- Uses `rapidfuzz.fuzz.token_set_ratio` ≥ 70 as the match threshold.
- 4-tier verdict with explicit colour + symbol pairing:

| Verdict | Symbol | Colour | Trigger |
|---|---|---|---|
| `verified` | ✓ | green | ≥3 distinct trusted sources agree |
| `partial` | • | amber | 2 sources cover it, details differ |
| `disputed` | ! | red | 1 other source, headline diverges |
| `unverified` | ? | muted | No cross-source signal |

- 6-hour cache on `news.fact_checks` table.
- Returns EN + HI rationale lines.
- See [services/news_factcheck.py](backend/services/news_factcheck.py).

### Read Later / Cancelled folders
- Per-device folders keyed by an `X-User-Token` header (UUID kept in `localStorage`).
- Two folders: `saved` and `cancelled` — explicit save vs. explicit dismiss.
- Backed by [models/read_later.py](backend/models/read_later.py).

### Breaking news ribbon
- Recomputed daily at 06:00 IST + on every poll-cycle gather.
- A "cluster" (similar titles) with ≥3 distinct sources crosses the threshold and surfaces as a dismissable red banner.
- 4-hour active window before alerts auto-expire.

### Per-category sub-agents
- Politics · Sports · Business · Tech · Entertainment, plus the Summarizer and Fact-Checker.
- Each ships a strict editorial-guardrails [SKILL.md](skills/) (no political labels, no buy/sell calls, no paparazzi tone, etc.).

### Accessibility (four-user contract)
- Voice IN + voice OUT on every control.
- Symbols + word labels — never colour alone.
- Hindi UI toggle (`_chittiLang` localStorage + `data-i18n` markers).
- Plain-English captions.

---

## Layout

```
chitti-news/
├── README.md             this file
├── CONTEXT.md            why it exists + accessibility contract
├── ARCHITECTURE.md       full backend/frontend split
├── CHANGELOG.md          shipped commits by feature
├── TODO.md               outstanding work
├── API.md                every /api/news/* endpoint
├── DATABASE.md           news.* schema reference
├── PROMPTS.md            every LLM prompt template
├── render.yaml           Render Blueprint
├── frontend/
│   └── index.html        mirror of workspace-root chitti_news.html
├── backend/
│   ├── main.py           Flask app + bootstrap
│   ├── config.py         settings
│   ├── database.py       SQLAlchemy engine + ensure_schema('news')
│   ├── requirements.txt  pinned deps (Python 3.11)
│   ├── data/
│   │   ├── sources.json  RSS feed registry
│   │   └── articles_seed.json   welcome seed
│   ├── models/           SQLAlchemy models (news.* schema)
│   ├── services/         news_db / news_ingest / news_summary / news_factcheck / news_scheduler / news_seed
│   └── routes/
│       └── news.py       Flask Blueprint /api/news/*
└── skills/
    ├── chitti-news/SKILL.md             product-level skill
    ├── chitti-news-summarizer/SKILL.md
    ├── chitti-news-factcheck/SKILL.md
    ├── chitti-news-politics/SKILL.md
    ├── chitti-news-sports/SKILL.md
    ├── chitti-news-business/SKILL.md
    ├── chitti-news-tech/SKILL.md
    └── chitti-news-entertainment/SKILL.md
```

---

## Quick start (local backend)

```bash
cd chitti-news/backend
pip install -r requirements.txt
export DEEPSEEK_API_KEY=sk-...
export DATABASE_URL=sqlite:///./chitti_news.db   # or your Supabase URL
python -m flask --app main run --port 8002
```

Then:

```bash
curl 'http://localhost:8002/health'
curl 'http://localhost:8002/api/news/india/en/national'
curl 'http://localhost:8002/api/news/article/1/take?language=hi'
```

---

## Reference apps surveyed

NewsBreak (US), SmartNews (Japan), Dailyhunt, Dainik Bhaskar, Way2News, CNA Singapore, Moneycontrol — what each does well and where Chitti News's edge sits is enumerated in [CHITTI_NEWS_MASTER_SPEC.md](../CHITTI_NEWS_MASTER_SPEC.md) section 2.
