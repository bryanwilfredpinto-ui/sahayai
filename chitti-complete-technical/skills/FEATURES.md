# Chitti Technical — FEATURES

Honest, code-verified inventory of what the [`chitti_complete_technical.html`](../../chitti_complete_technical.html) surface actually does today. Same three-section contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md):
**Built & working**, **Planned**, **Future**.

The backend lives in [`chitti-shares/backend/`](../../chitti-shares/backend/) — Chitti Technical and Chitti Fundamentals share one FastAPI service (`chitti-shares-api`). This file scopes to the **technical** surface only.

Last verified against the working tree on **2026-05-14**. When in doubt, re-grep
[`chitti-shares/backend/routes/technical.py`](../../chitti-shares/backend/routes/technical.py),
[`chitti-shares/backend/services/indicators.py`](../../chitti-shares/backend/services/indicators.py),
and [`chitti_complete_technical.html`](../../chitti_complete_technical.html) before claiming "built".

---

## 1. Built and working on the web

End-to-end wired: a real HTTP endpoint OR a frontend handler that produces a visible, externally-observable effect.

### 1.1 Indicator engine — 43 indicators (Roshan composite)

- `GET /api/technical/{symbol}/analyze?timeframe={day|week|month}` —
  computes the full indicator stack on the latest candles. Returns
  `indicators`, `summary` (BUY / SHORT / WAIT / Neutral), and a
  `trade_plan` (entry / target / SL based on ATR). Source:
  [`routes/technical.py:analyze`](../../chitti-shares/backend/routes/technical.py),
  [`services/indicators.py`](../../chitti-shares/backend/services/indicators.py).
- 43 indicators registered (the Phase 1 baseline of 34 plus the
  2010–2026 additions: TTM Squeeze, Awesome Oscillator, Vortex,
  Chandelier Exit, HMA, Laguerre RSI, Heikin-Ashi trend, BOP, Chande
  Kroll). New ones carry a lightning-badge in the scanner.
- **5-minute server cache** per (symbol, timeframe).

### 1.2 Multi-timeframe consensus (Roshan safety net)

- `GET /api/technical/{symbol}/consensus` — checks day / week / month
  agreement. If higher and lower TFs disagree → returns `WAIT`. Used as
  the strict-filter gate before any Call is generated.
- Verdict + per-timeframe rationale + summary returned in one shot.

### 1.3 Scanner — universe-wide indicator screen

- `GET /api/scan/{indicator}` — runs any of the 43 indicators across the
  full Nifty universe in one call. Returns BUY + SHORT columns with the
  signal-bearing candle.
- **Custom call type** — user picks TF1 + TF2 + Pullback timeframe in
  the UI; backend accepts `tf1`, `tf2`, `pullback` query params.
  Nothing hardcoded — the user defines the rule.
- **Last-closed-candle** (Roshan spec): scanner uses `iloc[-2]` so it
  never signals on an unfinished bar.
- Tickertape/Kite-inspired Tailwind UI, light theme, SEBI sticky banner.

### 1.4 Candles + auto support/resistance

- `GET /api/candles/{symbol}` — OHLC with timeframes `1m / 5m / 15m /
  hour / day / week / month`. Intraday timeframes route through
  [`services/intraday_candles.py`](../../chitti-shares/backend/services/intraday_candles.py)
  for direct Angel fetch (avoids the 365-day cap on the day path).
- `GET /api/levels/{symbol}` —
  [`services/levels.py`](../../chitti-shares/backend/services/levels.py)
  computes horizontal S/R + trendlines (strict wick-to-wick, no slope
  extrapolation, anchored to actual pivot prices). Bounded to pivot
  range; refetches on symbol change with retry on partial failure.

### 1.5 StockChart — TradingView-style chart on every symbol page

- `lightweight-charts` candlestick + RSI pane + S/R + trendlines.
- 1m / 5m / 15m / hour / day / week / month timeframe pills.
- Symbol search → resolve → chart in one flow.
- Crosshair OHLCV readout; timeframe labels render fully without
  truncation.

### 1.6 Custom rule engine — Pine-Script-lite

- `POST /api/technical/rules/evaluate` — accepts `{symbol, timeframe,
  rule_text}` and evaluates it against fresh candles. Parser:
  [`services/rule_engine.py`](../../chitti-shares/backend/services/rule_engine.py).
- `GET /api/technical/rules/examples` — pre-baked example rules
  (`RSI < 30 AND volume > 2 * avg_volume`, etc.).
- **Saved custom rules** (max 5 per user):
  `GET / POST / DELETE /api/technical/rules/saved`, plus
  `POST /api/technical/rules/saved/{id}/run` to fire a saved rule on a
  symbol. Backend route is shipped; frontend binding is partial — see §2.

### 1.7 Call reports

- `GET / POST /api/calls` — record a generated call (entry / target /
  SL / timeframe / rationale).
- `POST /api/calls/{id}/close` — mark a call closed with outcome.
- `POST /api/calls/track-all` (admin) — refresh high / low / last for
  open calls; powers the dashboard's running P&L.

### 1.8 Watchlist + Alerts + Portfolio Doctor (shared with Fundamentals)

- Watchlist: `GET / POST / DELETE /api/watchlist`,
  `POST /api/watchlist/reorder`.
- Alerts: `GET / POST /api/alerts`, `POST /api/alerts/{id}/toggle`,
  `DELETE /api/alerts/{id}`, `POST /api/alerts/check-all` (admin),
  `GET /api/alerts/events`. Routes:
  [`portfolio.py`](../../chitti-shares/backend/routes/portfolio.py).
- Portfolio Doctor: `GET /api/portfolio`,
  `GET /api/portfolio/insights` (DeepSeek-generated 3 specific recos,
  cached), `POST /api/portfolio/holdings`,
  `POST /api/portfolio/upload` (multipart Zerodha CSV),
  `DELETE /api/portfolio/holdings/{id}`.

### 1.9 Stock specialists (DeepSeek-powered per-stock chat)

- `GET /api/specialists` — list configured specialists with display
  name, long name, expertise.
- `POST /api/stocks/{symbol}/chat` — ask the per-stock specialist.
  Backed by
  [`services/specialist.py`](../../chitti-shares/backend/services/specialist.py) +
  [`config/stock_specialists.json`](../../chitti-shares/backend/config/stock_specialists.json).
- Routes the request through DeepSeek with stock-scoped context
  (recent fundamentals, latest analysis, etc.) — never the user's
  portfolio holdings (privacy default — see [`chat.py`](../../chitti-shares/backend/routes/chat.py)).

### 1.10 Chitti AI Chat (general)

- `GET / POST / DELETE /api/chat` — last-50-messages chat with the
  global Chitti agent. Context auto-injected: user name, watchlist
  symbols, current Nifty + Sensex (cached), recent open call reports.
  **Portfolio holdings NOT sent to LLM by default** — opt-in flag
  reserved.

### 1.11 Market view + indices

- `GET /api/market/indices` — NIFTY 50 + SENSEX live data via Kite.
- `GET /api/market/view` — Chitti's AI summary of where the market is
  today.
- Admin-only Kite OAuth (`/api/market/auth-url` /
  `/api/market/auth-callback` / `/api/market/auth-status`) seeds the
  shared access token used by every other route.

### 1.12 Agentic tool-calling surface (Phase 7)

- `POST /api/agent/technical/ask` — true tool-calling agent scoped to
  the technical tool set (registered in
  [`services/agent_tools.py`](../../chitti-shares/backend/services/agent_tools.py)).
  Companion endpoints exist for `fundamental` and `medupi`. Survives
  DeepSeek rate-limits because compute-only tools (consensus,
  Roshan composite) bypass the LLM.

### 1.13 Auth + quota + cost meter

- Phase 1 OTP-based auth (`auth.py` / `otp_sender.py`); admin flag
  gated by `ADMIN_MOBILE`.
- Per-user + per-day DeepSeek cost meter visible in the UI
  (`fc17c6c` — *feat(meter)*) — every reply carries `{cost_usd,
  cumulative_today}` so the user can see what each utterance costs.

### 1.14 SEBI disclaimer (substrate)

- Sticky `NOT SEBI REGISTERED` bar + full legal modal — never demoted
  to footer ([[project_legal_disclaimer]]). Repeats on every chart,
  scanner, calls, and chat surface.

---

## 2. Planned — queued (frontend bindings on shipped backends)

These are the gaps where the **backend is live** but the
**chitti_complete_technical.html** UI has not been wired up yet. Source:
[`chitti-shares/TODO.md`](../../chitti-shares/TODO.md) sections D / E / F / G / H / I.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| T1 | **Manual drawing tools** (trendlines, horizontal lines, Fib retracement, channels) | P1 | Biggest visible gap vs TradingView. | Add drawing layer on top of `lightweight-charts` in `chitti_complete_technical.html`. No backend change. |
| T2 | **Replay mode** — scrub backwards through history | P1 | TradingView signature feature; teaches pattern recognition for blind users when paired with voice-out per-bar. | Frontend-only: replay the candles array with a virtual cursor. |
| T3 | **Save chart layout** (colours, indicators, drawings) per stock | P2 | Persistence — current state evaporates on reload. | New `/api/chart/layouts` endpoint + localStorage fallback. |
| T4 | **Multi-chart compare** — overlay another stock or sector index | P2 | Pair-trade & relative-strength workflows. | Frontend: second series on the same chart. |
| T5 | **Volume Profile + VWAP overlay** | P1 | Both already supported by `lightweight-charts` plugins. | Frontend wire-up. |
| T6 | **Heikin-Ashi / Renko / Kagi / Point & Figure** chart types | P2 | Adds 4 alt chart types. | Frontend rendering modes. |
| T7 | **Pivot points** (Standard / Camarilla / Fibonacci / DM) | P2 | Day-trader staple. | `services/levels.py` extension + chart overlay. |
| T8 | **Custom rule builder UI** (Pine-Script-lite) | **P0** | Parser already shipped in `services/rule_engine.py`; the form is the only missing piece. | Frontend builder in the Scanner tab. |
| T9 | **Saved-scans UI** | P1 | Backend at `/api/technical/rules/saved` already supports CRUD + run; UI not wired. | Frontend "My Scans" tab. |
| T10 | **Real-time scanner alerts** — ping on newly matching symbol | P2 | Closes the loop from passive scan to active alert. | New polling job + push via existing `/api/alerts/events`. |
| T11 | **Backtest** — historical P&L if you'd traded an indicator | P1 | Trust-builder for the 43 indicators. | New `/api/backtest/{indicator}` endpoint + frontend chart. |
| T12 | **Sector heatmap** | P2 | Visual sector-performance grid. | New `/api/sectors/heatmap` + grid UI. |
| T13 | **Journal tab** — photo of chart, audio voice memo, tags, CSV export, trade replay link | P1 | Trader-discipline core. None shipped today. | New `journal_*` tables + multipart routes + frontend. |
| T14 | **Analytics tab** — quality vs P&L scatter, time-of-day heatmap, day-of-week, setup performance, emotion vs outcome, drawdown curve, Sharpe / Sortino / Calmar | P2 | Pro-trader analytics on top of the Journal. | All compute on journal rows; charts in frontend. |
| T15 | **Learn tab** — pattern-recognition quizzes, strategy backtest library, Hindi audio explanations per indicator | P2 | Four-user contract; voice-first education. | Static content + Voice Factory read-aloud. |
| T16 | **Calls tab** — voice-out for every new call, undo within 30 s, family-cascade for HIGH conviction calls | P1 | Reuse Vaani's emergency cascade pattern. | Frontend on top of `/api/calls`. |

**How to apply** when implementing:
- Every drawing / scanner / journal feature must follow the
  [four-user contract](../../SAHAYAI_MASTER.md#7-accessibility-requirements--non-negotiable):
  symbols + word label, never colour alone; voice-out for every state
  change.
- New frontend rule-builder + saved-scans UI must surface the SEBI
  banner before any signal is shown.
- The agentic `POST /api/agent/technical/ask` already exists; new tool
  registrations (e.g. `backtest_indicator`, `find_pattern`) belong in
  [`services/agent_tools.py`](../../chitti-shares/backend/services/agent_tools.py),
  not in fresh REST routes.

---

## 3. Future — needs partnership / regulator / paid data

Not in [`chitti-shares/TODO.md`](../../chitti-shares/TODO.md). Listed
because prospective users ask. No code today.

- **Pre-market scanner.** Requires Angel pre-open data access (not
  currently exposed on the free tier).
- **Tick-level intraday backtest.** Would require a paid tick-data
  partner (Truedata / GDFL); free Angel data is candle-aggregated.
- **Options-Greek scanner** (Delta / Gamma / Theta / Vega across the
  chain). Needs the Kite option-chain pull plus a Black-Scholes
  layer — neither shipped.
- **Auto-execute calls** (paper or real). Out of scope:
  Chitti Technical is **read-only by design** — every call ends with
  "tap to copy into your broker", never auto-submits an order.

---

## Cross-product hooks (already wired)

- **Chitti Technical ↔ Chitti Fundamentals.** Both products share
  `chitti-shares-api`; a user authenticated on one is authenticated on
  the other. The fundamentals scorecard for the same symbol is one
  click away from the technical view.
- **Chitti Technical ↔ Chitti Vaani.** Specialists chat (`/api/stocks/
  {symbol}/chat`) is read-aloud when the user has the four-user
  contract's "Voice IN + Voice OUT" mode active — same pipe as Vaani's
  `mode=read`.
- **Chitti Technical ↔ Founder dashboard.** The DeepSeek cost meter
  pushes per-utterance + daily totals back to the founder feed.

---

## How to keep this file honest

1. Move an item from Planned → Built **only after** curling the live
   production endpoint AND clicking through the chart / scanner / chat
   UI in a real browser (per
   [[feedback_verify_before_handover]]).
2. New indicators ship with a lightning badge in the scanner UI; if
   the badge is missing in the live page, the indicator is **not
   built** even if `compute_*` exists in the code.
3. SEBI sticky banner is a merge-blocker. If any new tab on
   `chitti_complete_technical.html` ships without it, this file (and
   the PR) must be reverted.
4. Every entry in §1 above is grep-able to a route or a frontend
   handler. If a feature is removed from the code, remove it here in
   the same commit.
---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

### Quality

| # | Item | How to apply |
|---|---|---|
| Q1 | **NOT SEBI REGISTERED** sticky bar must be **RED** — never white / grey. (Already locked in [`project_legal_disclaimer`](../../SAHAYAI_MASTER.md); audit the CSS on every Shares-backed page.) | Frontend audit: `chitti_complete_technical.html` + `chitti_fundamentals.html` — verify the `.sebi-bar` background is `#dc2626` or equivalent red; never pastel. |
| Q2 | Every recommendation shows **risk badge** — LOW (green) / MEDIUM (amber) / HIGH (red). | Backend already classifies; frontend renders a coloured pill alongside the recommendation. Uses the same colour palette as `Chitti.a11y.renderConfidence` for visual consistency. |
| Q3 | **Story Mode** in all 9 Vaani languages — not just English. Already in CHITTI_TECHNICAL_MASTER_SPEC.md as a target; surface the missing-language honestly until each lands. | Per-language story-mode templates in `chitti-shares/backend/services/story_mode_*.py`. Honest *"Story Mode in Tamil — COMING SOON"* when the template is missing. |
| Q4 | Roshan composite shows **confidence interval** — not just a number — *"Roshan: 72 (range 65–78, high agreement)"*. | Composite already aggregates 43 indicators; expose `roshan_low`, `roshan_high` based on the per-indicator vote spread. Frontend renders inline. |
| Q5 | Market closed state shown **clearly** — *"Market closed. Prices from last close (15:30 IST)."* Spoken aloud for blind users on first render after-hours. | Backend already emits `market_status: 'closed'|'open'`; frontend reads + renders a banner; auto-speak via `Chitti.a11y.speak` when first shown. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | SIP calculator — how much to invest monthly to reach a goal. | P1 | Pure calculator (no LLM) — input goal amount + tenure + expected return → monthly SIP. LLM narrates. |
| S2 | FD vs Mutual Fund vs Gold comparison — plain language for new investors. | P1 | Static comparison table + LLM personalisation for user's risk profile (asked once, stored locally). |
| S3 | Budget 2025 impact on stocks — which sectors benefit / lose. | P1 | Curated `budget_2025_sector_impact.md` + LLM narrative; surfaces during the post-Budget weeks. |
| S4 | IPO tracker — upcoming IPOs with plain-language prospectus summary. | P1 | Reads from NSE / BSE IPO calendars + DeepSeek summarises the DRHP. Honest *"This is a summary, not a recommendation"* footer. |
| S5 | *"Explain this term"* — user taps any financial term, Chitti gives a plain-Hindi explanation. | **P0** | Already partially in Story Mode; extract into a reusable substrate so every chart label / metric is tap-explainable. |
| S6 | Portfolio tracker — local-only, never on server. Add stocks → total gain / loss. | P2 | `localStorage` portfolio; cross-references with the existing prices feed; honest *"This is your local copy only, never synced"* footer. |

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\|'md'\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.
