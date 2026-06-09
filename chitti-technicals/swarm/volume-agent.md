🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SWARM AGENT — Volume (🔊 is the move backed by money?)

> Reads the **volume family** and answers: *is real money behind this move, or is it a thin, hollow drift?* Volume confirms or denies what trend and momentum claim. Weighted **0.8** — it confirms, it rarely leads. Deterministic. Obeys [swarm/README.md](README.md).

---

## Votes on (family)
**OBV** (on-balance volume trend) · **MFI** (money-flow index, volume-weighted RSI) · **CMF** (Chaikin money flow) · **VWAP** (price vs volume-weighted average).

## Inputs (from `chitti_technical_engine.js`)
`obv, obv_slope`, `mfi`, `cmf`, `vwap, price_vs_vwap`. Computed values only.

## Rubric → `score 0–10` + `BUY / SELL / WAIT`
| Read | Score | Signal |
|---|---|---|
| OBV rising with price, MFI 50–80, CMF > 0, price holding above VWAP | 8–10 | **BUY** (confirmed) |
| OBV up mildly, CMF slightly positive, price near VWAP | 6–7 | BUY (weak) |
| Flat OBV, CMF ~0, price chopping around VWAP | 4–5 | **WAIT** |
| **Divergence:** price up but OBV/CMF falling (hollow rally) | 3–4 | **WAIT** (warn) |
| OBV falling with price, MFI < 50 / > 80 extreme, CMF < 0, price below VWAP | 0–3 | **SELL** |

**Divergence is the prize signal:** a price rise on falling volume is a *warning*, not a buy — the agent flags it explicitly so the panel doesn't over-trust a hollow move.

## Returns
```
{ signal: "WAIT",
  score: 4,
  why: "Price is rising but OBV is flat and CMF turned negative — the rally isn't backed by buying volume. Be careful, this can be hollow." }
```

## Hard rules
1. **Confirmer, not leader:** weight 0.8 — volume validates trend/momentum, it doesn't outvote them.
2. **Flag divergence loudly** — a volume/price mismatch must surface in the `why`.
3. **Cite the indicator**; OBV/MFI/CMF/VWAP stay English, prose translates.
4. **Describe, never advise**; abstain honestly on thin/missing volume data (common in small-caps) → `WAIT, why: "insufficient volume data"`.
5. Subject to **[Risk veto](risk-agent.md)** + **[Honesty cap](honesty-agent.md)**.

---

## Cross-links
[swarm/README.md](README.md) · [momentum-agent.md](momentum-agent.md) · [volatility-agent.md](volatility-agent.md) · [SWARM.md](../SWARM.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
