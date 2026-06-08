🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# BO — Chart & Candlestick Pattern Recognition
## Step 1: Research (≥10 trading apps + ≥10 AI apps) — DONE BEFORE any code

Locked process (Sire): research 10 trading + 10 AI apps → CEOS for this BO only → program → test →
show working result before marking complete. **Users (blind→illiterate) + 9-language UI are
acceptance criteria.**

---
## A. 10 trading apps — how they DETECT & DISPLAY patterns

| # | App | What it does | What we take |
|---|---|---|---|
| 1 | **TrendSpider** | 147 candlestick + chart patterns auto-painted; H&S with tunable depth/deviation; MTF | **"actionable-only"**: discard stale / played-out / early / no-longer-respected patterns |
| 2 | **TradingView** | 47 candlestick patterns + 4 reversal chart patterns (Double Top/Bottom, H&S, Inverse) via **pivot structure + peak/trough equality + neckline + pullback depth + quality model**; recent 600 bars | the pivot-based detection recipe + recency window |
| 3 | **Autochartist** | 130+ patterns + candlesticks; real-time alerts WITH entry/SL/target **+ historical reliability stats per pattern** | **show reliability**, ties to our scorecard |
| 4 | **Finviz** | H&S / pattern screener across the market | scan-the-universe later |
| 5 | **Traders Cockpit** (India) | intraday + short-term pattern screener: Double Top/Bottom, H&S, Inverse, Triple Top/Bottom; marks H/L/R | NSE-first pattern set + level marks |
| 6 | **Investing.com** | candlestick pattern screener (completed + emerging) | completed vs emerging distinction |
| 7 | **ChartMill** | candlestick + chart pattern filters with a quality/score | per-pattern quality score |
| 8 | **StockCharts** | candlestick pattern scans + education | plain-language meaning per pattern |
| 9 | **Chartink** (India) | custom pattern scans on NSE | NSE scan integration |
| 10 | **TradingPatternScanner** (open-source, white07S) | algorithmic H&S, wedge, double-top via pivots | reference algorithm (deterministic, no ML) |

**Distilled:** detect **candlestick** (single/multi-bar) + **structural** (Double Top/Bottom, H&S +
inverse, triangles) via **swing pivots**; show **only the freshest actionable** pattern; give each a
**direction + reliability + plain-language meaning + the levels (neckline/peaks)**.
Sources: [TrendSpider patterns](https://help.trendspider.com/kb/automated-technical-analysis/automated-chart-pattern-recognition) · [TradingView candlestick detection](https://www.tradingview.com/support/solutions/43000584462-automatic-candlestick-pattern-detection/) · [TradingView auto chart patterns](https://www.tradingview.com/support/solutions/43000690464-auto-chart-patterns-on-tradingview/) · [Autochartist](https://wifitalents.com/best/chart-pattern-recognition-software/) · [Traders Cockpit (India)](https://www.traderscockpit.com/?pageView=intraday-pattern-screener) · [Finviz H&S](https://finviz.com/screener.ashx?v=210&s=ta_p_headandshoulders) · [TradingPatternScanner (GitHub)](https://github.com/white07S/TradingPatternScanner)

## B. 10 AI apps / research — pattern recognition & explainability

| # | Source | What it shows | What we take |
|---|---|---|---|
| 1 | **Deep Learning chart pattern recognition** (arXiv 1808.00418) | 2D-CNN on chart images | patterns are learnable, but rules are interpretable |
| 2 | **PDCG-Enhanced CNN** (MDPI/NCBI) | 86–98% accuracy, beats Fréchet/DTW | classical shape-match (DTW) as a baseline |
| 3 | **Dynamic Deep Convolutional Candlestick Learner** (arXiv 2201.08669) | CNN candlestick classifier | candlestick rules are well-defined → deterministic |
| 4 | **Vision on Edge — time-series patterns** | edge ML pattern ID | lightweight detection for rural devices |
| 5 | **1D-CNN / LSTM** approaches | sequence pattern detection | recency window matters |
| 6 | **USPTO 11620528** (time-series pattern detection) | patented pipeline | pivot/segment decomposition |
| 7 | **USPTO 11755929** (time-series pattern recognition) | template matching | template per pattern |
| 8 | **Newline — pattern recognition guide** | taxonomy of pattern recognition | structural vs statistical |
| 9 | **Market Masters AI — patterns cheat sheet** | plain-language pattern meanings | the words to speak to users |
| 10 | **Galileo / explainability practice** (prior BO) | textual/visual explanations build trust | **explain WHY** (which peaks/neckline) |

**Big AI lesson:** ML hits 80–99% but **domain-rule detection is interpretable + needs no key**, and
"tools that generate textual/visual explanations help experts trust predictions." For **blind /
illiterate users an explanation IS the product** — we must *speak why* a pattern was called. So:
deterministic pivot/OHLC rules (no LLM, no ML key) + a spoken plain-language reason.
Sources: [DL chart patterns (arXiv)](https://arxiv.org/pdf/1808.00418) · [PDCG-CNN (MDPI)](https://www.mdpi.com/2313-7673/10/5/263) · [Candlestick CNN learner (arXiv)](https://arxiv.org/pdf/2201.08669) · [Vision on Edge](https://visiononedge.com/ai-for-time-series-patterns-identification/) · [Market Masters — patterns](https://marketmasters.ai/learn/chart-patterns)

---
## Step 2: CEOS for THIS BO only — Pattern Recognition

**Objective:** detect the freshest actionable candlestick + chart pattern on the chosen timeframe,
state its direction + plain-language meaning + reliability, speak it, and feed it into the confluence
signal as supporting/contradicting evidence.

**Deterministic engine (no LLM / no ML key):**
- **Candlesticks** `detectCandles(candles)` (last bars): Doji, Hammer, Inverted Hammer, Shooting Star,
  Bullish/Bearish Engulfing, Bullish/Bearish Harami, Morning/Evening Star, Three White Soldiers /
  Three Black Crows, Piercing / Dark Cloud, Marubozu. Each → {name, dir, bars, meaning-key}.
- **Structural** `detectChartPatterns(candles)` via existing swing pivots: Double Top, Double Bottom,
  Head & Shoulders, Inverse H&S, Ascending/Descending/Symmetrical Triangle. Each → {name, dir,
  neckline/level, reliability}. Use peak/trough equality + neckline logic (TradingView recipe).
- **Actionable-only** (TrendSpider): only patterns completing within the last ~5 bars; discard stale.
- `detectPatterns(candles)` → the single strongest fresh pattern + a short list; `reliability` from a
  literature table now, and from our own **scorecard backtest** once enough samples exist (ties to the
  previous BO — calibrated, honest).
- Confluence: a pattern agreeing with the signal direction raises supporting evidence; contradicting
  lowers it. Never overrides the stop-loss rule.

**Accessibility (acceptance criteria):** pattern shown as **icon + name + direction word + meaning**
(color+icon+number, never color-only); "🔊 Hear pattern" speaks name + plain meaning in the selected
language; icon-only board shows 📈/📉/➡ + a pattern glyph; screen-reader gets a labelled region; the
pattern's levels appear in the chart data-table. 48px taps. Card carries `data-chitti-response` → the
5-element widget (🔊/🤖/👍/👎/feedback). Deaf/mute: fully visual + tap, no audio dependency.

**Languages:** pattern **proper-nouns stay English** (like RSI/MACD — i18n doctrine), but every
**direction + meaning + label** is added to all 9 languages (no Hinglish); UI re-renders on flip.

**Build steps:** (1) engine detectCandles/detectChartPatterns/detectPatterns + node tests (fixtures
with known patterns); (2) confluence hook; (3) Pattern card + chart level marks + audio/icon; (4)
i18n ×9 for meanings; (5) Playwright + axe + live cert. **Show Sire before marking complete.**

**Acceptance:** known fixtures detect the right pattern + direction; stale patterns are NOT shown;
reliability present; 9-language flip clean; axe 0 serious; screen-reader region valid; audio reads in lang.
