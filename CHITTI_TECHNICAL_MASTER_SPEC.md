# CHITTI TECHNICAL — Master Specification

**Version:** 1.1  
**Date:** 2026-05-08 (last refresh)  
**Maintainer:** Bryan Wilfred Pinto  
**Sister docs:** `CHITTI_FUNDAMENTALS_MASTER_SPEC.md`, `CHITTI_MEDUPI_MASTER_SPEC.md`

> Read this first every session. Update before closing. This is the contract.

---

## 1. Purpose

Chitti Technical is the technical-analysis sister product to Chitti Fundamentals. It serves Indian retail traders / investors via:

- **File:** [chitti_complete_technical.html](chitti_complete_technical.html) — single-file, vanilla JS, inlined LightweightCharts v4.1.3
- **Live URL:** `https://sahayai.in/chitti_complete_technical.html`
- **Backend:** [chitti-shares/backend/](chitti-shares/backend/) (FastAPI on Render) at `chitti-shares-api.onrender.com`

---

## 2. The Four-User Contract (non-negotiable)

Same as Fundamentals — every feature must serve all four:

| User | Cannot | Solved by |
|---|---|---|
| **Blind** | See | aria-labels everywhere + 🔊 button on every chip / verdict / row + verdict-first speech order |
| **Deaf** | Hear | ▲▼ ✅⚠️⛔ symbols + word labels (`up`/`down`/`flat`); colour never the only signal |
| **Mute** | Speak | All inputs are tap-or-dropdown; voice INPUT optional, never required |
| **Illiterate** | Read | 🎤 voice INPUT mic on every text input; plain-English caption on every metric; Hindi audio for verdicts |

---

## 3. Architecture

```
chitti_complete_technical.html      ← single-file frontend served from GitHub Pages root
chitti-shares/backend/
├── main.py                          ← FastAPI app
├── routes/technical.py              ← /api/technical/{symbol}, /api/calls/...
├── services/
│   ├── technical.py                 ← indicator engine (Roshan + 43 others)
│   ├── intraday_candles.py          ← side-door for 15min/5min/1min via Angel One
│   ├── scanner.py                   ← runs scans across universes
│   ├── levels.py                    ← auto S/R + trendlines
│   ├── indicators.py                ← shared indicator math
│   ├── angel_client.py              ← Angel SmartAPI client (LOCKED data source)
│   └── universes.py                 ← NIFTY 50 / Largecap / Midcap / Smallcap / Microcap
```

### Data sources (locked)

| What | Source | Status |
|---|---|---|
| Live prices, OHLC candles, indices | Angel SmartAPI | ✅ LIVE — works from Render |
| 15min / 5min / 1min intraday candles | Angel via `services/intraday_candles.py` (side-door) | ✅ LIVE |
| Auto S/R levels, trendlines | `services/levels.py` (computed from candles) | ✅ LIVE |
| News (per stock + market) | Moneycontrol + LiveMint + BSE + NSE RSS via `services/news_client.py` | ✅ LIVE |
| AI synthesis (Chitti's View) | DeepSeek (server-side, cached) | ✅ LIVE |
| **NOT USED:** Yahoo Finance | Blocked from Render IPs | 🚫 |
| **NOT USED:** Kite Connect | Paid (₹2,000/mo); Bryan has no Zerodha account | 🚫 |

---

## 4. Tab structure (current)

```
[🔍 Scanner] [📈 Chart] [📓 Journal] [📊 Analytics] [🎓 Learn] [📊 Calls]
```

Plus header (a11y bar): 🎬 Demo Mode · 🔊 Read page · 🎙️ How to use · ⚠️ Disclaimer  
Plus sticky SEBI disclaimer banner + full legal modal at the very top.

---

## 5. Reference apps surveyed

| App | Strength borrowed |
|---|---|
| **TradingView** | Multi-pane chart layout · indicator library · scripting (Pine) · Replay · drawing tools · alerts · ideas feed |
| **Zerodha Kite** | Marketwatch · GTT order shape (we don't trade, but pattern noted) · clean charts |
| **Angel One** | Smart Tags · scanner UX · mobile-first chart |
| **Groww** | Simplified UX · clean candles · timeframe pill bar |
| **Robinhood** | Swipe-to-timeframe · simplified mobile |
| **Investing.com** | Composite ratings · technical summary one-liner |
| **ChartIQ** | Pro-grade overlays |
| **Chartink** | Real-time scan signature, strategy builder |
| **StockEdge** | India-specific scans, custom universe filters |
| **Trendlyne** | Technical scoring chip |

---

## 6. WHAT'S BUILT (LIVE on `sahayai.in`)

### 6.1 Chart tab ✅
- Candlestick chart via inlined LightweightCharts v4.1.3
- **8 timeframes**: Monthly / Weekly / Daily / 4H / 1H / 15min / 5min / 1min
- **Auto support/resistance** drawn as horizontal lines (cascading from higher TFs)
- **Auto trendlines** drawn from swing highs/lows
- **Volume pane** below price
- **RSI pane** with 30/70 reference lines
- **MACD pane** with histogram
- **30+ indicator overlays** selectable from dropdown (RSI, MACD, BB, Supertrend, Force Index, OBV, VWAP, ADX, EMA, Heikin Ashi Trend, TTM Squeeze, Awesome Oscillator, Vortex, Chandelier Exit, Hull MA, Laguerre RSI, Balance of Power, Chande Kroll Stop, etc.)
- **Stock search** with autocomplete dropdown (~150 NIFTY 500 stocks)
- **Chitti's View** paragraph: BUY / SHORT / WAIT verdict in plain English
- **Speak buttons** on verdict + ratio block + index comments
- **Key levels row** (52W H/L, prev day H/L) toggleable
- **Compatibility containers** for old JS code (#buy-list, #sell-list)

### 6.2 Scanner tab ✅
- **Roshan Indicator** (Bryan's signature: RSI > SMA on 2 TFs + green candles + RED pullback)
- **43 indicators** including 9 newer ones (TTM Squeeze, Awesome, Vortex, Chandelier, Hull MA, Laguerre RSI, Heikin Ashi Trend, Balance of Power, Chande Kroll Stop)
- **5 universes**: NIFTY 50 (50) / Largecap (107) / Midcap (110) / Smallcap (105) / Microcap (52)
- **Call types**: Long-term / Positional / Swing / Intraday / Custom (with TF1, TF2, pullback)
- **BUY + SHORT counts** + per-stock list
- **Speak BUY** / **Speak SHORT** buttons (read all matches aloud)
- Open any result → loads chart for that stock
- Cache with force-refresh option

### 6.3 Journal tab ✅
- **Add Trade form** (always visible, `<details open>`)
  - Basic: Date, Day, Stock, Direction, Setup Type, TF Alignment, Entry, Exit, SL, Target, Lots, Result
  - Psychology: Emotion at Entry, Emotion at Exit, Held to Target, Exit Reason
  - Quality: Trade Quality, Rules Followed?, Chart Pattern, Indicator Used, Confidence (1-10), Market Bias, Market Condition, Notes
- **🎤 Voice mic** on Stock/Symbol field (illiterate user: speak the symbol)
- **Trade log table** with all entries
- **Summary bar**: Total P&L · Win Rate · Trades count
- **Excel import** button (existing)

### 6.4 Analytics tab ✅
- Per-stock analytics derived from journal
- **Psychology Breakdown** — emotion impact on outcomes
- Win rate, P&L, R:R metrics
- 🔊 **Hear Insights** button — full audio summary
- Stat grid (extensible)

### 6.5 Learn tab ✅
- **Chart Types** sub-tab (line, candle, Heikin Ashi, etc.)
- **Candlestick Patterns** sub-tab
- **Indicators** sub-tab — 43 indicators with plain-English captions ("RSI: speed of price; below 30 may rise…")
- **💬 Ask Chitti Technical** chat at the bottom — live Anthropic `claude-sonnet-4-20250514` with multi-turn history, per-user API key in localStorage, 🎤 voice mic on the input, 🔊 on every reply

### 6.6 Calls tab ✅
- BUY / SHORT call tracker
- Per-call performance (wins / losses / win rate)
- 🔊 Speak Calls button

### 6.7 Page-level ✅
- **SEBI sticky banner** + full legal modal (NOT SEBI REGISTERED · 2013 IA / 2014 RA non-registration · past-performance / data-source / user-responsibility clauses)
- **🎬 Demo Mode** button — guided 8-step walkthrough auto-loading NSE:RELIANCE, narrating Chart → S/R → Trendlines → RSI → Roshan → Scanner → Journal → Learn. Speech-end-driven progression (no cut-off).
- **🎤 Voice INPUT** on chat input + journal stock field
- **🔊 Voice OUTPUT** on every chip / verdict / row
- **▲▼ ✅⚠️⛔** symbols + word labels everywhere
- Mobile responsive
- aria-labels everywhere; role attributes on tabs / dialogs / lists
- LightweightCharts v4.1.3 inlined (not CDN)
- All JS wrapped in `if(!window._chittiLoaded){ ... }`
- Colours: only `rgba()` and `#RRGGBB` (no 8-digit hex)

---

## 7. WHAT'S PENDING (Coming Soon — skeleton TBD next session)

### 7.1 Chart tab — pending
- ⏳ **Manual drawing tools** — draw trendlines + horizontal lines + Fibonacci retracement + channels by hand (TradingView signature)
- ⏳ **Replay mode** — scrub backwards through history (TradingView signature)
- ⏳ **Save chart layout** — colours, indicators, drawings persist per stock
- ⏳ **Multi-chart compare** — overlay another stock or sector index on the same chart
- ⏳ **Volume Profile** + **VWAP overlay**
- ⏳ **More chart types**: Heikin Ashi, Renko, Kagi, Point & Figure
- ⏳ **Pivot points** (Standard, Camarilla, Fibonacci, DM)
- ⏳ **Multi-pane custom layouts** (TradingView-style)
- ⏳ **Crosshair OHLCV readout** (improve existing)

### 7.2 Scanner tab — pending
- ⏳ **Custom rule builder** — Pine-Script-lite ("RSI < 30 AND volume > 2× avg")
- ⏳ **Saved custom scans** — name + reuse
- ⏳ **Real-time scanner alerts** — ping when a stock newly matches
- ⏳ **Backtest** — for any indicator, show historical P&L if you'd traded it
- ⏳ **Sector heatmap view** — visual sector performance grid
- ⏳ **Pre-market scanner** (if Angel exposes pre-open data)

### 7.3 Journal tab — pending
- ⏳ Photo upload of chart screenshot per trade
- ⏳ Audio note per trade (voice memo recording)
- ⏳ Tags / labels per trade for grouping
- ⏳ CSV export beyond current
- ⏳ Trade replay link (jump back to chart at the trade timestamp)

### 7.4 Analytics tab — pending
- ⏳ **Trade quality vs P&L scatter plot**
- ⏳ **Time-of-day heatmap** (when do you trade best?)
- ⏳ **Day-of-week analysis**
- ⏳ **Setup-wise performance** (Triangle Break vs S&R Bounce vs Gap Fill)
- ⏳ **Emotion-wise outcome** (does Greed hurt? does Fear miss winners?)
- ⏳ **Drawdown curve**
- ⏳ **Sharpe / Sortino / Calmar ratios** across journal P&L

### 7.5 Learn tab — pending
- ⏳ **Pattern recognition quizzes** — interactive
- ⏳ **Strategy backtest library** — "Roshan ran on NIFTY for 5Y did this"
- ⏳ **Hindi explanations** for every indicator (audio + text)

### 7.6 Calls tab — pending
- ⏳ **Public calls feed** — community sharing (later, after auth ships)
- ⏳ **Call subscription** — follow other users
- ⏳ **Performance leaderboard**

### 7.7 Page-level — pending
- ⏳ **⭐ Watchlist** with live prices (star any stock; live ticker block)
- ⏳ **🔔 Price alerts** — browser push when threshold crosses (Service Worker + Notification API)
- ⏳ **Login + multi-device sync** (journal + watchlist persist across phones)
- ⏳ **Multi-language UI** (full Hindi/Tamil/Bengali UI, not just audio)
- ⏳ **Side-by-side compare** — chart two stocks together

---

## 8. ✨ Chitti Special — features no other technical app has (Coming Soon)

The Chitti edge — these go in the Chart tab footer + Scanner result row + Calls tab:

- **🎤 Story Mode (per signal)** — 60-second audio briefing of *why* this Roshan / RSI / MACD signal is firing, what historically happens after, what to watch for. No other app narrates the *story* of a signal.
- **📊 Confidence Dial on every BUY/SHORT verdict** — Chitti shows how confident it is (1–10) with reasons for any uncertainty (e.g. "8/10 — Daily and Weekly aligned, but volume below 20-day average"). TradingView shows signal; nobody shows confidence.
- **🎯 Risk-Fit Dial** — overlay each signal with the user's chosen persona (Conservative / Moderate / Aggressive). A Roshan BUY on a midcap is fine for Aggressive, flagged for Conservative.
- **🌐 Multi-Indian-language audio** — Hindi / Tamil / Bengali / Telugu / Marathi / Gujarati / Kannada audio for every verdict, not just English.
- **👨‍👩‍👧 Family Share** — WhatsApp-share the chart + verdict with the SEBI disclaimer pre-attached. One tap.
- **🔔 Audio alerts** — when a price alert fires, Chitti speaks aloud ("Reliance crossed your alert at one thousand five hundred"), not just buzzes silently.
- **⚖️ Plain-English signal compare** — "Reliance shows Roshan BUY on Daily, ITC shows Roshan WAIT on Daily, but ITC's Weekly is stronger." Compare two stocks' signals in plain words.
- **❄️ Technical Snowflake** — Simply-Wall-St-style 5-axis radar for technicals: Trend / Momentum / Volume / Volatility / Setup-Quality. One picture per stock.
- **🎙️ Voice-driven scanner** — *"Chitti, find me oversold midcaps"* via voice INPUT triggers the scan. Hands-free.

---

## 9. Reference-app coverage matrix

| App | Their signature | Status in Chitti |
|---|---|---|
| TradingView | Pine Script | ⏳ Custom rule builder pending |
| TradingView | Replay mode | ⏳ Pending |
| TradingView | Multi-chart layout | ⏳ Pending |
| TradingView | Drawing tools | ⏳ Pending |
| TradingView | Stock heatmap | ⏳ Pending (Scanner sector grid) |
| TradingView | Alerts engine | ⏳ Pending |
| TradingView | Ideas feed | 🚫 Out of scope (no social) |
| Zerodha Kite | GTT orders | 🚫 Out of scope (not a broker) |
| Zerodha Kite | Marketwatch | ⏳ Watchlist pending |
| Angel One | Smart Tags / signals | ✅ Roshan + 43 indicators |
| Angel One | Mobile-first chart | ✅ |
| Groww | Clean candle UX | ✅ |
| Robinhood | Swipe timeframe | ⏳ Add gesture support |
| Investing.com | Technical summary one-liner | ✅ Chitti's View |
| Investing.com | Composite rating | ⏳ Confidence Dial — Chitti Special |
| ChartIQ | Pro overlays | ✅ 43 indicators |
| Chartink | Strategy builder | ⏳ Custom rule builder pending |
| Chartink | Real-time scan | ✅ Roshan scanner |
| StockEdge | India-specific scans | ✅ NIFTY 50–Microcap universes |
| Trendlyne | Technical score | ⏳ Confidence Dial pending |

---

## 10. Build rules (non-negotiable — copy into next-session prompt)

1. **LightweightCharts v4.1.3 INLINED** in the HTML — never use CDN.
2. **All JS wrapped in `if(!window._chittiLoaded){ window._chittiLoaded = true; ... }`** — don't remove this guard.
3. **`node --check` must pass** with zero errors before any commit. Extract the second `<script>` block (skip the inlined LightweightCharts) and run `node --check` on it.
4. **Colours: `rgba()` and `#RRGGBB` only.** Never 8-digit hex (LightweightCharts silently fails on those).
5. **Chart timeframe lookbacks (in candle days):** Monthly=730 · Weekly=365 · Daily=120 · 4H=60 · 1H=30 · 15min=10 · 5min=5 · 1min=2. Never fetch 120 days for intraday.
6. **Roshan rule:** RSI(14) > SMA(20) on TF1 **AND** TF2 + both TF candles green + pullback TF candle RED. Use `df.iloc[-2]` for the last *closed* candle, NEVER `iloc[-1]` (in-progress).
7. **`chitti_complete_technical.html` line discipline:** every element inside its `id="tab-*"` div. No orphan HTML.
8. **`autoscaleInfoProvider`** is NOT a constructor option in `addLineSeries()` — pass it in `applyOptions` after creation.
9. **Speak buttons:** always call a named function. Never inline text in `onclick` (apostrophes break the attribute).
10. **Reference-line timestamps:** use actual candle timestamps (`lastCandles[0].time`, `lastCandles[-1].time`). NEVER hardcoded Unix timestamps.
11. **Cascading S/R:** when drawing higher-TF lines on a lower-TF chart, span the lower-TF candle range — not the higher-TF candle timestamps.
12. **Don't use `clientHeight`** for chart sizing on hidden tabs — returns 0. Use explicit heights: 420 px laptop / 340 px tablet / 240 px mobile.
13. **GitHub may be ahead of local** — Bryan deploys via Colab. `git fetch && git log HEAD..origin/main` before any push. If divergent, backup local branch → reset → cherry-pick.

---

## 10b. Phase 7 (P1) — Agentic foundations shipped 2026-05-08

The first agentic surface for Chitti Technical is now LIVE on Render. Source-of-truth files: `services/strength.py`, `services/agent_runtime.py`, `services/agent_tools.py` (all NEW, not on the certified list).

| Endpoint | Purpose | Verified |
|---|---|---|
| `GET /api/strength/{symbol}?timeframe=` | Composite 0-10 + confluence count | ✅ live |
| `GET /api/rating-table/{symbol}` | STRONG BUY..STRONG SELL across 5 TFs | ✅ live |
| `GET /api/quotes?symbols=` | Batch watchlist quotes via Angel | ✅ live |
| `POST /api/agent/technical/ask` | True tool-calling loop (DeepSeek) | ✅ wired (blocked by 402 — top-up needed) |

Frontend wired in `chitti_complete_technical.html`: Signal Strength + Confluence card grid, multi-TF rating table, ⭐ My Watchlist (localStorage + 15s polling). Open `openChart(sym)` triggers `loadStrengthAndRating(sym)`.

Tools registered with the Technical agent: `get_quote`, `get_signal_strength`, `get_rating_table`, `get_indicator_signals`, `get_levels`, `scan_universe`. System-prompt rules: technical-only persona, Roshan rule baked in, iloc[-2] reminder, SEBI disclaimer auto-appended, Hindi-on-Hindi-input.

Scanner fix shipped same week: full-universe scan (cap removed) + `iloc[-2]` correction across `_candle_color` and `_roshan_signal` + 6-thread `ThreadPoolExecutor` for fan-out. Largecap Intraday now scans 107/107 in ~100s and produces real BUY/SHORT setups instead of the prior 0/0 from the silent 60-cap.

---

## 11. Next-session priority order

1. **Top up DeepSeek balance** so all three /api/agent/{product}/ask endpoints actually answer (currently HTTP 402)
2. **Manual drawing tools** (trendlines + horizontal lines) — biggest visible gap vs TradingView
3. **Custom rule builder** (basic) — Pine-Script-lite for power users
4. **Story Mode for individual signals** — Chitti edge, distinguishes from TradingView
5. **Confidence Dial on every BUY/SHORT verdict** — Chitti edge
6. **Replay mode** — TradingView signature
7. **Sector heatmap** — visual scan
8. **Multi-Indian-language audio** for verdicts and alerts (Hindi/Tamil/Bengali/Telugu/Marathi/Gujarati/Kannada)
9. **Twilio voice/SMS** — phone-call alerts for critical setups

---

## 12. Closing checklist (every session)

- [ ] `node --check` passes for the main JS block of `chitti_complete_technical.html`
- [ ] `git fetch origin` + verify `git rev-list --count main...origin/main` is `0 0` (or use cherry-pick recovery)
- [ ] Test the live URL: `curl -sS https://chitti-shares-api.onrender.com/api/technical/NSE:RELIANCE` returns 200 with non-empty body
- [ ] Open `https://sahayai.in/chitti_complete_technical.html` in Chrome on desktop, click Demo Mode, walk through 8 steps without cut-off
- [ ] Three-user lens audit: aria-label on every new control, 🔊 button on every signal, ▲▼/word labels on every change, plain-English caption on every metric
- [ ] SEBI banner still visible at the top
- [ ] Update **section 6** (built) and **section 7** (pending) in this doc — move items between them as they ship
- [ ] Push to `main` — both GitHub Pages (frontend) and Render (backend) auto-deploy

---

*Living document. Update before every session close.*
