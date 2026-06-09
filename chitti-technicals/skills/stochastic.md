🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Stochastic — %K / %D oscillator (momentum)

> One of the 7 CEOS verdict indicators. **In the engine today.** "Stochastic" stays English in all 26 languages (Art. 9). Cross-links: [rsi.md](rsi.md) · [williams_r.md](williams_r.md) · [confluence_engine.md](confluence_engine.md).

---

## What it is (plain English / vernacular target)

The Stochastic asks: *where did today's close sit inside the high-low range of the last 14 bars?* If the close is near the top of the range, momentum is strong; near the bottom, weak. Output is 0–100.
- **Below 20** → near the bottom of its range (possible **BUY** lean).
- **Above 80** → near the top (possible **SELL** lean).
- **20–80** → no extreme — **WAIT**.

Vernacular framing: *"Stochastic 18 — yeh apni range ke neeche hai."*

## How the engine computes it (real)

`TechEngine.stochastic(candles, k=14, d=3)`:
- **%K** = (close − lowest-low(14)) / (highest-high(14) − lowest-low(14)) × 100.
- **%D** = 3-period SMA of %K (the smoother signal line).
Returns `{ k: [...], d: [...] }`. `indicatorSet()` reads the last `%K`:

```
%K < 20  → BUY    %K > 80 → SELL    else → WAIT
note: "Stochastic %K: <20 / >80"
```

One ±1 vote into `tfVerdict()` → `confluence()`.

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Stochastic is 18 — near the bottom of its range. One input, not a buy." |
| 🔡 Text | `Stoch %K 18 · BUY-lean` (word, not colour) |
| 🔺 Icon+shape | ▲ / ■ / ▼ for BUY-lean / WAIT / SELL-lean |
| 🤟 ISL/visual | "Stochastic" fingerspelled + concept "where the close sits in the range"; needle gauge, not a colour fill |
| 👁️ Blind | %K sonified as pitch; earcon on the 20 / 80 cross only |

## Honesty rail

Stochastic whipsaws in choppy markets and can stay pinned at an extreme during a trend. Chitti reads it **alongside** the trend and never as a standalone trigger. *NOT SEBI REGISTERED — analysis, not advice.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
