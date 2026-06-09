🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SWARM PANEL — execution rules

> The contract every agent in the panel obeys. Read [SWARM.md](../SWARM.md) first for the why. This file is the *how*: order of execution, the shared agent interface, the veto/cap precedence, and the hard rules no agent may break.

---

## Execution order (deterministic, fixed)
```
1. Crisis pre-gate        → if crisis keyword, STOP. Tele-MANAS 14416. No panel, no LLM.   (crisis_safety.md)
2. Tip Shield pre-gate    → if forwarded "tip" with scam markers, STOP. Warn. No buy read. (scam_protection.md)
3. Engine compute         → chitti_technical_engine.js produces the verdict object (numbers).
4. Directional agents     → Trend · Momentum · Volume · Volatility each vote {signal,score,why}.
5. Weighted vote          → Σ(score × weight) → 5-state directional verdict + honest tally.
6. RISK agent (supreme)   → no clean stop? VETO → HOLD/WAIT. Risk shown before reward.
7. HONESTY agent (cap)    → cap confidence, force disclaimer + "most traders lose" rail, kill fake %.
8. DeepSeek phrasing      → narrate the FINAL capped verdict in the user's language. Numbers pass through.
9. Four-channel render    → voice · text · icon+shape · ISL. Per-response widget on the box.
```
Steps 1–2 can short-circuit before the engine ever runs. Step 6 can override steps 4–5. Step 7 can cap step 6. **The LLM only ever sees the output of step 7.**

---

## Shared agent interface
Every **directional** agent (Trend, Momentum, Volume, Volatility) implements:

| Field | Meaning |
|---|---|
| **votes-on** | the indicator family it owns |
| **rubric** | how raw indicator state → `0–10` score and `BUY / SELL / WAIT` |
| **inputs** | which engine fields it reads (never raw price guesses — only computed values) |
| **returns** | `{ signal: BUY\|SELL\|WAIT, score: 0–10, why: "<one plain sentence citing the indicator>" }` |
| **hard rules** | what it must never do |

The two **supervisory** agents (Risk, Honesty) implement a different interface — they receive the assembled vote and return an **override** (veto) or a **cap**, not a directional score.

---

## Precedence (law)
**Crisis > Tip Shield > Risk veto > Honesty cap > weighted directional vote.**
A higher rail always wins. A confident Strong-Buy from all four directional agents is still forced to HOLD if Risk finds no stop, and its confidence is still capped by Honesty.

---

## Hard rules for every agent
1. **Deterministic only.** Every score traces to an engine number. No agent calls the LLM. No agent invents a value ([hallucination.md](../guardrails/hallucination.md)).
2. **Cite the indicator.** Every `why` names the indicator behind it (Danelfin tap-to-explain standard).
3. **No advice verbs.** An agent describes the read ("RSI leaning up"); it never says "you should buy" ([not_financial_advice.md](../guardrails/not_financial_advice.md)).
4. **Honest abstention.** Missing data → the agent returns `WAIT` with `why: "insufficient data"`, never a guess.
5. **Four-channel downstream.** An agent's `why` must be renderable as voice + text + icon + ISL.

---

## Cross-links
[SWARM.md](../SWARM.md) · [trend-agent.md](trend-agent.md) · [momentum-agent.md](momentum-agent.md) · [volume-agent.md](volume-agent.md) · [volatility-agent.md](volatility-agent.md) · [risk-agent.md](risk-agent.md) · [honesty-agent.md](honesty-agent.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
