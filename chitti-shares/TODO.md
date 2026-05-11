# TODO

Sources:

1. [`CHITTI_FUNDAMENTALS_MASTER_SPEC.md`](../CHITTI_FUNDAMENTALS_MASTER_SPEC.md) §4 Pending (priority order).
2. [`CHITTI_TECHNICAL_MASTER_SPEC.md`](../CHITTI_TECHNICAL_MASTER_SPEC.md) §7 What's Pending + §8 Chitti Special.
3. Grep for `TODO|FIXME|XXX` under `chitti-shares/backend/`.
4. Carry-overs from the Phase 7 agent commits.

## A. Chitti Fundamentals — Priority 2 (Chitti differentiators)

- [ ] **Story Mode** — 60-second audio narrative of the company (DeepSeek + browser TTS), single Overview-tab button, Hindi + English.
- [ ] **Risk-Fit Dial** — filter / overlay stocks by user persona (Conservative / Moderate / Aggressive). Compute side LIVE in [`services/snowflake.py::risk_fit`](backend/services/snowflake.py); wire into the fundamentals frontend cards.
- [ ] **Confidence Dial** — verdict confidence (0–10) with reasoning from multiple ratios. Compute side LIVE in [`snowflake.py::confidence_dial`](backend/services/snowflake.py); wire into fundamentals frontend.
- [ ] **5D Snowflake radar** — Value / Growth / Quality / Health / Income (Simply-Wall-St style). Compute side LIVE in [`snowflake.py::snowflake_5d`](backend/services/snowflake.py); wire SVG radar into the fundamentals frontend.
- [ ] **Plain-English Compare** — `"Reliance is 5× bigger than ITC, but ITC pays 7× more dividend."` Anthropic / DeepSeek generated from a peer-comparison context.

## B. Chitti Fundamentals — Priority 3 (Investor analytics)

- [ ] **Performance vs NIFTY 50** UI — 1M / 6M / 1Y / 3Y / 5Y / 10Y + alpha. Endpoint `/api/performance/{symbol}` SHIPPED; UI binding pending.
- [ ] **Returns Calculator** UI — lump-sum + SIP simulator vs NIFTY vs Bank FD. Endpoint `/api/returns` SHIPPED; UI pending.
- [ ] **Sector Peer Comparison** — P/E / ROE / Rev growth / D/E / Mcap table for sector peers.
- [ ] **Tickertape composite scorecard** scoring engine.
- [ ] **Trendlyne DVM** scoring (Durability / Valuation / Momentum).
- [ ] **Pros / Cons auto-generator** — DeepSeek-summarised from financials + news.
- [ ] **SWOT auto-generator** — same.
- [ ] **DCF calculator** — analyst-grade DCF with sensitivity table.
- [ ] **Top-10 institutional holders + KMP** — needs separate NSE/BSE shareholding scrape (screener.in only exposes quarterly aggregate).
- [ ] **Earnings calendar live data** — date + EPS estimate + actual.

## C. Chitti Fundamentals — Priority 4 (Agentic surface)

- [ ] `POST /api/agent/fundamental/ask` — already SHIPPED in [`main.py`](backend/main.py); next-step is wiring it into the fundamentals frontend's "Ask Chitti" textbox AND adding more granular tools: `get_pe_ratio`, `get_pb_ratio`, `get_roe`, `get_debt_to_equity`, `get_revenue_growth`, `compare_with_peers`. Currently only the 5 coarse tools (`get_fundamentals`, `get_financials`, `get_cagr`, `get_shareholding`, `get_news`) are registered in [`agent_tools.py`](backend/services/agent_tools.py).

## D. Chitti Technical — Chart tab pending

- [ ] **Manual drawing tools** — trendlines + horizontal lines + Fibonacci retracement + channels (biggest visible gap vs TradingView, see §11 of Technical spec).
- [ ] **Replay mode** — scrub backwards through history (TradingView signature).
- [ ] **Save chart layout** — colours, indicators, drawings persist per stock.
- [ ] **Multi-chart compare** — overlay another stock or sector index on the same chart.
- [ ] **Volume Profile** + **VWAP overlay**.
- [ ] **More chart types**: Heikin Ashi as overlay, Renko, Kagi, Point & Figure.
- [ ] **Pivot points** (Standard, Camarilla, Fibonacci, DM).
- [ ] **Multi-pane custom layouts** (TradingView-style).
- [ ] **Crosshair OHLCV readout** — improve existing.

## E. Chitti Technical — Scanner tab pending

- [ ] **Custom rule builder** — Pine-Script-lite (`RSI < 30 AND volume > 2× avg`). Parser exists in [`services/rule_engine.py`](backend/services/rule_engine.py); needs UI.
- [ ] **Saved custom scans** — name + reuse (`custom_rules` table already exists, route already exists at `/api/technical/rules/saved`; needs frontend in the technical HTML).
- [ ] **Real-time scanner alerts** — ping when a stock newly matches.
- [ ] **Backtest** — for any indicator, show historical P&L if you'd traded it.
- [ ] **Sector heatmap view** — visual sector performance grid.
- [ ] **Pre-market scanner** — if Angel exposes pre-open data.

## F. Chitti Technical — Journal tab pending

- [ ] Photo upload of chart screenshot per trade.
- [ ] Audio note per trade (voice memo recording).
- [ ] Tags / labels per trade for grouping.
- [ ] CSV export.
- [ ] Trade replay link — jump back to chart at the trade timestamp.

## G. Chitti Technical — Analytics tab pending

- [ ] **Trade quality vs P&L scatter plot**.
- [ ] **Time-of-day heatmap**.
- [ ] **Day-of-week analysis**.
- [ ] **Setup-wise performance**.
- [ ] **Emotion-wise outcome**.
- [ ] **Drawdown curve**.
- [ ] **Sharpe / Sortino / Calmar ratios** across journal P&L.

## H. Chitti Technical — Learn tab pending

- [ ] Pattern recognition quizzes — interactive.
- [ ] Strategy backtest library — "Roshan ran on NIFTY for 5Y did this".
- [ ] Hindi explanations for every indicator (audio + text).

## I. Chitti Technical — Calls tab pending

- [ ] **Public calls feed** — community sharing.
- [ ] **Call subscription** — follow other users.
- [ ] **Performance leaderboard**.

## J. Chitti Technical — Chitti Special (no other technical app has these)

- [ ] **Story Mode (per signal)** — 60-second audio briefing of *why* this Roshan / RSI / MACD signal is firing, what historically happens after, what to watch for.
- [ ] **Confidence Dial on every BUY/SHORT verdict** — Chitti edge.
- [ ] **Risk-Fit Dial** — per-signal persona overlay.
- [ ] **Multi-Indian-language audio** — Hindi / Tamil / Bengali / Telugu / Marathi / Gujarati / Kannada audio for every verdict.
- [ ] **Family Share** — WhatsApp-share chart + verdict + SEBI disclaimer with one tap.
- [ ] **Audio alerts** — when a price alert fires, Chitti speaks aloud.
- [ ] **Plain-English signal compare** — compare two stocks' signals in plain words.
- [ ] **Technical Snowflake** — 5-axis radar for technicals (Trend / Momentum / Volume / Volatility / Setup-Quality).
- [ ] **Voice-driven scanner** — *"Chitti, find me oversold midcaps"* via voice INPUT triggers the scan.

## K. Page-level (both products)

- [ ] **⭐ Watchlist** with live prices on the fundamentals frontend (technical frontend already wired via localStorage + 15 s polling).
- [ ] **🔔 Price alerts** — browser push when threshold crosses (Service Worker + Notification API).
- [ ] **Login + multi-device sync** on the technical frontend (journal + watchlist persist across phones).
- [ ] **Multi-language UI** (full Hindi / Tamil / Bengali UI, not just audio).
- [ ] **Side-by-side compare** — chart two stocks together.

## L. Phase 7 carry-overs (from CHANGELOG)

- [ ] **Top up DeepSeek balance** — all three `/api/agent/{product}/ask` endpoints currently return HTTP 402 when balance is exhausted. Listed as next-session priority #1 in [Technical spec §11](../CHITTI_TECHNICAL_MASTER_SPEC.md).
- [ ] **Migrate AI provider from Anthropic to DeepSeek where pages still reference Anthropic** — most server code is on DeepSeek already; the fundamentals frontend Ask Chitti still references Anthropic per [Fundamentals spec §5](../CHITTI_FUNDAMENTALS_MASTER_SPEC.md). See [`project_ai_provider_switch_to_deepseek.md`](../memory).
- [ ] **Investor lens still 'buffett' default** — surface a dropdown so the user can pick lens before asking. Tooling already supports the `lens` query parameter to `/api/agent/fundamental/ask`.

## M. Code TODO / FIXME / XXX

Grep across `chitti-shares/backend/`:

```text
(none — the only matches are unrelated address fields like "+91-755-XXXXXXX"
 in services/medupi_jan_aushadhi.py — those are placeholder phone numbers,
 not TODO markers)
```

No outstanding inline `TODO` / `FIXME` markers in the Python code as of 2026-05-11. The pending work is all in the master specs above and the "skeleton" `/api/medupi/family/wallet` + `/api/medupi/insurance-match` + `/api/medupi/jan_aushadhi/stock` endpoints in [`main.py`](backend/main.py) which return `"status": "skeleton", "next": "..."` payloads.

## N. Sibling MedUPI skeleton endpoints (co-hosted in this service)

These three endpoints in `main.py` return self-describing skeleton payloads. The `next` field on each describes the wiring work:

- [ ] `/api/medupi/family/wallet` — wire `family_profile` + `medupi_log` tables (MedUPI spec §13).
- [ ] `/api/medupi/insurance-match` — seed scheme catalogue (MedUPI spec §13).
- [ ] `/api/medupi/jan_aushadhi/stock` — wire JAK store-level inventory feed once available.
