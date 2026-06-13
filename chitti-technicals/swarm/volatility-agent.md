🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SWARM AGENT — Volatility (🌊 how rough is the sea?)

> Reads the **volatility family** and answers: *is the market calm, stretched, or coiled to spring?* Volatility doesn't pick a direction — it sizes the risk and the stop, and warns when a move is over-extended. Weighted **0.8**. Feeds the [Risk agent](risk-agent.md) directly. Obeys [swarm/README.md](README.md).

---

## Votes on (family)
**Bollinger Bands** (width & %B) · **ATR** (average true range — the stop & sizing input) · **Keltner Channels** · **TTM Squeeze** (Bollinger inside Keltner = coiled).

## Inputs (from `chitti_technical_engine.js`)
`bb_upper, bb_lower, bb_width, percent_b`, `atr`, `keltner_upper, keltner_lower`, `ttm_squeeze_on`. Computed values only.

## Rubric → `score 0–10` + `BUY / SELL / WAIT`
| Read | Score | Signal |
|---|---|---|
| Squeeze just *fired* upward (BB expanding out of Keltner), %B rising through 0.5 | 7–9 | **BUY** (breakout context) |
| Calm, mid-band, ATR moderate — orderly conditions | 5–6 | **WAIT** (neutral) |
| **%B > 1 (price outside upper band)** — over-extended, snap-back risk | 3–4 | **WAIT** (caution) |
| Squeeze ON (coiled) — energy building, direction unknown | 4–5 | **WAIT** (watch) |
| Squeeze fired *downward*, BB expanding down, %B falling through 0.5 | 1–3 | **SELL** (breakdown context) |
| ATR spiking hard (chaotic) | cap ≤ 4 | **WAIT** (too rough) |

**Over-extension means WAIT, not chase:** price riding outside the bands is exhaustion risk — the agent refuses to add conviction to a stretched move (anti-overtrading posture).

## Returns
```
{ signal: "WAIT",
  score: 4,
  why: "Price is poking outside the upper Bollinger band (%B 1.1) and ATR is elevated — the move is stretched and rough. Better to wait for it to settle." }
```

## Role beyond voting: it powers the stop
The ATR value this agent reads is the **same ATR the [Risk agent](risk-agent.md) uses to compute the mandatory stop** ([CONSTITUTION.md](../CONSTITUTION.md) Art. 5). If ATR is unreadable/chaotic, the Risk agent has no clean stop → **veto to HOLD**.

## Hard rules
1. **Over-extension = WAIT** (%B > 1 or < 0 caps conviction).
2. **Surface the squeeze state** — coiled energy is information the user deserves.
3. **Cite the indicator**; Bollinger/ATR/Keltner/TTM stay English, prose translates.
4. **Describe, never advise**; abstain honestly on missing data.
5. Subject to **[Risk veto](risk-agent.md)** + **[Honesty cap](honesty-agent.md)**.

---

## Cross-links
[swarm/README.md](README.md) · [risk-agent.md](risk-agent.md) · [volume-agent.md](volume-agent.md) · [CONSTITUTION.md](../CONSTITUTION.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
