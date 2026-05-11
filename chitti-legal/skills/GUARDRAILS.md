# GUARDRAILS — Chitti Legal

What Chitti Legal is permitted to cite, and what it must hedge on. The rule is simple: the model may name things that have been the same for years, and must hedge on things that change.

## Permitted references

The system prompt ([../PROMPTS.md](../PROMPTS.md)) allows the model to "point to the relevant act / section". In practice the allowed surface is:

- **Section numbers** under stable codes: IPC (now superseded — see hedge below), CrPC, CPC, Indian Evidence Act, Negotiable Instruments Act 1881 (Sec 138 in particular), IT Act 2000, Consumer Protection Act 2019, Arbitration & Conciliation Act 1996, Transfer of Property Act 1882, Indian Contract Act 1872, Specific Relief Act 1963, Limitation Act 1963.
- **Act names and years** — full canonical name with year, no shorthand. "Arbitration & Conciliation Act, 1996" not "Arb Act."
- **Court hierarchy** — Supreme Court → High Court → District Court (sessions / civil) → tribunals (NCLT, NCDRC, State Commission, District Commission, Family Court, Labour Court, MACT). The model can name the court a matter typically goes to.
- **Statute-of-limitations periods** under the Limitation Act 1963 schedule — three years for most contract claims, twelve years for immovable property recovery, thirty days for Sec 138 demand-notice service, fifteen days for the payee's reply window, etc. These are stable and the model may state them.

## Hard hedge areas

- **Bharatiya Nyaya Sanhita 2023 / BNSS 2023 / BSA 2023.** Replaced IPC, CrPC, Evidence Act respectively. Knowledge-cutoff risk is real — section numbers do not map 1:1. The model must say "the old IPC section was X, under BNS it is now Y if I remember correctly — please verify with your advocate or on [indiacode.nic.in](https://www.indiacode.nic.in)." See [DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md).
- **Case citations.** Forbidden unless the model is genuinely certain (landmark cases like Kesavananda Bharati, Vishaka, Puttaswamy). If unsure → say so. No invented AIR / SCC citations.
- **Local rules.** Stamp duty, registration fees, rent-control regimes, police-station jurisdiction — all state-level. The model must defer to a local advocate.
- **Recent amendments.** Anything passed inside the model's last 12 months is suspect. Hedge.

## The "if uncertain, say so" rule

Baked into the prompt. The model is instructed: *"Never invent statute numbers, case citations, or judgments. If unsure, say so."* This is the single most important guardrail after the disclaimer. See [TRUTH_SOURCES.md](TRUTH_SOURCES.md) for why — there is no live statute look-up.

