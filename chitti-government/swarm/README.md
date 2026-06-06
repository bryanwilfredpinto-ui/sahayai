🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# SWARM — Chitti Government 10-agent council

> Before any answer reaches the citizen, the relevant agents vote. The shown answer
> is the **synthesized verdict**, never one agent's raw opinion. Answers to
> [ROLE.md §6](../ROLE.md) and [CONSTITUTION.md](../CONSTITUTION.md). Wires into the
> platform [Swarm Intelligence](../../SAHAYAI_MASTER.md) cycle (daily collect →
> weekly validate ≥100 confirmations → monthly push to skills → quarterly review).
> **Government is HIGH-risk: every swarm-proposed skill change requires Sire's
> approval before it lands.**

## The council

| # | Agent | Judges | Can veto? |
|---|---|---|---|
| 1 | [Document Agent](document-agent.md) | which documents the citizen has / needs | — |
| 2 | [Eligibility Agent](eligibility-agent.md) | does the citizen meet each rule | — |
| 3 | [Scheme Agent](scheme-agent.md) | which schemes are real + relevant | — |
| 4 | [Life-Event Agent](life-event-agent.md) | what an event triggers | — |
| 5 | [Business Agent](business-agent.md) | business registrations / loans / compliance | — |
| 6 | [Fraud Agent](fraud-agent.md) | is this message a scam | — |
| 7 | [Accessibility Agent](accessibility-agent.md) | can all 4 users complete this | **YES** |
| 8 | [Language Agent](language-agent.md) | is the answer in pure target language | **YES** |
| 9 | [Memory Agent](memory-agent.md) | consistency with the Citizen Digital Twin | — |
| 10 | [Trust Agent](trust-agent.md) | source shown · no over-claim · uncertainty declared | **SUPREME VETO** |

## Voting rules

1. **Trust Agent is supreme.** If it flags a fabricated scheme, an approval
   guarantee, a missing source, or guessed eligibility, the answer is **blocked**
   and rewritten — no other agent can override it.
2. **Accessibility + Language can veto** any answer that a blind/illiterate user
   cannot consume or that mixes languages.
3. **No agent can manufacture certainty.** When agents disagree on eligibility, the
   synthesized verdict is `unknown / partial` with the disagreement surfaced —
   never the most optimistic agent's view.
4. **Confidence is a band, never a guarantee.** Eligibility/fraud answers carry a
   confidence band; the council never emits "you will be approved."

## Synthesis

The Government Copilot ([ARCHITECTURE.md](../ARCHITECTURE.md)) collects votes, applies
the veto hierarchy, and emits one six-field answer:
**What · Why · Documents · How to apply · Deadline · Source.**

---
> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
