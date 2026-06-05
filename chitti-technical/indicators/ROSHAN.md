🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# ROSHAN INDICATOR — Sire's custom composite

> **The signature of Chitti Technical.** The Roshan Indicator is Sire's own
> customised indicator and his stated favourite. It is a **first-class layer** —
> a chart overlay, a swarm voter ([../swarm/roshan-agent.md](../swarm/roshan-agent.md)),
> and a screener filter ([../screeners/SCREENER.md](../screeners/SCREENER.md)) —
> favourited by default in [../memory/](../memory/).

## Current definition (as implemented in the engine today)

The Roshan Indicator already exists in the production engine
([`technical.py::_roshan`](../../chitti-shares/backend/services/technical.py)):

```
RSI       = RSI(close, 14)
RSI_SMA   = SMA(RSI, 20)

Roshan signal:
  RSI > RSI_SMA   → BUY    (momentum accelerating above its own average)
  RSI < RSI_SMA   → SELL   (momentum decelerating below its own average)
  otherwise        → WAIT
```

Plain language (what Chitti Explain says):
> *"Roshan compares momentum to its own recent average. Momentum is now above its
> 20-period average — it is picking up. Roshan leans buy. This is one voice, not
> the whole verdict."*

This is the **honest baseline** carried forward from the legacy product. It is
intentionally simple, transparent, and computable from candles alone.

## Evolution owner

**Sire owns the Roshan logic.** It is a custom indicator; its formula evolves only
on Sire's direction (this mirrors the [CHITTI_SOP.md](../../CHITTI_SOP.md)
"Evolution owner" field). The swarm may *propose* refinements via
[../observability/feedback.md](../observability/feedback.md), but the Roshan
formula is **not auto-learnable** — a change to it is a deliberate, Sire-approved
commit, versioned in this file.

### Roadmap (proposed, awaiting Sire's sign-off — NOT live)

These are candidate enhancements to make Roshan a true multi-factor composite.
They are listed as `COMING SOON` and are **not** claimed as active:

- **Multi-timeframe Roshan** — compute the RSI-vs-RSI-SMA relationship on the
  trade-type's higher timeframe and require agreement (Founder Rule #4).
- **Trend filter** — only honour a Roshan BUY when price is above a chosen EMA, to
  suppress oversold-in-a-downtrend traps.
- **Volume confirmation** — upgrade Roshan BUY to "strong" only on a volume spike.
- **Confidence band** — distance of RSI above/below its SMA → LOW/MED/HIGH lean.

Each, when Sire approves it, lands here with a version bump and a new eval row.

## How Roshan participates

| Surface | Role |
|---|---|
| Chart | Overlay pane: RSI line + its SMA(20), with the BUY/SELL/WAIT state shaded. |
| Swarm | The Roshan Agent casts a weighted vote in the confluence. |
| Screener | "Roshan = BUY" is a one-tap filter across the NSE universe. |
| Explain | Always rendered in plain language, never as a bare "Roshan: BUY". |

## Guardrails specific to Roshan

- Roshan is **one voter, never the verdict.** A Roshan BUY in a confirmed
  higher-timeframe downtrend is overruled by the confluence engine to HOLD/SELL —
  and Chitti says *why*.
- Roshan never carries a "guaranteed" or "sure-shot" framing
  ([../guardrails/guaranteed_returns.md](../guardrails/guaranteed_returns.md)).
- Like every signal, a Roshan-led BUY still ships with stop + RR or it does not ship.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
