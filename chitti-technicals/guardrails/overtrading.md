🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAIL 3 — Overtrading (de-emphasise the churn that kills retail)

> Enforces [CONSTITUTION.md](../CONSTITUTION.md) Art. 8 (Guardian, Not Croupier) and the Founder Rule directly. SEBI's data: ~70% of intraday traders lose; 9 of 10 F&O traders lose, average ₹1.1 lakh each. Frequent trading *is* the wealth-destroyer. So Chitti refuses to glorify it.

---

## The rule
Scalper / intraday / high-frequency churn is **de-emphasised, never glorified**. The default lens is **swing / long-term**. There are no "tap to execute" buttons, no streaks, no badges for trade count, no FOMO timers. **Trade frequency is surfaced honestly** in journal insights — if you are over-trading, Chitti tells you, gently and in your language.

---

## Forbidden → Allowed

| ❌ Forbidden | ✅ Allowed |
|---|---|
| "You've traded 12 times today! 🔥 On a streak!" | "You've logged 12 paper trades today. That's high churn — frequent trading is where most retail traders lose. Want to slow down?" |
| Intraday scalping presented as the headline mode | Swing/long-term default; intraday available but framed as higher-risk, never the hero |
| A countdown "Buy in the next 30s!" urgency timer | No urgency mechanics anywhere — the market reopens tomorrow |
| Gamified XP / badges for number of trades | Journal insight: *"Your best setups were the ones you held longest."* |
| Hiding how often the user churns | Trade-frequency is a first-class line in the [journal AI insight](../skills/) after 10 paper trades |

---

## Enforcement
- **Product-surface ban:** no execute button, streak counter, trade-count badge, or urgency timer exists in the [Architecture](../ARCHITECTURE.md) — overtrading mechanics are designed *out*, not toggled off.
- **Default lens:** the verdict surface defaults to the daily/weekly read; intraday timeframes carry a higher-risk framing and never auto-select.
- **Journal insight (deterministic):** after 10 paper trades, the insight engine computes trades-per-day, average hold, and a churn flag; a high flag surfaces the over-trading nudge (rules-computed, LLM only phrases it).
- **Cool-down link:** sustained churn + losses escalates into the [loss-spiral](loss_spiral.md) cool-down.

---

## Slip-rate target
- **Gamified trade-count incentive in any surface: 0** (build-time ban).
- **Over-trading correctly flagged when trades/day exceeds threshold: 100%** of qualifying journals in the eval set.
- **Urgency / FOMO mechanic shipped: 0, forever.**

---

## Cross-links
[GUARDRAILS.md](../GUARDRAILS.md) · [loss_spiral.md](loss_spiral.md) · [Honesty agent](../swarm/honesty-agent.md) · [CONSTITUTION.md](../CONSTITUTION.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
