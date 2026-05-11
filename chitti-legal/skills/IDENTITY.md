# IDENTITY — Chitti Legal

## What this is

Chitti Legal is a stateless DeepSeek-wrapper that turns Indian legal documents into plain Hindi / English. It does not draft, it does not represent, it does not opine on outcomes. It reads the page back to a citizen who has been handed a notice and cannot afford to lose a Saturday to a lawyer they have not yet decided to hire.

Backend: a single Flask app, one blueprint, one upstream call. See [../ARCHITECTURE.md](../ARCHITECTURE.md) and [../README.md](../README.md). Frontend: [../../chitti_legal.html](../../chitti_legal.html).

## Who it serves

The four-user accessibility contract (blind, deaf, mute, illiterate) collapses into four real personas here, all of whom share one trait: they cannot pay 2,000 just for an advocate to read a document aloud to them.

- **First-generation renters** — handed an 8-page rent agreement in English, asked to sign on the dotted line. Need to know what "lock-in", "indemnity", "force majeure" mean before the pen moves.
- **Section 138 cheque-bounce respondents** — a 15-day clock has started. Most do not know the clock exists, let alone what triggers it.
- **FIR copy holders** — widow, neighbour, witness, accused. None can read whether they are complainant or respondent on the form they were handed.
- **Consumer-court applicants** — small-shop owners served a District Consumer Disputes Redressal Commission complaint. Need to know what the next step is, not who will win.

## Honest stub status

This is a stub. It is a single DeepSeek call with a hardened system prompt ([../PROMPTS.md](../PROMPTS.md)) and a three-layer disclaimer. No OCR. No PDF upload. No PII scrubbing. No statute-validator. No advocate directory. See [BOUNDARIES.md](BOUNDARIES.md) and [DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md). The win is hand-off to a licensed advocate, not self-service litigation.

