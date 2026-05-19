# Chitti Shares — Deploy Full Guide (Phases 1–6)

This is the single canonical guide for deploying Chitti Shares end-to-end. It supersedes (but does not replace) `DEPLOY_PHASE1.md`, `DEPLOY_PHASE2.md`, and `DEPLOY_PHASE3-5.md`, which are kept as references for incremental phase work.

---

## What is Chitti Shares?

A web app for Indian retail traders. AI-powered stock research with live indices, fundamentals, quarterly results, technical analysis, custom rule engine, watchlist, alerts, portfolio doctor, AI chat, and 10 stock-specific specialist Chittis.

**Production URL** (after deploy): https://shares.sahayai.in
**Backend API**: https://chitti-shares-api.up.railway.app
**Database**: SQLite on Render persistent disk

---

## Architecture

```
React SPA (Vite, Tailwind)               FastAPI (uvicorn)
─────────────────────                    ─────────────────
chitti-shares-web                ←──→    chitti-shares-api
  Render Static Site                       Render Web Service
  shares.sahayai.in                        chitti-shares-api.onrender.com
                                              │
                                              ├── SQLite (./data/chitti_shares.db)
                                              ├── Yahoo Finance (free, default)
                                              ├── Kite Connect (optional, for trades)
                                              ├── DeepSeek (chat + insights)
                                              ├── Fast2SMS (OTP)
                                              └── Telegram bot (Kite reauth alerts)

Render Cron Jobs                         GitHub Actions
─────────────────                        ──────────────
3× scheduled curl hits                   Auto-deploy on push to main
to /api/cron/* endpoints                   .github/workflows/deploy-chitti-shares.yml
```

---

## Pre-flight: API keys you need

You can deploy without all of these — Yahoo + DeepSeek are the only **mandatory** ones for daily use. Kite is plumbed but not required until you go live with paid trades.

| Service | Required? | Where to get | What it costs |
|---|---|---|---|
| Fast2SMS | Yes (real OTPs) | https://www.fast2sms.com/ | ~₹0.22/SMS |
| DeepSeek | Yes | https://platform.deepseek.com/api_keys | ~₹0.50–₹2.00/day at retail volume |
| Yahoo Finance | No (free) | (no key needed) | ₹0 |
| Kite Connect | Optional | https://developers.kite.trade/apps/new | ₹2,000 one-time + ₹500/month |
| Telegram bot | Optional | Message [@BotFather](https://t.me/BotFather) → `/newbot` | Free |
| Render | Yes (hosting) | https://dashboard.render.com/ | Free tier OK to start |

### Getting the Telegram bot token + chat ID (for Kite re-auth alerts)

1. Open Telegram, message **@BotFather**.
2. Send `/newbot`, follow the prompts. BotFather gives you a token like `123456:AAH...`. Save as `TELEGRAM_BOT_TOKEN`.
3. Send any message to your new bot (must do this so the bot has a chat to reply to).
4. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser, find `"chat":{"id":123456789}`. That number is your `TELEGRAM_CHAT_ID`.

If you skip Telegram, the cron `kite-reauth` endpoint just logs warnings — nothing breaks.

---

## Environment variables (every variable, explained)

Set all of these on the Render Web Service dashboard → **Environment** tab. There's a shorter `.env.example` in the repo with the same content.

### Phase 1: Auth + JWT
```
JWT_SECRET=                     # 32+ char random string. NEVER commit. Generate with: openssl rand -hex 32
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
DATABASE_URL=sqlite:///./data/chitti_shares.db
ADMIN_MOBILE=9876543210         # Your phone, used for Kite OAuth + admin endpoints
DEV_MODE_FAKE_OTP=false         # Set true ONLY in local dev to skip real SMS
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
FAST2SMS_API_KEY=               # From fast2sms.com → DevAPI → API key
```

### Phase 2: Market data
```
KITE_API_KEY=                   # From developers.kite.trade. Empty if Kite unused.
KITE_API_SECRET=
KITE_REDIRECT_URL=https://chitti-shares-api.up.railway.app/api/market/auth-callback
DATA_SOURCE=yahoo               # 'yahoo' (free) or 'kite' (paid). Switch later by changing this.
DEEPSEEK_API_KEY=               # From platform.deepseek.com
FRONTEND_URL=https://shares.sahayai.in
BACKEND_URL=https://chitti-shares-api.up.railway.app
```

### Phase 5: Watchlist + Alerts
```
ALERTS_POLL_MINUTES=5           # Used in legacy in-process scheduler. Phase 6 uses Render Cron instead.
MAX_WATCHLIST_ITEMS=50
MAX_ALERTS_PER_USER=30
```

### Phase 6: Quota / budget caps + Telegram + Cron
```
DAILY_BUDGET_INR=50             # Soft cap: warning logged when crossed
HARD_CAP_INR=100                # Hard cap: metered API calls return 503 until 00:00 IST
                                #   - DeepSeek + Fast2SMS get blocked
                                #   - Yahoo (free) keeps working
TELEGRAM_BOT_TOKEN=             # Optional. See "Getting the Telegram bot token" above.
TELEGRAM_CHAT_ID=
CRON_SECRET=                    # Long random string. Used in cron URL: ?secret=<CRON_SECRET>
                                # Generate with: openssl rand -hex 32
```

---

## First-time deploy (start to finish)

This assumes you already have a Render account and the GitHub Actions workflow committed.

### 1. Create the Web Service (backend)

1. Render Dashboard → **New** → **Web Service**.
2. Connect your `bryanwilfredpinto-ui/sahayai` repo.
3. **Root directory**: `chitti-shares/backend`
4. **Runtime**: Python 3
5. **Build command**: `pip install -r requirements.txt`
6. **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. **Plan**: Free (or Starter $7/mo if you want no auto-sleep)
8. **Persistent Disk**: Attach a 1 GB disk mounted at `/opt/render/project/src/data` (so SQLite survives restarts). The free plan does include this.
9. Paste all env vars from the section above.
10. Deploy. Tail the logs — you should see:
    ```
    INFO: Application startup complete.
    INFO: Uvicorn running on http://0.0.0.0:10000
    INFO stock_universe: Seeded 153 stocks into universe
    ```

Note the URL Render gives you, e.g. `chitti-shares-api.onrender.com`.

### 2. Create the Static Site (frontend)

1. Render Dashboard → **New** → **Static Site**.
2. Same repo.
3. **Root directory**: `chitti-shares/frontend`
4. **Build command**: `npm install && npm run build`
5. **Publish directory**: `dist`
6. **Environment**: add `VITE_API_URL=https://chitti-shares-api.up.railway.app` (no trailing slash).
7. Deploy.

### 3. Custom domain

1. Static site → **Settings** → **Custom Domain** → add `shares.sahayai.in`.
2. At your DNS provider (where `sahayai.in` is hosted), add a CNAME:
   ```
   shares.sahayai.in   CNAME   <your-render-static-site>.onrender.com
   ```
3. Wait 5–15 minutes. Render auto-provisions HTTPS.

### 4. Set up Render Cron Jobs (Phase 6)

Three cron jobs total. Render Dashboard → **New** → **Cron Job**.

| Cron name | Schedule (UTC) | Schedule (IST) | Command |
|---|---|---|---|
| chitti-alerts | `*/5 3-10 * * 1-5` | every 5 min, Mon–Fri 8:30–16:00 IST (covers full market) | `curl -X POST 'https://chitti-shares-api.up.railway.app/api/cron/alerts?secret=$CRON_SECRET'` |
| chitti-track-calls | `*/5 3-10 * * 1-5` | same as above | `curl -X POST 'https://chitti-shares-api.up.railway.app/api/cron/track-calls?secret=$CRON_SECRET'` |
| chitti-kite-reauth | `25 0 * * *` | 5:55 AM IST daily | `curl -X POST 'https://chitti-shares-api.up.railway.app/api/cron/kite-reauth?secret=$CRON_SECRET'` |

For each cron job:
- **Runtime**: Docker
- **Plan**: Cron Job (free tier supports 1 cron job; paid is $1/mo each)
- **Environment variable**: `CRON_SECRET` — set the SAME value as on the web service
- **Command**: as shown above

The endpoints are secret-protected. A wrong/missing secret returns 401.

> **Free tier note:** Render's free plan currently allows 1 cron job. If you only have one slot, prioritise `chitti-alerts`. The other two can be triggered manually via curl until you upgrade.

### 5. Smoke test

```bash
# Backend health
curl https://chitti-shares-api.up.railway.app/health
# → {"ok":true}

# OTP flow (replace MOBILE)
curl -X POST https://chitti-shares-api.up.railway.app/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"mobile":"9876543210"}'
# → {"ok":true}  (real SMS arrives if FAST2SMS_API_KEY is set)

# Cron secret check
curl -X POST 'https://chitti-shares-api.up.railway.app/api/cron/alerts?secret=wrong'
# → 401

curl -X POST 'https://chitti-shares-api.up.railway.app/api/cron/alerts?secret=YOUR_SECRET'
# → {"checked":N,"fired":M}  during market hours, or {"skipped":true,"reason":"outside market hours"}
```

Open `https://shares.sahayai.in`, log in with your mobile + OTP, you're on the dashboard.

---

## What's auto-managed vs manual

### Auto-managed
- **Database tables**: created on first startup via `Base.metadata.create_all()`. New columns from later phases auto-add on existing rows with defaults.
- **Stock universe**: ~153 Nifty/BSE stocks seeded on first start from `config/nifty_universe.json`. Idempotent; reseeding is a no-op.
- **Specialists config**: loaded from `config/stock_specialists.json` on first request. Hot-reloadable — push a new file and restart the web service.
- **Quota tracking**: every external API call (DeepSeek, Fast2SMS, Yahoo) auto-logs to `usage_log`. Daily summary in `daily_quota_summary` table. Resets at 00:00 IST naturally (new date row created).
- **Cold-start UX**: frontend pings `/health` on app mount. If any subsequent API call hangs >8 seconds, the "Backend is waking up — refresh the page" overlay appears.

### Manual (one-time per setup)
1. Set all env vars (above)
2. Configure DNS CNAME for `shares.sahayai.in`
3. Set up the 3 Render Cron Jobs (or just the alerts one on free tier)
4. Push code → CI/CD deploys automatically

### Manual (ongoing, only if `DATA_SOURCE=kite`)
- Daily Kite OAuth at ~6 AM IST (Zerodha invalidates all tokens daily). Visit `/api/market/auth-url` in the browser logged in as `ADMIN_MOBILE`. Telegram bot will remind you at 5:55 AM via the kite-reauth cron.

---

## API reference (62 routes)

### Auth (4)
- `POST /auth/send-otp` — request OTP for a mobile
- `POST /auth/verify-otp` — exchange OTP for access + refresh tokens
- `POST /auth/refresh` — get new access token
- `POST /auth/logout` — revoke refresh token

### User + devices (5)
- `GET /user/me` — profile (now includes `language`)
- `PUT /user/me` — update name and/or language (`{"language": "en"|"hi"}`)
- `GET /user/devices` — list logged-in devices
- `DELETE /user/devices/{id}` — revoke one device
- `DELETE /user/devices` — revoke all

### Market (6)
- `GET /api/market/indices` — Nifty + Sensex live
- `GET /api/market/view` — Chitti's daily AI summary
- `GET /api/market/auth-url` — Kite OAuth URL (admin)
- `GET /api/market/auth-callback` — OAuth return handler
- `GET /api/market/auth-status` — is Kite token valid?

### Stocks (5)
- `GET /api/stocks/search?q=...` — local Nifty universe search **(Phase 6)**
- `GET /api/stocks/resolve?q=...` — best canonical match
- `GET /api/stocks/{symbol}/quote` — single quote
- `GET /api/stocks/{symbol}/fundamentals` — full scorecard
- `GET /api/stocks/{symbol}/quarterly` — last 8 quarters
- `GET /api/stocks/{symbol}/history?days=&interval=` — OHLC candles
- `POST /api/stocks/{symbol}/chat` — talk to a stock specialist **(Phase 6)**

### Technical + custom rules (8)
- `GET /api/technical/{symbol}/analyze?timeframe=day|week|month` — indicators + ATR-based trade plan **(Phase 6)**
- `GET /api/technical/{symbol}/consensus` — multi-timeframe BUY/SELL/WAIT verdict **(Phase 6)**
- `POST /api/technical/rules/evaluate` — evaluate a custom rule
- `GET /api/technical/rules/examples` — pre-baked rule examples
- `GET /api/technical/rules/saved` — list user's saved rules **(Phase 6)**
- `POST /api/technical/rules/saved` — save a rule (max 5/user) **(Phase 6)**
- `POST /api/technical/rules/saved/{id}/run` — run a saved rule on a stock **(Phase 6)**
- `DELETE /api/technical/rules/saved/{id}` — delete saved rule **(Phase 6)**

### Calls (5)
- `GET /api/calls` — list user's calls
- `POST /api/calls` — log a new call
- `POST /api/calls/{id}/close` — manually close a call
- `POST /api/calls/track-all` — admin: refresh all open calls (manual; cron handles this normally)
- `GET /api/calls/stats` — win rate + summary **(Phase 6)**

### Watchlist (4)
- `GET /api/watchlist` — list with live quote + scorecard grade + tech signal **(Phase 6 enriched)**
- `POST /api/watchlist` — add symbol
- `POST /api/watchlist/reorder` — drag-to-reorder persistence **(Phase 6)**
- `DELETE /api/watchlist/{id}` — remove

### Alerts (7)
- `GET /api/alerts` — list user's alerts
- `POST /api/alerts` — create alert
- `POST /api/alerts/{id}/toggle` — enable/disable
- `DELETE /api/alerts/{id}` — remove
- `POST /api/alerts/check-all` — admin: run alert checker now
- `GET /api/alerts/events` — recent fired events
- `POST /api/alerts/events/mark-seen` — clear unread badge

### Portfolio (5)
- `GET /api/portfolio` — holdings + Doctor verdict + 5-star rating **(Phase 6 stars)**
- `POST /api/portfolio/holdings` — add a holding
- `POST /api/portfolio/upload` — Zerodha CSV import **(Phase 6)**
- `GET /api/portfolio/insights` — DeepSeek-generated 3 specific recommendations **(Phase 6)**
- `DELETE /api/portfolio/holdings/{id}` — remove

### Chat (3)
- `GET /api/chat` — history (last 50 messages)
- `POST /api/chat` — send message
- `DELETE /api/chat` — clear history

### Specialists (1) **(Phase 6)**
- `GET /api/specialists` — list 10 stock-specific Chittis

### Quota (3) **(Phase 6)**
- `GET /api/quota/today` — today's spend + caps + status
- `GET /api/quota/history` — last 30 days
- `GET /api/quota/breakdown` — this month grouped by provider/operation

### Cron (3) **(Phase 6)** — secret-protected
- `POST /api/cron/alerts?secret=...` — alerts checker (called by Render Cron)
- `POST /api/cron/track-calls?secret=...` — refresh open calls
- `POST /api/cron/kite-reauth?secret=...` — Telegram reminder if Kite token stale

### Health
- `GET /health` — `{"ok":true}`

---

## Acceptance test battery

After deploy, run this from any shell. Replace `BASE`, `MOBILE`, `CRON_SECRET`.

```bash
BASE=https://chitti-shares-api.up.railway.app
MOBILE=9876543210
SECRET=YOUR_CRON_SECRET

# 1. Health
curl -s $BASE/health
# → {"ok":true}

# 2. Send OTP (real SMS — check your phone)
curl -s -X POST $BASE/auth/send-otp \
     -H "Content-Type: application/json" \
     -d "{\"mobile\":\"$MOBILE\"}"

# 3. Verify (use OTP from SMS)
TOKEN=$(curl -s -X POST $BASE/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d "{\"mobile\":\"$MOBILE\",\"otp\":\"123456\",\"device_id\":\"test\",\"device_type\":\"desktop\",\"user_agent\":\"curl\"}" \
     | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

H="Authorization: Bearer $TOKEN"

# 4. /user/me has language field
curl -s -H "$H" $BASE/user/me | grep language

# 5. Stock search (local, fast)
curl -s -H "$H" "$BASE/api/stocks/search?q=reli"

# 6. Specialists list (Phase 6)
curl -s -H "$H" $BASE/api/specialists

# 7. Quota status
curl -s -H "$H" $BASE/api/quota/today

# 8. Watchlist round-trip
curl -s -X POST -H "$H" -H "Content-Type: application/json" \
     -d '{"symbol":"NSE:RELIANCE"}' $BASE/api/watchlist
curl -s -H "$H" $BASE/api/watchlist
# Reorder (just one item — for demo)
curl -s -X POST -H "$H" -H "Content-Type: application/json" \
     -d '{"ordered_ids":[1]}' $BASE/api/watchlist/reorder

# 9. Cron secret enforcement
curl -s -X POST "$BASE/api/cron/alerts?secret=wrong" -o /dev/null -w "%{http_code}\n"
# → 401
curl -s -X POST "$BASE/api/cron/alerts?secret=$SECRET"
# → {"checked":N,"fired":M} or {"skipped":true,...}

# 10. Saved rules
curl -s -X POST -H "$H" -H "Content-Type: application/json" \
     -d '{"name":"Buy on bounce","rule_text":"RSI(14) < 30","signal":"BUY"}' \
     $BASE/api/technical/rules/saved
curl -s -H "$H" $BASE/api/technical/rules/saved
```

---

## Common issues

### "The server is waking up. Please refresh the page in 20–30 seconds."
This is **expected behaviour** on Render's free tier. Dynos sleep after 15 min idle. The frontend's wake-up overlay handles it gracefully. To eliminate cold starts, upgrade the web service to **Starter ($7/mo)** which never sleeps.

### `503 BUDGET_CAP_EXCEEDED`
You've hit the daily ₹100 hard cap (or whatever `HARD_CAP_INR` is set to). Yahoo calls (free) still work. Other metered calls return 503 until 00:00 IST.
- Check `GET /api/quota/today` to see spend
- Check `GET /api/quota/breakdown` to see what's burning the budget
- Adjust `HARD_CAP_INR` upward if you're a heavy user
- Most likely culprit: portfolio insights or specialist chats hitting DeepSeek

### Yahoo returns 403 / "possibly delisted"
Yahoo Finance occasionally rate-limits or geo-blocks. yfinance retries automatically. If it persists, set `DATA_SOURCE=kite` (after Kite setup) — Kite is more reliable but paid.

### Kite re-auth needed every morning
This is by design. Zerodha invalidates all access tokens daily ~06:00 IST. The Telegram cron at 5:55 IST sends a reminder. To re-auth: visit `https://chitti-shares-api.up.railway.app/api/market/auth-url` while logged in as `ADMIN_MOBILE`.

### Cron job never runs
- Verify the `secret` query param matches `CRON_SECRET` exactly (case-sensitive)
- Render free tier only allows 1 cron job; check you're not over the limit
- Check Render → Cron Job → Logs

---

## Migrating between phases

If you were on Phase 1–5 and pulling the Phase 6 code:

1. Existing tables get **new columns** automatically:
   - `users.language` → defaults `'en'`
   - `watchlist_items.order_index` → defaults `0`
2. **New tables** auto-create on first start:
   - `usage_log`, `daily_quota_summary`, `stocks`, `custom_rules`
3. **New env vars** must be added (see Phase 6 section above). Without them:
   - No `CRON_SECRET` → cron endpoints return 503
   - No Telegram → kite-reauth logs warnings, doesn't crash
   - No `HARD_CAP_INR` / `DAILY_BUDGET_INR` → defaults of 100 / 50 apply
4. Restart the web service to seed the stock universe.

That's it. No data migration required.

---

## Cost estimate (typical solo trader)

Month 1 (1 active user, you):
- Render Web Service free: ₹0 (cold-starts up to 30s; Starter $7 = ₹600 if you want zero cold-starts)
- Render Static Site: ₹0
- Render Cron Job (1 free): ₹0
- Fast2SMS: ~₹6/month (1 OTP/day)
- DeepSeek: ~₹50–₹150/month (depends on chat usage)
- Yahoo: ₹0
- Domain (already owned): ₹0
- **Total: ₹50–₹160/month** if free Render tier; ~₹650–₹760/month with Starter

Month 6+ (with Kite for live trading):
- Add Kite Connect: ₹500/month
- Render Starter recommended: ₹600/month
- DeepSeek with specialist usage: ~₹200–₹400/month
- **Total: ~₹1,300–₹1,500/month**

The hard cap protects you from runaway bills.

---

## Files & directories cheatsheet

```
chitti-shares/
├── backend/
│   ├── main.py              # FastAPI app, mounts 13 routers
│   ├── config.py            # Settings (env vars)
│   ├── database.py          # SQLAlchemy session
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/
│   │   ├── nifty_universe.json     # 153 stock seed
│   │   └── stock_specialists.json  # 10 specialists config
│   ├── models/              # SQLAlchemy models (one file per area)
│   ├── routes/              # FastAPI routers
│   └── services/            # Business logic, external clients
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router + WakeUpOverlay
│   │   ├── components/      # Reusable UI
│   │   ├── pages/           # Route components
│   │   └── utils/           # api.js, auth.js, i18n.js, format.js
│   └── package.json
├── DEPLOY_FULL.md           # ← you are here
├── DEPLOY_PHASE1.md         # Reference: Phase 1 only
├── DEPLOY_PHASE2.md         # Reference: Phase 2 only
├── DEPLOY_PHASE3-5.md       # Reference: Phases 3–5
└── README.md
```

That's the whole system. If anything in the deploy fails, check the **Common issues** section first; if still stuck, copy the failing log line into Chitti chat — it has full self-knowledge of this codebase.
