# Chitti Shares — Phase 2 Deployment Walkthrough

Phase 2 adds real Nifty 50 / Sensex data and the DeepSeek-powered
"Chitti Market View" card. **Phase 1 is untouched** — same login,
same dashboard URL, same Railway services.

This guide takes ~25 minutes if you already have a Kite Connect app,
~45 minutes if you need to create one.

---

## What's new in Phase 2

| Layer | Added |
|---|---|
| Backend | `routes/market.py`, `services/{kite_client,deepseek_client,indices_analyzer,cache}.py`, `models/kite_token.py` |
| Backend | 5 new endpoints under `/api/market/*` (3 user, 2 admin) |
| Backend | New deps: `kiteconnect`, `tzdata` |
| Frontend | `IndexCard`, `MarketViewCard`, `useAutoRefresh` hook |
| Frontend | Dashboard rewired to live data with auto-refresh + market-hours awareness |
| Env | 5 new vars: `KITE_API_KEY`, `KITE_API_SECRET`, `KITE_REDIRECT_URL`, `DEEPSEEK_API_KEY`, `ADMIN_MOBILE` |

> **Note on `pandas` / `pandas_ta`**: Phase 2 spec mentioned them but Phase 2's
> math (50-day SMA + bucketed support/resistance) is plain Python.
> Adding pandas to a Railway free instance costs ~50MB of build size
> with zero benefit here. Saving it for Phase 4 (RSI/MACD/Williams)
> where it actually pays off.

---

## Step 0 — Get Kite Connect credentials

If you already have a Kite Connect app at developers.kite.trade, **skip to Step 1**.

1. Go to https://developers.kite.trade → log in with your Zerodha account.
2. **Create a new app** → choose type **Connect**.
3. Fill in:
   - **App name**: `Chitti Shares`
   - **Redirect URL**: `https://chitti-shares-api-production.up.railway.app/api/market/auth-callback` *(must match exactly — copy-paste this)*
   - **Postback URL**: leave blank
   - **Description**: anything (e.g. "AI trading dashboard")
4. Pay the subscription:
   - **₹500 one-time** signup
   - **₹2000/month** recurring (auto-renews until you cancel)
5. After payment, the app shows up under "My Apps". Click it. You'll see:
   - **API key** — copy → this is `KITE_API_KEY`
   - **API secret** — click "Show" → copy → this is `KITE_API_SECRET`

Keep both safe. The secret is shown only once unless you regenerate.

---

## Step 1 — Push Phase 2 code to GitHub

From your local clone of the `sahayai` repo:

```bash
cd ~/sahayai

# Replace the chitti-shares folder with the new Phase 2 version
# (or merge if you've made local changes — just diff first)

# Verify .gitignore is still doing its job
git status
# You should see modifications inside chitti-shares/ — NO .env, NO node_modules.

git add chitti-shares/
git commit -m "feat: phase 2 - live nifty/sensex + chitti market view"
git push origin main
```

Railway auto-redeploys both `chitti-shares-api` and `chitti-shares-web` as soon as
the push lands. You'll see the build start in the Railway dashboard within ~30 seconds.

While they build, set the new env vars (Step 2).

---

## Step 2 — Add the 5 new env vars on Railway

Open Railway dashboard → `chitti-shares-api` → **Environment** → **Add Environment Variable**.

Add these one at a time:

| Key | Value |
|---|---|
| `KITE_API_KEY` | *(paste the API key from Step 0)* |
| `KITE_API_SECRET` | *(paste the API secret from Step 0)* |
| `KITE_REDIRECT_URL` | `https://chitti-shares-api-production.up.railway.app/api/market/auth-callback` |
| `DEEPSEEK_API_KEY` | *(your existing DeepSeek key — confirm it's already there)* |
| `ADMIN_MOBILE` | *(your 10-digit mobile, no +91, no spaces — same one you log in with)* |

Click **Save Changes**. Railway redeploys the backend service automatically.
Wait ~3 minutes for the deploy log to show `Application startup complete`.

> If `DEEPSEEK_API_KEY` was already in your Railway env from earlier Chitti work,
> you don't need to re-add it — just verify it's listed.

---

## Step 3 — Do the first-time Kite OAuth (admin only)

Kite tokens expire **every day at ~6:00 AM IST**. You re-run this dance once a day.
First time setup:

### 3a. Get your Kite login URL

Open a terminal:

```bash
# Replace YOUR_MOBILE and YOUR_OTP with your actual values
# Step 1: send yourself an OTP
curl -X POST https://chitti-shares-api-production.up.railway.app/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'

# Step 2: verify and capture the access_token
curl -X POST https://chitti-shares-api-production.up.railway.app/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","otp":"123456","device_id":"admin-cli","device_type":"desktop","user_agent":"curl"}'
# Copy the "access_token" from the response.

# Step 3: get the Kite login URL
curl https://chitti-shares-api-production.up.railway.app/api/market/auth-url \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

You'll see something like:
```json
{"login_url": "https://kite.zerodha.com/connect/login?api_key=xxxxx&v=3"}
```

### 3b. Open that URL in your browser

1. Paste the `login_url` into a browser → Kite login page opens.
2. Log in with your Zerodha credentials → 2FA → biometric.
3. Kite redirects to your backend callback URL.
4. You see a green "✓ Kite Connected" page with a link back to `shares.sahayai.in`.

> **Easier alternative**: just visit `https://shares.sahayai.in` in a browser, log in normally, then in another tab paste the `login_url` from Step 3a. The OAuth callback writes the token to your Postgres DB regardless of which browser tab does it.

### 3c. Verify it stuck

```bash
curl https://chitti-shares-api-production.up.railway.app/api/market/auth-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Should return:
```json
{"connected": true, "kite_user_id": "AB1234", "kite_user_name": "...", "issued_at": "2026-...", "last_used_at": "2026-..."}
```

You're good. The backend will use this stored token for all subsequent
`/api/market/indices` and `/api/market/view` calls until tomorrow 6 AM IST,
when you re-run Step 3.

---

## Step 4 — Acceptance tests (run all of these)

### Test 1: Real Nifty value matches NSE

```bash
curl https://chitti-shares-api-production.up.railway.app/api/market/indices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Open https://www.nseindia.com in another tab. Compare the `nifty.value` field
to the live NIFTY 50 number on NSE. Should be within ₹5–10 (Kite has a small
WebSocket-vs-HTTP lag).

### Test 2: Closed-market caching

If you run Test 1 outside market hours (or on a weekend), the response will
include `"market_open": false` and the value will be the close from the last
trading day. That's correct.

Hit the endpoint twice in a row — second call should be near-instant (cached).

### Test 3: Real DeepSeek summary

```bash
curl https://chitti-shares-api-production.up.railway.app/api/market/view \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Returns:
```json
{"summary": "...some natural-language paragraph...", "confidence": "high|medium|low", ...}
```

Wait 16 minutes (cache expires) and run again — the summary text should be
*slightly* different (DeepSeek is non-deterministic with `temperature: 0.65`).
If it's identical word-for-word, the cache TTL didn't expire yet — wait longer.

### Test 4: Frontend dashboard shows real data

1. Open https://shares.sahayai.in on your phone.
2. Log in.
3. Dashboard should show:
   - NIFTY 50 card with real value, change %, support/resistance/SMA, signal pill
   - SENSEX card with real value
   - Chitti Market View card with a 2-sentence AI summary
   - "LIVE" pill (green dot) during market hours, "CLOSED" outside

### Test 5: Unauthenticated 401

```bash
curl -i https://chitti-shares-api-production.up.railway.app/api/market/indices
# expect: HTTP/2 401
```

### Test 6: Phase 1 still works

Open the app in a fresh incognito window → log in with mobile + OTP → land on
Dashboard. Settings page → device list still accurate. Logout → /login.
Nothing in Phase 1 should have changed.

---

## Daily ritual (after Phase 2 is live)

Every morning between 6 AM and 9 AM IST you'll need to re-do Step 3.
Phase 5 will automate this with a stored credential / scheduler — for now it's manual.

If a user opens the dashboard before you've re-auth'd, they see a clear error:
> "Kite token expired - admin must re-auth"

That's by design — better than serving stale or fake data.

---

## Common issues + fixes

### `503: No Kite token stored - admin must run OAuth`

You skipped Step 3, or the day rolled over. Re-do Step 3.

### `503: Kite token expired - admin must re-auth`

Token aged out (daily 6 AM expiry). Re-do Step 3.

### `403: Admin access required` on /auth-url

Your logged-in mobile doesn't match `ADMIN_MOBILE` env var. Check spelling
(no +91, no spaces). Save → backend redeploys → log out and log back in.

### `502: DeepSeek HTTP 401`

`DEEPSEEK_API_KEY` is wrong or expired. Check the value at
https://platform.deepseek.com/api_keys.

### `502: DeepSeek HTTP 402`

You're out of DeepSeek credit. Top up. (Phase 2 uses ~50 tokens per call,
~₹0.01. With 15-min caching, costs are trivial.)

### Nifty value is stale (didn't update for 10+ minutes during market hours)

Check the cache TTL — `/api/market/indices` caches for 5 min during market
hours. If you click "Refresh" on the card and it still shows old data, check
Railway backend logs for `Kite token expired` warnings.

### "Redirect URI mismatch" on Kite login page

Your `KITE_REDIRECT_URL` env var doesn't EXACTLY match what's registered at
developers.kite.trade. Including trailing slashes and `https` vs `http`.
Fix one or the other so they match.

### Backend logs show `httpx.ConnectError` on first request after a quiet period

Railway free tier sleeps after 15 min idle. First request takes ~30s to wake.
The frontend's auto-refresh hook will retry; users just see a brief loading
state. Upgrade to Railway's $7/month Starter plan to eliminate this.

---

## Quick reference

| Resource | URL |
|---|---|
| Production app | https://shares.sahayai.in |
| Backend API | https://chitti-shares-api-production.up.railway.app |
| API docs | https://chitti-shares-api-production.up.railway.app/docs |
| Kite developer console | https://developers.kite.trade |
| DeepSeek console | https://platform.deepseek.com |

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/market/auth-url` | Admin | Get Kite login URL |
| `GET /api/market/auth-callback` | Public (Kite calls it) | Handles Kite redirect |
| `GET /api/market/auth-status` | Admin | Check if Kite token is stored |
| `GET /api/market/indices` | User | Live Nifty + Sensex |
| `GET /api/market/view` | User | Chitti Market View AI summary |

---

## What Phase 2 deliberately does NOT do

- ❌ Per-user Kite logins (Phase 5 may add)
- ❌ Intraday tick-by-tick streaming via Kite WebSocket (Phase 4 if needed)
- ❌ Holiday calendar (NSE/BSE holidays show "market closed" on the website but
      our `is_market_open()` doesn't know — fix in Phase 4)
- ❌ Top-contributor breakdown ("which stocks moved Nifty today") — Phase 3
- ❌ Charts of any kind — Phase 4
- ❌ Auto re-auth (you do it manually each morning) — Phase 5

That's all by design. Phase 2 is "make the placeholders real". Done.
