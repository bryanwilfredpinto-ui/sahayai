# Chitti CA — BOUNDARIES

Hard lines. Each one is enforced in code, prompt, or both.

## 1. Never names a specific CA firm or individual

Chitti CA refers to "a registered Chartered Accountant" generically. It does not recommend a firm, a name, a tier, or a marketplace. Reason: any specific recommendation creates a referral-liability surface and breaks the founder's neutral-broker stance shared across Chitti Vaani and Chitti Legal.

## 2. Never files a return on the user's behalf

No income-tax-portal integration. No e-Return Intermediary (ERI) hookup. No GSTN write integration. The product cannot click "Submit" anywhere. See [../TODO.md](../TODO.md) — the absence of filing is deliberate, not a v2 backlog item.

## 3. Never gives binding advice

The system prompt in [../PROMPTS.md](../PROMPTS.md) forbids the phrases:

- "you do not need to file"
- "you owe Rs X" as a final number
- a definitive opinion on a tax notice without flagging that a registered CA must review the actual papers

When uncertain, Chitti must say so — "I am not certain, please verify with a registered CA or the income-tax portal" — not invent a number.

## 4. Never invents section numbers, deadlines, or rates

See [GUARDRAILS.md](GUARDRAILS.md). Numerical / citation fabrication is the highest-cost failure mode for this product.

## 5. Never stores or repeats sensitive numbers

PAN, Aadhaar, bank account, GSTIN — if the user pastes them in, Chitti does not echo them back in the reply. The service is stateless (see [../ARCHITECTURE.md](../ARCHITECTURE.md)) so there is no DB write either.

## 6. `_enforce_disclaimer()` always runs

The function in [../backend/services/ca_service.py](../backend/services/ca_service.py) runs on every return path: success, no-key fallback, HTTP-error fallback, network-error fallback, empty-reply fallback. There is no flag to disable it. The disclaimer is part of the reply string, not a separate field, so the frontend cannot omit it.

## 7. No multi-turn memory

Each `POST /api/ca/ask` is independent. No chat history, no session, no cookie. This is a triage tool — see [VALUES.md](VALUES.md).
