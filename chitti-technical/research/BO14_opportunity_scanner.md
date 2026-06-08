🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# BO14 — Opportunity Scanner ("Today's Best Setups")
## Step 1: Research — Top 20 apps + Top 20 AI apps (BEFORE coding), with best practices

Locked process (Sire): per BO research **Top 20 apps + Top 20 AI apps** → document with best practices →
code → test → show. **Users (blind/deaf/illiterate) + 9-language UI = acceptance criteria** — the
scanner must be **spoken**, icon-first, decluttered, colour+icon+number (never colour-only), with the
5-element widget (🔊/🤖/👍/👎/✏️-or-🎤) and the Vaani language dropdown.

**What BO14 does:** scan a whole cap tier / Nifty 50 with the existing deterministic multi-TF signal,
**rank the strongest BUY/SELL setups by confidence**, and surface only the **top few** (decluttered),
each with entry/SL/target — spoken for non-readers. Turns "analyse one stock" into "find the setups."

---
## A. 20 stock-scanner / screener apps — best practice we take

| # | App | Best practice |
|---|---|---|
| 1 | **Trade Ideas (Holly)** | nightly backtest → **rank highest-probability**, surface **top-5** (top-5 averaged 58.7% intraday win rate) |
| 2 | **TrendSpider** | automated multi-TF scan; rank by setup quality; no manual input |
| 3 | **Finviz** | free, many filters; fast tabular results |
| 4 | **Benzinga Pro** | real-time streaming + alerts |
| 5 | **Stock Rover** | best-overall screening depth |
| 6 | **TradingView** | screener + alerts + saved scans |
| 7 | **TC2000** | raw scan **speed** |
| 8 | **Thinkorswim** | custom scan scripts |
| 9 | **Magnifi** | natural-language scan queries |
| 10 | **Seeking Alpha (Quant)** | factor grades surfaced per pick |
| 11 | **Chartink** (India) | **prebuilt real-time scans** — intraday bullish/bearish, breakout, crossover; live alerts/min |
| 12 | **Tickertape** (India) | 60+ filters + **prebuilt screens** |
| 13 | **Screener.in** (India) | shareable saved screens |
| 14 | **Streak (Zerodha)** (India) | no-code scan + **per-minute alerts** |
| 15 | **Sensibull** (India) | options-aware scans |
| 16 | **SignalSky** | dedicated **signal scanner** (India+US), buy/sell labels |
| 17 | **Strike.money** (India) | visual scan results |
| 18 | **Stoxra** (India) | AI-assisted NSE scanning |
| 19 | **NSE-Stock-Scanner** (open-source) | swing/intraday scan + risk management (reference algo) |
| 20 | **MarketSmith India** | rated lists (RS-style) |

**Distilled:** **rank by probability/confidence** · surface **only the top few** (decluttered — Apple-News
discipline) · **prebuilt directional scans** (bullish/bearish/breakout) · **per-row confidence + entry/SL/
target** · real-time, fast.
Sources: [Benzinga — best scanners](https://www.benzinga.com/money/best-stock-scanners) · [Liberated Stock Trader — screeners](https://www.liberatedstocktrader.com/best-stock-screeners/) · [Chartink screener](https://chartink.com/screener) · [Tickertape screener](https://www.tickertape.in/screener) · [India day-trading screeners](https://www.techjockey.com/blog/technical-stock-screeners)

## B. 20 AI scanner / picker apps — best practice (and anti-pattern) we take

| # | App | Best practice we take |
|---|---|---|
| 1 | **Trade Ideas Holly** | rules-based AI, **ranked top picks + published win rate** |
| 2 | **Tickeron** | scans 9,000/min; **success probability + certainty rating per signal**; historical accuracy per pattern |
| 3 | **Danelfin** | **AI Score 1-10 with a factor breakdown** (which factors drive it) → explainability |
| 4 | **Kavout** | Kai Score 1-9 from 200+ factors; backtested outperformance |
| 5 | **Zen Ratings** | single rating + component grades |
| 6 | **Prospero.ai** | probability-of-up per stock |
| 7 | **TrendSpider AI** | 220 patterns auto-detected, ranked |
| 8 | **TradeAlgo** | AI alerts with rationale |
| 9 | **VisionVix predictors** | confidence-banded predictions |
| 10 | **Magnifi (AI)** | conversational scan |
| 11 | **Composer** | rule/AI strategy → ranked universe |
| 12 | **Numerai signals** | crowd-model ranking discipline (no look-ahead) |
| 13 | **Sana / enterprise ML** | calibrated scores |
| 14 | **Stoxra (India AI)** | NSE AI scan |
| 15 | **Tickertape AI** | smart screens |
| 16 | **Perplexity/ChatGPT scans** | *anti-pattern:* hallucinated tickers → we stay deterministic |
| 17 | **Holly "Best of the Best"** | *anti-pattern:* **120+ daily picks = noise** → we surface only the TOP few, decluttered |
| 18 | **Danelfin factor breakdown** | **show WHY** (our per-TF confluence + pattern) |
| 19 | **Tickeron certainty** | tie the confidence to our **calibration/scorecard** (honest, not hype) |
| 20 | **Vaani / Chitti substrate** | **spoken, 9-language, 5-element widget** — no competitor does this for blind/illiterate users |

**Big AI lesson:** the winners **rank + publish confidence with a factor breakdown** (Danelfin, Tickeron,
Holly) — but the laggards **flood you with picks**. So we **rank by our confluence confidence, surface
only the top few, show WHY (per-TF + pattern), and speak it** — tying confidence to our honest
calibration, not hype. Deterministic (no LLM, no key); accessibility is the moat.
Sources: [WallStreetZen — best AI screeners](https://www.wallstreetzen.com/blog/best-ai-stock-screener/) · [Trade Ideas Holly (TrendSpider compare)](https://trendspider.com/learning-center/trade-ideas-alternative/) · [Danelfin/Kavout (HowStuffWorks)](https://money.howstuffworks.com/kavout-best-ai-stock-pickers.htm) · [AI stock pickers 2026](https://www.prospero.ai/resources-blog/the-10-best-ai-stock-pickers-in-2026-tools-that-actually-beat-the-market)

---
## Step 2: CEOS for THIS BO only — Opportunity Scanner

**Objective:** scan a cap tier / Nifty 50 with the deterministic multi-TF signal, rank BUY & SELL setups
by confidence, surface only the **top few** with entry/SL/target + the confluence reason, fully spoken.

**Engine (no LLM):**
- `scanUniverse(symbolToCandlesByTf, opts)` → for each symbol run `generateSignal(candlesByTf, {tfs})`;
  keep directional (BUY/SELL); rank by **confidence desc** (tie: confluence %); return
  `{ buys:[...], sells:[...], scanned, asOf }`, each row {sym, signal, confidence, confluence, entry,
  sl, t1}. opts: tfs (ticked), top (default 5 each).

**Accessibility (acceptance):** card carries `data-chitti-response` → 5-element widget; each setup row is
**icon + symbol + confidence% + entry/SL/target** (colour **+icon+number**, never colour-only); **"🔊 Read
setups"** speaks the top BUYs and SELLs in the selected language; tap a row → loads full analysis; 48px
taps; **decluttered** (top few only — no 120-pick noise).

**Languages:** all UI labels in **9 languages** (no Hinglish); stock names + "Nifty 50" stay English;
re-render on flip.

**Build steps:** (1) engine `scanUniverse` + node tests; (2) Opportunity Scanner card with tier selector +
"Scan now" + ranked BUY/SELL lists + "🔊 Read setups" + tap-to-open; (3) i18n ×9; (4) Playwright + axe +
live cert. **Show Sire before marking complete; then ask: is this the best I've ever made?**

**Acceptance:** ranks by confidence; only directional shown; top-N cap; rows carry entry/SL/target;
9-language flip clean; axe 0 serious; box wired with the widget; audio reads in language.
