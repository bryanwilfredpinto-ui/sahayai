# Chitti Shares — Phase 1 Deployment Walkthrough

This guide takes you from "code on your laptop" to "live at https://shares.sahayai.in"
in about 30–40 minutes. Follow it top to bottom — no skipping.

> **Your JWT_SECRET (already generated — save this somewhere safe):**
> ```
> dgGIRPmoD0f9eeP443uB4uTRf9bsh_1IFKNNGjgsmxy5YgjjcEPWDBsHb6bZUo1EVzmHaYe8OTOK2X76Ep4vfg
> ```
> You'll paste this into Render in Step 4.

---

## Step 0 — Get a Fast2SMS API key (5 minutes)

1. Go to https://www.fast2sms.com → **Sign Up** (use your sahayai mobile number).
2. Verify your mobile via OTP. They'll add **₹50 free credit** (~250 OTPs — enough for early testing).
3. Top up if you want: ₹500 minimum, gets you ~2,500 OTPs.
4. After login, click **Dev API** in the left sidebar.
5. You'll see an `Authorization` key — long string of letters/numbers. **Copy it.** This is your `FAST2SMS_API_KEY`.

> No DLT registration needed. Phase 1 uses Fast2SMS's "OTP route" which is exempt.

---

## Step 1 — Push the code to your existing GitHub repo

Your existing repo: `github.com/bryanwilfredpinto-ui/sahayai`

You'll add the entire `chitti-shares/` folder as a subfolder of that repo.

### From your local machine

```bash
# 1. Clone (or pull, if you already have it)
cd ~
git clone https://github.com/bryanwilfredpinto-ui/sahayai.git
cd sahayai

# 2. Drop the chitti-shares/ folder I gave you into the repo root.
#    After this you should have:  sahayai/chitti-shares/...

# 3. Verify .gitignore is doing its job (no .env files, no node_modules)
git status
# You should see ONLY chitti-shares/ files. NO .env. NO node_modules. NO *.db.
# If you see node_modules or .env in the list, STOP and fix .gitignore first.

# 4. Commit and push
git add chitti-shares/
git commit -m "feat: add chitti-shares phase 1 (auth + dashboard shell)"
git push origin main
```

If `git push` asks for credentials and you've never done this before, GitHub now requires
a **Personal Access Token** instead of your password:
1. github.com → click your avatar → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic).
2. Scope: tick `repo`. Expiry: 90 days. Generate. Copy the `ghp_...` token.
3. Use it as the password when git asks.

---

## Step 2 — Create the Render Postgres database

1. Log into https://dashboard.render.com.
2. Top right: **New +** → **Postgres**.
3. Fill in:
   - **Name**: `chitti-shares-db`
   - **Database**: `chitti_shares`
   - **User**: leave default
   - **Region**: Singapore (closest to India)
   - **Plan**: **Free**
4. Click **Create Database**. Wait ~1 minute for status to go green.
5. On the database page, scroll to **Connections** → copy the **Internal Database URL**.
   It looks like `postgres://chitti_shares_user:xxxxx@dpg-xxxxx/chitti_shares`.
   Keep this tab open — you'll paste it in Step 3.

---

## Step 3 — Create the backend Web Service

1. **New +** → **Web Service**.
2. **Connect a repository** → pick `bryanwilfredpinto-ui/sahayai`.
   (If you don't see it, click "Configure account" and grant Render access to that repo.)
3. Fill in:
   - **Name**: `chitti-shares-api`
   - **Region**: **Singapore** (must match the DB region!)
   - **Branch**: `main`
   - **Root Directory**: `chitti-shares/backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
4. **Don't click Create yet.** Scroll to **Advanced** → **Add Environment Variable** and add these one by one:

| Key | Value |
|---|---|
| `JWT_SECRET` | `dgGIRPmoD0f9eeP443uB4uTRf9bsh_1IFKNNGjgsmxy5YgjjcEPWDBsHb6bZUo1EVzmHaYe8OTOK2X76Ep4vfg` |
| `ACCESS_TOKEN_MINUTES` | `15` |
| `REFRESH_TOKEN_DAYS` | `30` |
| `DATABASE_URL` | *(paste the Internal Database URL from Step 2)* |
| `FAST2SMS_API_KEY` | *(paste the Authorization key from Step 0)* |
| `OTP_LENGTH` | `6` |
| `OTP_EXPIRY_MINUTES` | `5` |
| `FRONTEND_URL` | `https://shares.sahayai.in` |
| `BACKEND_URL` | `https://chitti-shares-api-production.up.railway.app` |
| `DEV_MODE_FAKE_OTP` | `false` |

5. Set **Health Check Path** to `/health`.
6. Click **Create Web Service**.
7. Watch the deploy log. First build takes 3–5 minutes. You're looking for:
   ```
   Application startup complete.
   Uvicorn running on http://0.0.0.0:10000
   ```
8. Once green, open `https://chitti-shares-api-production.up.railway.app/health` in a browser.
   You should see: `{"ok":true}` ✅

> **First-deploy gotcha**: Free Render web services sleep after 15 min of no traffic.
> First request after sleep takes ~30 seconds. Fine for Phase 1; we'll upgrade later.

---

## Step 4 — Create the frontend Static Site

1. **New +** → **Static Site**.
2. Same repo: `bryanwilfredpinto-ui/sahayai`.
3. Fill in:
   - **Name**: `chitti-shares-web`
   - **Branch**: `main`
   - **Root Directory**: `chitti-shares/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Advanced** → **Add Environment Variable**:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://chitti-shares-api-production.up.railway.app` |

5. Click **Create Static Site**.
6. While it builds, click **Redirects/Rewrites** in the left side panel and add:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

   *(Render usually picks this up from `public/_redirects` automatically — adding it via UI is belt-and-suspenders.)*

7. Wait for green build (~2 minutes).
8. Open the temporary URL Render gives you (e.g. `https://chitti-shares-web.onrender.com`).
   You should see the **Login** page. ✅

---

## Step 5 — Point shares.sahayai.in at the static site

You need to add ONE CNAME record at your domain registrar (wherever sahayai.in is registered — GoDaddy, Namecheap, Hostinger, Cloudflare, etc.).

### 5a. Add the custom domain in Render

1. On the `chitti-shares-web` service page → **Settings** → **Custom Domains** → **Add Custom Domain**.
2. Enter `shares.sahayai.in` → **Save**.
3. Render shows you a **target host**, something like `chitti-shares-web.onrender.com` or `xyz123.cname.render.com`. **Copy that exact string.**

### 5b. Add the CNAME at your DNS provider

Log into wherever sahayai.in's DNS is managed and add:

| Type | Name / Host | Value / Points to | TTL |
|---|---|---|---|
| `CNAME` | `shares` | *(paste the target Render gave you)* | `300` (5 min) |

> **If your registrar makes you enter the full subdomain in "Name"**, use `shares.sahayai.in`.
> Most registrars want just `shares` because they auto-append the root domain.

### 5c. Wait for DNS + verification

- DNS usually propagates in 5–10 min, sometimes longer.
- Render auto-verifies and issues a free Let's Encrypt SSL cert.
- The Custom Domains page will show **"Verified"** + **"Certificate Issued"**.
- Open https://shares.sahayai.in — you should see the Login page over HTTPS. ✅

While you wait, you can check propagation at https://dnschecker.org → enter `shares.sahayai.in`, type CNAME.

---

## Step 6 — End-to-end smoke test

Run all 10 acceptance tests against the live site:

| # | Test | How |
|---|---|---|
| 1 | Send real OTP | Open https://shares.sahayai.in on your phone → enter your 10-digit mobile → tap **Send OTP** → SMS arrives within 30s |
| 2 | Wrong OTP rejected | Enter `000000` → red toast: "Wrong OTP" |
| 3 | Correct OTP logs in | Enter the actual OTP → lands on Dashboard with "Good Morning, Trader" |
| 4 | Session persists | Refresh the page → still on Dashboard, no redirect to login |
| 5 | Two devices coexist | Log into the same number from desktop browser → both stay logged in |
| 6 | Third device evicts oldest | Log in from a 2nd phone → original phone's next API call returns 401 → it gets bounced to /login |
| 7 | Logout works | Top-right Logout → redirected to /login, refresh stays on /login |
| 8 | Settings accurate | Login again → Settings → see correct mobile, edit name, see device list with mobile/desktop chips |
| 9 | UI feels premium | Dark theme, smooth animations, no flash of unstyled content, mobile feels native |
| 10 | DNS works | https://shares.sahayai.in resolves with green padlock |

Tick them off as you go.

---

## Common issues + fixes

### "CORS error" in browser console

Backend isn't allowing the frontend origin.
→ Check `FRONTEND_URL` env var on `chitti-shares-api` is exactly `https://shares.sahayai.in` (no trailing slash). Save → it auto-redeploys.

### "Network Error" / "ERR_CONNECTION_REFUSED"

Frontend's `VITE_API_URL` is wrong, OR backend is sleeping (free tier).
→ Open the backend URL directly in a browser tab to wake it. First request takes 30s.
→ If the URL doesn't load at all, check `VITE_API_URL` on `chitti-shares-web` matches your actual backend URL exactly. Trigger a manual redeploy after changing.

### "OTP not arriving"

→ Backend logs (Render dashboard → `chitti-shares-api` → Logs) should show `Fast2SMS response: {...}`.
→ If it shows `"return": false`, the API key is wrong or you're out of credits.
→ Check Fast2SMS dashboard balance.
→ Make sure the mobile starts with 6/7/8/9 — the regex rejects others.

### "no such table: users" in backend logs

DB tables didn't get created.
→ The startup hook creates them automatically; if it's failing, check `DATABASE_URL` is the **Internal** URL (starts with `postgres://`), not the External one.
→ Manually trigger redeploy: Render dashboard → Manual Deploy → Clear build cache & deploy.

### DNS shows "Verification Failed" for >30 minutes

→ Confirm the CNAME value at your registrar matches Render's target EXACTLY (case-insensitive, no trailing dot for most registrars).
→ Some registrars (Hostinger, GoDaddy) require you to NOT include the domain part in the "Name" field — use just `shares`.
→ Test with `dig shares.sahayai.in CNAME` in terminal — it should return Render's host.

### Login looks fine but Dashboard endlessly spins

Open browser DevTools → Network tab → look for the `/user/me` call.
- 401 → token isn't being sent. Check `localStorage` has `chitti_access_token`.
- CORS preflight failed → see CORS fix above.
- 500 → backend logs will tell you.

---

## What to do after Phase 1 is live

1. **Tell me it's working** — share the live URL or a screenshot.
2. **Don't burn SMS credits testing** — set `DEV_MODE_FAKE_OTP=true` temporarily on Render if you want to test repeatedly without using real OTPs (the OTP will print in the backend logs instead). Set back to `false` before showing anyone else.
3. **Phase 2** picks up next session: live Kite Connect data into the Nifty/Sensex cards, then Chitti Market View powered by the DeepSeek key already in your Render env.

---

## Quick reference

| Resource | URL |
|---|---|
| Production app | https://shares.sahayai.in |
| Backend API | https://chitti-shares-api-production.up.railway.app |
| API docs (Swagger) | https://chitti-shares-api-production.up.railway.app/docs |
| Health check | https://chitti-shares-api-production.up.railway.app/health |
| Render dashboard | https://dashboard.render.com |
| Repo | https://github.com/bryanwilfredpinto-ui/sahayai |
| Fast2SMS dashboard | https://www.fast2sms.com/dashboard |
