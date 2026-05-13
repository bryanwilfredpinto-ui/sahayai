# Chitti Fundamentals — FEATURES

Honest, code-verified inventory of what the [`chitti_fundamentals.html`](../../chitti_fundamentals.html) surface actually does today. Same three-section contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md):
**Built & working**, **Planned**, **Future**.

The backend lives in [`chitti-shares/backend/`](../../chitti-shares/backend/) — Chitti Fundamentals and Chitti Technical share one FastAPI service (`chitti-shares-api`). This file scopes to the **fundamentals** surface only.

Last verified against the working tree on **2026-05-14**. When in doubt, re-grep
[`chitti-shares/backend/services/scorecard.py`](../../chitti-shares/backend/services/scorecard.py),
[`chitti-shares/backend/services/screener_client.py`](../../chitti-shares/backend/services/screener_client.py),
[`chitti-shares/backend/services/snowflake.py`](../../chitti-shares/backend/services/snowflake.py),
and [`chitti_fundamentals.html`](../../chitti_fundamentals.html) before claiming "built".

---

## 1. Built and working on the web

End-to-end wired: a real HTTP endpoint OR a frontend handler that produces a visible, externally-observable effect.

### 1.1 Fundamentals scorecard

- `GET /api/stocks/{symbol}/fundamentals` — returns a Buffett/Lynch/
  Graham-flavoured scorecard (P/E, P/B, ROE, ROCE, debt/equity,
  promoter holding, sales growth, profit growth, dividend yield,
  market cap). Source:
  [`services/scorecard.py:build_scorecard`](../../chitti-shares/backend/services/scorecard.py).
- `GET /api/stocks/{symbol}/quarterly` — last N quarters of P&L
  highlights (revenue, expenses, operating profit, OPM, PAT).
- **Data source:** [`screener.in`](https://www.screener.in) via
  [`screener_client.py`](../../chitti-shares/backend/services/screener_client.py).
  Yahoo client is kept as **local-dev only** — Yahoo is blocked from
  Render (locked decision [[project_data_sources]]).
- Trailing `%` cells are now accepted (commit `c725c22` —
  *fix(screener): accept trailing % in table cells*) so OPM /
  margin / ratio rows render without parse errors.

### 1.2 Public `/api/fundamentals` endpoint (Chitti Fundamentals launch)

- Standalone public endpoint that powers the no-login
  [`chitti_fundamentals.html`](../../chitti_fundamentals.html) frontend.
  Shipped in commit `9bc396b` — *feat: Chitti Fundamentals — standalone
  HTML + public /api/fundamentals*.

### 1.3 Fundamentals scanner — 31 verdict strategies

- Scanner page with 31 strategies (Buffett / Lynch / Graham /
  Kedia / RKD / dividend / growth / value combos) + `Scan All`. Shipped
  in commits `f568591` *feat(fundamentals): scanner with 31 strategies*
  and `75fe3a6` *feat(scanner): real universe scan + verdict cards*.
- Verdict cards per stock (✅ pass / ⚠️ partial / ❌ fail) with the
  specific ratio that drove the verdict.

### 1.4 5D Snowflake radar — compute LIVE, UI pending

- [`services/snowflake.py::snowflake_5d`](../../chitti-shares/backend/services/snowflake.py)
  computes the five dimensions (Value / Growth / Quality / Health /
  Income) Simply-Wall-St style. Numeric output is live; **SVG radar
  binding in the fundamentals frontend is pending** ([`chitti-shares/TODO.md`](../../chitti-shares/TODO.md) A).
- Shipped in commit `06f93d8` — *feat(p2): 5D Snowflake + Confidence
  Dial + Risk-Fit Dial (compute-only)*.

### 1.5 Confidence Dial — compute LIVE, UI pending

- [`services/snowflake.py::confidence_dial`](../../chitti-shares/backend/services/snowflake.py)
  returns verdict confidence 0–10 with rationale from multiple ratios.
  Compute is live; frontend dial binding is the open piece.

### 1.6 Risk-Fit Dial — compute LIVE, UI pending

- [`services/snowflake.py::risk_fit`](../../chitti-shares/backend/services/snowflake.py)
  filters / overlays stocks by user persona (Conservative / Moderate /
  Aggressive). Compute is live; frontend persona toggle pending.

### 1.7 Returns Calculator + Performance vs NIFTY — endpoints LIVE, UI pending

- `GET /api/performance/{symbol}` — 1M / 6M / 1Y / 3Y / 5Y / 10Y +
  alpha vs NIFTY 50. Shipped in `4ab96a1` —
  *feat(p3): performance vs NIFTY + returns calculator*.
- `GET /api/returns` — lump-sum + SIP simulator vs NIFTY vs Bank FD.
  Bypasses the 365-day cap via direct 2,000-day pull (`6d42998` —
  *fix(returns): bypass technical.fetch_candles 365-day cap*).
- **Both endpoints are live in production; frontend UI bindings are
  the open piece** (TODO sections B-1, B-2).

### 1.8 News tab

- Per-stock news feed wired into the fundamentals page (commit
  `f568591` ships the News tab). Source:
  [`services/news_client.py`](../../chitti-shares/backend/services/news_client.py).

### 1.9 Ask Chitti chat — embedded on the fundamentals page

- DeepSeek-powered chat scoped to the open stock's fundamentals,
  reachable from every stock card.
- Routes through `/api/chat` (last 50 messages cached per user) or the
  per-stock specialist at `/api/stocks/{symbol}/chat` when one is
  configured. Holdings are not leaked to the LLM unless the user
  opts in.

### 1.10 Watchlist + Alerts + Portfolio (shared with Technical)

- Watchlist: `GET / POST / DELETE /api/watchlist`.
- Alerts: `GET / POST /api/alerts`, `POST /api/alerts/{id}/toggle`,
  `GET /api/alerts/events`.
- Portfolio Doctor: `GET /api/portfolio`,
  `GET /api/portfolio/insights` (DeepSeek-generated 3 specific recos,
  cached), `POST /api/portfolio/holdings`,
  `POST /api/portfolio/upload` (Zerodha CSV).
- Routes:
  [`portfolio.py`](../../chitti-shares/backend/routes/portfolio.py).

### 1.11 Agentic tool-calling — Fundamentals agent

- `POST /api/agent/fundamental/ask` — true tool-calling agent shipped
  in `529eaac` *feat(agent): true tool-calling /api/agent/{tech|fund|
  medupi}/ask endpoints*.
- Currently exposes 5 coarse tools in
  [`services/agent_tools.py`](../../chitti-shares/backend/services/agent_tools.py):
  `get_fundamentals`, `get_financials`, `get_cagr`, `get_shareholding`,
  `get_news`. Endpoint live, broader tool registry queued (§2).

### 1.12 Per-utterance + per-day DeepSeek cost meter

- Shipped in `fc17c6c` — *feat(meter): per-utterance + per-day
  DeepSeek cost visible in the UI*. Every reply carries `{cost_usd,
  cumulative_today}` so users see the cost of each interaction.

### 1.13 Skeleton coverage of reference apps (Angel / Zerodha / Groww / Screener / Tickertape / Bloomberg)

- Commit `0e92fd9` — *feat(fundamentals): full skeleton with every
  feature from Angel/Zerodha/Groww/Screener/Tickertape/Bloomberg*
  ships the **full feature surface** as a skeleton, per the
  [[feedback_skeleton_first_pass]] rule. Built sub-features are wired
  end-to-end; planned ones are listed as `COMING SOON` in the UI.

### 1.14 SEBI disclaimer (substrate)

- Sticky `NOT SEBI REGISTERED` bar + full legal modal on every page
  ([[project_legal_disclaimer]]). Repeats above every scorecard, every
  scanner verdict, every Snowflake / Confidence / Risk-Fit dial.

---

## 2. Planned — queued (frontend wiring on shipped backends + Chitti differentiators)

Source:
[`chitti-shares/TODO.md`](../../chitti-shares/TODO.md) sections A / B / C. All compute backends below are **already live**; the missing piece is the user-facing UI.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| F1 | **Story Mode** — 60-second audio narrative of the company | **P0** | Voice-first onboarding for blind / illiterate / elderly users. | DeepSeek narrative + Voice Factory read-aloud. Single Overview-tab button. Hindi + English first; 26 langs via Voice Factory cascade. |
| F2 | **Risk-Fit Dial UI** — filter / overlay by persona | P1 | Compute already live (`snowflake.py::risk_fit`); just needs frontend toggle. | Persona pill in fundamentals header; cards re-shade based on fit score. |
| F3 | **Confidence Dial UI** — verdict confidence 0–10 | P1 | Compute already live (`snowflake.py::confidence_dial`). | Dial gauge next to the verdict + tap-to-expand rationale. |
| F4 | **5D Snowflake radar UI** — Value / Growth / Quality / Health / Income | P1 | Compute already live (`snowflake.py::snowflake_5d`). | SVG radar in the Overview tab. |
| F5 | **Plain-English Compare** — `"Reliance is 5× bigger than ITC, but ITC pays 7× more dividend."` | P2 | DeepSeek-generated from peer-comparison context. | New `/api/compare?a=&b=` endpoint + Compare tab. |
| F6 | **Performance vs NIFTY UI** — 1M / 6M / 1Y / 3Y / 5Y / 10Y + alpha | P1 | Endpoint live; UI pending. | Bar / line chart in Performance tab. |
| F7 | **Returns Calculator UI** — lump-sum + SIP simulator vs NIFTY vs Bank FD | P1 | Endpoint live; UI pending. | Input form + result card in Returns tab. |
| F8 | **Sector Peer Comparison** — P/E / ROE / Rev growth / D/E / Mcap table for sector peers | P2 | Standard reference-app feature. | New `/api/peers/{symbol}` + table in Peers tab. |
| F9 | **Tickertape composite scorecard** scoring engine | P2 | Differentiator vs raw screener.in. | New scoring service + scorecard tab. |
| F10 | **Trendlyne DVM** — Durability / Valuation / Momentum scoring | P2 | Reference-app parity. | New scoring service + dial UI. |
| F11 | **Pros / Cons auto-generator** | P2 | DeepSeek-summarised from financials + news. | New `/api/proscons/{symbol}` endpoint. |
| F12 | **SWOT auto-generator** | P2 | Same pattern as F11. | New `/api/swot/{symbol}` endpoint. |
| F13 | **DCF calculator** — analyst-grade DCF with sensitivity table | P2 | Investor-grade differentiator. | New DCF service; sensitivity grid UI. |
| F14 | **Top-10 institutional holders + KMP** | P2 | screener.in only exposes quarterly aggregate; need separate NSE/BSE shareholding scrape. | New scraper service + Shareholding tab. |
| F15 | **Earnings calendar live data** — date + EPS estimate + actual | P2 | Pro-investor feature. | New `/api/earnings_calendar` + Calendar tab. |
| F16 | **More granular agent tools** for `POST /api/agent/fundamental/ask` | P1 | Currently only 5 coarse tools. Add: `get_pe_ratio`, `get_pb_ratio`, `get_roe`, `get_debt_to_equity`, `get_revenue_growth`, `compare_with_peers`. | Register in [`services/agent_tools.py`](../../chitti-shares/backend/services/agent_tools.py). |

**How to apply** when implementing:
- Story Mode (F1) must read aloud via Voice Factory's 4-supplier
  cascade — not browser-native TTS — so 26 Indian languages are covered
  ([[project_voice_factory_complete]]).
- Every new dial / radar must follow the four-user contract: symbol +
  word label, never colour alone; voice-out for every state change.
- Plain-English Compare (F5), Pros/Cons (F11), SWOT (F12) carry the
  server-enforced SEBI disclaimer — never client-controlled.

---

## 3. Future — needs partnership / paid data / regulator

Listed because prospective users ask. No code today.

- **Live institutional flow** (DII / FII daily). Needs a NSE / BSE
  paid data partnership; the public bhavcopy is end-of-day only.
- **Bulk + block deal alerts.** Same — would require a paid feed.
- **Insider trades + SAST disclosures parser.** Public PDFs but
  scraping is brittle; a SEBI partnership would be cleaner.
- **Live broker-house ratings + target prices.** Each broker would
  need a B2B agreement; reliability of public broker PDFs is low.
- **Live conference-call transcripts + sentiment.** Bigshare / NSDL
  publish; transcription + sentiment is a large compute spend.
- **Auto-execute investing rules** (paper or real). Out of scope:
  Chitti Fundamentals is **read-only by design** — every verdict ends
  with "tap to copy into your broker", never auto-submits orders.

---

## Cross-product hooks (already wired)

- **Chitti Fundamentals ↔ Chitti Technical.** Both share
  `chitti-shares-api`. The fundamentals scorecard and the technical
  chart for the same symbol are one click apart.
- **Chitti Fundamentals ↔ Chitti Vaani.** Ask-Chitti chat and Story
  Mode (planned, F1) read aloud through the Voice Factory cascade —
  same pipe as Vaani's `mode=read`.
- **Chitti Fundamentals ↔ Chitti News.** Per-stock news tab pulls
  from the news RSS substrate; tapping any headline opens it in the
  Chitti News overlay (planned wire).
- **Chitti Fundamentals ↔ Founder dashboard.** Per-utterance +
  per-day DeepSeek cost meter pushes back to the founder feed.

---

## How to keep this file honest

1. Move an item from Planned → Built **only after** curling the live
   production endpoint AND clicking the UI on `chitti_fundamentals.html`
   in a real browser (per [[feedback_verify_before_handover]]).
2. Yahoo references must stay scoped to **local-dev only**. If a new
   feature here gets wired to `yahoo_client` for production, that is a
   bug — switch to `screener_client` or another approved source
   ([[project_data_sources]]).
3. SEBI sticky banner is a merge-blocker. If any new tab on
   `chitti_fundamentals.html` ships without it, this file (and the PR)
   must be reverted.
4. New agent tools belong in `services/agent_tools.py`, not in fresh
   REST routes. The agentic surface is the future-facing seam.
