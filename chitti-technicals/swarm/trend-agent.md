🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SWARM AGENT — Trend (📈 the direction of the river)

> Reads the **trend family** and answers one question: *which way is the river flowing, and how strong is the current?* Deterministic. Cites the indicator. Phrases nothing — the LLM does that downstream. Obeys [swarm/README.md](README.md).

---

## Votes on (family)
**EMA** (fast/slow stacking & slope) · **ADX** (trend strength) · **Supertrend** (flip direction) · **Ichimoku** (cloud position & Tenkan/Kijun).

## Inputs (from `chitti_technical_engine.js`)
`ema_fast, ema_slow, ema_slope`, `adx, di_plus, di_minus`, `supertrend_dir`, `ichimoku_price_vs_cloud, tenkan, kijun`. Reads computed values only — never invents a level ([hallucination.md](../guardrails/hallucination.md)).

## Rubric → `score 0–10` + `BUY / SELL / WAIT`
| Read | Score | Signal |
|---|---|---|
| Price > both EMAs, EMAs stacked up & rising, ADX ≥ 25, Supertrend up, price above cloud | 8–10 | **BUY** |
| Mild up-stack, ADX 20–25, Supertrend up but price in/near cloud | 6–7 | BUY (weak) |
| EMAs flat/tangled, ADX < 20 (no trend), price inside cloud | 4–5 | **WAIT** |
| Mild down-stack, ADX 20–25, Supertrend down | 3–4 | SELL (weak) |
| Price < both EMAs, stacked down & falling, ADX ≥ 25, Supertrend down, below cloud | 0–2 | **SELL** |

**ADX is the gate:** ADX < 20 means *no trend* — the agent leans **WAIT** regardless of EMA direction (a stack with no strength is noise).

## Returns
```
{ signal: "BUY",
  score: 8,
  why: "EMA20 above EMA50 and rising, ADX 28 (strong), Supertrend up, price above the Ichimoku cloud — the trend is up on this timeframe." }
```

## Hard rules
1. **No trend, no conviction:** ADX < 20 caps the score toward WAIT, even with a clean EMA stack.
2. **Cite the indicator** in every `why` (EMA/ADX/Supertrend/Ichimoku stay English; prose translates — [CONSTITUTION.md](../CONSTITUTION.md) Art. 9).
3. **Describe, never advise** — "trend is up", never "buy" ([not_financial_advice.md](../guardrails/not_financial_advice.md)).
4. **Abstain honestly** on missing candles → `WAIT, why: "insufficient data"`.
5. The agent's BUY is still subject to the **[Risk veto](risk-agent.md)** and the **[Honesty cap](honesty-agent.md)** downstream — it never wins alone.

---

## Cross-links
[swarm/README.md](README.md) · [momentum-agent.md](momentum-agent.md) · [risk-agent.md](risk-agent.md) · [SWARM.md](../SWARM.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
