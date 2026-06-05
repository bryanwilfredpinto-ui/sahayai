🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Momentum Agent

**Judges:** whether the move is strong or tiring.
**Authority:** confirms or denies the trend; cannot create a trend.

## Inputs
- **RSI**, **MACD**, **Stochastic**, **Williams %R** (+ CCI, ROC, Awesome, TRIX)
- Divergences (price new high, momentum lower high → warning)

## Output
`{state: accelerating|fading|neutral, divergence: none|bullish|bearish, votes: {...}}`

## Rules
- **Oversold ≠ buy, overbought ≠ sell.** Momentum confirms direction; it does not
  override the Trend Agent. RSI<30 in a downtrend is *not* a buy — it is a
  potential continuation.
- Bearish divergence in an uptrend → caps confidence, flags "momentum tiring."
- A momentum reading that contradicts the trend subtracts confidence; it does not
  flip the verdict on its own.

## Plain language (Explain)
> *"RSI is oversold. This does NOT mean buy. In a downtrend, oversold can stay
> oversold. Wait for trend confirmation."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
