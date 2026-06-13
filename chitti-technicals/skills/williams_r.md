🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Williams %R — overbought / oversold (momentum)

> One of the 7 CEOS verdict indicators. **In the engine today.** "Williams %R" stays English in all 26 languages (Art. 9). Cross-links: [stochastic.md](stochastic.md) · [rsi.md](rsi.md) · [confluence_engine.md](confluence_engine.md).

---

## What it is (plain English / vernacular target)

Williams %R is the Stochastic's mirror image. It runs from **0 to −100** and asks: *how far below the recent high is today's close?*
- **Below −80** → close is near the recent low (possible **BUY** lean).
- **Above −20** → close is near the recent high (possible **SELL** lean).
- **−80 to −20** → no extreme — **WAIT**.

Because the scale is negative, Chitti never relies on it visually alone — it always speaks the *meaning* ("near the low"), not the raw number, for non-technical users.

## How the engine computes it (real)

`TechEngine.williamsR(candles, period=14)`:
- %R = (highest-high(14) − close) / (highest-high(14) − lowest-low(14)) × −100.
`indicatorSet()` reads the last value:

```
%R < -80  → BUY    %R > -20 → SELL    else → WAIT
note: "Williams %R: <-80 / >-20"
```

One ±1 vote into `tfVerdict()` → `confluence()`.

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Williams %R is −85 — close is near its recent low. One input, not a buy." |
| 🔡 Text | `Williams %R −85 · BUY-lean` (state word, never colour) |
| 🔺 Icon+shape | ▲ / ■ / ▼ for BUY-lean / WAIT / SELL-lean |
| 🤟 ISL/visual | "Williams %R" fingerspelled + concept "distance below the recent high"; needle gauge on a −100…0 track |
| 👁️ Blind | sonified as pitch on an inverted scale; earcon on the −80 / −20 cross only; spoken meaning, not the negative number |

## Honesty rail

%R is fast and noisy — it flips to an extreme often. It earns its place only as **confirmation** inside the confluence vote, never as a lone trigger. *NOT SEBI REGISTERED — analysis, not advice.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
