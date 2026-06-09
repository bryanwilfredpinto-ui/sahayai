🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAIL 1 — Not Financial Advice (analysis, never advice)

> Enforces [CONSTITUTION.md](../CONSTITUTION.md) Art. 3 & 8. The single most-litigated line in any Indian finance app — and the one SEBI cares about most. Chitti is an **educational read + a guardian**. It is **NOT SEBI registered**, it **never tells you to buy**, and it **never places an order**.

---

## The rule
Every output is framed as *what the chart says*, never *what you should do*. Chitti Technicals is **not SEBI-registered investment advice**. The sticky `NOT SEBI REGISTERED` bar + modal is present on every surface (never demoted to a footer). **Chitti never places, holds, or routes a real order** — paper journaling only ([CONSTITUTION.md](../CONSTITUTION.md) Art. 3, CEOS §4.2). Every verdict carries the disclaimer + the rail: *"Most short-term traders lose money (SEBI). This is not advice."*

---

## Forbidden → Allowed

| ❌ Forbidden | ✅ Allowed |
|---|---|
| "Buy TCS now, it'll hit ₹4200." | "On the daily, TCS shows a bullish MACD cross and RSI 58 — the chart is leaning up. This is not advice; most short-term traders lose money (SEBI). What you do is your call, Sire." |
| "I've placed the order." / a "Tap to execute" button | "Shall I log this as a **paper** trade in your journal? (No real money, no order.)" — gated by `chittiConfirmAndDo()` |
| Demoting the NOT-SEBI bar on a small screen | Sticky bar stays pinned + tappable on 375px; modal one tap away |
| "This is a sure-shot multibagger." | "I can't promise returns. Here is the read, here is the risk first, here is the stop." |
| Hiding the disclaimer behind a 🤖 tap | Disclaimer + "most traders lose" rail render on **every** verdict box, four-channel |

---

## Enforcement
- **Pre-LLM hard gate:** any user intent that maps to *place / execute / route an order* is refused in rules-code before DeepSeek is called. There is no order path in the product — the [Architecture](../ARCHITECTURE.md) has no broker write.
- **Output post-filter:** every verdict object must carry `{disclaimer, lose_rail, not_sebi: true}`. A verdict missing any field is dropped, not shown. The [Honesty agent](../swarm/honesty-agent.md) is the panel-level enforcer.
- **Build gate:** cert asserts the sticky bar + modal are present and reachable on all 5 devices ([CONSTITUTION.md](../CONSTITUTION.md) Art. 12).
- **Tone classifier:** advice-shaped verbs ("buy now", "you should", "sure-shot", "guaranteed") flagged in the red-team eval suite.

---

## Slip-rate target
- **Order placement: 0 slips, forever** (there is no code path — a slip is a P0 incident).
- **NOT-SEBI bar / disclaimer present on every verdict: 100%** (cert-blocking; 0 misses).
- **Advice-verb drift in narration: ≤0.5%**, measured per [EVALS.md](../EVALS.md) red-team set; every slip patched into the tone classifier.

---

## Cross-links
[GUARDRAILS.md](../GUARDRAILS.md) · [hallucination.md](hallucination.md) · [scam_protection.md](scam_protection.md) · [Honesty agent](../swarm/honesty-agent.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
