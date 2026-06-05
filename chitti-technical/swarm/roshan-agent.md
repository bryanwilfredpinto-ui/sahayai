🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Roshan Agent ⭐

**Judges:** Sire's custom composite indicator ([../indicators/ROSHAN.md](../indicators/ROSHAN.md)).
**Authority:** one weighted voter in the confluence — first-class, never the whole verdict.

## Inputs
- RSI(14) and SMA(20) of RSI(14) — the current Roshan definition
- (Roadmap, Sire-approved only: higher-timeframe agreement, trend filter, volume
  confirmation, confidence band)

## Output
`{roshan: BUY|SELL|WAIT, value: <rsi>, lean_strength: 0..1}`

## Rules
- `RSI > RSI_SMA` → BUY lean; `RSI < RSI_SMA` → SELL lean; else WAIT.
- Roshan is **overruled by the Trend Agent**: a Roshan BUY in a confirmed
  higher-timeframe downtrend cannot produce a BUY verdict — and Chitti says why.
- Roshan never carries "guaranteed" / "sure-shot" framing.
- Its formula evolves **only on Sire's sign-off** (custom indicator, not learnable).

## Plain language (Explain)
> *"Roshan — your custom indicator — compares momentum to its own average. Right
> now momentum is above its average, so Roshan leans buy. It's one voice in the
> vote, not the final call."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
