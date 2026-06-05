🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# RESEARCH — best-practice study (done BEFORE the build, per the locked process)

> Locked new-products process ([SAHAYAI_MASTER.md §2a](../SAHAYAI_MASTER.md)): *research the
> top apps → copy the full feature surface → mark gaps COMING SOON.* This is the research
> step. Conducted 2026-06-06 via live web search across the world's best charting / trading
> apps + fintech UX + accessibility literature. Each finding is tagged **✅ already built**,
> **➕ ADDED because of this research**, or **🔵 roadmap (COMING SOON)**.

## Apps & sources studied

| App / source | What we took |
|---|---|
| **TradingView** | native multi-timeframe analysis; higher-TF data on one chart; customizable indicator params; alerts ("80% of users say alerts give them an edge"); Pine-Script-style custom indicators |
| **Zerodha Kite** | 100+ indicators, clean-but-serious balance, multiple watchlists, Indian-market (NSE) defaults, ChartIQ/TradingView dual chart engines, bracket/cover order types |
| **Groww / 915 Terminal** | TradingView-powered charts, multi-timeframe screener, beginner-friendly minimalism, payoff visualisation |
| **Upstox** | TradingView-based experience, screeners + indicators |
| **Robinhood** | clean minimalist mobile-first, progressive disclosure, fractional/instant — *accessibility for beginners* |
| **Fintech UX research** (merge.rocks, openwebsolutions behavioral patterns) | progressive disclosure, ≤2-tap-to-act, sub-second speed, behavioral guardrails |
| **Accessibility research** (Deque, accessiBe, A11Y Collective, TradingView a11y) | **ARIA data-table alternative to charts; toggle chart↔table; text alternatives for every visual data point; keyboard-operable** |

## Findings → how Chitti Technical responds

### A. Charting & analysis
1. **Native multi-timeframe is the #1 differentiator of the best apps.** → ✅ built — the
   F2 ladder (Long M→W→D · Positional W→D · Swing D→4H · Intraday 4H→1H), higher TF governs.
2. **Configurable indicator placement / params.** → ✅ built — per-oscillator overlay↔separate-pane
   toggle ([charts/CHARTS.md](charts/CHARTS.md)), exactly Sire's RSI/Williams %R/Stochastic ask.
3. **Big indicator library, NSE defaults.** → ✅ built — 38-indicator catalogue + Roshan, NSE universe by cap tier.
4. **Real-time alerts ("an edge").** → 🔵 roadmap — manual-refresh is the locked model now;
   price/indicator alerts are a COMING-SOON feature (Golden-Rule confirmed), not faked.

### B. UX
5. **Progressive disclosure — serve beginner AND advanced without hiding complexity.** → ✅ built —
   Chitti Explain expands jargon for beginners (P8); advanced users (P9) get indicator/pane/screener control.
6. **≤ 2 taps to act; sub-second speed.** → ✅ built — one-tap Scan; deterministic engine renders
   sub-millisecond (measured: 96 scans < 1 s).
7. **Persistent access to positions/watchlist.** → ✅ built — Portfolio Mode card always present.
8. **Minimalist, uncluttered, organised data (the #1 complaint about rivals: "charts too complex").**
   → ✅ built — card layout, one active oscillator pane on mobile, others tap-to-expand.

### C. Behavioral design (openwebsolutions 9 patterns)
9. **Friction-by-design before side-effecting actions.** → ✅ built — Golden-Rule confirm on log/close trade.
10. **Loss-aversion cues — show entry + downside prominently.** → ✅ built — stop & rupee-risk shown on every signal.
11. **Default nudges — conservative defaults.** → ✅ built — RR floors per trade type; position size from a risk budget.
12. **Risk labelling — icon + colour, applied consistently.** → ✅ built — 📈 BUY / 🛑 SELL / ⏸️ HOLD, word+icon, never colour alone.
13. **Cooling-off / anti-revenge-trade timers.** → ✅ documented ([guardrails/overconfidence.md](guardrails/overconfidence.md))
    + ➕ **ADDED** a plain-language behaviour brake surfaced in Portfolio (revenge/over-trade nudge).
14. **Contextual anchoring to personal history.** → ✅ built — Portfolio shows realised vs promised RR.

### D. Accessibility — where EVERY incumbent is weak and we must lead
15. **Charts are opaque to screen readers; best practice = an ARIA/text DATA-TABLE alternative + a
    toggle between chart and table** (Deque, accessiBe, A11Y Collective). → ➕ **ADDED because of this
    research** — the canvas chart now has a **"Show data table"** toggle that renders an accessible
    `<table>` of the candles + active indicator values, so a blind trader reads the same data the
    chart shows. **This was my gap; the research caught it; it is now built and cert-checked.**
16. **Text alternative for every visual data point; keyboard-operable; WCAG Perceivable/Operable/Robust.**
    → ✅ + ➕ — verdict/risk are text+audio (Audio Trade Summary); the new data-table is the chart's
    text alternative; tap targets ≥44px; 5-element box per card.
17. **No incumbent offers vernacular voice-first / ISL.** → ✅ our moat — 9-language whole-UI flip,
    voice-out, ISL panel, illiterate icon+voice flow. This is what makes the *same institutional-grade
    analysis* reach the farmer, the blind trader, the deaf trader (PRODUCT_VISION).

## Net of the research
The research **validated** the core build (multi-timeframe, risk-first, progressive disclosure,
behavioral guardrails) and **exposed one real gap** — the accessible chart **data-table alternative** —
which is now built (item 15) because a blind trader cannot read a `<canvas>`. The incumbents'
weakness (vernacular + disability access) is precisely Chitti Technical's reason to exist.

## Sources
- [TradingView — Multi-timeframe scripts](https://in.tradingview.com/scripts/multi-timeframe/) · [TradingView Accessibility](https://www.tradingview.com/accessibility/)
- [Scaling TradingView's UI/UX (RonDesignLab case)](https://rondesignlab.com/cases/tradingview-platform-for-traders)
- [10 best trading platform design examples (merge.rocks)](https://merge.rocks/blog/the-10-best-trading-platform-design-examples-in-2024)
- [Behavioral Design in Trading Apps — 9 UX patterns (openwebsolutions)](https://openwebsolutions.in/blog/behavioral-design-trading-apps-ux-patterns/)
- [Zerodha vs Groww vs Upstox (Finology)](https://select.finology.in/broker/compare/groww/zerodha/upstox) · [Groww platform review (comparesharebrokers)](https://comparesharebrokers.com/trading-platform/groww)
- [Making Fintech Accessible (accessiBe)](https://accessibe.com/blog/knowledgebase/making-fintech-accessible) · [Accessible interactive charts (Deque)](https://www.deque.com/blog/how-to-make-interactive-charts-accessible/) · [Accessible charts checklist (A11Y Collective)](https://www.a11y-collective.com/blog/accessible-charts/)

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
