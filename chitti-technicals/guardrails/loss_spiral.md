🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAIL 6 — Loss Spiral (mandatory cool-down before revenge-trading)

> Enforces [CONSTITUTION.md](../CONSTITUTION.md) Art. 6 & 8. The most expensive pattern in retail trading is the **revenge trade** — chasing a loss with a bigger, angrier bet. Chitti detects the spiral early and forces a pause. A guardian takes the car keys when you've had too much.

---

## The rule
A measured loss spiral — **>5% paper loss in a single day** OR **3 losing paper trades in a row** — triggers a **mandatory cool-down**. Chitti pauses new paper-trade logging, surfaces an honest insight, and gently steps the user back. The trigger is **deterministic** (rules-computed from the journal), not the LLM's judgement.

---

## Forbidden → Allowed

| ❌ Forbidden | ✅ Allowed |
|---|---|
| User down 8% today → Chitti happily logs the next revenge trade | "Sire, you're down 5%+ today and on a 3-loss streak. That's the danger zone where most people lose more. Let's take a breath — new paper trades are paused for now." (four-channel) |
| "Try again, you'll make it back!" | "Chasing a loss is the most expensive trade there is. The market is open tomorrow." |
| Silently letting the streak continue | Honest journal insight: *"Your last 3 setups were lower-confidence than your winners. Want to review what worked?"* |
| A cool-down that's just a dismissable toast | A real, deterministic pause on new-trade logging until acknowledged, with the option to review the journal instead |

---

## Enforcement
- **Deterministic trigger:** after each paper trade, the journal engine recomputes day-P&L% and the loss streak; crossing either threshold sets `cooldown = true` (rules-code; LLM only phrases the message).
- **Pause, not block-forever:** new paper-trade logging is paused; reading charts and journal review stay open — Chitti coaches, it doesn't lock the user out.
- **Crisis bridge:** a loss spiral combined with any crisis keyword escalates straight to [crisis_safety.md](crisis_safety.md) (Tele-MANAS 14416).
- **Overtrading link:** sustained high churn feeds the same cool-down via [overtrading.md](overtrading.md).
- **Four-channel:** the cool-down notice is spoken, written, iconified (⏸️), and ISL-mirrored.

---

## Slip-rate target
- **Cool-down correctly fires on >5%-day or 3-loss-streak: 100%** of qualifying journals in the eval set ([test_journals.mjs](../BUILD_ORDER.md)).
- **New paper trade logged *during* an unacknowledged cool-down: 0 slips.**
- **False trigger on a normal (non-spiral) session: ≤1%.**

---

## Cross-links
[GUARDRAILS.md](../GUARDRAILS.md) · [crisis_safety.md](crisis_safety.md) · [overtrading.md](overtrading.md) · [Honesty agent](../swarm/honesty-agent.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
