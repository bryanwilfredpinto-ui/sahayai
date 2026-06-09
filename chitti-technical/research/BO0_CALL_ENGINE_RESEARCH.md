🎖️ Chitti Technical — Call-Engine BO0 research (20 trading + 20 AI apps). 2026-06-10. NO build — skeleton only.

# BO0 — Research → Best Practices → Skeleton (don't reinvent the wheel)

## Top 20 trading / charting / India apps — what each does best
| # | App | Best-in-class at | Source |
|---|---|---|---|
| 1 | TradingView | community indicators, Pine Script, **multi-TF layout** (watch Daily while scalping 1m), usable free tier | [chartinglens](https://chartinglens.com/blog/best-stock-charting-platforms-2026) |
| 2 | TrendSpider | **AI pattern detection · auto-trendlines · S/R zones · visual backtester** | [trendspider via chartinglens](https://chartinglens.com/blog/best-tradingview-alternatives-updated-may-2026) |
| 3 | thinkorswim | 400+ studies, **OnDemand paper-replay**, options analytics | same |
| 4 | NinjaTrader | order flow / DOM, tick data | same |
| 5 | Webull | **clean dashboard**, unified portfolio | [propfirmapp](https://propfirmapp.com/trading-tools) |
| 6 | Koyfin · 7 TC2000 · 8 TradeStation · 9 StockCharts · 10 ChartingLens | charting depth, scanners | [quantvps](https://www.quantvps.com/blog/list-of-top-charting-platforms-for-trading) |
| 11 | Zerodha Kite | ₹20 flat, **reliability**, **Varsity education** | [thebeststockbroker](https://www.thebeststockbroker.com/best-trading-app-in-india/) |
| 12 | Groww · 13 Upstox | **beginner dashboards + tutorials**, zero-commission | [equentis](https://www.equentis.com/blog/top-10-best-trading-apps/) |
| 14 | Angel One | advanced charts (TradingView/ChartIQ) | same |
| 15 | Dhan | native TradingView, options chain + Greeks + OI, basket/GTT | [dhan](https://dhan.co/blog/news/top-10-best-stock-brokers-in-india/) |
| 16 | Streak (Zerodha) | **no-code strategy + 5-yr backtest** | [streak](https://www.streak.tech/) |
| 17 | StockEdge | **pre-built daily scans** (breakout, volume, delivery) | [strike](https://www.strike.money/reviews/chartink-alternatives) |
| 18 | Tickertape · 19 Chartink · 20 GoCharting/Sensibull | screeners, multi-TF layouts, options | [chartinglens](https://chartinglens.com/blog/best-stock-charting-platforms-2026) |

## Top 20 AI apps — what each does best
| # | AI app | Best-in-class at | Source |
|---|---|---|---|
| 1 | Trade Ideas (HOLLY) | real-time AI scanning (but **overwhelms beginners**) | [stockbrokers](https://www.stockbrokers.com/guides/ai-stock-trading-bots) |
| 2 | TrendSpider AI | AI trendlines + heatmaps + pattern recognition | [wallstreetzen](https://www.wallstreetzen.com/blog/best-ai-technical-analysis-tools/) |
| 3 | **Tickeron** | **"glass box" — show the AI's logic, success probability & track record BEFORE you commit** | [ambcrypto](https://ambcrypto.com/6-best-ai-stock-trading-apps-in-2026-automated-tools-for-smarter-stock-trading/) |
| 4 | Danelfin | AI score from 600 technical + 150 fundamental + 150 sentiment | [wallstreetzen](https://www.wallstreetzen.com/blog/ai-stock-analysis/) |
| 5 | Composer · 6 Magnifi · 7 Kavout · 8 Streetbeat · 9 AInvest · 10 Prospero.ai | guided/automated allocation + AI picks | [koinly](https://koinly.io/blog/ai-trading-apps/) |
| 11 | **TradeZella** | AI insight on every trade, **tick-replay**, **11-yr backtest**, auto-sync 500+ brokers (4.8/5) | [tradezella](https://www.tradezella.com/best-trading-journal) |
| 12 | TraderSync · 13 Tradervue | journal analytics (Tradervue fell behind: no AI/backtest/replay) | [tradervue](https://www.tradervue.com/blog/best-trading-journal) |
| 14 | **Edgewonk** | **Tiltmeter** — emotional state vs trades; Edge Finder weekly strengths/weaknesses | [tradeciety](https://tradeciety.com/best-online-trading-journals) |
| 15 | ChatGPT · 16 Perplexity · 17 Claude | multi-turn context, natural language explanation | — |
| 18 | **Sierra** | **personalization — history/preferences shape every interaction** | [retellai](https://www.retellai.com/blog/conversational-ai-platforms) |
| 19 | Retell AI / voice agents | low-latency **voice**, **human-fallback when confidence drops** | [lindy](https://www.lindy.ai/blog/ai-voice-agents) |
| 20 | **Robinhood + LightHouse** | **price sonification for the blind** — BUT *no technical studies for screen-reader users* | [AFB](https://afb.org/aw/18/6/15202) |

## Best practices to ADOPT (don't reinvent)
1. **Multi-TF on one screen** (TradingView) → our triple-screen picker.
2. **"Glass box"** (Tickeron): show logic + **success probability + track record** before acting → the verdict already shows why+confidence; the **journal + backtest IS the track record** — surface it next to the call.
3. **AI auto-pattern / trendline / S/R on the chart** (TrendSpider) → engine has patterns+S/R; auto-draw them.
4. **Visual backtester on the exact config** (TrendSpider/Streak/TradeZella) → our 3-yr net backtest.
5. **Tick-replay / paper-trade** (thinkorswim/TradeZella) → "replay this call" / paper mode.
6. **Journal analytics + psychology** (TradeZella/Edgewonk **Tiltmeter**) → our journal + the **loss-spiral cool-down already in the engine** = an in-the-moment Tiltmeter (better — it intervenes *before* the next trade).
7. **Journal honesty** (50–100 trades for significance; AI needs 200+) → label the scorecard's sample size.
8. **Agentic = specific-task + multi-modal + context + human fallback** (Sierra/Retell) → Chitti is a single-task agent, multi-modal, "WAIT" when confidence is low.
9. **Personalization** (Sierra) → "learns my patterns" (staged).
10. **Education baked in** (Zerodha Varsity / Groww tutorials) → P8 teaching mode ("what is this?").
11. **Clean, usable default** (Webull/TradingView free tier) → decision-first Simple view.

## Areas of improvement — what EVERY one does badly (Chitti's edge)
1. **Zero accessibility** — none serve blind/illiterate/non-English; Robinhood sonifies price but gives **no technical analysis** to the blind.
2. **Steep learning curves** (Trade Ideas overwhelms) — Chitti leads with a decision.
3. **English-only, literate-only.**
4. **False certainty** (Indian "100% accurate" signal-sellers) — Chitti bans it; risk-first.
5. **Paywalled** ($14–79/mo) — Chitti free.
6. **Tools, not a decision** — Chitti gives the call + the why.
7. **Psychology measured *after*** (Edgewonk) — Chitti's cool-down intervenes *in the moment*.

## THE SKELETON (architecture — reuse vs new; NO code yet)
```
PRIMARY (decision-first, every persona)        ADVANCED (P9, one tap)
┌─ Screen picker: trend TFs + entry frame ─┐   ┌─ Chart: candles @ any TF (reuse) ──────┐
│  Monthly·Weekly·Daily·4H·1H·15m·5m·1m     │   │  + 39-indicator picker overlay/pane     │
├─ 🤖 CHITTI VERDICT (the call) ───────────┤   │  + auto S/R + pattern marks (reuse)     │
│  BUY/SELL/WAIT · Entry · Stop · Targets   │   ├─ Screener (reuse scanUniverse) ────────┤
│  · R:R · confidence · why(✓/✗)            │   ├─ Call Journal (NEW: every call logged) ┤
│  5 channels: voice·visual·haptic·         │   │   stock·screen·dir·E/SL/T·time·conf      │
│  sonification·ISL  +  ✏️🔊🤖👍👎 box      │   │   + outcome + win/R analytics            │
├─ "what is this?" teaching (NEW, P8) ──────┤   ├─ Backtest (reuse evaluateSignal/journal)┤
└─ Listen / Glass-box: success prob + record┘   │   3-yr NET of costs · both dirs · my config│
                                                └─ Paper/replay mode (NEW) ───────────────┘
ENGINE (reuse, 354 tests): generateSignal · chittiVerdict · confluenceScore · tfBias · atrRiskBlock ·
  detectPatterns · srConfluence · scanUniverse · roshan · evaluateSignal · scorecard · calibration · backtestJournal
NEW engine work: cost-aware backtest (brokerage+STT+slippage) · long+short P&L · call-journal store ·
  pattern-learning v1 (remember TFs/stocks/accepted calls, on-device) · "glass-box" track-record surface.
ACCESSIBILITY substrate (reuse): chitti_technical_a11y.js (sonification/haptic/trendWord) · 5-element box ·
  9-lang i18n · ISL · disability-profile auto-config.
SAFETY (reuse): no-stop→no-call · banned "100% accurate" · loss-spiral cool-down · NOT-SEBI bar.
```
**Verdict:** ~80% is REUSE (engine + a11y + chart + indicators + screener + backtest exist & tested). NEW =
the **call journal**, **cost-aware long+short backtest**, **glass-box track record**, **paper/replay**,
**P8 teaching mode**, **pattern-learning v1**. That's the skeleton — exhaustive, nothing to reinvent.
