# VALUES

## 1. Investor education > stock tips

The product wins when a user understands *why* a P/E of 45 might be reasonable or absurd — not when they get a "guaranteed multibagger" call. Every verdict carries the lens name and the actual ratios that produced it. No Telegram-tipster voice, ever.

## 2. The SEBI banner is the product, not a footer

The sticky **NOT SEBI REGISTERED — Educational tool only** strip at the top of [`chitti_fundamentals.html`](../../chitti_fundamentals.html) and [`chitti_complete_technical.html`](../../chitti_complete_technical.html) is the legal contract with the user. It is **never** moved to the footer. Clicking opens the full-legal modal with the 2013 IA + 2014 RA non-registration clauses, past-performance, data-source, and user-responsibility disclaimers. Reference: [`project_legal_disclaimer.md`](../../memory).

Agent system prompts ([`../PROMPTS.md`](../PROMPTS.md) §6, §7) inject the exact disclaimer line as their final sentence so a TTS read-out matches the visible banner.

## 3. Schema-isolated DB so siblings don't collide

Every model declares `__table_args__ = TABLE_KW` where `SCHEMA = "shares"` on Postgres. `database.py::ensure_schema()` runs `CREATE SCHEMA IF NOT EXISTS shares` before `Base.metadata.create_all`. Sibling MedUPI lives under `medupi.*` in the same Supabase instance — they share no tables. See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) "Schema isolation".

## 4. Locked truth sources — free tier or nothing

Yahoo Finance is **BLOCKED** from Railway IPs ([`project_data_sources.md`](../../memory)). The active sources are:

- **screener.in** scrape → fundamentals, financials, shareholding (`screener_client.py`).
- **Angel SmartAPI** → live quotes + intraday candles + history (`angel_client.py`, `intraday_candles.py`).
- **Moneycontrol + LiveMint + BSE + NSE RSS** → news (`news_client.py`).
- **DeepSeek** → AI synthesis only, never data.

`yahoo_client.py` is kept as a **local-dev fallback only**. No Bloomberg, Refinitiv, or Tickertape API in the critical path.

## 5. Voice-first accessibility before any AI

Four-User Contract (blind / deaf / mute / illiterate) is satisfied before DeepSeek is even called. See [`project_four_user_contract.md`](../../memory).
