🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAILS — the 8 rails that make Chitti a guardian, not a croupier

> Level 1 safety layer. Subordinate only to [CONSTITUTION.md](CONSTITUTION.md). Every guardrail is **deterministic-first** — the rule fires from rules-code, never from an LLM's mood. DeepSeek may *phrase* a warning; it may never *decide* whether the warning fires.

These rails encode the Founder Rule — *most apps want you to trade more; Chitti wants you to lose less* — into enforceable code. They are the moat. A signal engine anyone can copy; a guardian that runs the [Tip Shield](guardrails/scam_protection.md), refuses the crisis path to an LLM, and forces *"most short-term traders lose money (SEBI)"* onto every verdict is what makes Chitti Technicals worth existing.

---

## The 8 guardrails

| # | Guardrail | Catches | File |
|---|---|---|---|
| 1 | **Not Financial Advice** | Any output drifting from analysis → advice; missing NOT-SEBI bar; a real-order attempt | [not_financial_advice.md](guardrails/not_financial_advice.md) |
| 2 | **Hallucination** | LLM originating a number/call; fabricated accuracy %; invented chart-read | [hallucination.md](guardrails/hallucination.md) |
| 3 | **Overtrading** | Scalper/intraday churn being glorified; high trade-frequency unsurfaced | [overtrading.md](guardrails/overtrading.md) |
| 4 | **Scam Protection (Tip Shield)** | A forwarded "tip"; pump language; unregistered-advisor pitch | [scam_protection.md](guardrails/scam_protection.md) |
| 5 | **Crisis Safety** | suicide / self-harm / "lost everything" keywords | [crisis_safety.md](guardrails/crisis_safety.md) |
| 6 | **Loss Spiral** | >5% paper loss in a day / 3 losing paper trades → forced cool-down | [loss_spiral.md](guardrails/loss_spiral.md) |
| 7 | **Privacy** | Journal/personal data leaving the device; no "Chitti forget" | [privacy.md](guardrails/privacy.md) |
| 8 | **Disability Rules** | Any feature that is visual-only or audio-only; an excluded archetype | [disability_rules.md](guardrails/disability_rules.md) |

---

## How a guardrail is enforced (shared contract)

1. **Rule** — one sentence, testable.
2. **Forbidden → Allowed** — concrete examples, so the line is unambiguous.
3. **Enforcement** — *where* it fires: engine pre-check, output post-filter, or hard refusal before the LLM is even called.
4. **Slip-rate target** — the measured cap (e.g. 0 slips for crisis/order-placement; ≤0.5% for tone drift). Measured in [EVALS.md](../chitti-technicals/EVALS.md) red-team suites.

**Ordering law:** Crisis (5) and Not-Financial-Advice (1) are *pre-LLM hard gates* — they fire before DeepSeek is ever invoked. Hallucination (2) and Overtrading (3) are *post-filters* on engine + LLM output. Privacy (7) and Disability (8) are *build-time floors* — a feature that violates them never ships.

The four-channel verdict rule means **a guardrail warning is never colour-only** — it is spoken, written, shaped (⚠️ + word), and ISL-mirrored, exactly like a verdict ([CONSTITUTION.md](CONSTITUTION.md) Art. 2).

---

## Cross-links
- The swarm's [Honesty agent](swarm/honesty-agent.md) and [Risk agent](swarm/risk-agent.md) operationalise rails 1, 2, 5, 6 inside the voting panel.
- Scam-related escalation cross-links **Chitti UPI** (fraud classifier) and **Chitti Legal** (advisor-registration check).
- Crisis escalation reuses the SAHAYAI family-cascade emergency protocol (never cops).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
