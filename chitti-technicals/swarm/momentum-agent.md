🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SWARM AGENT — Momentum (⚡ the speed of the move)

> Reads the **momentum family** and answers: *is the move accelerating, exhausting, or turning?* Home of the **Roshan** composite (RSI14 vs SMA20) reused from `chitti_technical_engine.js`. Deterministic. Cites the indicator. Obeys [swarm/README.md](README.md).

---

## Votes on (family)
**RSI** (14) · **Stochastic** (%K/%D) · **MACD** (line/signal/histogram) · **Williams %R** · **Roshan** (RSI14 vs SMA20 composite — Chitti's own indicator).

## Inputs (from `chitti_technical_engine.js`)
`rsi14`, `stoch_k, stoch_d`, `macd_line, macd_signal, macd_hist`, `williams_r`, `roshan_state`. Computed values only.

## Rubric → `score 0–10` + `BUY / SELL / WAIT`
| Read | Score | Signal |
|---|---|---|
| MACD bullish cross + rising hist, RSI 50–70 (room left), Stoch turning up from <20, Roshan bullish | 8–10 | **BUY** |
| RSI 50–60 rising, MACD hist flat-positive, Roshan neutral-up | 6–7 | BUY (weak) |
| RSI ~50, MACD flat, Stoch mid-range, Roshan neutral | 4–5 | **WAIT** |
| **RSI > 70 (overbought)** or **< 30 (oversold)** — exhaustion, *not* a trade trigger by itself | 4–5 | **WAIT** (caution) |
| MACD bearish cross + falling hist, RSI 30–50 falling, Roshan bearish | 0–3 | **SELL** |

**Overbought ≠ sell, oversold ≠ buy.** RSI extremes signal *exhaustion risk*, so the agent leans **WAIT** at the extremes rather than chasing — this is the anti-overtrading posture ([overtrading.md](../guardrails/overtrading.md)).

## Returns
```
{ signal: "BUY",
  score: 7,
  why: "MACD just crossed up with a rising histogram, RSI is 58 (room before overbought), and Roshan is bullish — momentum is building, not yet stretched." }
```

## Hard rules
1. **Extremes mean caution, not conviction:** RSI > 70 / < 30 caps toward WAIT.
2. **Roshan is cited by name** when it drives the vote (it is Chitti's own composite).
3. **Cite the indicator**; RSI/MACD/Stochastic stay English, prose translates.
4. **Describe, never advise**; abstain honestly on missing data.
5. Subject to **[Risk veto](risk-agent.md)** + **[Honesty cap](honesty-agent.md)** — momentum alone never ships a signal.

---

## Cross-links
[swarm/README.md](README.md) · [trend-agent.md](trend-agent.md) · [volume-agent.md](volume-agent.md) · [overtrading.md](../guardrails/overtrading.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
