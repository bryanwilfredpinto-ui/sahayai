# ARCHITECTURE — Chitti Vaani

## High-level

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser (chitti_vaani.html, served from any static host)               │
│   ├ Web Speech API (mic in / TTS out)                                   │
│   ├ Consent gate + 6-section T&C modal                                  │
│   ├ Voice-sample collector (IndexedDB, opt-in upload)                   │
│   └ Local emergency cascade (confirm → alarm → ring spouse)             │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTPS (CORS-gated by ALLOWED_ORIGINS)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Render web service: chitti-vaani-api  (Flask + gunicorn, 2 workers)    │
│                                                                          │
│  main.py                                                                 │
│   ├ /api/vaani/*       (routes/vaani.py        → services/vaani_service)│
│   ├ /api/vaani/email/* (routes/email.py        → services/email_service)│
│   ├ /api/vaani/emerg/* (routes/emergency.py    → services/emergency_…)  │
│   ├ /api/admin/*       (routes/admin.py        → services/admin_*)      │
│   └ /api/feedback/*    (routes/feedback.py     → services/feedback_*)   │
│                                                                          │
│  Background:                                                             │
│   ├ admin_scheduler  — APScheduler cron, monthly keep-alive 06:00 IST   │
│   └ feedback_scheduler — APScheduler cron, daily report 06:00 IST       │
└──────────────────────────────────┬──────────────────────────────────────┘
              │                    │                          │
              ▼                    ▼                          ▼
       DeepSeek API           Google OAuth +              SQLite (/tmp)
       (chat completions)     Gmail API                    + Postgres
                              (token exch + send)          (Supabase, prod)
```

## Backend code layout

| File | Purpose |
|---|---|
| [main.py](backend/main.py) | Flask app factory. Registers 5 blueprints, mounts schedulers, idempotent DB init/seed wrapped in try/except so a misconfigured `ADMIN_DATABASE_URL` cannot take down the rest of Vaani. |
| [config.py](backend/config.py) | Frozen dataclass `Settings` reading env vars. Avoids pydantic-settings because Render's slim image lacks Rust + cmake (same workaround as MedUPI / News). |
| [routes/vaani.py](backend/routes/vaani.py) | `/api/vaani/ask`, `/health`, `/languages`. Thin shell; validates body, hands to `vaani_service.ask()`. |
| [routes/email.py](backend/routes/email.py) | `/api/vaani/email/{status,auth/start,auth/callback,send,disconnect}`. Per-end-user Gmail OAuth keyed by frontend-generated `user_token`. |
| [routes/emergency.py](backend/routes/emergency.py) | `/api/vaani/emergency/{trigger,check-in,pair/issue,pair/accept,pair/unpair,pair/list,poll}`. Chitti-to-Chitti pairing + relay inbox. |
| [routes/admin.py](backend/routes/admin.py) | `/api/admin/products/*` + `/api/admin/scheduler`. Product-Gmail dashboard backend. Gated by `ADMIN_SECRET` via `?secret=` or `X-Admin-Secret` header; OAuth callback is open (Google can't carry custom headers). |
| [routes/feedback.py](backend/routes/feedback.py) | `/api/feedback/{collect,report,list,run-now,health,<id>/junk}`. `/collect` is open; admin endpoints share the `ADMIN_SECRET` gate. In-process rate limiter (1 req/IP/s, 60/IP/hour). |
| [services/vaani_service.py](backend/services/vaani_service.py) | DeepSeek sync HTTP wrapper (`httpx.Client`, 30 s timeout). System prompt constant `CHITTI_VAANI_PROMPT`. `_enforce_disclaimer()` appends the Hindi legal line if the model forgot. Graceful `_fallback()` when no key set. |
| [services/email_service.py](backend/services/email_service.py) | Gmail OAuth code exchange + refresh + send-as-user. Scope `gmail.send + userinfo.email`. Adds Chitti AI signature footer on every outbound message. |
| [services/email_db.py](backend/services/email_db.py) | SQLite token store. Two tables: `oauth_tokens` (per `user_token` × provider), `oauth_state` (short-lived state for the callback hop). WAL mode. |
| [services/emergency_service.py](backend/services/emergency_service.py) | Cascade-fanout entrypoint. `EMERGENCY_KEYWORDS` multi-lang. `COP_DENYLIST` refusal. `trigger() → relay_db.push_event()` for every paired partner. |
| [services/relay_db.py](backend/services/relay_db.py) | SQLite store for pair codes, symmetric pairs, and the relay inbox. Sweeps stale codes (5 min) and delivered events (24 h). |
| [services/admin_db.py](backend/services/admin_db.py) | SQLAlchemy ORM. Auto-picks Postgres via `ADMIN_DATABASE_URL` / `DATABASE_URL` (rewrites `postgres://` → `postgresql+psycopg2://`), falls back to SQLite at `ADMIN_TOKEN_DB`. Hand-written column migration (`domain_template`, `features`). |
| [services/admin_oauth.py](backend/services/admin_oauth.py) | Per-product Gmail OAuth. Mirrors `email_service.py` but tokens belong to product mailboxes (e.g. `chittinews@gmail.com`) keyed by `product_id`. Separate redirect URI `/api/admin/products/oauth/callback`. |
| [services/admin_scheduler.py](backend/services/admin_scheduler.py) | `APScheduler.BackgroundScheduler` — monthly keep-alive (default 1st @ 06:00 IST). Sends a "keep-alive" email from every connected product mailbox to `ADMIN_NOTIFY_EMAIL` to exercise the refresh path before Google's ~6-month idle revoke. Idempotent under multi-worker gunicorn via month-equality check. |
| [services/feedback_db.py](backend/services/feedback_db.py) | SQLAlchemy `feedback_log` table. Junk filter (`_IMPOSSIBLE` regex + one-word + duplicate collapse). Score formula `(Impact × Frequency × Urgency) / Effort` with PWD-weighted impact (1.0 for blind/deaf/mute/illiterate, 0.8 elderly, 0.6 general). |
| [services/feedback_scheduler.py](backend/services/feedback_scheduler.py) | Daily 06:00 IST report. Caches `_last_report` in module memory; emails via any connected admin product mailbox if `ADMIN_NOTIFY_EMAIL` set. |
| [scripts/admin_seed.py](backend/scripts/admin_seed.py) | Idempotent upsert of 17 default product rows on every boot — 5 original Chittis (News / MedUPI / CA / Legal / Vaani) + 12 shop Chittis (Kirana / Pharmacy / Restaurant / Salon / Medical / Grocery / Dairy / Stationery / Hardware / Clothing / Electronics / Furniture) each tagged with a domain template. |

## Phase 1 (deployed) vs Phase 2 (Android, spec only)

Web Vaani — what is live on `chitti-vaani-api.onrender.com`:

- Voice in / voice out, 9-language conversational replies
- Gmail OAuth + "send email as Chitti AI" with the Chitti signature
- 24/7 emergency cascade (web variant — Web Audio alarm, `tel:` deep-link, paired-Chitti polling)
- Federated voice-sample collection (IndexedDB, opt-in upload)
- WhatsApp / UPI / `tel:` deep-link pro actions

**Cannot be done in a browser** (these live in [`CHITTI_VAANI_PHASE2_ANDROID_SPEC.md`](../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md) at repo root):

| # | Capability | Android API |
|---|---|---|
| 1 | Lock the phone on voice command | `DevicePolicyManager.lockNow()` (DEVICE_ADMIN) |
| 2 | Hard refusal to unlock (no `unlockNow()` exists for 3rd-party apps + code-level deny list) | — |
| 3 | Toggle silent / ring mode | `AudioManager.setRingerMode()` |
| 4 | Auto-answer / screen incoming calls | `InCallService` + `CallScreeningService` (Default Dialer + Call Screening roles) |
| 5 | Night-mode 10 PM–6 AM with on-device Vosk keyword spotting → flip silent to ring on emergency | foreground service + `STREAM_ALARM` bypass + FCM push for inbound Chitti-to-Chitti relay |
| 9b | Open WhatsApp **and tap send autonomously** | `AccessibilityService` scoped to WA send-button node, with 2 s silent-cancel readback |
| 11b | Voice-biometric UPI PIN replacement | Bank-PSP partnership + RBI sandbox (parked as v2) |
| — | Read incoming SMS / WhatsApp / notifications aloud | `NotificationListenerService` |
| — | Native call log | `READ_CALL_LOG` (Play Store high-scrutiny) |

Build phases for Android (2.1 → 2.6, ~5 months total) — see spec.

## Vaani-to-Chitti relay

The relay is the substrate the emergency cascade uses to wake a partner's phone even on silent. It is generic — `kind` is just a string — so future features (e.g. "Mom shared a news article with you") ride the same plumbing.

```
issue_pair_code(user_A)  ─►  6-digit code shown to user_A's helper
helper accepts on their device:
  consume_pair_code(code, user_B)  ─►  symmetric row in `pairs` table

Event fan-out:
  user_A.trigger(emergency)
    → emergency_service.trigger(user_A)
       → relay_db.push_event(to=user_B, from=user_A, kind="emergency", payload)
  user_B polls /api/vaani/emergency/poll
    → returns event, marks delivered, sweeps >24h delivered rows
```

Web clients poll; Android v2 will swap polling for FCM push.

## Admin panel (WIP)

`/api/admin/products/*` is the backend for the **Sahay AI Admin Dashboard**, served by `chitti_admin_products.html` at repo root. It manages product Gmail accounts across the whole Chitti family — not just Vaani. The monthly keep-alive scheduler exists because Google revokes refresh tokens that have been idle ~6 months (and 7 days in OAuth Testing mode); a once-a-month self-send keeps them warm.

Auth model:
- Every admin endpoint except the OAuth callback requires `?secret=<ADMIN_SECRET>` or `X-Admin-Secret`.
- The OAuth callback is open because Google can't carry custom headers; the `state` token is opaque, single-use, and TTL-capped at 10 minutes.
- If `ADMIN_SECRET` is missing, every admin call returns **503 fail-closed**.

## Configuration surface (env vars)

| Var | Purpose | Default |
|---|---|---|
| `DEEPSEEK_API_KEY` | required for live replies; missing key → graceful fallback | unset |
| `DEEPSEEK_MODEL` / `DEEPSEEK_URL` | model selection | `deepseek-chat` / `api.deepseek.com/chat/completions` |
| `ALLOWED_ORIGINS` | CORS allowlist, comma-separated | unset → `*` |
| `VAANI_MAX_TOKENS` / `VAANI_TEMPERATURE` | DeepSeek tuning | 600 / 0.4 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Gmail OAuth | unset |
| `GOOGLE_REDIRECT_URI` | end-user Gmail callback | `https://chitti-vaani-api.up.railway.app/api/vaani/email/auth/callback` |
| `VAANI_TOKEN_DB` / `VAANI_RELAY_DB` | SQLite paths (ephemeral on Render free tier) | `/tmp/chitti_vaani_tokens.sqlite` / `/tmp/chitti_vaani_relay.sqlite` |
| `ADMIN_SECRET` | shared secret for `/api/admin/*` + `/api/feedback/*` admin endpoints. Missing = 503. | unset |
| `ADMIN_DATABASE_URL` / `DATABASE_URL` | Postgres for admin + feedback tables; rewrites `postgres://` to `postgresql+psycopg2://` | unset → SQLite |
| `ADMIN_TOKEN_DB` / `FEEDBACK_DB_PATH` | SQLite fallback paths | `/tmp/chitti_admin.sqlite` / `/tmp/chitti_feedback.sqlite` |
| `ADMIN_NOTIFY_EMAIL` | recipient of keep-alive + daily feedback report | `sire@gmail.com` |
| `ADMIN_OAUTH_REDIRECT_URI` | per-product Gmail callback | `https://chitti-vaani-api.up.railway.app/api/admin/products/oauth/callback` |
| `ADMIN_KEEPALIVE_DAY/HOUR/MINUTE` | monthly cron in IST | 1 / 6 / 0 |
| `ADMIN_SCHEDULER_ENABLED` / `ADMIN_SEED_DEFAULTS` | kill-switches | `true` / `true` |
| `FEEDBACK_REPORT_HOUR/MINUTE` | daily cron in IST | 6 / 0 |
| `FEEDBACK_IP_SALT` | sha256 salt for IP-hash; rotate to reset rate-limit history | `chitti-feedback` |
| `FEEDBACK_SCHEDULER_ENABLED` | kill-switch | `true` |

## Idempotency and crash-isolation rules

- DB init / seed / scheduler start are each wrapped in `try/except` inside `_create_app()` — Vaani's voice route must keep serving even if Postgres is unreachable.
- `admin_db.init_db()` is one-shot guarded by `_INITIALISED`; same for `feedback_db.init_db()`.
- `admin_seed.seed_defaults_if_empty()` upserts — never overwrites admin-edited fields.
- `admin_scheduler` does **not** run a leader election under multi-worker gunicorn; it relies on a `same calendar month` check to avoid duplicate sends.
- `feedback_scheduler` similarly relies on the daily cron + idempotent re-run of `daily_report()`.
