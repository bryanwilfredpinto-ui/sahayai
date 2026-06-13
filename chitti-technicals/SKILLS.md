🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SKILLS — index, the 39-indicator catalogue, and the feature surface

> Level 2. The map of every capability in Chitti Technicals and the **real** function in [`../chitti_technical_engine.js`](../chitti_technical_engine.js) (`window.TechEngine`) behind it. We document the engine that exists; we never invent math.

---

## 1. Skill files (cross-linked)

| Skill | What it documents | Engine fn |
|---|---|---|
| [skills/FEATURES.md](skills/FEATURES.md) | Live capability surface (parsed by `chitti_features.js`) | — |
| [skills/rsi.md](skills/rsi.md) | RSI(14) momentum + accessibility mapping | `rsi()` |
| [skills/stochastic.md](skills/stochastic.md) | Stochastic %K/%D | `stochastic()` |
| [skills/williams_r.md](skills/williams_r.md) | Williams %R | `williamsR()` |
| [skills/bollinger.md](skills/bollinger.md) | Bollinger Bands(20,2) | `bollinger()` |
| [skills/camarilla_pivots.md](skills/camarilla_pivots.md) | Camarilla gravity grid (BO6 addition, now in engine) | `camarillaPivots()` |
| [skills/classic_pivots.md](skills/classic_pivots.md) | Classic floor pivots PP/R1-3/S1-3 (BO6 addition, now in engine) | `classicPivots()` |
| [skills/sr_confluence.md](skills/sr_confluence.md) | Multi-TF support/resistance zones (BO6 addition, now in engine) | `srConfluence()` |
| [skills/roshan.md](skills/roshan.md) | The Roshan composite — Sire's signature | `roshan()` |
| [skills/confluence_engine.md](skills/confluence_engine.md) | Multi-TF ladders + 5-state verdict + vote tally + MMI mood | `confluence()` · `scan()` |
| [skills/risk_engine.md](skills/risk_engine.md) | ATR+structure stop, NO stop → NO signal, RR floor, sizing | `riskBlock()` |
| [skills/tip_shield.md](skills/tip_shield.md) | Anti-scam tip checker | Tip Shield patterns + `hasBannedPhrase()` |

## 2. The 39-indicator catalogue (`INDICATOR_NAMES`)

The engine's `indicatorSet(candles)` returns a `{ value, signal, note }` for each — `signal ∈ BUY / SELL / WAIT`. This is the real, exported list (`TechEngine.INDICATOR_NAMES`, 39 entries):

**Momentum / oscillators (12):** RSI · Stochastic · Stochastic RSI · Williams %R · CCI · ROC · Momentum · TRIX · Ultimate Oscillator · Awesome Oscillator · Laguerre RSI · Balance of Power
**Trend (13):** MACD · ADX · Aroon · Parabolic SAR · Supertrend · Ichimoku · Vortex · Hull MA · Heikin Ashi Trend · Elder Ray · Elder Impulse · EMA 50 · EMA 200
**Volatility / channels (7):** Bollinger Bands · ATR · Keltner Channels · Donchian Channels · TTM Squeeze · Chandelier Exit · Chande Kroll Stop
**Volume (6):** OBV · Force Index · Accumulation/Distribution · Chaikin Money Flow · MFI · VWAP
**Composite (1):** **Roshan Indicator** ⭐

> The CEOS "7 verdict indicators" = **RSI · Williams %R · Stochastic · Bollinger** (in the engine from day one) + **Camarilla pivots · Classic pivots · S/R-confluence** (the BO6 additions — now also in the engine via `camarillaPivots` / `classicPivots` / `srConfluence`). The other 35 indicators feed the per-TF vote inside `tfVerdict()`.

## 3. Analysis surface (exported)

- `trendOf(candles)` → `{ dir: up/down/sideways, strength }` (EMA20/50/200 + ADX gate)
- `tfVerdict(candles)` → per-TF `{ trend, verdict: BUY/SELL/HOLD, lean, indicators }`
- `confluence(candlesByTf, tradeType)` → higher-TF-governs verdict + confidence + score + contributing/contradicting
- `scan(candlesByTf, {tradeType})` → the full verdict block (the page's primary call)
- `riskBlock(candles, side, rrFloor, riskBudget)` → entry/stop/targets/size (NO stop → invalid)
- `explain(signal)` → deterministic, disclaimer-bearing narration template (the floor when DeepSeek is off)
- `hasBannedPhrase(text)` / `BANNED` → guardrail against "guaranteed / risk-free / 100% accurate"
- CEOS layer: `generateSignal` · `chittiVerdict` · `detectCrisis` · `crisisResponse` · `detectLossSpiral` · `aiInsights`

## 4. Feature surface (grouped)

LIVE (deterministic, offline): read any symbol · 4-channel verdict · multi-TF confluence · Roshan · ATR risk block · Tip Shield · 39-indicator catalogue · dual paper journal · pivots + S/R zones · 26-lang re-render.
PLANNED: DeepSeek vernacular narration · live Angel One candles · Vaani routing (all BO12, Sire-blocked).
COMING SOON: ISL camera input · community-donated voices.

(See [skills/FEATURES.md](skills/FEATURES.md) — the machine-parsed source of truth for `chitti_features.js`.)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
