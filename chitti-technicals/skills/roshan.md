🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Roshan Indicator ⭐ — Sire's signature composite

> The one indicator that is **ours**. **In the engine today** (`roshan`). "RSI" inside it stays English in all 26 languages (Art. 9). Cross-links: [rsi.md](rsi.md) · [confluence_engine.md](confluence_engine.md) · [../SKILLS.md](../SKILLS.md).

---

## What it is (plain English / vernacular target)

The Roshan Indicator watches **RSI against its own smoothed self**. It takes RSI(14), then a 20-bar average of that RSI, and compares the two:
- **RSI above its 20-average** → momentum is improving → **BUY**.
- **RSI below its 20-average** → momentum is fading → **SELL**.
- **Equal / not enough data** → **WAIT**.

The idea: a raw RSI number is noisy; comparing RSI to *its own trend* filters the noise and catches momentum turns earlier than waiting for the 30/70 extremes.

Vernacular framing: *"Roshan keh raha hai BUY — momentum apne average se upar mud gaya hai. Yeh ek input hai, advice nahin."*

## How the engine computes it (real)

`TechEngine.roshan(values)`:

```
r       = rsi(values, 14)                  // the RSI line
rsiSma  = sma( r (non-null), 20 )          // 20-average of RSI, re-aligned to full length
value   = round2(last(r))                  // current RSI
avg     = round2(last(rsiSma))             // current RSI-average
signal  = value > avg ? 'BUY'
        : value < avg ? 'SELL'
        : 'WAIT'
return { rsi, rsiSma, value, avg, signal }
```

It is exported (`TechEngine.roshan`), included in the 39-indicator `indicatorSet()`, and **surfaced explicitly** on every `scan()` result as `result.roshan` (computed on the trigger timeframe's closes). It also drives the screener's `roshan` filter.

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Roshan says BUY — RSI is above its own average. One input, not advice." |
| 🔡 Text | `Roshan: BUY · RSI 54 vs avg 49` (word + the two numbers) |
| 🔺 Icon+shape | ▲ BUY · ■ WAIT · ▼ SELL — the same shape grammar as every verdict |
| 🤟 ISL/visual | "Roshan" + "RSI" fingerspelled, concept "momentum versus its own average"; two lines (RSI + its average) drawn with distinct styles, the crossover marked |
| 👁️ Blind | RSI and its average sonified as two timbres; an earcon at the crossover (the BUY/SELL flip); spoken meaning, not raw numbers |

## Honesty rail

Roshan is a momentum read, not a profit promise. In a sideways chop it flips often — which is exactly why it is **one vote inside the multi-TF confluence**, never the sole trigger, and never presented without a stop. *NOT SEBI REGISTERED — analysis, not advice. Most short-term traders lose money (SEBI).*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
