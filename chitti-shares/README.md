# Chitti Shares

Indian equities backend that powers **two** Chitti front-ends from a single FastAPI service:

| Frontend (repo root) | Live URL | Persona |
|---|---|---|
| [`chitti_fundamentals.html`](../chitti_fundamentals.html) | https://sahayai.in/chitti_fundamentals.html | Patient teacher (Buffett / Lynch / Graham / Greenblatt lenses) |
| [`chitti_complete_technical.html`](../chitti_complete_technical.html) | https://sahayai.in/chitti_complete_technical.html | Fast technical trader (Roshan Indicator + 43 indicators) |

Backend service: `https://chitti-shares-api.up.railway.app`

## Data sources (locked)

Yahoo Finance is **BLOCKED** from Render IPs. The active sources are:

| Need | Source | File |
|---|---|---|
| Fundamentals, financials, shareholding, CAGR inputs | **screener.in** scrape | [`backend/services/screener_client.py`](backend/services/screener_client.py) |
| Live quotes, intraday candles (15m / 5m / 1m), historical OHLC | **Angel SmartAPI** | [`backend/services/angel_client.py`](backend/services/angel_client.py), [`backend/services/intraday_candles.py`](backend/services/intraday_candles.py) |
| News (per stock + market) | **Moneycontrol + LiveMint + BSE + NSE RSS** | [`backend/services/news_client.py`](backend/services/news_client.py) |
| AI synthesis (Chitti's View, Story Mode, Ask Chitti, agentic loops) | **DeepSeek** chat completions (migrating off Anthropic) | [`backend/services/deepseek_client.py`](backend/services/deepseek_client.py) |
| Index quotes (Nifty / Sensex when NSE/Yahoo blocked) | Laptop pusher → `POST /debug/ingest-indices` | [`backend/main.py`](backend/main.py) |
| Yahoo Finance | LOCAL-DEV FALLBACK ONLY | [`backend/services/yahoo_client.py`](backend/services/yahoo_client.py) |

## What ships today

- 60+ HTTP routes split across `routes/` and the agentic `main.py` entry endpoints
- Mobile-OTP auth + JWT refresh + 2-device-per-user enforcement (Phase 1)
- Live Nifty/Sensex + Chitti Market View (Phase 2)
- Fundamentals scorecard (A+ to F) + 8-quarter results + star rating (Phase 3)
- Roshan Indicator + 43 technical indicators + custom rule DSL + call reports (Phase 4)
- Watchlist + alerts + Portfolio Doctor + Chitti AI Chat + Hindi UI (Phase 5)
- 10 per-stock specialists + ATR trade plans + multi-TF consensus + saved rules + quota tracking + AI portfolio insights (Phase 6)
- Phase 7 agentic surface: `/api/agent/technical/ask`, `/api/agent/fundamental/ask`, `/api/agent/medupi/ask` (true DeepSeek tool-calling loop)
- Phase 7 compute-only differentiators: 5D Snowflake radar, Confidence Dial, Risk-Fit Dial, Performance vs NIFTY, Returns calculator
- Universe scanner (Roshan + 43 indicators) across 5 universes (NIFTY 50 / Largecap / Midcap / Smallcap / Microcap)
- Strategy screener with 30+ investor-lens slugs (Buffett / Lynch / Graham / Greenblatt / Munger / Pabrai / Marks / RJ / Kedia / RKD / RMD / NS / HDFC / Mirae / Motilal / etc.)
- Per-call DeepSeek quota tracking (soft cap ₹50 / day, hard cap ₹100 / day, IST reset)
- In-process APScheduler (replaced paid Render cron jobs)
- MedUPI endpoints co-hosted in this service (sibling product, separate Neon DB)

## Layout

```
chitti-shares/
+- backend/                 FastAPI + SQLAlchemy + JWT + Angel + screener + DeepSeek
|  +- config/               nifty_universe.json + stock_specialists.json
|  +- routes/               auth, user, market, stocks, technical, portfolio,
|  |                        chat, quota, specialists, cron     (10 routers)
|  +- services/             angel_client, screener_client, news_client,
|  |                        technical, indicators, scanner, strength,
|  |                        snowflake, returns, fundamentals_extras,
|  |                        fundamental_scanner, scorecard, rule_engine,
|  |                        specialist, deepseek_client, usage_tracker,
|  |                        cache, deps, auth_helpers, otp_sender,
|  |                        symbol_resolver, stock_universe, levels,
|  |                        intraday_candles, scheduler,
|  |                        agent_runtime, agent_tools,
|  |                        medupi_* (sibling)
|  +- models/               user, device, kite_token, stock, quota,
|  |                        stock_universe, index_quote, _schema
|  +- main.py               app entry; public + Phase 7 endpoints live here
|  +- database.py           engine + Base + ensure_schema('shares')
|  +- config.py             pydantic Settings (env vars)
|  +- requirements.txt
|  L- runtime.txt
+- frontend/                React 18 + Vite + Tailwind (legacy; replaced by single-file HTML)
+- render.yaml              Blueprint: backend (web) + frontend (static)
+- README.md                <- you are here
+- CONTEXT.md               Why this product exists + accessibility contract
+- ARCHITECTURE.md          Engine map, schema isolation, scheduler design
+- API.md                   Every route grouped fundamentals / technical / shared
+- DATABASE.md              Tables, columns, indexes, schema isolation
+- CHANGELOG.md             git-log driven history
+- TODO.md                  Outstanding spec items + code TODOs
+- PROMPTS.md               Every LLM prompt template in the codebase
+- DEPLOY_FULL.md           Canonical Render walkthrough
+- DEPLOY_PHASE1..3-5.md    Historical phase guides
```

## Production deploy

Render Blueprint (`render.yaml`) provisions:

1. `chitti-shares-api` — FastAPI web service on the Render free tier (cold-start friendly; `/health` is the wake-up ping).
2. `chitti-shares-web` — legacy React static site (the single-file HTMLs now serve from GitHub Pages root).

Manual env vars to set in the Render dashboard:

```
DATABASE_URL          (Supabase / Neon Postgres "Direct" string)
FAST2SMS_API_KEY      (OTP delivery)
DEEPSEEK_API_KEY      (AI synthesis)
ADMIN_MOBILE          (10-digit, no +91 — gates Kite OAuth endpoints)
CRON_SECRET           (long random; same value used by ingest + cron URLs)
ANGEL_API_KEY / ANGEL_CLIENT_CODE / ANGEL_PIN / ANGEL_TOTP_SECRET   (price feed)
KITE_API_KEY / KITE_API_SECRET                                       (optional)
TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID                                 (optional)
```

`DATA_SOURCE=yahoo` is the default but is effectively bypassed by `screener_client` + `angel_client` paths because Yahoo is IP-blocked from Render.

## Standing rules

- **NOT SEBI Registered** sticky banner + full-legal modal — never moved to footer (see [`project_legal_disclaimer.md`](../memory)).
- **Four-user contract**: Blind, Deaf, Mute, Illiterate — voice IN + voice OUT + symbols + plain English, never colour-only.
- **Investor lens always declared** on every fundamentals verdict.
- **iloc[-2] only** for the last *closed* candle in the Roshan rule; never `[-1]` (in-progress).
- **Free-tier sources only** — no Bloomberg / Refinitiv / Tickertape API.
