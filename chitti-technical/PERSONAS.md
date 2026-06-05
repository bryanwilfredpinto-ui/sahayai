🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# PERSONAS — Chitti Technical

Nine personas. The first four define the **trade-type timeframe ladders** (the
core of the multi-timeframe engine, [PRD.md](PRD.md) F2). The last five define
the **accessibility + skill floor** every persona inherits.

The design call always goes to the persona named "Primary" for the feature. All
others benefit, but they do not get to break the primary's experience.

---

## P1 — Long-Term Investor

| Field | Value |
|---|---|
| Goal | Build conviction in a stock to hold for months/years. |
| Timeframe ladder | **Monthly → Weekly → enter on Daily** |
| What they ask | *"Is RELIANCE in a long-term uptrend? Where do I accumulate?"* |
| What Chitti gives | Monthly trend (regime) → Weekly structure (pullback or breakout) → Daily entry zone + stop loss below the higher-timeframe invalidation. |
| Risk style | Wide stop, position sized small, RR ≥ 1:3. |

## P2 — Positional Trader

| Field | Value |
|---|---|
| Goal | Hold a few weeks, ride a leg of the trend. |
| Timeframe ladder | **Weekly → enter on Daily** |
| What they ask | *"Is this a fresh positional buy or already extended?"* |
| What Chitti gives | Weekly trend + momentum → Daily entry/stop/target, with "already extended" warning when daily is far from the mean. |

## P3 — Swing Trader

| Field | Value |
|---|---|
| Goal | Hold a few days, catch a swing. |
| Timeframe ladder | **Daily → confirm on 4-Hourly** |
| What they ask | *"Swing entry on HDFCBANK?"* |
| What Chitti gives | Daily structure → 4H trigger, tighter stop, RR ≥ 1:2, invalidation explicit. |

## P4 — Intraday Trader

| Field | Value |
|---|---|
| Goal | Enter and exit the same session. |
| Timeframe ladder | **4-Hourly → enter on Hourly** |
| What they ask | *"Intraday view on NIFTY future?"* |
| What Chitti gives | 4H bias → 1H trigger, very tight stop, hard "no trade if bias and trigger disagree" rule, session-end exit reminder. |

> **The ladder rule (Founder Rule #4):** the higher timeframe sets the
> *direction*; the lower timeframe only sets the *trigger*. If they disagree,
> Chitti says **WAIT / HOLD**, never forces a BUY or SELL.

---

## P5 — Blind Trader

| Field | Value |
|---|---|
| Challenge | Cannot see the chart or the numbers. |
| Primary mode | **Voice-first.** Every box reads aloud; an "Audio Trade Summary" speaks Trend → Entry → Stop → Target → Confidence in order. |
| Hard rule | No signal is conveyed by colour alone. The chart is narrated ("price is above the 50-EMA, momentum rising"). |

## P6 — Deaf Trader

| Field | Value |
|---|---|
| Challenge | Cannot hear audio output. |
| Primary mode | **Visual-first.** Large numbers, symbol + word labels (📈 BUY / 🛑 STOP / 🎯 TARGET / ⚠️ RISK), ISL panel on every response. |
| Hard rule | Nothing is audio-only; every spoken line has a visible caption. |

## P7 — Illiterate Trader

| Field | Value |
|---|---|
| Challenge | Cannot read or write. |
| Primary mode | **Icons + Voice.** Picture menus, voice-everything, voice confirmation ("say HAAN to set this alert"). |
| Hard rule | The full BUY/SELL/STOP/TARGET flow is usable with zero reading, in the user's language, on 2G. |

## P8 — Beginner

| Field | Value |
|---|---|
| Challenge | Does not know what RSI, MACD or a stop loss are. |
| Primary mode | **Teaching mode.** Chitti Explain expands every term once, links "what is this?" on every indicator, and refuses to show a signal without its risk. |
| Hard rule | Never assume knowledge. Every jargon term has a one-tap plain-language explainer. |

## P9 — Advanced Trader

| Field | Value |
|---|---|
| Challenge | Wants control, not training wheels. |
| Primary mode | **Customization.** Pick indicators, set RSI/Williams %R/Stochastic to overlay or separate pane, choose favourite indicators (incl. Roshan), tune screener filters. |
| Hard rule | Customization never removes the risk block or the disclaimer — those are non-negotiable for every persona. |

---

## Persona → feature priority matrix

| Feature | Primary persona | Must also serve |
|---|---|---|
| Multi-timeframe engine (F2) | P1–P4 | all |
| Entry / Stop / Target engines (F3–F5) | P2, P3, P4 | all |
| Chitti Explain (F6) | P8 | P5, P7 |
| Roshan Indicator (F7) | P9 | all (as a plain-language signal) |
| Screener (F8) | P9, P2 | P1 |
| Audio Trade Summary | P5 | P7 |
| Configurable chart panes | P9 | P6 (visual) |

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
