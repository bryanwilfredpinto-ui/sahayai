🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# BO-NEXT — Signal Outcome Tracking & Accuracy Scorecard
## Step 1: Research (≥10 trading apps + ≥10 AI apps) — DONE BEFORE any code

Per Sire's locked process (2026-06-08): research 10 trading + 10 AI apps → write CEOS for this BO
only → program → test → show working result before marking complete. Users + languages are
acceptance criteria, not extras.

---
## A. 10 trading apps — how they track signal/trade OUTCOMES & ACCURACY

| # | App | What it does for outcome/accuracy | What we take |
|---|---|---|---|
| 1 | **TradeZella** | 50+ reports: win rate, profit factor, expectancy, equity curve, calendar P&L, backtest, trade replay | core KPI set + equity curve |
| 2 | **TradesViz** | 600+ stats incl. win rate, expectancy, drawdown, **MFE/MAE**, 40+ chart types, generous free tier | MFE/MAE (how far for/against before exit) |
| 3 | **Tradervue** | auto-import 80+ brokers, win rate, P&L, shared journals | per-trade outcome log |
| 4 | **Edgewonk** | Edge Finder + **mistake tracking**, R-multiple, expectancy | R-multiple as the unit of result |
| 5 | **TradingView Strategy Tester** | 3 tabs: Overview (equity + drawdown), Performance Summary (profit factor, Sharpe, % profitable), **List of Trades** (entry/exit/P&L) | the 3-pane shape: summary + list |
| 6 | **TrendSpider Strategy Tester** | total return, Sharpe/Sortino, win rate, avg win/loss, R:R, max DD, trade log, **Go/No-Go flags** on weak metrics | **Go/No-Go flag on low sample / high DD** |
| 7 | **FX Replay** | backtest interpretation — win rate, expectancy, drawdown education | "win rate 40-60% is normal" guardrail |
| 8 | **Chartink** (India) | scanner + backtest on NSE; pass/fail per scan | NSE-first outcome eval |
| 9 | **Streak by Zerodha** (India) | no-code strategy backtest + win-rate/return per strategy | per-strategy (here per-mode) breakdown |
| 10 | **MarketSmith India** | rated setups + follow-through stats | confidence→outcome rating |

**Distilled metrics (consensus):** Win rate · Profit Factor · Expectancy (avg R) · R-multiple ·
Max Drawdown · Avg win/avg loss · Equity curve · per-trade outcome (entry/exit/result). Win rate
40-60% normal; DD < 20% healthy. Flag low trade count.
Sources: [ForTraders — best journals](https://www.fortraders.com/blog/best-trade-journals-analytics-tools) · [TradesViz](https://www.tradesviz.com/) · [TradingView Strategy Tester](https://www.tv-hub.org/guide/tradingview-backtesting) · [TrendSpider metrics](https://trendspider.com/learning-center/basic-backtesting-metrics/) · [TradeZella backtesting](https://www.tradezella.com/blog/best-backtesting-software) · [FX Replay — interpret backtests](https://fxreplay.com/learn/how-to-interpret-backtest-results-a-traders-guide-to-smarter-strategy-decisions)

## B. 10 AI apps — how they track ACCURACY, CONFIDENCE & CALIBRATION

| # | App / source | What it does | What we take |
|---|---|---|---|
| 1 | **Weights & Biases** | experiment tracking, accuracy/precision dashboards over runs | accuracy-over-time view |
| 2 | **Arize AI** | ML observability — performance + **drift** monitoring | score-distribution drift = degradation signal |
| 3 | **Fiddler AI** | model performance + **calibration** monitoring | calibration as a first-class metric |
| 4 | **Evidently AI** | data/model drift + performance reports | report-per-window |
| 5 | **WhyLabs** | model monitoring, score-distribution drift | watch confidence drift before accuracy drops |
| 6 | **Galileo AI** | model validation best practices (right metrics, no false confidence) | "wrong metrics → false confidence" |
| 7 | **LlamaIndex confidence scoring** | confidence-scored answers | bucket by confidence |
| 8 | **Azure Document Intelligence** | shows accuracy **and** confidence per field | show confidence alongside outcome |
| 9 | **Extend.ai** | confidence scoring systems, thresholds | threshold-gated display |
| 10 | **ProductSchool eval-metrics** | trust metrics for AI products | trust = honest accuracy, shown |

**The big AI lesson — CALIBRATION:** a 90%-confidence call should be right ~90% of the time. Measure
with **reliability buckets / Expected Calibration Error (ECE)**. Watch score-distribution drift as an
early warning. Never manufacture false confidence. This is the differentiator vs. trading apps:
**we will show whether our own confidence is honest.**
Sources: [ProductSchool — AI eval metrics](https://productschool.com/blog/artificial-intelligence/evaluation-metrics) · [Galileo — model validation](https://galileo.ai/blog/best-practices-for-ai-model-validation-in-machine-learning) · [LlamaIndex — confidence scoring](https://www.llamaindex.ai/glossary/confidence-scoring-models) · [Azure — accuracy & confidence](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept/accuracy-confidence) · [Extend.ai — confidence systems](https://www.extend.ai/resources/best-confidence-scoring-systems-document-processing)

---
## Step 2: CEOS for THIS BO only — Signal Outcome Tracking & Accuracy Scorecard

**Objective:** close the System Signal Journal loop — every logged call gets a measured outcome, and
an honest accuracy + calibration scorecard is shown. No call stays PENDING forever unverified.

**Deterministic engine (no LLM):**
- `evaluateSignal(signal, futureCandles)` → walk forward from the signal bar; for a BUY: T1_HIT if a
  high ≥ T1 before a low ≤ SL; SL_HIT if low ≤ SL first; T2_HIT if it reaches T2; else PENDING.
  Mirror for SELL. Returns {outcome, barsToOutcome, rMultiple, mfe, mae}.
- `scorecard(evaluatedSignals)` → win rate, profit factor, expectancy (avg R), avg win/loss, max
  drawdown (of cumulative R), equity curve points, sample count + **Go/No-Go flag** (No-Go if < 10
  resolved). Sliced by **timeframe-combo** and by **mode**.
- `calibration(evaluatedSignals)` → bucket by confidence (60-70/70-80/80-90/90-100); per bucket show
  predicted vs **actual** win rate + ECE. Honest-limitations made measurable.

**Accessibility (four-user contract — acceptance criteria):**
- Visual: color **+ icon + number** (✅ T1/T2, 🛑 SL, ⏳ pending) — never color-only; 48px taps.
- Audio: a "🔊 Read scorecard" button speaks win rate + calibration verdict in the selected language.
- Icon-only mode: per-signal ✅/❌/⏳ board, no text dependency.
- Screen reader: scorecard as a `<table>` with `<caption>` + `<th scope>`; equity curve has a data-table alt.
- Deaf/mute: fully visual + tap; no audio dependency for any action.

**Languages:** every new label added to `chitti_technical_i18n.js` for all 9 full languages (no
Hinglish); whole-UI re-renders on language flip; numbers/percentages are locale-formatted; outcome
codes shown as icons + translated words.

**Build steps (one BO):** (1) engine `evaluateSignal`/`scorecard`/`calibration` + node tests;
(2) backend/live: pull forward candles to resolve outcomes (cache); (3) UI scorecard card +
calibration table + per-signal outcome on each journal row + audio/icon; (4) i18n strings ×9;
(5) Playwright + axe + live cert. **Show Sire the working result before marking complete.**

**Acceptance:** outcomes resolve correctly on fixtures; scorecard math matches hand-calc; calibration
buckets present; 9-language flip clean; axe 0 serious; screen-reader table valid; audio reads in lang.
