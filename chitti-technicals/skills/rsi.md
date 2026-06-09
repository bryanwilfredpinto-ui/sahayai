🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# RSI — Relative Strength Index (momentum)

> One of the 7 CEOS verdict indicators. **In the engine today.** `RSI` stays English in all 26 languages (proper noun, Art. 9). Cross-links: [confluence_engine.md](confluence_engine.md) · [roshan.md](roshan.md) · [../SKILLS.md](../SKILLS.md).

---

## What it is (plain English / vernacular target)

RSI asks: *over the last 14 bars, was the stock mostly going up or mostly going down, and how hard?* It is a number from 0 to 100.
- **Below 30** → "beaten down, maybe oversold" (a possible **BUY** lean).
- **Above 70** → "run up hard, maybe overbought" (a possible **SELL** lean).
- **30–70** → "no extreme — WAIT."

Vernacular framing Chitti speaks: *"RSI 28 hai — yeh share zyada gir chuka hai, sambhal ke."* (Never "buy now" — analysis, not advice.)

## How the engine computes it (real)

`TechEngine.rsi(values, period=14)` — Wilder's smoothing: seed average gain/loss over the first 14 deltas, then smooth each subsequent bar. Returns a full-length array (nulls until enough bars). `indicatorSet()` reads the **last** value:

```
RSI < 30  → BUY    RSI > 70 → SELL    else → WAIT
note: "RSI(14): <30 oversold, >70 overbought"
```

This per-indicator BUY/SELL/WAIT becomes one ±1 vote inside `tfVerdict()`, which feeds the multi-TF `confluence()`. RSI is also the input to the **Roshan** composite.

## Accessibility mapping (Art. 2 — four channels, never colour-only)

| Channel | Rendering |
|---|---|
| 🔊 **Voice** | "RSI is 28 — oversold. This is one input, not a buy. Most short-term traders lose." |
| 🔡 **Text** | `RSI 28 · oversold · BUY-lean` (word + state, not colour) |
| 🔺 **Icon+shape** | ▲ for BUY-lean, ■ for WAIT, ▼ for SELL-lean — shape carries meaning |
| 🤟 **ISL / visual** | "RSI" fingerspelled (no native sign) + concept panel "momentum, 0–100"; gauge with a moving needle, not a red/green fill |
| 🦻 **Deaf earcon twin** | the RSI-30/70 **earcon** (a tone the blind user hears as it crosses) is mirrored as a text/flash event |
| 👁️ **Blind sonification** | RSI plotted as pitch; an earcon fires *only* on the 30 / 70 cross (event-only `aria-live`, not every tick) |

## Honesty rail

RSI overbought ≠ "sell," oversold ≠ "buy" — a strong trend can hold an extreme for weeks. Chitti always pairs RSI with the trend and the stop. *Past performance does not guarantee future results. NOT SEBI REGISTERED.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
