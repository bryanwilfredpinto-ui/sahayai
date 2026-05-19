# Deploy Phases 3–5 — Yahoo Finance + Watchlist + Alerts + Portfolio + Chat

Phase 1 ships auth. Phase 2 ships indices. **Phases 3–5 ship the actual product.**

This document covers what changed since Phase 2 and how to verify each new
endpoint and feature. The CI/CD workflow you set up earlier (`deploy-chitti-shares.yml`)
will auto-deploy everything on `git push`.

---

## TL;DR

1. Add 4 new env vars on `chitti-shares-api` (Render dashboard).
2. `git push origin main` — workflow handles the rest.
3. After Render shows "Live", run the curl block at the bottom.
4. The daily Kite OAuth ritual is **no longer needed** while `DATA_SOURCE=yahoo`.

---

## What's new since Phase 2

### Backend
- **Yahoo Finance** as the active market-data source via `services/data_source.py` —
  Kite stays plumbed in but inactive. Toggle with `DATA_SOURCE=yahoo|kite`.
- **30 new authenticated routes** across stocks, technical, calls, watchlist, alerts,
  portfolio, chat. (44 total now.)
- **6 new database tables**: `watchlist_items`, `alerts`, `alert_events`,
  `call_reports`, `chat_messages`, `portfolio_holdings`.
  Auto-created on first start via `Base.metadata.create_all()`.
- **Pure-Python indicators**: SMA, EMA, RSI, MACD, Williams %R, Force Index, Elder Ray,
  Bollinger Bands. No pandas dep — saves ~50 MB at build time.
- **Custom rule DSL**: Parses things like `RSI(14) > SMA(20 of RSI(14)) AND MACD_HIST > 0`.
  Recursive-descent parser, never uses `eval()`.

### Frontend
- 5 tabs in bottom nav: Home, Markets, Portfolio, Alerts, Chitti AI.
- Stock detail page with Fundamentals / Quarterly / Technical / Custom Rule tabs.
- Hindi UI toggle in Settings (English ↔ हिन्दी).
- Voice playback for Chitti's chat replies (`window.speechSynthesis`).

---

## Step 1 — Add new env vars on Render

Open the `chitti-shares-api` service → **Environment** tab. Add these 4:

| Key | Value | Why |
|---|---|---|
| `DATA_SOURCE` | `yahoo` | Picks Yahoo (free, no daily expiry) over Kite |
| `ALERTS_POLL_MINUTES` | `5` | How often `check-all` runs (cron job) |
| `MAX_WATCHLIST_ITEMS` | `50` | Cap per user |
| `MAX_ALERTS_PER_USER` | `30` | Cap per user |

Click **Save changes**. Render will auto-redeploy. Wait ~3–5 min for "Live" status.

The previously-set env vars (`JWT_SECRET`, `FAST2SMS_API_KEY`, `KITE_API_KEY`,
`KITE_API_SECRET`, `KITE_REDIRECT_URL`, `DEEPSEEK_API_KEY`, `ADMIN_MOBILE`,
`FRONTEND_URL`, `BACKEND_URL`, `DATABASE_URL`, etc.) all stay as they were.

> **Note on Kite vars:** keep `KITE_API_KEY` / `KITE_API_SECRET` set even though
> we're using Yahoo. They're needed only if you flip `DATA_SOURCE=kite` later.
> The Kite OAuth routes still mount; they just don't get hit.

---

## Step 2 — Push the code

```bash
cd ~/sahayai
git checkout main
git pull origin main

# Drop the new chitti-shares folder into place
# (replace your previous one)
rm -rf chitti-shares
unzip -o /path/to/downloaded/chitti-shares-phase1-5.zip
mv chitti-shares-extracted-folder chitti-shares  # or wherever it extracted

git status
# Expected: lots of changes under chitti-shares/ — backend/, frontend/, render.yaml, README.md
# Should NOT see anything outside chitti-shares/.

git add chitti-shares/
git commit -m "feat(chitti-shares): phases 3-5 (yahoo, watchlist, alerts, portfolio, chat)"
git push origin main
```

The `Deploy Chitti Shares` workflow runs in Actions. ~10 sec to fire the hooks.
Render then takes ~3–5 min to build backend (new deps: `yfinance`) and ~2–3 min
for frontend (just one new build).

You'll see ✅ commit comments when the workflow succeeds. Watch
`https://dashboard.render.com` for the actual build progress.

---

## Step 3 — Acceptance tests

Login first to grab a token (do this in your browser DevTools after a successful
login — `localStorage.getItem('chitti_access_token')` — or via the curl flow below):

```bash
# Get an access token (with DEV_MODE_FAKE_OTP=true)
API=https://chitti-shares-api.up.railway.app
MOBILE=9999999999

curl -s -X POST $API/auth/send-otp \
  -H 'Content-Type: application/json' \
  -d "{\"mobile\":\"$MOBILE\"}"

# OTP appears in Render logs (chitti-shares-api → Logs tab) when DEV_MODE_FAKE_OTP=true
# Or arrives via SMS if you've set FAST2SMS_API_KEY.

# Replace 123456 with the actual OTP
TOKEN=$(curl -s -X POST $API/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d "{\"mobile\":\"$MOBILE\",\"otp\":\"123456\",\"device_id\":\"curl-test\",\"device_type\":\"desktop\",\"user_agent\":\"curl\"}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

echo "Token: ${TOKEN:0:30}..."
H="Authorization: Bearer $TOKEN"
```

Now hit each Phase 3–5 surface:

```bash
# ===== Phase 3: Stock data =====
curl -sH "$H" "$API/api/stocks/resolve?q=reliance" | python3 -m json.tool
# expect: {"input":"reliance","symbol":"NSE:RELIANCE"}

curl -sH "$H" "$API/api/stocks/NSE:RELIANCE/quote" | python3 -m json.tool
# expect: last_price, prev_close, day_high/low/open, currency

curl -sH "$H" "$API/api/stocks/NSE:RELIANCE/fundamentals" | python3 -m json.tool | head -40
# expect: name, sector, scorecard with metrics + overall_grade

curl -sH "$H" "$API/api/stocks/NSE:RELIANCE/quarterly" | python3 -m json.tool | head -30
# expect: star_rating, revenue_trend, profit_trend, all (last 8 quarters)

curl -sH "$H" "$API/api/stocks/NSE:RELIANCE/history?days=30&interval=day" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(f"{len(d[\"candles\"])} candles, latest close: {d[\"candles\"][-1][\"close\"]}")'
# expect: ~22 candles (trading days), valid close price

# ===== Phase 4: Technical analysis =====
curl -sH "$H" "$API/api/technical/NSE:RELIANCE/analyze?timeframe=day" | python3 -m json.tool
# expect: indicators object with RSI, MACD, SMAs, summary (Buy/Sell/Neutral)

curl -sH "$H" "$API/api/technical/rules/examples" | python3 -m json.tool
# expect: 6 example rules

curl -sH "$H" -X POST "$API/api/technical/rules/evaluate" \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"NSE:RELIANCE","rule_text":"RSI(14) > 50 AND MACD_HIST > 0","timeframe":"day"}' \
  | python3 -m json.tool
# expect: rule, result (true/false), trace [...]

# ===== Phase 4: Call reports =====
curl -sH "$H" -X POST "$API/api/calls" \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"NSE:RELIANCE","call_type":"BUY","timeframe":"day","entry_price":2500,"target":2700,"stop_loss":2400,"rationale":"Test call"}' \
  | python3 -m json.tool

curl -sH "$H" "$API/api/calls" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(f"{len(d)} calls")'
# expect: at least 1

# ===== Phase 5: Watchlist =====
curl -sH "$H" -X POST "$API/api/watchlist" \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"NSE:TCS"}' | python3 -m json.tool

curl -sH "$H" "$API/api/watchlist" | python3 -m json.tool
# expect: list with TCS + last_price + change_pct

# ===== Phase 5: Alerts =====
curl -sH "$H" -X POST "$API/api/alerts" \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"NSE:TCS","kind":"price_above","threshold":4000,"timeframe":"day"}' \
  | python3 -m json.tool

curl -sH "$H" "$API/api/alerts" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(f"{len(d)} alerts active")'

# ===== Phase 5: Portfolio + Doctor =====
curl -sH "$H" -X POST "$API/api/portfolio/holdings" \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"NSE:RELIANCE","qty":10,"avg_buy_price":2500}' | python3 -m json.tool

curl -sH "$H" "$API/api/portfolio" | python3 -m json.tool | head -50
# expect: holdings, total_invested, total_current, total_pnl, doctor.verdict

# ===== Phase 5: Chat =====
curl -sH "$H" "$API/api/chat" | python3 -c 'import json,sys; print(f"{len(json.load(sys.stdin))} messages in history")'

curl -sH "$H" -X POST "$API/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"message":"Brief view on Indian markets today?"}' \
  | python3 -m json.tool
# expect: reply (DeepSeek summary, 3-5 sentences)
```

If everything above returns sensible data, **all 5 phases are working in production.**

---

## Step 4 — Verify in browser

1. Open `https://shares.sahayai.in` (or `https://chitti-shares-web.onrender.com`).
2. Login with your mobile.
3. Tap each bottom-nav tab in order:
   - **Home** — should show Nifty + Sensex with live numbers (Yahoo data, ~15 min delayed).
   - **Markets** — empty watchlist; type "RELIANCE" → Add → it appears with quote.
   - **Portfolio** — empty state; tap Add Holding → enter Reliance / 10 / 2500 → see Doctor verdict.
   - **Alerts** — empty state; tap Create Alert → Reliance / Price above / 3500 → it's listed.
   - **Chitti AI** — type "what's hot today" → Chitti replies in 3-5 sentences.
4. Tap a watchlist item → Stock Detail opens with all 4 tabs working.
5. Settings → switch Language to हिन्दी → bottom-nav labels swap to Hindi.
6. In Chitti chat, tap 🔊 Listen on any reply → browser reads it aloud.

---

## Step 5 — Optional: schedule alert checks

Right now, alerts only fire when `POST /api/alerts/check-all` is called (admin-gated).
To make alerts actually monitor in the background, add a Render Cron Job:

1. Render dashboard → **New +** → **Cron Job**.
2. **Name**: `chitti-shares-alerts-cron`
3. **Schedule**: `*/5 9-15 * * 1-5` (every 5 min, Mon-Fri, 9 AM – 3 PM UTC ≈ 2:30–8:30 PM IST)
   — **WAIT, fix this for IST**: NSE is open 09:15–15:30 IST = 03:45–10:00 UTC.
   Use: `*/5 3-10 * * 1-5`
4. **Command**:
   ```bash
   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://chitti-shares-api.up.railway.app/api/alerts/check-all
   ```
   You'll need to bake an admin access token. Easier alternative: add a long-lived
   "service" token mechanism (out of scope for this phase). For now, run it manually
   from your phone or skip this step entirely.

---

## Common issues

**Yahoo returns nothing for a symbol**
→ Check the symbol via `/api/stocks/resolve?q=<input>`. Yahoo uses `.NS` suffix for NSE
and `.BO` for BSE. Some lesser-known stocks aren't on Yahoo.

**`DataSourceError: yfinance failed`**
→ Yahoo throttles aggressive callers. Our 60-sec quote cache prevents this in practice.
If it persists, check Render logs — most likely a transient rate limit, retries on next
request.

**Chat returns 502 from DeepSeek**
→ Check `DEEPSEEK_API_KEY` is set correctly on `chitti-shares-api`. Visit
`https://platform.deepseek.com` to verify your account has credit.

**Portfolio Doctor shows "Needs attention" but everything looks fine**
→ The Doctor flags portfolios with fewer than 5 holdings (concentration warning).
Add more or ignore.

**Hindi UI shows English in some places**
→ The translation map covers user-facing labels. Stock symbols, prices, sector names,
DeepSeek replies, and a few admin-only strings stay in their original language.
This is intentional — financial data should be unambiguous.

**Custom rule throws "Bad rule"**
→ Common gotchas: keywords are case-insensitive but indicator names are not (use
`RSI`, `SMA`, `MACD_HIST`, etc — uppercase). Use `AND` / `OR` for boolean ops.
The 6 examples at `/api/technical/rules/examples` cover the syntax.

---

## What's NOT in this drop

- **Push notifications** for alerts (needs FCM + Apple dev account)
- **Real-time tick streaming** (would need `DATA_SOURCE=kite` + Kite Ticker WebSocket)
- **screener.in data** (robots.txt + Cloudflare block — fundamentals come from Yahoo)
- **Manual chart rendering** in Stock Detail (we show indicator values, not candle charts —
  add Recharts or Plotly later if needed)
- **Auto-track open calls** (the `track-all` endpoint exists but isn't on a schedule;
  add as a Render Cron Job alongside the alerts cron above)

These are deliberate scope cuts — none block the core "trader picks a stock, sees
fundamentals + technicals + a Chitti opinion + manages a watchlist + gets alerts"
flow.

---

## Switching to Kite later

If you want to flip to Kite Connect as the active source:

1. Make sure `KITE_API_KEY` and `KITE_API_SECRET` are still set on Render.
2. Change `DATA_SOURCE` from `yahoo` to `kite`.
3. Save → Render redeploys.
4. Run the Kite OAuth dance from `DEPLOY_PHASE2.md` Step 3 (you'll need to do this
   every morning at 6 AM IST going forward — that's the trade-off).
5. **Important caveat**: stock-level history via Kite is not implemented in this
   build (Kite needs instrument tokens, not symbols). Indices work; stocks would
   need a symbol→token map. If you switch, the watchlist/portfolio quotes work
   but Stock Detail's Technical tab will fail until that mapping is added.

For most users: stay on Yahoo.
