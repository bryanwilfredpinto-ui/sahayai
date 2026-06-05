🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# INDICATORS — the Chitti Technical indicator catalogue

> **Source of truth + dismantle note.** Per Sire's 2026-06-06 instruction, the
> legacy "Chitti Technical" UI is dismantled and **the indicator engine in the
> Scanner section is kept and carried forward as-is.** These indicators already
> exist, implemented in pure numpy/pandas (no paid libraries) in
> [`chitti-shares/backend/services/technical.py`](../../chitti-shares/backend/services/technical.py)
> and [`indicators.py`](../../chitti-shares/backend/services/indicators.py). Chitti
> Technical productises that engine — it does not re-implement it.

Indicator names render in **English** in every language (RSI, MACD, EMA, …) per
[CTO.md §6](../../chitti-cto/CTO.md). Only the *explanation* around them is translated.

## Catalogue (38 indicators, all live in the engine)

### Momentum / Oscillators
| Indicator | Default | Signal rule (as implemented) |
|---|---|---|
| **RSI** | 14 | <30 oversold / >70 overbought |
| **Stochastic** | 14,3 | %K vs %D cross; <20 / >80 zones |
| **Stochastic RSI** | — | RSI-of-RSI, faster oversold/overbought |
| **Williams %R** | 14 | <-80 oversold / >-20 overbought |
| **CCI** | 20 | <-100 BUY / >100 SELL |
| **ROC** | 12 | >0 BUY / <0 SELL |
| **Momentum** | — | sign of price change |
| **TRIX** | — | triple-smoothed EMA momentum |
| **Ultimate Oscillator** | — | multi-period momentum blend |
| **Awesome Oscillator** | 5/34 | midpoint SMA(5)−SMA(34), zero-cross |
| **Laguerre RSI** | — | low-lag RSI variant |
| **Balance of Power** | — | buyers vs sellers per bar |

### Trend
| Indicator | Default | Signal rule |
|---|---|---|
| **MACD** | 12,26,9 | line vs signal cross + histogram |
| **ADX (+DI/−DI)** | 14 | >25 strong trend; +DI>−DI = BUY |
| **Aroon** | — | up/down trend strength |
| **Parabolic SAR** | 0.02/0.2 | price above SAR = BUY |
| **Supertrend** | 10,3 | +1 BUY / −1 SELL |
| **Ichimoku** | 9/26/52 | price above cloud = BUY |
| **Vortex** | 14 | VI+ > VI− = bullish |
| **Hull MA** | 20 | low-lag trend MA |
| **Heikin Ashi Trend** | — | smoothed candle trend |
| **EMA / SMA stack** | 9/20/50/100/200 | price vs MA, MA ordering |

### Volatility / Bands / Stops
| Indicator | Default | Signal rule |
|---|---|---|
| **Bollinger Bands** | 20,2 | band touch / squeeze |
| **ATR** | 14 | volatility unit → ATR-based stops |
| **Keltner Channels** | 20,2 | breakout vs mean-revert |
| **Donchian Channels** | 20 | N-period high/low breakout |
| **TTM Squeeze** | 20 | BB inside Keltner = squeeze → release |
| **Chandelier Exit** | 22,3 | ATR trailing stop |
| **Chande Kroll Stop** | — | volatility trailing stop |

### Volume / Money flow
| Indicator | Default | Signal rule |
|---|---|---|
| **OBV** | — | on-balance volume trend |
| **Force Index** | 13 | price × volume, smoothed |
| **Accumulation/Distribution** | — | buying vs selling pressure |
| **Chaikin Money Flow** | — | volume-weighted flow |
| **MFI** | 14 | volume-weighted RSI |
| **VWAP** | session | fair-value mean |
| **Volume Spike** | vs avg | participation confirmation |

### Elder system
| Indicator | Default | Signal rule |
|---|---|---|
| **Elder Ray** | 13 | bull power / bear power vs EMA13 |
| **Elder Impulse** | — | EMA13 + MACD-hist colour state |

### Custom
| Indicator | Default | Signal rule |
|---|---|---|
| **Roshan Indicator** ⭐ | RSI14 / SMA20 | Sire's custom composite — see [ROSHAN.md](ROSHAN.md) |

## How indicators feed the signal

1. **Per indicator** the engine emits `{value, signal ∈ BUY/SELL/WAIT, note}`.
2. Indicators in **warmup** (insufficient candles) emit `value: null` and
   **abstain** from the vote — they are never counted as 0 or as a false signal.
3. The **Confluence Engine** ([../scanners/SCANNER.md](../scanners/SCANNER.md))
   weights and tallies the BUY/SELL/WAIT votes per timeframe.
4. **Chitti Explain** ([../README.md](../README.md)) turns the winning tally and
   its `note`s into one plain-language paragraph.

## Configurability (Persona P9 — Advanced)

- Any indicator can be toggled on/off in the scan and shown on the chart.
- Each oscillator can be rendered **overlaid on the candles** or **in its own
  pane** — see [../charts/CHARTS.md](../charts/CHARTS.md).
- Favourite indicators (incl. Roshan by default) persist in [../memory/](../memory/).

## Honesty rules

- A NaN/warmup value is **never** rendered as a signal.
- Defaults shown above are the engine defaults; if a user changes a period, the
  explanation states the period used.
- No indicator value is ever invented by the LLM — hallucination gate in
  [../guardrails/](../guardrails/) + [../evals/hallucination_eval.md](../evals/hallucination_eval.md).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
