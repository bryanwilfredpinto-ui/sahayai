🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Bollinger Bands — volatility envelope

> One of the 7 CEOS verdict indicators. **In the engine today.** "Bollinger Bands" stays English in all 26 languages (Art. 9). Cross-links: [confluence_engine.md](confluence_engine.md) · [risk_engine.md](risk_engine.md) · [../SKILLS.md](../SKILLS.md).

---

## What it is (plain English / vernacular target)

Bollinger Bands draw a **moving lane** around price: a 20-bar average in the middle, and two edges set 2 standard deviations away. The lane **widens when the stock is volatile** and **narrows when it is calm**.
- Price **at/below the lower band** → stretched down (possible **BUY** lean).
- Price **at/above the upper band** → stretched up (possible **SELL** lean).
- Price **inside the lane** → **WAIT**.

Vernacular framing: *"Price neeche wali line ko chhoo raha hai — bahut khinch gaya hai."*

## How the engine computes it (real)

`TechEngine.bollinger(values, period=20, mult=2)`:
- **mid** = SMA(close, 20).
- **upper / lower** = mid ± 2 × standard-deviation(close, 20).
Returns `{ mid, upper, lower }`. `indicatorSet()` reads the last bands vs price:

```
price <= lower  → BUY    price >= upper → SELL    else → WAIT
note: "BB(20,2) band touch"
```

The band **width** also informs the risk engine's volatility read and the `TTM Squeeze` (Bollinger-inside-Keltner) state.

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Price is touching the lower band — stretched down. One input, not a buy." |
| 🔡 Text | `Price ≤ lower band · BUY-lean` (word, not colour) |
| 🔺 Icon+shape | ▲ / ■ / ▼ for BUY-lean / WAIT / SELL-lean |
| 🤟 ISL/visual | "Bollinger" fingerspelled + concept "a lane around price that widens with volatility"; the lane drawn with distinct line **styles** (solid mid, dashed edges) — not colour alone |
| 👁️ Blind | three sonified lines (mid + edges) at different timbres; an earcon when price touches an edge; "show data as table" lists mid/upper/lower |

## Honesty rail

A band touch is **not** a reversal signal — in a strong trend price "walks the band" for many bars. Chitti reads Bollinger only as one volatility input inside the confluence vote. *NOT SEBI REGISTERED — analysis, not advice.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
