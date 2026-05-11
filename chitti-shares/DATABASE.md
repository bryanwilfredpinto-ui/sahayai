# DATABASE

Backing store: **Supabase Postgres** (single shared database with the sibling chitti-medupi service). Local development falls back to SQLite (file `chitti_shares.db`).

> **Memo (2026-05-11)** — Despite both services sharing a single Supabase project, *Chitti Shares and Chitti MedUPI are isolated under separate schemas* (`shares.*` vs `medupi.*`). The memory entry "[chitti-shares Neon DB is SEPARATE from chitti-medupi's Neon DB](../memory)" refers to logical isolation at the **schema** level — neither service can see the other's tables. If a future migration splits them onto physically separate Neon projects, only the `DATABASE_URL` env var in `render.yaml` changes; nothing in the application code does.

## Schema isolation

Implemented in [`backend/models/_schema.py`](backend/models/_schema.py):

```python
SCHEMA = "shares" if DATABASE_URL.startswith("postgres") else None
TABLE_KW = {"schema": SCHEMA} if SCHEMA else {}
fk_target("users") = "shares.users.id"   # Postgres
                   = "users.id"          # SQLite
```

Layout on Supabase:

| Schema | Owner | Contents |
|---|---|---|
| `public.*` | Supabase | Internals, auth tables |
| `shares.*` | This service | Everything in this file |
| `medupi.*` | Sibling chitti-medupi service | Medicine database, family wallet, etc. |

[`backend/database.py::ensure_schema()`](backend/database.py) runs `CREATE SCHEMA IF NOT EXISTS shares` on startup before `Base.metadata.create_all`.

## Tables (under `shares.*` on Postgres)

### `users` — [`models/user.py`](backend/models/user.py)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `mobile` | String(10) | UNIQUE, indexed, NOT NULL, `[6-9]\d{9}` |
| `name` | String(80) | NOT NULL, default `"Trader"` |
| `language` | String(4) | NOT NULL, default `"en"` (`en`/`hi`) |
| `created_at` | DateTime | NOT NULL, UTC now |

### `devices` — [`models/device.py`](backend/models/device.py)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | NOT NULL, indexed |
| `device_id` | String(128) | NOT NULL, indexed (FingerprintJS browser fingerprint) |
| `device_type` | String(16) | NOT NULL, `mobile` or `desktop` |
| `user_agent` | String(400) | nullable |
| `refresh_jti` | String(64) | NOT NULL, indexed; deleting the row revokes the refresh token |
| `created_at`, `last_active` | DateTime | NOT NULL |

Business rule (enforced in `routes/auth.py`): at most one Device of each `device_type` per user; a third login of the same type kicks out the older row.

### `otps` — [`models/device.py`](backend/models/device.py)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `mobile` | String(10) | NOT NULL, indexed |
| `code_hash` | String(200) | NOT NULL — bcrypt of the 6-digit code |
| `expires_at` | DateTime | NOT NULL |
| `created_at` | DateTime | NOT NULL |
| `attempts` | Integer | NOT NULL, default 0; lock after 5 wrong tries |

### `kite_tokens` — [`models/kite_token.py`](backend/models/kite_token.py)

Single-row table (always `id=1`).

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | always `1` |
| `access_token` | String(200) | NOT NULL — daily-refreshed |
| `public_token` | String(200) | nullable |
| `user_id` | String(40) | Kite user id (e.g. `AB1234`) |
| `user_name` | String(120) | nullable |
| `issued_at`, `last_used_at` | DateTime | NOT NULL |

### `stocks` — [`models/stock_universe.py`](backend/models/stock_universe.py)

Master Nifty 500 table, seeded on first start by [`services/stock_universe.py::seed_if_empty()`](backend/services/stock_universe.py).

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `symbol` | String(40) | UNIQUE, indexed, NOT NULL, e.g. `NSE:RELIANCE` |
| `name` | String(120) | NOT NULL |
| `sector` | String(60) | nullable |
| `market_cap_cr` | Float | nullable |
| `instrument_token` | Integer | Kite instrument token (populated later) |
| `in_nifty_500` | Integer | NOT NULL, default 1 |
| `updated_at` | DateTime | NOT NULL |

Indexes: `ix_stocks_name` on `name`.

### `index_quotes` — [`models/index_quote.py`](backend/models/index_quote.py)

Stores quotes pushed from the user's laptop (workaround for Render IP blocks on Yahoo / NSE).

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `canonical` | String(64) | UNIQUE, indexed, NOT NULL, e.g. `NSE:NIFTY 50` |
| `last_price`, `prev_close`, `day_open`, `day_high`, `day_low`, `change`, `pchange` | Float | nullable |
| `updated_at` | DateTime | UTC; auto-updates on UPDATE |

### `watchlist_items` — [`models/stock.py`](backend/models/stock.py)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | NOT NULL, indexed |
| `symbol` | String(40) | NOT NULL |
| `note` | String(200) | nullable |
| `order_index` | Integer | NOT NULL, default 0 — drag-reorder |
| `added_at` | DateTime | NOT NULL |

Unique constraint: `uq_watchlist_user_symbol(user_id, symbol)`.

### `alerts` — [`models/stock.py`](backend/models/stock.py)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | NOT NULL, indexed |
| `symbol` | String(40) | NOT NULL |
| `kind` | String(40) | NOT NULL: `price_above` / `price_below` / `rsi_above` / `rsi_below` / `macd_cross_up` / `macd_cross_down` |
| `threshold` | Float | nullable |
| `timeframe` | String(8) | NOT NULL, default `day` |
| `active` | Boolean | NOT NULL, default `True` |
| `triggered_at`, `last_checked_at` | DateTime | nullable |
| `note` | String(200) | nullable |
| `created_at` | DateTime | NOT NULL |

Index: `ix_alerts_active_user(active, user_id)`.

### `alert_events` — [`models/stock.py`](backend/models/stock.py)

Audit log of fired alerts.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `alert_id` | Integer FK `shares.alerts.id` | NOT NULL, indexed |
| `user_id` | Integer FK `shares.users.id` | NOT NULL, indexed |
| `symbol` | String(40) | NOT NULL |
| `fired_value` | Float | nullable |
| `note` | String(300) | nullable |
| `fired_at` | DateTime | NOT NULL |
| `seen` | Boolean | NOT NULL, default `False` |

### `call_reports` — [`models/stock.py`](backend/models/stock.py)

Every BUY / SELL / WAIT signal generated. Tracks performance over time.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | nullable (NULL = system-wide call), indexed |
| `symbol` | String(40) | NOT NULL, indexed |
| `call_type` | String(8) | NOT NULL: `BUY` / `SELL` / `WAIT` |
| `timeframe` | String(8) | NOT NULL, default `day` |
| `rationale` | Text | nullable |
| `entry_price` | Float | NOT NULL |
| `target`, `stop_loss` | Float | nullable |
| `high_seen`, `low_seen`, `last_price` | Float | nullable, cron-updated |
| `last_updated_at` | DateTime | nullable |
| `status` | String(20) | NOT NULL, default `open`: `open` / `target_hit` / `sl_hit` / `closed_manual` |
| `closed_price` | Float | nullable |
| `closed_at`, `created_at` | DateTime | nullable / NOT NULL |

### `chat_messages` — [`models/stock.py`](backend/models/stock.py)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | NOT NULL, indexed |
| `role` | String(16) | NOT NULL: `user` / `assistant` |
| `content` | Text | NOT NULL |
| `created_at` | DateTime | NOT NULL |

### `portfolio_holdings` — [`models/stock.py`](backend/models/stock.py)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | NOT NULL, indexed |
| `symbol` | String(40) | NOT NULL |
| `qty`, `avg_buy_price` | Float | NOT NULL |
| `added_at` | DateTime | NOT NULL |

Unique constraint: `uq_portfolio_user_symbol(user_id, symbol)`.

### `custom_rules` — [`models/stock.py`](backend/models/stock.py)

Up to 5 saved rules per user.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | NOT NULL, indexed |
| `name` | String(80) | NOT NULL |
| `rule_text` | String(400) | NOT NULL, e.g. `RSI(14) < 30 AND MACD_HIST > 0` |
| `signal` | String(10) | NOT NULL, default `BUY`: `BUY` / `SELL` / `WAIT` |
| `created_at` | DateTime | NOT NULL |

### `usage_log` — [`models/quota.py`](backend/models/quota.py)

One row per external API call.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `user_id` | Integer FK `shares.users.id` | nullable (NULL = system call), indexed |
| `provider` | String(20) | NOT NULL: `deepseek` / `fast2sms` / `yahoo` |
| `operation` | String(60) | NOT NULL: `chat` / `send_otp` / `quote` / etc. |
| `input_tokens`, `output_tokens`, `units` | Integer | nullable |
| `cost_inr` | Float | NOT NULL, default 0.0 |
| `success` | Integer | NOT NULL, default 1 (0 = failed) |
| `error` | String(200) | nullable |
| `duration_ms` | Integer | nullable |
| `created_at` | DateTime | NOT NULL, indexed |

Index: `ix_usage_provider_date(provider, created_at)`.

### `daily_quota_summary` — [`models/quota.py`](backend/models/quota.py)

One row per IST day. Incrementally updated.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | indexed |
| `date_ist` | String(10) | UNIQUE, NOT NULL — `YYYY-MM-DD` |
| `total_inr`, `deepseek_inr`, `fast2sms_inr`, `yahoo_inr` | Float | NOT NULL, default 0.0 |
| `call_count`, `blocked_count` | Integer | NOT NULL, default 0 |
| `updated_at` | DateTime | NOT NULL |

## Pricing constants

Defined in [`services/usage_tracker.py`](backend/services/usage_tracker.py) (also returned by `/api/usage/today`):

| Provider | Operation | Rate (April 2026) |
|---|---|---|
| DeepSeek | chat input | ₹22.50 / 1M tokens |
| DeepSeek | chat output | ₹91.50 / 1M tokens |
| Fast2SMS | OTP send | ₹0.22 / SMS |
| Yahoo Finance | quote / fundamentals | free (logged for rate-limit visibility) |

## Caps

| Cap | Default | Where |
|---|---|---|
| Soft daily cap | ₹50 | `DAILY_BUDGET_INR` env var; logs warning |
| Hard daily cap | ₹100 | `HARD_CAP_INR`; metered routes return 503 `BUDGET_CAP_EXCEEDED` |
| Watchlist | 50 / user | `MAX_WATCHLIST_ITEMS` |
| Alerts | 30 / user (active) | `MAX_ALERTS_PER_USER` |
| Saved custom rules | 5 / user | `MAX_SAVED_RULES_PER_USER` in `routes/technical.py` |
| Devices | 1 mobile + 1 desktop / user | Enforced in `routes/auth.py` |

## Migration / bootstrap

There is no Alembic migration ladder. `Base.metadata.create_all(bind=engine)` runs on every startup and is idempotent. Adding a new column without changing existing rows works in dev; for Supabase production, run the `ALTER TABLE` via the Supabase SQL editor before deploying the new model.

The Nifty 500 stock universe is seeded by `services.stock_universe.seed_if_empty()` from [`backend/config/nifty_universe.json`](backend/config/) on first start.

The 10 stock specialists are loaded lazily from [`backend/config/stock_specialists.json`](backend/config/) by `services.specialist.get_all()`. No DB row; adding an 11th stock = append to the JSON, no migration.
