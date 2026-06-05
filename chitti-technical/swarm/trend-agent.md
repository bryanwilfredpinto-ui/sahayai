🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Trend Agent

**Judges:** the direction of the controlling (higher) timeframe.
**Authority:** governs direction — this is the agent Founder Rule #4 empowers.

## Inputs
- EMA/SMA stack (9/20/50/100/200) ordering and slope
- Market structure (higher-highs/higher-lows vs lower-lows)
- Supertrend, ADX (+DI/−DI) for trend strength
- The trade type's **direction timeframe(s)**: Monthly+Weekly (long), Weekly
  (positional), Daily (swing), 4-Hourly (intraday)

## Output
`{direction: up|down|sideways, strength: 0..1, evidence: [...]}`

## Rules
- The trend on the direction timeframe **sets the side** the trigger timeframe is
  allowed to act on. A BUY trigger in a confirmed downtrend cannot become a BUY.
- `sideways` (low ADX, flat EMAs) → bias toward **HOLD**; counter-trend trades are
  flagged as such, never sold as the primary setup.
- Strength feeds confidence: a strong, clean trend lifts confidence; a choppy one caps it.

## Plain language (Explain)
> *"On the weekly, this is in an uptrend — price is above its rising averages. So
> we only look for buys on the daily, not sells."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
