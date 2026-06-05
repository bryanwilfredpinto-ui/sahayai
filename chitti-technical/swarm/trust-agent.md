🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Trust Agent

**Judges:** final verification before anything reaches the user.
**Authority:** **can BLOCK or downgrade.** The last gate; guardrails live here.

## Checks (all must pass)
1. **Stop present + RR valid** (confirms Risk Agent) — else block.
2. **No invented numbers** — every value in the output traces to the computed
   engine data ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)). A
   level not in the data → block.
3. **Guardrail language** — no "guaranteed," "sure-shot," "multibagger,"
   "100% accuracy," "no stop loss needed" ([../guardrails/](../guardrails/)).
4. **Disclaimer present** — NOT SEBI REGISTERED on the surface.
5. **Confidence calibrated** — HIGH only when confirmations genuinely stack;
   overconfidence is downgraded ([../guardrails/overconfidence.md](../guardrails/overconfidence.md)).
6. **Invalidation present** — one checkable sentence stating what proves the signal wrong.

## Output
`{passed: bool, blocked_reason: str|null, downgrades:[...]}`

## On block
The signal is replaced by an honest **"no clean trade"** (or a downgraded HOLD)
with the reason — never silently dropped, never forced through.

## Plain language (Explain)
> *"I was about to call this a buy, but there's no clean stop nearby — taking it
> would mean risking too much. So: no trade here today. That's the honest answer."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
