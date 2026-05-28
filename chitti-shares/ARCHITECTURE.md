# ARCHITECTURE

```
                              GitHub Pages root
                +---------------------------------------+
                |  chitti_fundamentals.html             |
                |  chitti_complete_technical.html       |
                +-------------------+-------------------+
                                    | https / CORS
                                    v
                +---------------------------------------+
                |  chitti-shares-api-production.up.railway.app       |
                |  FastAPI + Uvicorn (free tier dyno)   |
                |                                       |
                |   routes/         main.py             |
                |   services/       (Phase 7 here)      |
                |   models/         database.py         |
                +----------+-----+-----+----------------+
                           |     |     |
        +------------------+     |     +------------------+
        |                        |                        |
        v                        v                        v
  screener.in              Angel SmartAPI            DeepSeek API
  (HTML scrape)            (live + intraday)         (chat / tools)
                                                          ^
                                  Moneycontrol RSS        |
                                  LiveMint RSS  -->  news_client
                                  BSE / NSE RSS

                +---------------------------------------+
                |  Supabase Postgres (Neon-style)       |
                |    public.*    (Supabase internals)   |
                |    shares.*    (this service)         |
                |    medupi.*    (sibling Chitti)       |
                +---------------------------------------+
```

## Backend stack

| Layer | Library / version |
|---|---|
| Web framework | FastAPI 0.115 |
| ASGI runner | Uvicorn (single-worker on Railway free dyno) |
| ORM | SQLAlchemy 2.0 (`declarative_base`, schema-qualified) |
| Settings | pydantic-settings (`BaseSettings` in `config.py`) |
| HTTP client | httpx (async for DeepSeek, sync for screener / Angel) |
| Scheduler | APScheduler (in-process; replaced paid Railway cron jobs) |
| Auth | mobile OTP via Fast2SMS + JWT access (15 min) + refresh (30 d) + bcrypt OTP hashing |
| Hosting | Railway free tier (cold-start friendly) |
| Database | Supabase Postgres (`shares` schema) — SQLite for local dev |
| AI | DeepSeek chat completions (`deepseek-chat`); migrating off Anthropic |

## Module map

### `backend/main.py`

App entry. Mounts the routers and also declares the **public, unauthenticated** Phase 3+ endpoints directly:

- `/api/fundamentals/{symbol}`, `/api/financials/{symbol}`, `/api/cagr/{symbol}`, `/api/shareholding/{symbol}`
- `/api/fundamental-scan`, `/api/fundamental-scan/strategies`
- `/api/news/market`, `/api/news/stock/{symbol}`
- `/api/technical/{symbol}` (public — distinct from the authenticated `/api/technical/{symbol}/analyze` router)
- `/api/scan/roshan`, `/api/scan/{indicator}`, `/api/scan/cache`
- `/api/levels/{symbol}`, `/api/candles/{symbol}`
- `/api/strength/{symbol}`, `/api/rating-table/{symbol}`, `/api/quotes`
- `/api/snowflake/{symbol}`, `/api/confidence/{symbol}`, `/api/risk-fit/{symbol}`
- `/api/performance/{symbol}`, `/api/returns`
- `/api/chitti-view/{symbol}` (DeepSeek 2–3-sentence verdict + auto-speak)
- `/api/agent/{technical|fundamental|medupi}/ask` (true tool-calling loop)
- `/api/usage/today`
- `/debug/nse`, `/debug/angel`, `/debug/ingest-indices` (laptop pusher workaround)
- `/api/medupi/*` (sibling product, co-hosted)

### `backend/routes/` — authenticated routers

| File | Prefix | Purpose |
|---|---|---|
| `auth.py` | `/auth` | OTP send / verify / refresh / logout · 2-device-per-user enforcement |
| `user.py` | `/user` | Profile, device list, revoke single / all devices |
| `market.py` | `/api/market` | Kite OAuth flow (admin-gated) + indices + market view |
| `stocks.py` | `/api/stocks` | search / resolve / quote / fundamentals (auth'd) / quarterly / history |
| `technical.py` | `/api/technical`, `/api/calls` | analyze / consensus / rule eval / saved rules + call reports |
| `portfolio.py` | `/api/watchlist`, `/api/alerts`, `/api/portfolio` | Watchlist + alerts + Portfolio Doctor + CSV upload + AI insights |
| `chat.py` | `/api/chat` | Chitti AI Chat (persisted history) |
| `quota.py` | `/api/quota` | Today / history / breakdown of DeepSeek + Fast2SMS spend |
| `specialists.py` | `/api/specialists`, `/api/stocks/{sym}/chat` | 10 per-stock Chittis |
| `cron.py` | `/api/cron` | Secret-gated alert / track-call / kite-reauth jobs |

### `backend/services/`

Engine modules — every one of them is tested by hitting the corresponding route.

- **`screener_client.py`** — HTML scrape of screener.in. Returns identity, ratios, quarterly P&L (last 8), shareholding, full financials (annual P&L + BS + CF). Primary fundamentals source from Railway.
- **`yahoo_client.py`** — yfinance wrapper. LOCAL-DEV ONLY (Yahoo blocked from Railway). Kept as a fallback inside `main.py /api/fundamentals` for the rare case where screener returns empty.
- **`angel_client.py`** — Angel SmartAPI for live quotes + historical candles (Daily through Monthly). The locked price source on Railway.
- **`intraday_candles.py`** — Side-door direct-Angel fetch for `15min`/`5min`/`1min` timeframes (separate from the Daily-cap codepath).
- **`news_client.py`** — Moneycontrol + LiveMint + BSE + NSE RSS aggregator. `fetch_market_news()` and `fetch_stock_news(symbol)`.
- **`indicators.py`** — RSI, MACD, Bollinger, SMA, EMA, ATR, Williams %R, Force Index, Elder Ray, OBV, ADX, Supertrend, Heikin Ashi Trend, TTM Squeeze, Awesome Oscillator, Vortex, Chandelier Exit, Hull MA, Laguerre RSI, Balance of Power, Chande Kroll Stop, etc. `compute_all(candles)` returns the 43-indicator block plus a summary.
- **`technical.py`** — Public technical engine. `technical_report(symbol, indicators)` runs the indicator stack across all timeframes for one symbol.
- **`scanner.py`** — Universe scans (`scan_roshan`, `scan_indicator`). Uses a 6-thread `ThreadPoolExecutor` to fan out across the 50–110-stock universes. Reads `iloc[-2]` (last closed candle) per the Roshan rule.
- **`levels.py`** — Auto support / resistance + trendlines from swing pivots.
- **`strength.py`** — Composite signal strength (0–10) + confluence count (`signal_strength`) and STRONG BUY → STRONG SELL rating across timeframes (`rating_table`).
- **`snowflake.py`** — 5D Value/Growth/Quality/Health/Income radar (`snowflake_5d`), Confidence Dial, Risk-Fit Dial. Compute-only; never round-trips the LLM so it stays alive when DeepSeek is rate-limited.
- **`returns.py`** — Performance vs NIFTY, lump-sum returns, SIP returns. Pulls 2000-day history directly via Angel (bypasses `technical.fetch_candles`'s 365-day cap).
- **`fundamentals_extras.py`** — Derived metrics: 3y/5y/10y CAGR for Sales / Operating Profit / Net Profit.
- **`fundamental_scanner.py`** — 30+ investor-lens strategies (`buffett`, `lynch`, `graham`, `greenblatt`, `munger`, `pabrai`, `marks`, `rj`, `kedia`, AMC and theme slugs).
- **`scorecard.py`** — A+ to F grading + quarterly star rating + verdict.
- **`rule_engine.py`** — Custom-rule DSL parser/evaluator (`RSI(14) < 30 AND MACD_HIST > 0`).
- **`specialist.py`** — 10 stock specialists (Reliance, TCS, HDFC Bank, etc.). Each pulls fundamentals + quarterly + technical for ONE stock and builds a focused DeepSeek system prompt.
- **`stock_universe.py`** — Nifty 500 seeded master table. Search-as-you-type without round-tripping data sources.
- **`symbol_resolver.py`** — User input → canonical `NSE:RELIANCE` / `BSE:SENSEX`.
- **`cache.py`** — In-memory TTL cache used by every fetch path (quotes 60 s, fundamentals 1 hr, news 10 min, etc.).
- **`deps.py`** — FastAPI dependencies: `get_current_user`, `get_admin_user`.
- **`auth_helpers.py`** — JWT create/decode + bcrypt OTP hash.
- **`otp_sender.py`** — Fast2SMS send + dev fake-OTP mode.
- **`kite_client.py`** — Optional Zerodha Kite OAuth flow (paid; opt-in via `DATA_SOURCE=kite`).
- **`nse_client.py`** — NSE direct fetch (blocked on Railway → laptop pusher fallback).
- **`deepseek_client.py`** — Async DeepSeek chat completions, decorated with `@tracked` so every call lands in `usage_log`.
- **`usage_tracker.py`** — Hard-cap pre-check (`CapExceeded`), cost calculation (₹22.50 / 1M input tokens, ₹91.50 / 1M output tokens), per-IST-day rollup into `daily_quota_summary`.
- **`scheduler.py`** — APScheduler. Replaces Railway Cron (Railway charges $1/mo each). Runs while the web service is awake.
- **`agent_runtime.py`** — DeepSeek tool-calling loop. `run_agent(system, user, tools, executors, max_steps)` orchestrates LLM-pick-tool → execute → loop → synthesise.
- **`agent_tools.py`** — Tool schemas + executors for Chitti Technical, Chitti Fundamental, Chitti MedUPI.

### `backend/models/`

| Model | Schema-qualified table | Purpose |
|---|---|---|
| `User` | `shares.users` | One row per mobile-OTP-registered trader |
| `Device`, `OTP` | `shares.devices`, `shares.otps` | 2-device-per-user enforcement + OTP bcrypt store |
| `KiteToken` | `shares.kite_tokens` | Single-row daily-refreshed Kite access token |
| `Stock` | `shares.stocks` | Nifty 500 master (search-as-you-type) |
| `IndexQuote` | `shares.index_quotes` | Laptop-pushed Nifty / Sensex snapshots |
| `WatchlistItem` | `shares.watchlist_items` | Per-user watchlist (drag-reorder) |
| `Alert`, `AlertEvent` | `shares.alerts`, `shares.alert_events` | Price + RSI alerts + audit trail |
| `CallReport` | `shares.call_reports` | BUY / SELL / WAIT calls + high_seen / low_seen tracking |
| `CustomRule` | `shares.custom_rules` | Up to 5 saved custom rules per user |
| `ChatMessage` | `shares.chat_messages` | Chitti AI Chat history (last 50 / user) |
| `PortfolioHolding` | `shares.portfolio_holdings` | Manual or Zerodha-CSV holdings |
| `UsageLog` | `shares.usage_log` | One row per external API call |
| `DailyQuotaSummary` | `shares.daily_quota_summary` | One row per IST day |

## Schema isolation

[`backend/models/_schema.py`](backend/models/_schema.py) detects Postgres vs SQLite and exports:

```python
SCHEMA       = "shares" if Postgres else None
TABLE_KW     = {"schema": SCHEMA} if SCHEMA else {}
fk_target(t) = "shares.t.id"     if SCHEMA else "t.id"
```

Every model declares `__table_args__ = TABLE_KW` (or combines a tuple with it) so the same code runs against:

- **Local SQLite** (no schemas, plain table names)
- **Supabase Postgres** (all tables under `shares.*`, sister service MedUPI under `medupi.*`)

`database.py::ensure_schema()` runs `CREATE SCHEMA IF NOT EXISTS shares` on startup before `Base.metadata.create_all(bind=engine)`.

## Scheduler design

The Railway free tier blocks long-running cron jobs (paid feature). [`backend/services/scheduler.py`](backend/services/scheduler.py) replaces them with an in-process APScheduler that runs **while the web service is awake**:

- Alerts check — every 5 min during 09:15–15:30 IST Mon–Fri
- Open-call tracker — every 5 min during market hours
- Kite re-auth reminder — daily 05:55 IST (skipped when `DATA_SOURCE=yahoo`)
- Daily quota summary rollover — 00:00 IST

The legacy `/api/cron/*` URLs remain available for an external curl-based caller (laptop pusher or paid Railway cron) and are secret-gated by `CRON_SECRET`.

## Request lifecycle

```
client request
    +--- CORS middleware (allowed_origins set in main.py)
    +--- (optional) JWT auth dependency (deps.get_current_user)
    +--- Route handler
            +--- services.cache.get(key)              <-- short-circuits if hot
            +--- services.{screener,angel,news}_client
            +--- services.deepseek_client.chat(...)  <-- @tracked: budget pre-check + token log
            +--- services.cache.set(key, value, ttl)
    +--- response
    +--- exception_handler(CapExceeded) -> 503 {code: BUDGET_CAP_EXCEEDED}
```

Cold-start: Railway free dyno sleeps after 15 min idle. The frontend pings `/health` on app-mount; if any subsequent API call hangs >8 s, a "Backend is waking up" overlay appears. The HTML pages do not require auth for the Phase 3+ public endpoints, so most users never see auth flow at all.
