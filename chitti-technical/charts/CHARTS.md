🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# CHARTS — candlesticks + configurable indicator panes

Sire's requirement (2026-06-06):
> *"Give me a chart option where I want RSI separately or in the same window where
> candlestick populate, similarly for Williams %R, Stochastic, etc."*

So the chart's defining feature is **per-indicator pane placement**: every
oscillator can be shown **overlaid on the candles (same window)** or **in its own
stacked pane (separate window)** — the user's choice, per indicator, remembered.

## Reference-app research (top charting apps in the world)

Per the locked new-products process ([SAHAYAI_MASTER.md §2a](../../SAHAYAI_MASTER.md)) —
research the best, copy the proven UX, never reinvent:

| App | What we copy | What we leave |
|---|---|---|
| **TradingView** | Stacked indicator panes, overlay-vs-pane toggle, drag-to-reorder panes, crosshair readout, multi-timeframe tabs | Social/paywall, infinite indicator sprawl |
| **Zerodha Kite** | Clean Indian-market defaults (NSE symbols, 9:15–15:30 session), fast mobile candles | — |
| **Investing.com** | Indicator picker grouped by type, plain tooltips | Ads, clutter |
| **ChartIQ / Upstox** | Touch-first pinch-zoom, responsive pane collapse on mobile | — |
| **Groww** | Beginner-friendly minimalism, big tap targets | Over-simplified (no pane control) |

**Chitti's differentiator:** the same chart is **fully accessible** — narratable
for blind users, captioned for deaf users, in the user's language — which no
mainstream charting app does.

## Pane model

```
┌─────────────────────────────────────────────┐
│  CANDLES (main window)                        │
│  + OVERLAY indicators:                        │
│    EMA/SMA stack, Bollinger, Supertrend,      │
│    Ichimoku, VWAP, PSAR, Donchian, Keltner,   │
│    Roshan overlay (optional)                  │
├─────────────────────────────────────────────┤
│  PANE 2 (separate window) — e.g. RSI          │
├─────────────────────────────────────────────┤
│  PANE 3 (separate window) — e.g. Williams %R  │
├─────────────────────────────────────────────┤
│  PANE 4 (separate window) — e.g. Stochastic   │
└─────────────────────────────────────────────┘
```

### Per-indicator placement rule

| Indicator class | Default placement | Can move to |
|---|---|---|
| Trend/price overlays (EMA, BB, Supertrend, Ichimoku, VWAP, PSAR, Donchian, Keltner, HMA) | **Overlay** (same window) | own pane (rare) |
| Oscillators (RSI, Williams %R, Stochastic, Stoch RSI, CCI, ROC, MFI, MACD, Awesome, TRIX, Ultimate) | **Separate pane** | **overlay on candles** (Sire's explicit ask) |
| Volume (Volume bars, OBV, Force Index, CMF, A/D) | volume pane | own pane |
| **Roshan** ⭐ | own pane (RSI + its SMA20) | overlay |

Each indicator chip has a **⤢ overlay / ⊟ separate pane** toggle. Placement
persists per user in [../memory/](../memory/).

## Chart controls

- **Timeframe tabs:** Monthly · Weekly · Daily · 4-Hourly · Hourly (match the
  multi-timeframe ladder, F2). Switching is one tap.
- **Indicator picker:** grouped by class (Trend / Momentum / Volatility / Volume /
  Custom), each with a one-line "what is this?" (Chitti Explain) for beginners.
- **Crosshair readout:** OHLC + each active indicator's value at the hovered/
  tapped bar — and that readout is **spoken** on demand for blind users.
- **Manual refresh** control + "data as of" stamp. No auto-tick.
- **Markings:** entry zone, stop, and targets from the Scanner are drawn on the
  chart as labelled lines (📈 entry / 🛑 stop / 🎯 target) — word + icon, never
  colour alone.

## Responsiveness (desktop · laptop · tablet · mobile)

Per [../ui/UI.md](../ui/UI.md), the chart adapts, it does not just shrink:

| Viewport | Chart behaviour |
|---|---|
| **Desktop / laptop (≥1280px)** | Full multi-pane stack visible; side indicator picker. |
| **Tablet (768px)** | 2–3 panes visible; extra panes collapse to a swipeable strip. |
| **Mobile (375px)** | Candles + **one** active oscillator pane; others become tap-to-expand cards; pinch-zoom; big tap targets (≥48×48px). |

The candle window never collapses below readability; on mobile, panes stack
vertically and are individually collapsible.

## Accessibility — the chart for the 4 users

- **Blind:** "Describe this chart" speaks structure + active indicators
  ("price above 50-EMA, RSI 58 rising, Roshan leaning buy"). The chart is **never
  the only carrier of a signal** — the Scanner verdict is always available as text+audio.
- **Deaf:** every readout captioned; crosshair values shown large.
- **Illiterate:** indicator chips are icons; values spoken; "what is this?" by voice.
- **Colour:** every drawn line has a word label; bull/bear states pair colour with
  ▲/▼ and a word.

## Implementation note

Charting library candidate: a lightweight, free, offline-capable canvas charter
(e.g. lightweight-charts-class library) to keep 2G/low-end-device performance and
avoid paywalled SDKs — final pick recorded in [../ARCHITECTURE.md](../ARCHITECTURE.md)
at build time. Candle + indicator data come from the same deterministic engine as
the Scanner, so the chart and the verdict can never disagree.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
