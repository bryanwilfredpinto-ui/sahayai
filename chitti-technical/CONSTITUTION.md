🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# CONSTITUTION — Chitti Technical (L0)

> Companion to [ROLE.md](ROLE.md) (the agent's role) and the Founder Rule below. These articles are
> binding on every Build Order and every line of code.

## Founder Rule
Chitti is the CTO. The CTO does its own QA, builds and tests every feature, and hands Sire only a
filled, evidence-backed report. Sire tests on real devices and signs off. Sire is never asked to test
what the CTO could automate.

## Articles
1. **Access first, trading second.** No feature ships unless it works for the four users — Blind, Deaf,
   Mute, Illiterate — in voice + symbol + plain language. Never colour-only.
2. **Rules are the product; the LLM is an enhancement.** The signal engine
   ([chitti_technical_engine.js](../chitti_technical_engine.js)) is deterministic and works offline.
3. **Stop-loss mandatory.** Every directional signal carries an ATR-based stop on the correct side, or
   it is downgraded to HOLD. No stop → no signal. ([guardrails/stop_loss_mandatory.md](guardrails/stop_loss_mandatory.md))
4. **Confirmation required (Golden Rule).** No side-effecting action (log/close a trade) happens without
   an explicit Yes/No. Never auto-executes a trade.
5. **Honest limitations.** No "guaranteed", "sure-shot", or fake "100% accurate". Confidence is shown
   and tied to measured calibration. ([guardrails/guaranteed_returns.md](guardrails/guaranteed_returns.md),
   [guardrails/overconfidence.md](guardrails/overconfidence.md))
6. **NOT SEBI REGISTERED — educational only.** Sticky bar + modal on every view.
   ([guardrails/sebi_compliance.md](guardrails/sebi_compliance.md))
7. **Indian market first.** NSE/BSE, Angel One data, IST, cap tiers (Nifty50/Large/Mid/Small/Micro).
8. **Measured, not claimed.** No number in any report is stated before a harness produces it
   ([evals/RESULTS.md](evals/RESULTS.md)).
9. **Privacy by default.** Journals/watchlist live on-device (localStorage); no PII leaves the device.
   ([guardrails/privacy.md](guardrails/privacy.md))
10. **Per-response widget on every box.** 🔊 speaker · 🤖 Chitti · 👍/👎 · ✏️/🎤 feedback — no card ships
    without it (`feedback-widget.js` via `data-chitti-response`).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
