# TRUTH_SOURCES

Where every number originates. Locked per [`project_data_sources.md`](../../memory) — Yahoo is BLOCKED from Render IPs.

## Primary sources (production)

### 1. screener.in — fundamentals

- File: [`backend/services/screener_client.py`](../backend/services/screener_client.py)
- Method: HTML scrape, cached 1 hr in [`services/cache.py`](../backend/services/cache.py).
- Returns: identity, ratios (P/E, P/B, ROE, ROCE, D/E, current ratio, dividend yield, market cap), quarterly P&L (last 8), shareholding %, full annual P&L + BS + CF.
- Backs: `/api/fundamentals/{symbol}`, `/api/financials/{symbol}`, `/api/cagr/{symbol}`, `/api/shareholding/{symbol}`, and the `get_fundamentals` / `get_financials` / `get_shareholding` agent tools in [`agent_tools.py`](../backend/services/agent_tools.py).

### 2. Angel SmartAPI — prices

- File: [`backend/services/angel_client.py`](../backend/services/angel_client.py) + [`intraday_candles.py`](../backend/services/intraday_candles.py).
- Method: REST + TOTP-authenticated login on dyno startup.
- Returns: live LTP, day OHLC, historical candles (Daily through Monthly via `angel_client`; intraday 1m/5m/15m via the `intraday_candles` side door).
- Backs: `/api/quotes`, `/api/candles/{symbol}`, `/api/technical/{symbol}`, `/api/scan/*`, `/api/levels/{symbol}`, `/api/performance/{symbol}`, `/api/returns`, and the `get_quote` agent tool.
- Quota: tracked via [`usage_tracker`](../backend/services/usage_tracker.py); concurrency capped by a 6-thread `ThreadPoolExecutor` in `scanner.py`.

### 3. RSS aggregator — news

- File: [`backend/services/news_client.py`](../backend/services/news_client.py)
- Feeds: Moneycontrol + LiveMint + BSE + NSE.
- Cache: 10 min.
- Backs: `/api/news/market`, `/api/news/stock/{symbol}`, and the `get_news` agent tool.

## Fallbacks

### Yahoo Finance — LOCAL-DEV ONLY

- File: [`backend/services/yahoo_client.py`](../backend/services/yahoo_client.py)
- Render IPs are blocked by Yahoo; this client is **only** invoked when running locally and screener.in returns empty.
- Documented in [`../README.md`](../README.md) "Data sources (locked)" and [`project_data_sources.md`](../../memory).
- Do **not** add a new code path that depends on Yahoo from a deployed environment.

### Laptop pusher — indices when NSE blocks Render

- Route: `POST /debug/ingest-indices` in [`main.py`](../backend/main.py).
- Source: a developer's home machine fetches NIFTY/SENSEX from `nse_client.py` and POSTs the snapshot.
- Persisted in `shares.index_quotes`. Read by `/api/market/view`.

## AI synthesis

- **DeepSeek** chat completions via [`deepseek_client.py`](../backend/services/deepseek_client.py). Migrating off Anthropic per [`project_ai_provider_switch_to_deepseek.md`](../../memory).
- DeepSeek **never** supplies data — only narrates the data the truth sources above provide.
