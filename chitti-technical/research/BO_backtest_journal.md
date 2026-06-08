🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# BO — Backtest Journal with User-Selected Timeframe
## Step 1: Research (≥10 trading apps + ≥10 AI apps) — DONE BEFORE any code

Locked process (Sire): research 10 trading + 10 AI apps → CEOS for this BO only → program → test →
show working result before marking complete. **Users (blind→illiterate) + 9-language UI = acceptance
criteria. Stock names + proper nouns stay English.**

The ask: a journal of HISTORICAL signal performance for ANY stock, ANY ticked timeframe, **₹1 lakh
deployed per stock**, showing date · entry · target · SL · P&L; a **batch Nifty-50 runner** that
aggregates P&L across ₹50 lakh; aggregate win rate / profit factor / total return.

---
## A. 10 trading apps — backtest journals, batch runs, fixed-capital P&L

| # | App | What it does | What we take |
|---|---|---|---|
| 1 | **TradeZella** | select strategy → P&L, win rate, **profit factor**, avg win/loss, trade count; 11+ yr data | "**PF > 1.3 over 50+ trades = net profitable**" guardrail |
| 2 | **TrendSpider** | no-code Strategy Tester, dropdown conditions, up to 50 yr | per-TF rule set; equity + trade log |
| 3 | **TradesViz** | PnL + win-rate charts, automated insights | plain-language summary of results |
| 4 | **TradingView Strategy Tester** | equity curve · performance summary · **List of Trades** (date/entry/exit/P&L) · XLSX export | the per-trade journal table shape |
| 5 | **AmiBroker** | **portfolio strategies across 50+ symbols**, walk-forward, Monte Carlo | **batch across many symbols** (Nifty 50 runner) |
| 6 | **QuantConnect** | event-driven, **Time Frontier eliminates look-ahead bias**, multi-asset portfolio equity | no-lookahead (we already walk data-up-to-bar) |
| 7 | **Backtrader** | multi-asset, multi-timeframe, slippage/broker modeling | per-TF backtest + realistic frictions (note slippage) |
| 8 | **Zerodha Streak** (India) | no-code backtest+deploy, **performance report for several stocks in one click** | **one-click batch** for NSE |
| 9 | **Chartink** (India) | backtest scans on NSE | NSE-first |
| 10 | **QuantShare** | walk-forward optimisation, probabilistic modelling | walk-forward validation |

**Distilled:** per-trade journal rows (date · side · entry · target · SL · exit · **P&L ₹**) + aggregate
(win rate, **profit factor**, total return, max drawdown, equity curve); **batch many symbols** with a
total-deployed base; **no look-ahead bias**; PF>1.3 over 50+ trades is the bar.
Sources: [TradeZella — analyze performance](https://www.tradezella.com/blog/analyze-trading-performance) · [TradeZella — best backtesting](https://www.tradezella.com/blog/best-backtesting-software) · [QuantConnect backtesting](https://www.quantconnect.com/docs/v2/cloud-platform/backtesting) · [AmiBroker/Backtrader/Streak comparison](https://chartswatcher.com/pages/blog/top-backtesting-software-comparison-for-2025) · [Streak (Zerodha)](https://zerodha.com/z-connect/kite/introducing-the-new-streak-scanner-now-free-for-all-our-users-and-technicals-dashboard) · [India backtesting tools](https://www.techjockey.com/blog/best-backtesting-software)

## B. 10 AI apps — no-code / explainable backtest & portfolio simulation

| # | App | What it shows | What we take |
|---|---|---|---|
| 1 | **Composer** | no-code AI backtest, **natural-language** strategy, Sharpe/max-DD/annualised/Calmar | explain results plainly (our audio summary) |
| 2 | **QuantConnect (AI)** | multi-asset portfolio equity in backtest + live | portfolio-level aggregate |
| 3 | **Trade Ideas — Holly AI** | daily ideas with entries/exits + simulation | entry/exit per trade |
| 4 | **Tickeron** | AI backtest + pattern stats | pattern→outcome stats |
| 5 | **Kavout** | ML ranking + backtest | ranked batch |
| 6 | **Numerai** | tournament backtests, no-lookahead discipline | strict validation |
| 7 | **LuxAlgo** | AI backtesting assistant | per-rule reporting |
| 8 | **Capitalise.ai** | plain-English automation + backtest | language-first UX |
| 9 | **Trality** | Python/rule bots, backtest metrics | metrics set |
| 10 | **Danelfin** | AI scores + historical hit-rate | reliability/hit-rate display |

**Big AI lesson:** the winning UX is **no-code + plain-language explanation** of results (Composer,
Capitalise.ai). For blind/illiterate users that means an **audio summary** ("On Monthly TCS, 18 trades,
win rate 61%, profit factor 1.7, total return +14% on ₹1 lakh") and a **screen-reader table**, not a
chart dump. Keep **no look-ahead bias** (QuantConnect/Numerai discipline) — we already enforce it.
Sources: [Composer](https://www.composer.trade/) · [Composer review (metrics)](https://tooliverse.ai/tools/composer) · [QuantConnect](https://www.quantconnect.com/) · [AI quant tools 2026](https://ambcrypto.com/6-best-quant-trading-platforms-in-2026-boost-your-returns-with-ai-trading-bots/) · [AI tools for strategy dev](https://www.luxalgo.com/blog/best-ai-tools-trading-strategy-development/)

---
## Step 2: CEOS for THIS BO only — Backtest Journal

**Objective:** simulate Chitti's signal historically on the **user-ticked timeframe** for one stock or
the whole **Nifty 50**, with **₹1,00,000 deployed per trade**, and show a screen-reader journal +
aggregate metrics + audio summary.

**Capital model (explicit, so it is unambiguous):**
- **₹1,00,000 deployed per trade** (sequential redeploy). `shares = floor(100000 / entry)`.
- BUY P&L₹ = shares × (exit − entry); SELL P&L₹ = shares × (entry − exit). Exit = target/SL/last close.
- Per stock: total P&L = Σ rows; **return % = ΣP&L / 100000 × 100**.
- **Batch Nifty 50:** total P&L = Σ across stocks; **deployed = ₹1 lakh × N stocks** (₹50 lakh for 50);
  aggregate return % = totalP&L / (N × 100000) × 100.

**Deterministic engine (no LLM):**
- `backtestJournal(candles, opts)` → walk the chosen TF, data-up-to-each-bar (NO look-ahead); at each
  signal (tfVerdict + ATR SL/T1) record a row {date, side, entry, target, sl, exit, outcome, shares,
  pnl₹, rMultiple, barsHeld}. opts: capital (₹1L), lookahead, range (lastN / fromDays).
- `aggregateBacktest(rows)` → trades, win rate, profit factor, total P&L₹, deployed₹, return %, max
  drawdown ₹, avg P&L/trade.
- `batchBacktest(symbolToCandles, opts)` → per-stock summary + aggregate (Nifty 50). One-click.
- Timeframe: backtest the **fastest ticked TF** (the trigger); single-TF when one is ticked (Example 1:
  Monthly→monthly rows). Higher ticked TFs noted as filters (full multi-TF-confluence backtest = v2).

**Accessibility (acceptance criteria):**
- Journal as a `<table>` with `<caption>` + `<th scope>`; outcome as **icon + colour + number** (✅ T1 /
  🛑 SL + ₹P&L, green/red, never colour-only); 48px taps.
- "🔊 Hear results" speaks the aggregate in the selected language.
- Icon-only mode: per-trade ✅/🛑 board.
- Deaf/mute: fully visual + tap. Card carries `data-chitti-response` → 5-element widget.

**Languages:** all UI labels (Backtest, Run, Date, Entry, Target, Stop, Profit/Loss, Win rate, Profit
factor, Total return, Deployed, Run Nifty 50, range options) added to **all 9 languages** (no Hinglish);
**stock names + proper nouns stay English**; re-render on flip.

**Build steps:** (1) engine backtestJournal/aggregateBacktest/batchBacktest + node tests (fixtures with
known P&L); (2) Backtest Journal card + range + "Run" + "Run Nifty 50" + table + aggregate + audio/icon;
(3) i18n ×9; (4) Playwright + axe + live cert. **Show Sire before marking complete.**

**Acceptance:** P&L math matches hand-calc on a fixture; ₹1 lakh per trade; Nifty-50 batch aggregates
on ₹50 lakh; no look-ahead; 9-language flip clean; axe 0 serious; screen-reader table valid; audio in lang.
