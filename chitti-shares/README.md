# Chitti Shares — Phases 1–6 Complete

Premium AI trading intelligence for Indian retail traders.

| Phase | What it ships |
|---|---|
| **1** | Mobile-OTP auth, JWT refresh, device management, dashboard shell |
| **2** | Live Nifty/Sensex via Kite, Chitti Market View (DeepSeek 2-sentence summary) |
| **3** | Stock fundamentals scorecard (A+/F grading), quarterly results with star rating |
| **4** | Technical analysis (RSI, MACD, Williams %R, Force Index, Elder Ray) + custom rule DSL + call reports |
| **5** | Watchlist, alerts (price/RSI), Portfolio Doctor, Chitti AI Chat, Hindi UI, voice playback |
| **6** | **Quota tracking · 10 stock specialists · ATR trade plans · multi-TF consensus · saved rules · CSV upload · AI portfolio insights · 5-star rating · Render Cron · Telegram Kite reminder · drag-to-reorder watchlist · cold-start wake-up screen** |

**Status: 62 routes, 153 stock universe seeded, frontend builds 149 KB gzipped.**

```
chitti-shares/
├── backend/                FastAPI + SQLAlchemy + JWT + Fast2SMS + Yahoo + DeepSeek + Telegram
│   ├── config/             nifty_universe.json (seed) + stock_specialists.json
│   ├── routes/             auth, user, market, stocks, technical, portfolio,
│   │                        chat, quota, specialists, cron     (13 routers)
│   └── services/           data_source, indicators, rule_engine, scorecard,
│                            usage_tracker, stock_universe, specialist
├── frontend/               React 18 + Vite + Tailwind + i18n (en/hi) + DnD + voice I/O
│   ├── components/         WakeUpOverlay, QuotaWidget, StockSearch, VoiceButton, ...
│   └── pages/              Dashboard, Markets, Portfolio, Alerts, Calls,
│                            Specialists, SpecialistChat, ChittiChat, ...
├── render.yaml             Blueprint for backend + web + DB + 3 cron jobs
├── README.md               ← you are here
├── DEPLOY_FULL.md          ★ Single canonical deploy guide (read this first)
├── DEPLOY_PHASE1.md        Reference: Phase 1 only
├── DEPLOY_PHASE2.md        Reference: Phase 2 only
└── DEPLOY_PHASE3-5.md      Reference: Phases 3–5
```

## Active data source

**Yahoo Finance is the active source.** Free, no daily token expiry, no monthly fee. Kite Connect is plumbed as a provision — flip `DATA_SOURCE=kite` after purchasing the API to get:

- Real-time data (no 15-min delay)
- Level-2 / market depth
- Same broker for live trading hooks

When `DATA_SOURCE=yahoo`, the daily Kite OAuth dance is **not** needed. The Telegram re-auth cron auto-skips on Yahoo mode.

## Phase 6 highlights

### Cold-start wake-up UX
Render's free dyno sleeps after 15 min idle. The frontend pings `/health` on app mount; if any subsequent API call hangs >8s, a friendly **"Backend is waking up — refresh the page"** overlay appears with a live timer. No more confused users staring at a blank screen.

### Budget caps
Every external API call (DeepSeek, Fast2SMS, Yahoo) is auto-logged with token counts and INR cost. **Soft cap (₹50/day)** logs a warning. **Hard cap (₹100/day)** returns 503 on metered routes. Yahoo (free) is never blocked. Daily reset at 00:00 IST. Visible on the dashboard top-right at all times.

### 10 Stock Specialists
Per-stock Chittis with focused context. Each pulls live fundamentals + last quarterly + today's technical signal for that one stock and builds a system prompt that pins the specialty + language. Configured via `config/stock_specialists.json` — adding an 11th stock requires no code change.

### ATR-based trade plans
Every Technical analysis now returns an Entry zone, Target, Stop Loss, and Risk:Reward ratio derived from ATR(14). Auto-fills the "Log Call" form so you don't have to do mental math.

### Multi-timeframe consensus
Strict-filter signal: checks day, week, month timeframes. Returns BUY only if all bullish, SELL only if all bearish, else WAIT with reason. Surfaces the "higher TF disagrees" warning before you log a bad call.

### Saved custom rules
Up to 5 saved rules per user. Save a custom rule once, run it against any stock with one click. Examples: "Oversold bounce", "Strong uptrend", "Breakout above Bollinger".

### Portfolio improvements
- **CSV upload** in Zerodha holdings.csv format (`Instrument, Qty., Avg. cost`)
- **AI Insights** button hits DeepSeek for 3 specific recommendations
- **5-star rating** based on diversification, concentration, P&L
- **Cached** insights (1hr TTL) so refreshing the page doesn't burn budget

### Drag-to-reorder watchlist
Uses `@hello-pangea/dnd` (modern fork of react-beautiful-dnd, React 18 compatible). Each row inline shows scorecard grade + technical signal when cached. New items go to the bottom; user reordering persists in DB.

### Render Cron Jobs
Three secret-protected endpoints:
- `/api/cron/alerts` (every 5 min, market hours) — checks alerts, fires events
- `/api/cron/track-calls` (every 5 min, market hours) — refreshes open calls, marks target/SL hits
- `/api/cron/kite-reauth` (5:55 AM IST daily) — sends Telegram reminder if Kite token stale (skipped if `DATA_SOURCE=yahoo`)

## Quick deploy

See **`DEPLOY_FULL.md`** for the complete walkthrough. TL;DR:

1. Push the repo to GitHub.
2. Render → New → Blueprint → point at the repo. `render.yaml` provisions backend + frontend + DB + 3 crons.
3. Set manual env vars: `FAST2SMS_API_KEY`, `DEEPSEEK_API_KEY`, `ADMIN_MOBILE`, `CRON_SECRET`. (Kite + Telegram optional.)
4. Add CNAME `shares.sahayai.in → <render-static-site>.onrender.com`.
5. Open `https://shares.sahayai.in` and log in.

First request after a deploy / cold start may take 30s — the wake-up overlay handles this gracefully.

## Tech stack

| Layer | Tools |
|---|---|
| Backend | FastAPI 0.115, SQLAlchemy 2.0, Uvicorn, httpx, yfinance, kiteconnect, bcrypt, PyJWT |
| Frontend | React 18.3, Vite 5.4, Tailwind 3.4, react-router 6, axios, react-hot-toast, @hello-pangea/dnd, FingerprintJS |
| Data | Yahoo Finance (default, free) / Kite Connect (optional, paid) |
| AI | DeepSeek chat completions (~₹50/M input tokens) |
| Auth | Mobile OTP via Fast2SMS, JWT access + refresh, per-device tracking |
| Hosting | Render (free tier supported with cold starts) |
| Database | SQLite on persistent disk, or Postgres if `DATABASE_URL` is set |
| i18n | English + Hindi (Devanagari), persisted in DB + localStorage |
| Voice | Web Speech API (browser-native TTS + STT, no cloud bill) |

No external state, no microservices, no Kubernetes. Single web service + single static site + 3 crons.
