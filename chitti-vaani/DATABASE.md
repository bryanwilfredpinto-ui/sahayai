# DATABASE — Chitti Vaani

Three storage layers:

1. **SQLite (Vaani-local)** — Gmail OAuth tokens + emergency relay. Ephemeral on Railway's free tier (`/tmp` is wiped on every deploy).
2. **Postgres or SQLite (admin / feedback)** — picked at runtime from `ADMIN_DATABASE_URL` → `DATABASE_URL` → SQLite fallback. Production should always use Supabase Postgres so admin state survives deploys.
3. **In-memory** — schedulers cache the most recent feedback report and APScheduler job state.

---

## Layer 1 — SQLite (Vaani-local)

### `oauth_tokens` ([email_db.py](backend/services/email_db.py))

One row per `(user_token, provider)`. `provider` is forward-looking (Gmail today, Outlook tomorrow). Persistent SQLite WAL, lock-protected single connection per thread.

| Column | Type | Notes |
|---|---|---|
| `user_token` | TEXT | frontend-generated UUID, primary-key part |
| `provider` | TEXT | `"gmail"` today, primary-key part |
| `email` | TEXT | what Google said this account is |
| `access_token` | TEXT NOT NULL | |
| `refresh_token` | TEXT | nullable — Google only ships on first consent unless `prompt=consent` |
| `token_uri` | TEXT | constant `https://oauth2.googleapis.com/token` |
| `client_id` | TEXT | stored so refresh can run without re-reading env |
| `client_secret` | TEXT | same |
| `scopes` | TEXT | JSON-encoded list |
| `expiry` | INTEGER | unix seconds (UTC) |
| `created_at` | INTEGER NOT NULL | unix seconds |
| `updated_at` | INTEGER NOT NULL | unix seconds |

**Indexes**: PK on `(user_token, provider)`.

### `oauth_state` ([email_db.py](backend/services/email_db.py))

Short-lived (10 min) state tokens for the OAuth round trip. `save_state()` sweeps stale rows on every insert.

| Column | Type | Notes |
|---|---|---|
| `state` | TEXT PK | random 24-byte token base64-encoded |
| `user_token` | TEXT NOT NULL | who initiated |
| `provider` | TEXT NOT NULL | `"gmail"` |
| `created_at` | INTEGER NOT NULL | unix seconds; rows older than 600 s deleted on next write |

Path: `VAANI_TOKEN_DB` (default `/tmp/chitti_vaani_tokens.sqlite`).

### `pair_codes` ([relay_db.py](backend/services/relay_db.py))

6-digit pair codes the master shares verbally with a helper. Expire in 5 minutes. Swept on every insert.

| Column | Type | Notes |
|---|---|---|
| `code` | TEXT PK | 6 digits |
| `user_token` | TEXT NOT NULL | code owner |
| `user_label` | TEXT | optional display name, ≤ 80 chars |
| `created_at` | INTEGER NOT NULL | unix seconds |

### `pairs` ([relay_db.py](backend/services/relay_db.py))

Symmetric Chitti-to-Chitti pairs. Composite PK uses `(user_a, user_b)` lexicographic-sorted so a single row covers both directions.

| Column | Type | Notes |
|---|---|---|
| `user_a` | TEXT NOT NULL | `min(token1, token2)`, PK part |
| `user_b` | TEXT NOT NULL | `max(...)`, PK part |
| `label_for_a` | TEXT | what B sees A as |
| `label_for_b` | TEXT | what A sees B as |
| `created_at` | INTEGER NOT NULL | |

### `relay_inbox` ([relay_db.py](backend/services/relay_db.py))

Inbox of events waiting for the recipient's Chitti to poll. Delivered rows older than 24 h are swept on every fetch.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `to_user` | TEXT NOT NULL | recipient `user_token` |
| `from_user` | TEXT NOT NULL | sender |
| `kind` | TEXT NOT NULL | `"emergency"` or `"emergency_check_in"` (extensible) |
| `payload` | TEXT NOT NULL | JSON-encoded blob (reason, transcript, source, ts, ...) |
| `created_at` | INTEGER NOT NULL | |
| `delivered` | INTEGER NOT NULL DEFAULT 0 | flipped to 1 on first poll |

**Index**: `idx_inbox_to (to_user, delivered, id)`.

Path: `VAANI_RELAY_DB` (default `/tmp/chitti_vaani_relay.sqlite`).

---

## Layer 2 — Admin + Feedback (Postgres in prod, SQLite local)

Backend resolution order ([admin_db.py `_resolve_url`](backend/services/admin_db.py)):
1. `ADMIN_DATABASE_URL` — preferred. Set to Supabase Postgres URL.
2. `DATABASE_URL` — fallback for shared infra.
3. SQLite at `ADMIN_TOKEN_DB` (default `/tmp/chitti_admin.sqlite`). Ephemeral on Railway — only suitable for local dev.

`postgres://...` URLs are rewritten to `postgresql+psycopg2://...` (SQLAlchemy 2.x dialect prefix). Engine uses `pool_pre_ping=True`. The feedback layer adds a third resolution step ([feedback_db.py `_resolve_url`](backend/services/feedback_db.py)): `FEEDBACK_DATABASE_URL` → `ADMIN_DATABASE_URL` → `DATABASE_URL` → SQLite at `FEEDBACK_DB_PATH`.

A hand-written `_migrate_added_columns()` runs at `init_db()` to add `domain_template` and `features` to `product_gmail_accounts` if they are missing (so we stay off Alembic for now).

### `product_gmail_accounts` ([admin_db.py](backend/services/admin_db.py))

One row per Chitti product mailbox.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK autoincrement | |
| `product_key` | String(64), unique, not null | e.g. `chittinews`, lowercase, matches `^[a-z][a-z0-9_]{1,62}$` |
| `product_name` | String(128), not null | e.g. `"Chitti News"` |
| `gmail_address` | String(256), not null | what an admin entered |
| `oauth_status` | String(32), not null, default `not_added` | one of `not_added` / `needs_auth` / `connected` / `expired` / `revoked` |
| `access_token` | Text | nullable until first consent |
| `refresh_token` | Text | nullable; Google may omit on re-consent — we preserve the previous value |
| `token_expiry` | BigInteger | unix seconds |
| `scopes` | Text | space-separated |
| `connected_email` | String(256) | what Google said. Authoritative over `gmail_address`. |
| `last_keep_alive_at` | DateTime | UTC |
| `last_keep_alive_ok` | Integer | 1 / 0 / null |
| `last_keep_alive_msg` | String(512) | |
| `next_keep_alive_at` | DateTime | advisory only — APScheduler is source of truth |
| `domain_template` | String(64) | one of the 10 dropdown templates or null |
| `features` | Text | comma-separated, ≤ 1024 chars |
| `created_at` | DateTime, server_default `now()`, not null | |
| `updated_at` | DateTime, server_default `now()` ON UPDATE | |

`to_dict()` augments with `token_expires_in` (computed) and converts `features` to a list.

### `product_action_logs` ([admin_db.py](backend/services/admin_db.py))

Audit trail. `log_action()` never raises.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK autoincrement | |
| `product_id` | Integer NOT NULL, indexed | |
| `action` | String(48) NOT NULL | `oauth_start` / `oauth_callback_ok` / `oauth_callback_fail` / `keepalive_ok` / `keepalive_fail` / `manual_send_ok` / `manual_send_fail` / `added` / `deleted` |
| `status` | String(16) NOT NULL | `ok` / `fail` |
| `detail` | Text | ≤ 4000 chars |
| `created_at` | DateTime, server_default `now()`, not null | |

**Index**: `ix_product_action_logs_recent (product_id, created_at DESC)`.

### `admin_oauth_state` ([admin_db.py](backend/services/admin_db.py))

Persistent OAuth state so the Google callback works even when it lands on a different gunicorn worker than the one that issued the state. 10-min TTL, swept on every write.

| Column | Type | Notes |
|---|---|---|
| `state` | String(96) PK | random opaque token |
| `product_id` | Integer NOT NULL | which row to update on callback |
| `frontend_redirect` | String(512) | optional bounce-back URL |
| `created_at` | DateTime, server_default `now()`, not null | |

### `feedback_log` ([feedback_db.py](backend/services/feedback_db.py))

Per-event row from the widget.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK autoincrement | |
| `page` | String(64), not null, indexed | e.g. `chitti_vaani`, matches `^[a-z][a-z0-9_]{1,63}$` |
| `type` | String(16), not null, indexed | `thumbs_up` / `thumbs_down` / `suggestion` |
| `text` | Text | null for thumbs up / down |
| `email` | String(256) | optional reply-to |
| `user_segment` | String(16) | `blind` / `deaf` / `mute` / `illiterate` / `elderly` / `general` |
| `user_agent` | String(512) | clipped browser UA |
| `ip_hash` | String(64) | sha256(`FEEDBACK_IP_SALT` ‖ ip), 32 hex chars stored |
| `is_junk` | Integer, default 0 | set by `filter_and_score_suggestions()` or `POST /<id>/junk` |
| `created_at` | DateTime, server_default `now()`, not null | |

**Index**: `ix_feedback_log_page_type_created (page, type, created_at DESC)`.

Junk filter rules:
- `is_one_word` — single-token suggestions dropped
- `_IMPOSSIBLE` regex — abuse / "free money" / login-takeover requests dropped
- Duplicate normalised text on the same page collapsed; the survivor inherits the highest-impact `user_segment` and accumulates `emails`

Scoring (PWD-weighted) — `(impact × frequency × urgency) / effort`:
- `impact` = 1.0 for `blind` / `deaf` / `mute` / `illiterate`; 0.8 for `elderly`; 0.6 for `general`
- `urgency` = 1.5 if the page has more thumbs_down than thumbs_up; else 1.0
- `effort` = 1.0 placeholder until the admin dashboard exposes human tagging
- `frequency` = duplicate count

---

## Layer 3 — In-memory state

- `services.feedback_scheduler._last_report` / `_last_run_at` — cached output of `feedback_db.daily_report()`; rebuilt by the 06:00 IST cron and by `POST /api/feedback/run-now`.
- `services.admin_scheduler._scheduler` / `services.feedback_scheduler._scheduler` — `BackgroundScheduler` handles; idempotent `start()`.
- `routes.feedback._RL_BURST` / `_RL_HOUR` — per-IP rate-limit windows (1 s burst gap + 60/hour). Reset on process restart.

## Persistence notes

- **`/tmp` is wiped on every Railway free-tier deploy.** Use `ADMIN_DATABASE_URL` (Supabase Postgres) for admin + feedback in production. Vaani's user token DB and relay DB are still SQLite — graduate them when emergency cascade exits beta (a long-running multi-day pair must survive a deploy).
- The feedback layer falls back through three env vars before SQLite — make sure at least one Postgres URL is set in production.
- `FEEDBACK_IP_SALT` should be a stable random string; rotating it resets per-IP rate-limit history but **does not change** any existing hashed rows in `feedback_log`.
