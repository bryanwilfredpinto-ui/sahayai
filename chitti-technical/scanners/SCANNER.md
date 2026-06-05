🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# SCANNER — the signal engine (F1 + F2 + Confluence)

The Scanner is the core. It takes a resolved instrument + a trade type, runs the
indicator catalogue across the trade-type's timeframe ladder, and resolves a
single **BUY / SELL / HOLD** with a confidence band. **This is the engine kept
from the legacy product** ([../indicators/INDICATORS.md](../indicators/INDICATORS.md));
the multi-timeframe + swarm + trust wrapping is the CEOS addition.

## Inputs

| Input | Source |
|---|---|
| Instrument | F0 Stock Search (NSE stock / index / ETF) |
| Trade type | P1 Long-term · P2 Positional · P3 Swing · P4 Intraday |
| Candles per timeframe | Angel / NSE feed (manual refresh; "data as of" stamp) |
| Indicator set | full catalogue, or the user's selected subset (P9) |

## The timeframe ladder (F2)

| Trade type | Direction TF(s) | Trigger TF | RR floor |
|---|---|---|---|
| Long-term | Monthly → Weekly | Daily | 1:3 |
| Positional | Weekly | Daily | 1:3 |
| Swing | Daily | 4-Hourly | 1:2 |
| Intraday | 4-Hourly | Hourly | 1:1.5 |

## Algorithm

```
1. For each timeframe in the ladder:
     a. fetch candles (skip + flag if insufficient)
     b. compute every selected indicator → {BUY/SELL/WAIT} per indicator
        (warmup/NaN indicators ABSTAIN — never counted)
     c. run the swarm agents → per-timeframe sub-verdict + sub-confidence

2. CONFLUENCE:
     direction_TF_verdict  = swarm verdict on the higher timeframe(s)
     trigger_TF_verdict    = swarm verdict on the entry timeframe

     if direction and trigger AGREE      → emit that side (BUY or SELL)
     if direction is NEUTRAL/sideways    → HOLD ("no clean trend")
     if they DISAGREE                    → HOLD/WAIT ("higher TF says X,
                                            entry TF says Y — wait for alignment")

3. CONFIDENCE:
     HIGH   = direction strong + trigger agrees + volume confirms + Roshan agrees
     MEDIUM = direction clear + trigger agrees, one confirmation missing
     LOW    = thin agreement / low ADX / contradictory volume

4. RISK (only if BUY or SELL):
     entry zone (F3) · stop loss (F4) · targets 1-2-3 + RR (F5) · position size
     if no valid stop within the trade-type budget → DOWNGRADE to HOLD
     ("no clean stop — skip this trade")

5. TRUST LAYER gate (guardrails) → may block → honest "no clean trade"

6. CHITTI EXPLAIN → plain language in the user's language
```

## Output contract

```json
{
  "instrument": "RELIANCE",
  "trade_type": "swing",
  "verdict": "BUY",
  "confidence": "MEDIUM",
  "confluence_score": 0.62,
  "timeframes": {
    "daily":  {"trend": "up",   "verdict": "BUY",  "why": "..."},
    "4h":     {"trend": "up",   "verdict": "BUY",  "why": "..."}
  },
  "contributing":  ["Supertrend BUY", "MACD BUY", "Roshan BUY", "Volume spike"],
  "contradicting": ["RSI nearing overbought"],
  "entry":  {"zone": [a, b], "ideal": x, "aggressive": y, "conservative": z},
  "stop":   {"price": s, "pct": p, "atr": a, "structure": lvl, "recommended": "structure"},
  "targets":[{"price": t1, "rr": "1:2"}, {"price": t2, "rr": "1:3.5"}, ...],
  "position_size": {"qty": n, "rupee_risk": r},
  "invalidation": "wrong if 4H closes below <s>",
  "data_as_of": "2026-06-06T15:30:00+05:30",
  "disclaimer": "NOT SEBI REGISTERED — educational analysis, not advice"
}
```

HOLD outputs the same shape minus the risk block, with `why` explaining the
non-trade. **HOLD is a valid, valuable answer** (Founder Rule #2) — never padded
into a weak BUY.

## Hard rules

- **No stop → no signal** ([../guardrails/stop_loss_mandatory.md](../guardrails/stop_loss_mandatory.md)).
- **Higher timeframe governs** ([../SOP.md](../SOP.md)).
- **Abstaining indicators never vote.**
- **Every number shown is computed** — no LLM-invented level
  ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)).
- **Manual refresh** — the scan uses the last fetched candles and shows the stamp;
  it never silently uses stale data as if fresh.

## Performance

- Target **< 2 s** per scan ([../SUCCESS_METRICS.md](../SUCCESS_METRICS.md)).
- Pure-Python indicators on 50–500 candles; the swarm runs the timeframes in
  parallel; DeepSeek Explain is the only network hop and is non-blocking for the
  deterministic verdict (templated fallback if slow/down).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
