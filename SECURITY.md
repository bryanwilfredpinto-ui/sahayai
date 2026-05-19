# Sahay AI — Security & Secrets

## Secrets that have ever been in this repo

Last audit: 2026-05-14

| Secret | Where it was | Status | Action required |
|---|---|---|---|
| **DeepSeek API key** `sk-372a74292…` | Hardcoded at [chitti_agents_v1.py:35](chitti_agents_v1.py) and [chitti_self_train.py:31](chitti_self_train.py) since commit `abf9aec` (2026-04-something) | **Leaked to git history** | ⚠️ **ROTATE** — see below |

Everything else audited clean:
- `SahayAI2026` admin/pull secret — never committed (only set as Render env var).
- Render API key `rnd_…` — never committed.
- Turso libSQL auth tokens (per-DB JWTs) — never committed; live only in Render env vars and your local `chitti-*/backend/.env` files (gitignored).
- UptimeRobot API key — never committed.
- Gmail OAuth client secret — never committed.

## How to rotate the leaked DeepSeek key

1. Sign in to https://platform.deepseek.com → **API Keys** → find `sk-372a74292a8c407abaaf673aab58c3f1` → **Revoke**.
2. Click **Create new API key**, copy it (shown once).
3. Update on Render — every service that uses DeepSeek:
   - chitti-medupi-api, chitti-news-api, chitti-government-api, chitti-vaani-api, chitti-ca-api, chitti-legal-api, chitti-voice-factory-api, chitti-shares-api, chitti-founder-api
   - Dashboard → service → Environment → edit `DEEPSEEK_API_KEY` → paste → Save (Render auto-redeploys).
   - Or call the Render REST API:
     ```
     PUT /v1/services/{id}/env-vars/DEEPSEEK_API_KEY  body: {"value":"<new key>"}
     ```
4. Update your local dev `.env` files at `chitti-*/backend/.env`.

(Old key history is still in the git log, but once revoked it has no value.)

## Rules going forward

1. **No secret ever lives in code.** All keys / tokens / passwords come from `os.environ.get(...)` with a `raise RuntimeError(...)` fallback when missing. Don't use defaults that are real values.
2. **`.env` files are gitignored** (see [.gitignore](.gitignore) lines 1-7). If you ever need to add a new `.env.example`, only check in placeholder values like `<paste-here>`.
3. **Admin endpoints accept secrets in the `Authorization: Bearer …` header only**, never as `?secret=…` URL params. URL params get logged by Render / Cloudflare / your browser / Referer headers. The `chitti-founder` `_require_admin()` returns HTTP 400 with `{"error": "secret_in_url_not_allowed"}` if anyone is still passing the secret in the URL — that 400 is intentional, it's a "fix your client" signal, not a config problem.
4. **Rotate any secret you've shared in chat / pasted into a screenshot / sent over email.** Treat plaintext sharing as compromise.

## How to send the admin secret (chitti-founder)

Wrong:
```
curl https://chitti-founder-api.up.railway.app/admin/founder/json?secret=SahayAI2026
```
Right:
```
curl -H "Authorization: Bearer SahayAI2026" \
     https://chitti-founder-api.up.railway.app/admin/founder/json
```
(Legacy `X-Admin-Secret: SahayAI2026` header also accepted during migration.)

## Gmail app password — setup for `FOUNDER_SMTP_PASS`

Daily Founder report (07:00 IST) and Weekly Trend (Sun 08:00 IST) email
through `smtp.gmail.com`. Gmail no longer accepts your regular account
password for SMTP — you need an **app password**.

1. Sign in to your Google account (bryanwilfredpinto@gmail.com).
2. Go to https://myaccount.google.com/security and confirm **2-Step Verification is ON**. App passwords only work when 2FA is enabled.
3. Go to https://myaccount.google.com/apppasswords (or "App passwords" link from the Security page).
4. Under **App name**, type something memorable: `chitti-founder-render` (the literal label is your choice — Google just shows it back to you).
5. Click **Create**. Google displays a 16-character password like `abcd efgh ijkl mnop`. Copy it. **It's shown only once.**
6. On the Render dashboard:
   - Open the **chitti-founder-api** service.
   - **Environment** tab → find `FOUNDER_SMTP_PASS` → click edit.
   - Paste the 16-character password **with the spaces removed** (`abcdefghijklmnop`) — Gmail accepts either form, but spaces sometimes get trimmed wrong by env var pages.
   - Save. Render auto-redeploys.
7. Test the SMTP path **before the cron fires for real**:
   ```
   curl -X POST -H "Authorization: Bearer SahayAI2026" \
        https://chitti-founder-api.up.railway.app/admin/founder/send
   ```
   You should get `{"ok":true}` and an email in your inbox within ~30s.

If `ok:false`, check the Render service logs — the SMTP failure mode is
logged with the exact `smtplib` error (auth refused / TLS handshake /
relay denied / etc.).

## What to do if Bryan finds a key in a screenshot / chat

1. Identify which key.
2. Revoke at the source (DeepSeek, Render, Turso, UptimeRobot, Google).
3. Generate a new one.
4. Update everywhere it's set (each Render service's env var; each local `.env`).
5. Add an entry to the "Secrets that have ever been in this repo" table above for the audit trail.
