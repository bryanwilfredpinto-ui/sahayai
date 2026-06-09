🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SWARM — the indicator-family voting panel

> The intelligence layer. Analogous to Chitti Fashion's stylist-agent panel: instead of one model guessing, a panel of **deterministic indicator-family agents** each casts a vote on what it sees, votes are weighted into one verdict, and two supervisory agents — **Risk (supreme)** and **Honesty (anti-overconfidence)** — have the final say. Subordinate to [CONSTITUTION.md](CONSTITUTION.md); every agent is rules-code, the LLM only phrases.

---

## Why a panel, not a single signal
A lone signal is brittle and overconfident — the exact failure mode of Tickeron-92% and Incite-95% (rejected, see [hallucination.md](guardrails/hallucination.md)). A panel makes **confluence** the product: *"4 of 6 families agree"* is honest and legible, where a single needle is not. This mirrors Investing.com's vote tally and is the gold pattern from the [research](RESEARCH_BEST_APPS.md).

---

## The panel

| Agent | Votes on (family) | Weight | File |
|---|---|---|---|
| 📈 **Trend** | EMA · ADX · Supertrend · Ichimoku | 1.0 | [swarm/trend-agent.md](swarm/trend-agent.md) |
| ⚡ **Momentum** | RSI · Stochastic · MACD · Williams %R · **Roshan** | 1.0 | [swarm/momentum-agent.md](swarm/momentum-agent.md) |
| 🔊 **Volume** | OBV · MFI · CMF · VWAP | 0.8 | [swarm/volume-agent.md](swarm/volume-agent.md) |
| 🌊 **Volatility** | Bollinger · ATR · Keltner · TTM-Squeeze | 0.8 | [swarm/volatility-agent.md](swarm/volatility-agent.md) |
| 🛡️ **Risk** *(supreme)* | clean ATR/structure stop exists? | **VETO** | [swarm/risk-agent.md](swarm/risk-agent.md) |
| ⚖️ **Honesty** *(supervisor)* | overconfidence · disclaimer · fabricated % | **CAP** | [swarm/honesty-agent.md](swarm/honesty-agent.md) |

Each directional agent returns `{signal: BUY|SELL|WAIT, score: 0-10, why}`. See [swarm/README.md](swarm/README.md) for the execution contract.

---

## How the vote resolves
1. **Each directional agent** (Trend, Momentum, Volume, Volatility) reads its family from `chitti_technical_engine.js` output and casts `signal + score(0-10) + why`.
2. **Weighted vote:** `Σ(score × weight)` mapped to the 5-state verdict (Strong-Buy ▲▲ → Strong-Sell ▼▼). The raw tally is shown honestly: *"Trend & Momentum say Buy, Volume says Wait, Volatility says Buy."*
3. **Risk agent is supreme:** if there is **no clean ATR/structure stop**, Risk **vetoes** the directional verdict down to **HOLD/WAIT** — no exceptions ([CONSTITUTION.md](CONSTITUTION.md) Art. 5). Risk number is shown *before* reward.
4. **Honesty agent caps:** it bounds the confidence band, forces the disclaimer + *"most short-term traders lose money (SEBI)"* rail, and kills any fabricated accuracy claim before render.
5. **DeepSeek phrases** the resolved, capped verdict in the user's language — never on the path of a number, stop, size, or crisis.

---

## Swarm learning (anonymised, gated)
Same-type instances learn from each other ([privacy.md](guardrails/privacy.md)): outcomes are **anonymised + aggregated**, a pattern needs **≥100 confirmations** before it is a candidate, and — because this is HIGH-risk (financial) — every candidate goes to **Sire review** before it can adjust any weight or rubric. Locked decisions are never learnable. Raw personal journals never enter the swarm.

---

## Cross-links
[swarm/README.md](swarm/README.md) · [GUARDRAILS.md](GUARDRAILS.md) · [CONSTITUTION.md](CONSTITUTION.md) · [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
