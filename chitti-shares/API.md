# API

Every HTTP route currently exposed by the Chitti Shares backend. Base URL on production:

```
https://chitti-shares-api-production.up.railway.app
```

Grouped by surface: **Public / Shared**, **Fundamentals frontend**, **Technical frontend**, **Authenticated**, **Agentic (DeepSeek tool-calling)**, **Sibling MedUPI**, **Diagnostic / Cron / Health**.

Symbol parameters are URL-encoded canonical form, e.g. `NSE:RELIANCE`, `BSE:SENSEX`. Frontend must `encodeURIComponent`.

## 1. Health / debug

| Method | Path | Source | Notes |
|---|---|---|---|
| GET | `/` | [`main.py`](backend/main.py) | Returns `{app, version, status}` |
| GET | `/health` | [`main.py`](backend/main.py) | `{ok: true}` — used by Railway and the frontend wake-up ping |
| GET | `/debug/nse` | [`main.py`](backend/main.py) | NSE direct healthcheck + sample NIFTY/SENSEX/BANKNIFTY quotes |
| GET | `/debug/angel` | [`main.py`](backend/main.py) | Angel SmartAPI healthcheck |
| POST | `/debug/ingest-indices` | [`main.py`](backend/main.py) | Body `{secret, quotes:[{canonical,last_price,prev_close,day_open,day_high,day_low,change,pchange},...]}` — laptop pusher upsert into `index_quotes`. Auth = `?secret=CRON_SECRET` match. |

## 2. Fundamentals frontend endpoints

All public (no auth). Used by [`chitti_fundamentals.html`](../chitti_fundamentals.html) and the Phase 7 Snowflake / Confidence / Risk-Fit overlays.

| Method | Path | Returns |
|---|---|---|
| GET | `/api/fundamentals/{symbol}` | Identity, sector, industry, 52W H/L, P/E, fwd P/E, P/B, EPS, dividend yield, D/E, ROE, ROA, ROCE, margins, current/quick ratio, book value, beta, EV/EBITDA, PEG, shares outstanding, revenue & earnings growth, last 8 quarters (revenue + net profit + operating profit + OPM). 1 hr cache. Source: screener.in primary, Yahoo local-dev fallback. |
| GET | `/api/financials/{symbol}` | Full financial-statements matrix from screener.in: quarterly P&L, half-yearly P&L (derived), annual P&L + BS + CF. |
| GET | `/api/cagr/{symbol}` | 3 y / 5 y / 10 y CAGR for Sales, Operating Profit, Net Profit. |
| GET | `/api/shareholding/{symbol}` | Quarterly Promoter / FII / DII / Public / MF / Pledged. Empty dict if unavailable. |
| GET | `/api/fundamental-scan?universe=&strategy=&max_stocks=` | Strategy filter across a universe. `strategy` slug: `buffett` (default) / `lynch` / `graham` / `greenblatt` / `munger` / `fisher` / `pabrai` / `marks` / `rj` / `kedia` / `rkd` / `rmd` / `ns` / `hdfc` / `mirae` / `motilal` / `jpm` / `gs` / `cs1`–`cs4` / `pli` / `china1` / `infra` / `green` / `defence` / `digital` / `div-aristo` / `turnaround` / `insider` / `debt-free` / `hidden`. `universe`: `nifty50` / `largecap` / `midcap` / `smallcap` / `microcap` / `all`. |
| GET | `/api/fundamental-scan/strategies` | List every strategy slug + plain-English name + caveat note. |
| GET | `/api/news/market?limit=` | Top market-moving headlines (Moneycontrol / LiveMint / BSE filings / NSE announcements). 10 min cache. `limit` max 50. |
| GET | `/api/news/stock/{symbol}?limit=` | Headlines mentioning the symbol. `limit` max 25. |
| GET | `/api/snowflake/{symbol}` | 5D Value/Growth/Quality/Health/Income radar (0–10 each). |
| GET | `/api/confidence/{symbol}` | Confidence Dial 0–10 + reasoning. |
| GET | `/api/risk-fit/{symbol}?persona=` | Risk-Fit overlay. `persona`: `conservative` / `moderate` (default) / `aggressive`. |
| GET | `/api/performance/{symbol}` | Performance vs NIFTY 1 M / 6 M / 1 Y / 3 Y / 5 Y / 10 Y + alpha. |
| POST | `/api/returns` | Body `{symbol, mode:"lumpsum"|"sip", amount_inr?|monthly_inr?, years}`. Returns ending value + CAGR vs NIFTY vs Bank FD. |

## 3. Technical frontend endpoints

All public (no auth). Used by [`chitti_complete_technical.html`](../chitti_complete_technical.html).

| Method | Path | Returns |
|---|---|---|
| GET | `/api/technical/{symbol}?indicators=` | Full technical analysis. `indicators` optional comma-separated subset of the 43, e.g. `RSI,MACD,Roshan Indicator`. Empty = all. Per-indicator BUY/SELL/WAIT across all timeframes. |
| GET | `/api/scan/roshan?call=&universe=&max_stocks=&force=` | Roshan Indicator scan. `call`: `Long-term` / `Positional` (default) / `Swing` / `Intraday`. `universe`: `nifty50` (default) / `largecap` / `midcap` / `smallcap` / `microcap`. Returns BUY + SHORT lists. |
| GET | `/api/scan/{indicator}?call=&universe=&max_stocks=&force=&tf1=&tf2=&pullback=` | Generic scanner. `indicator` URL-encoded (e.g. `MACD`, `Force+Index`). `call=Custom` requires `tf1`, `tf2`, `pullback`. |
| GET | `/api/scan/cache` | Diagnostic — what's currently cached. |
| GET | `/api/levels/{symbol}?timeframe=` | Auto support / resistance + trendlines. `timeframe`: `Monthly` / `Weekly` / `Daily` (default) / `4H` / `1H` / `15min` / `5min` / `1min`. |
| GET | `/api/candles/{symbol}?timeframe=&days_back=` | OHLCV candles. `timeframe` same as levels; `days_back` default 180. Intraday TFs route through `services.intraday_candles`; others through `services.technical`. |
| GET | `/api/strength/{symbol}?timeframe=` | Composite signal strength 0–10 + confluence breakdown for one TF. |
| GET | `/api/rating-table/{symbol}` | STRONG BUY / BUY / NEUTRAL / SELL / STRONG SELL across every timeframe. |
| GET | `/api/quotes?symbols=NSE:RELIANCE,NSE:TCS,...` | Batch live quotes via Angel SmartAPI. Returns `{symbol: {last_price, change, pchange, ...}}`. |
| POST | `/api/chitti-view/{symbol}` | Body `{timeframe, rsi?, macd_signal?, trend?, price?, ma50?, ma200?}`. Returns `{verdict: "BUY"|"SELL"|"HOLD", summary, language}`. 2–3-sentence DeepSeek-generated plain-English call, auto-spoken by the frontend. |

## 4. Authenticated routers (mounted in `main.py`)

JWT bearer required (`Authorization: Bearer <access_token>`) unless flagged Admin.

### 4.1 Auth — `routes/auth.py`

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/send-otp` | `{mobile: "[6-9]\d{9}"}` | Always 200 — does not reveal whether the number is registered. |
| POST | `/auth/verify-otp` | `{mobile, otp, device_id, device_type: "mobile"|"desktop", user_agent?}` | Verifies OTP; auto-creates User if first login; enforces 2-device cap (1 mobile + 1 desktop) by deleting the existing same-type Device row of a different device_id. Returns `{access_token, refresh_token, user}`. |
| POST | `/auth/refresh` | `{refresh_token}` | Swap refresh for new access token. Checks Device.refresh_jti so revoked devices fail. |
| POST | `/auth/logout` | `{refresh_token?}` | Idempotent. Deletes the Device row matching the refresh token's jti. |

### 4.2 User — `routes/user.py`

| Method | Path | Body / Returns |
|---|---|---|
| GET | `/user/me` | `{id, mobile, name, language, created_at}` |
| PUT | `/user/me` | `{name?, language?: "en"|"hi"}` |
| GET | `/user/devices` | List of `{id, device_type, user_agent, created_at, last_active}` |
| DELETE | `/user/devices/{device_id}` | Revoke one device |
| DELETE | `/user/devices` | Revoke all devices for current user |

### 4.3 Market — `routes/market.py`

Admin-gated routes require the authenticated user's `mobile == ADMIN_MOBILE`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/market/auth-url` | Admin | URL admin clicks to log into Kite. |
| GET | `/api/market/auth-callback?request_token=` | **Public** (kite redirect) | Swaps Kite request_token → access_token, stores in `kite_tokens`. Returns HTML page. |
| GET | `/api/market/auth-status` | Admin | Whether a Kite token is currently stored. |
| GET | `/api/market/indices` | User | NIFTY 50 + SENSEX live + support / resistance / signal. 5 min cache when market open, 30 min when closed. |
| GET | `/api/market/view` | User | Chitti's 2-sentence DeepSeek AI summary of today's market. 15 min cache. |

### 4.4 Stocks — `routes/stocks.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/stocks/search?q=` | Local Nifty 500 fuzzy search (no Yahoo / Angel round trip). |
| GET | `/api/stocks/resolve?q=` | User input → canonical symbol form. 1 hr cache. |
| GET | `/api/stocks/{symbol}/quote` | LTP + day OHLC. 1 min cache. |
| GET | `/api/stocks/{symbol}/fundamentals` | Scorecard (A+ → F) + raw fundamentals. 1 hr cache. **AUTHENTICATED VARIANT** of the public `/api/fundamentals/{symbol}` — uses yahoo_client internally because it relies on `services.scorecard.build_scorecard`. |
| GET | `/api/stocks/{symbol}/quarterly` | Last 8 quarters + star rating. 1 hr cache. |
| GET | `/api/stocks/{symbol}/history?days=&interval=` | OHLC candles. `days` 5–2000, `interval` defaults `day`. 5 min cache. |

### 4.5 Technical (authenticated) — `routes/technical.py`

| Method | Path | Body / Notes |
|---|---|---|
| GET | `/api/technical/{symbol}/analyze?timeframe=` | `timeframe`: `day` / `week` / `month`. Returns indicators + ATR-based entry/target/SL trade plan. 5 min cache. |
| GET | `/api/technical/{symbol}/consensus` | Strict-filter: day + week + month. All bullish → BUY; all bearish → SELL; else WAIT with reason. |
| POST | `/api/technical/rules/evaluate` | `{symbol, rule_text, timeframe?}`. Evaluates a custom rule (`RSI(14) < 30 AND MACD_HIST > 0`) against fresh data. |
| GET | `/api/technical/rules/examples` | Pre-baked example rules. |
| GET | `/api/technical/rules/saved` | List the user's saved rules. |
| POST | `/api/technical/rules/saved` | `{name, rule_text, signal: "BUY"|"SELL"|"WAIT"}`. Max 5 saved per user. |
| DELETE | `/api/technical/rules/saved/{rule_id}` | Delete one. |
| POST | `/api/technical/rules/saved/{rule_id}/run` | `{symbol, timeframe?}`. Re-evaluate the saved rule on a new symbol. |

### 4.6 Calls — `routes/technical.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/calls` | List all calls (user's + system-wide system_user_id NULL ones). 200 row cap. |
| GET | `/api/calls/stats` | Win rate + summary. |
| POST | `/api/calls` | `{symbol, call_type: BUY|SELL|WAIT, timeframe, entry_price, target?, stop_loss?, rationale?}` |
| POST | `/api/calls/{id}/close` | `{closed_price}` — manual close. |
| POST | `/api/calls/track-all` | **Admin**. Refresh open calls; auto-mark target_hit / sl_hit. (Cron alias: `/api/cron/track-calls?secret=`.) |

### 4.7 Watchlist — `routes/portfolio.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/watchlist` | List + best-effort scorecard grade + cached technical signal per row. |
| POST | `/api/watchlist` | `{symbol, note?}`. Cap `MAX_WATCHLIST_ITEMS=50`. |
| POST | `/api/watchlist/reorder` | `{ordered_ids: [int]}` — persists drag-reorder. |
| DELETE | `/api/watchlist/{item_id}` | Remove one. |

### 4.8 Alerts — `routes/portfolio.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/alerts` | List. |
| POST | `/api/alerts` | `{symbol, kind: price_above|price_below|rsi_above|rsi_below, threshold, timeframe?, note?}`. Cap `MAX_ALERTS_PER_USER=30`. |
| POST | `/api/alerts/{id}/toggle` | Active ↔ paused. Resets `triggered_at`. |
| DELETE | `/api/alerts/{id}` | Remove. |
| GET | `/api/alerts/events` | Last 50 fired events for current user. |
| POST | `/api/alerts/events/mark-seen` | Mark all unseen events as seen. |
| POST | `/api/alerts/check-all` | **Admin**. Run alert checker now. (Cron alias: `/api/cron/alerts?secret=`.) |

### 4.9 Portfolio — `routes/portfolio.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/portfolio` | Holdings + Doctor verdict (Healthy / Mostly healthy / Needs attention / Significant issues) + 1–5 star rating + concerns + wins. |
| GET | `/api/portfolio/insights` | DeepSeek-generated 3 specific recommendations. Cached per-user 1 hr. |
| POST | `/api/portfolio/holdings` | `{symbol, qty, avg_buy_price}`. Merges if symbol already held (weighted-avg price). |
| POST | `/api/portfolio/upload` | multipart CSV (Zerodha holdings.csv format `Instrument, Qty., Avg. cost`). Replaces existing holdings. |
| DELETE | `/api/portfolio/holdings/{id}` | Remove one. |

### 4.10 Chat — `routes/chat.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/chat` | Last 50 messages. |
| POST | `/api/chat` | `{message}`. Returns `{reply, created_at}`. Context: user name, watchlist + cached quotes, indices summary, open calls. Portfolio holdings NOT sent to LLM by default. |
| DELETE | `/api/chat` | Wipe history. |

### 4.11 Quota — `routes/quota.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/quota/today` | `{date_ist, total_inr, soft_cap_inr, hard_cap_inr, remaining_to_soft, remaining_to_hard, status: ok|warning|blocked, by_provider, call_count, blocked_count}` |
| GET | `/api/quota/history` | Last 30 days. |
| GET | `/api/quota/breakdown` | This month grouped by provider + operation. |

Public, unauthenticated variant lives at `/api/usage/today` in [`main.py`](backend/main.py). Returns the same shape plus a per-operation breakdown + DeepSeek pricing constants.

### 4.12 Specialists — `routes/specialists.py`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/specialists` | List all configured stock specialists with `{symbol, display_name, long_name, expertise}`. |
| POST | `/api/stocks/{symbol}/chat` | `{message}`. Returns `{symbol, reply}`. Specialist pulls live fundamentals + last quarterly + today's technical for THAT one stock and builds a focused DeepSeek prompt. History NOT persisted (Q&A only). |

## 5. Agentic surface (DeepSeek tool-calling)

All public. Run an LLM-pick-tool / execute / loop / synthesise cycle via [`services/agent_runtime.py`](backend/services/agent_runtime.py). System prompts + tool schemas live in [`services/agent_tools.py`](backend/services/agent_tools.py). See [PROMPTS.md](./PROMPTS.md) for exact prompt text.

| Method | Path | Body |
|---|---|---|
| POST | `/api/agent/technical/ask` | `{question, max_steps?}`. Tools: `get_quote`, `get_signal_strength`, `get_rating_table`, `get_indicator_signals`, `get_levels`, `scan_universe`. |
| POST | `/api/agent/fundamental/ask` | `{question, lens?: buffett|lynch|graham|greenblatt|..., max_steps?}`. Tools: `get_fundamentals`, `get_financials`, `get_cagr`, `get_shareholding`, `get_news`. |
| POST | `/api/agent/medupi/ask` | `{question, max_steps?}`. Tools: `search_medicine`, `find_alternatives`, `classify_risk`, `find_jan_aushadhi_stores`, `simulate_cart`. (Sibling product co-hosted.) |

## 6. Sibling MedUPI endpoints (co-hosted)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/medupi/medicine/{name}` | Lookup brand or molecule. |
| GET | `/api/medupi/alternatives?molecule=&strength=&dosage_form=&current_brand=` | Strict same-composition equivalents. |
| GET | `/api/medupi/risk/{molecule}` | HIGH / MEDIUM / LOW classification. |
| GET | `/api/medupi/jan_aushadhi?lat=&lng=&radius_km=&limit=` | Nearby Jan Aushadhi stores. |
| POST | `/api/medupi/cart-simulator` | Body `{items: [{molecule, strength, dosage_form, monthly_qty, current_price, current_brand?}, ...]}`. Returns optimised cart. |
| GET | `/api/medupi/family/wallet` | **Skeleton** — see [TODO.md](./TODO.md) §N. |
| GET | `/api/medupi/insurance-match?molecule=&scheme=` | **Skeleton**. |
| GET | `/api/medupi/jan_aushadhi/stock?store_id=&molecule=&strength=&dosage_form=` | **Skeleton**. |

## 7. Cron — `routes/cron.py`

All require `?secret=CRON_SECRET`. Designed for external curl callers.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/cron/alerts?secret=` | Runs `routes/portfolio.run_alert_check`. Skipped outside market hours. |
| POST | `/api/cron/track-calls?secret=` | Refresh open calls, mark target / SL hit. |
| POST | `/api/cron/kite-reauth?secret=` | Telegram reminder if Kite token stale (>22 hrs). Skipped if `DATA_SOURCE != kite`. |

## 8. Error handling

- Any handler that calls a DeepSeek-tracked function may raise `services.usage_tracker.CapExceeded`. The global exception handler returns `503 {detail, code: "BUDGET_CAP_EXCEEDED"}`.
- `DataSourceAuthError` (Kite OAuth missing) → `503`. `DataSourceError` (network / parse) → `502`.
- All 401/403/404 follow FastAPI defaults.
