🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAIL 5 — Crisis Safety (a human being matters more than a chart)

> Enforces [CONSTITUTION.md](../CONSTITUTION.md) Art. 6. A market app that ignores a user in crisis is negligent. Trading losses are a documented cause of acute distress in India. When a user signals self-harm, **Chitti drops the chart and points to help — deterministically, with no LLM in the path.**

---

## The rule
Crisis keywords (suicide, self-harm, *"I want to end it,"* *"lost everything,"* *"barbaad ho gaya,"* *"khatam kar dunga"* and their 26-language equivalents) trigger an **immediate, deterministic** response: surface **Tele-MANAS 14416** (India's national mental-health helpline) + the SAHAYAI family-cascade option. **No LLM is invoked.** No chart, no verdict, no "but here's your portfolio" — the crisis path is hard-coded and reproducible.

---

## Forbidden → Allowed

| ❌ Forbidden | ✅ Allowed |
|---|---|
| User: "I lost everything, I want to end it." → LLM improvises a comforting paragraph | Deterministic: *"Sire, you matter more than any trade. Please call Tele-MANAS now: **14416** — free, 24×7, in your language. Shall I help you reach someone in your family?"* (four-channel, no LLM) |
| Routing the message into the normal verdict pipeline | Hard pre-gate: crisis keywords short-circuit *before* any other handler |
| Auto-dialling police (100/112) | Family-cascade per SAHAYAI emergency protocol — **never cops** |
| A colour-only banner | Spoken + written + ⛑️ icon + ISL-mirrored helpline number |

---

## Enforcement
- **First handler, no exceptions:** crisis detection runs at the very front of the input pipeline, ahead of intent routing, Tip Shield, and engine. It cannot be reached *after* an LLM call.
- **Deterministic detection + response:** keyword/phrase match in all 26 languages → fixed, audited response string. DeepSeek is **never** asked to handle a crisis ([CONSTITUTION.md](../CONSTITUTION.md) Art. 6).
- **Tele-MANAS 14416** is the primary number; family-cascade (spouse/family, never police) is offered via `chittiConfirmAndDo()`, reusing the SAHAYAI emergency protocol.
- **Four-channel:** the helpline number is spoken, displayed, iconified, and ISL-fingerspelled — recoverable with sight OR sound removed.
- **Logged for safety, not analytics:** a crisis event is recorded locally for the loss-spiral cool-down, never sold or synced (see [privacy.md](privacy.md)).

---

## Slip-rate target
- **Crisis keyword reaching the LLM instead of the deterministic path: 0 slips, forever** (P0 if ever observed).
- **Tele-MANAS 14416 surfaced on every crisis trigger: 100%** across all 26 languages in the eval set.
- **False-negative (missed crisis phrase): driven to 0** — the keyword list is expanded on every miss; over-triggering is acceptable, missing is not.

---

## Cross-links
[GUARDRAILS.md](../GUARDRAILS.md) · [loss_spiral.md](loss_spiral.md) · [not_financial_advice.md](not_financial_advice.md) · SAHAYAI emergency protocol (family cascade, never cops)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
