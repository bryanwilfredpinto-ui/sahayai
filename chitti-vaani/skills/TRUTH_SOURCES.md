# TRUTH_SOURCES — Chitti Vaani

Where Vaani's facts come from. If it is not in one of these, Vaani asks or refuses.

## 1. Gmail OAuth tokens — per-user, SQLite (Phase 1)

End-user Gmail credentials live in [../backend/services/email_db.py](../backend/services/email_db.py), keyed by a frontend-generated `user_token`. Two tables:

- `oauth_tokens` — `user_token × provider` → `access_token`, `refresh_token`, `expires_at`, `gmail_address`
- `oauth_state` — short-lived state for the OAuth callback hop, TTL 10 minutes

Scope: `gmail.send + userinfo.email`. Refresh is handled inside `email_service.py` on every send. Tracked migration: SQLite → Supabase Postgres alongside the admin tables.

## 2. Product Gmail accounts — admin-managed

Mailboxes that **Chitti** sends from (e.g. `chittinews@gmail.com`, `chittimedupi@gmail.com`) are owned by Sahay AI, granted by Bryan during admin setup, and stored separately from end-user tokens. See [../backend/services/admin_db.py](../backend/services/admin_db.py) + [../backend/services/admin_oauth.py](../backend/services/admin_oauth.py). The admin dashboard frontend is `chitti_admin_products.html` at the repo root.

Keep-alive: [../backend/services/admin_scheduler.py](../backend/services/admin_scheduler.py) sends a monthly self-mail from each connected mailbox to `ADMIN_NOTIFY_EMAIL` to exercise the refresh path before Google's ~6-month idle revoke (7 days in OAuth Testing mode).

## 3. Emergency contacts — per-user paired-Chitti relay

Trusted circle + paired-Chitti table lives in [../backend/services/relay_db.py](../backend/services/relay_db.py). Three tables:

- `pair_codes` — 6-digit codes shown to the helper, TTL 5 minutes
- `pairs` — symmetric rows: `user_A ↔ user_B`
- `relay_events` — fan-out inbox, swept after 24 h of delivery

Emergency cascade reads names + numbers from `pairs`. Cop-number entries (`COP_DENYLIST`) are refused at dial time even if stored.

## 4. Feedback log — `feedback_log` table

Cross-product feedback widget posts to `/api/feedback/collect` and lands in [../backend/services/feedback_db.py](../backend/services/feedback_db.py). PWD-weighted score formula `(Impact × Frequency × Urgency) / Effort`. Daily 06:00 IST report emailed via the admin product mailbox.

## 5. Conversational replies — DeepSeek

System prompt: `CHITTI_VAANI_PROMPT` in [../backend/services/vaani_service.py](../backend/services/vaani_service.py). Wire shape: `model=deepseek-chat`, `temperature=0.4`, `max_tokens=600`, 30 s timeout. No retrieval layer in Phase 1 — replies are pure generative + post-processed by `_enforce_disclaimer()`.

## 6. Languages — `/api/vaani/languages`

9 first-class: `hi, en, ta, te, bn, mr, gu, kn, ml`. Voice supply for 26 languages via Chitti Voice Factory.
