🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Chitti Technical — RESEARCH v2 (best practices BEFORE the rebuild)

Done 2026-06-08, BEFORE any build order, because the shipped UX did not match the CEOS workflow.
Sire's complaint (valid): no timeframe selector, no get-signal-per-TF, no user-picked multi-TF
confluence, no visible journal entries, no 1m/5m calls.

## What the best apps actually do

### 1. Multi-timeframe selector + confluence (TradingView MTF dashboards, MQL5 MTF panels)
- **Per-timeframe checkboxes** — user ENABLES/DISABLES each TF (1m·5m·15m·1H·4H·D·W·M). The signal
  is computed on EXACTLY the ticked TFs.
- Show **each TF's direction as an arrow** — ⬆⬆ strong-bull · ⬆ bull · ➡ neutral · ⬇ bear · ⬇⬇ strong-bear.
- Fire a directional signal **only when the selected TFs agree** (consensus); show the **alignment count**
  ("3/3 bullish") + a composite/quality score; scale position size by quality.
- Background shading / colour makes alignment obvious. A "Generate Signal" action, not auto-magic.
- Sources: [TradingView MTF](https://in.tradingview.com/scripts/multi-timeframe/) · [MTF Dashboard 9 TFs+Signals](https://www.tradingview.com/script/13etGnbq-MTF-Dashboard-9-Timeframes-Signals/) · [TradeFundrr — MTF confluence](https://tradefundrr.com/multiple-timeframe-confluence-trading/)

### 2. Signal / trade journal (TradeZella, ChartsWatcher, TradesViz)
- **Visible rows**, not a counter: date · ticker · direction · setup · entry · SL · target · exit · size ·
  **R-multiple** · outcome (PENDING/T1_HIT/SL_HIT). P&L + R auto-calculated.
- Two journals: **System Signal Journal** (auto-logs every call given) + **User Trade Journal** (what the user did), linked by signal id.
- Tags + filter → win-rate by setup/timeframe. Emotional notes catch what numbers don't.
- Sources: [TradeZella guide](https://www.tradezella.com/blog/trading-journal-complete-guide) · [ChartsWatcher templates](https://chartswatcher.com/pages/blog/6-trading-journal-example-templates-to-try-in-2025) · [TradesViz SL/target sim](https://www.tradesviz.com/blog/stop-loss-profit-target-trade-simulator/)

### 3. Accessible chart (Highcharts a11y, Deque, A11Y Collective)
- **Sonification** (Highcharts × Georgia Tech) — sound conveys trend without sight. → our audio-graph.
- **Data-table alternative** with `<caption>` + `<th scope>`; keyboard navigation; 4.5:1 contrast. → we have these.
- Real candles must render (an empty canvas fails everyone).
- Sources: [Highcharts a11y](https://www.highcharts.com/accessibility/) · [Deque — accessible charts](https://www.deque.com/blog/how-to-make-interactive-charts-accessible/) · [A11Y Collective checklist](https://www.a11y-collective.com/blog/accessible-charts/)

## Build order for the rebuilt page (research-informed)
- **R-BO1** Timeframe selector: 8 checkboxes (1m→Monthly) + 4 preset quick-picks (Long-Term/Swing/Day/Scalper auto-tick) + **Generate Signal** button.
- **R-BO2** Engine `signalForTimeframes(candlesByTf, tickedTFs, opts)` — confluence on the EXACT ticked TFs → BUY/SELL/HOLD + "X/Y bullish" + ATR SL/T1/T2 + position size. (reuses tested `confluenceScore`/`atrRiskBlock`.)
- **R-BO3** Signal card: symbol + live price + 🟢/🔴/🟡 + confidence + "X/Y timeframes bullish" + Entry/SL/T1/T2 + position size + **per-TF arrow table** (⬆/➡/⬇).
- **R-BO4** Live fetch the ticked TFs incl 1m/5m/15m (backend intraday endpoint).
- **R-BO5** **Visible** System Signal Journal + User Trade Journal rows (id·symbol·TFs·signal·entry·SL·T1·outcome·time).
- **R-BO6** Real candlestick chart renders; 39 indicators show clean numeric values.
- Each step: node + Playwright + axe + live test. Engine (39 indicators + ATR + confluence) is KEPT — it is tested 306/0 and correct; only the page UX is dismantled and rebuilt.
