# GUARDRAILS — Chitti Vaani

What Vaani is **never** allowed to fabricate. These are anti-hallucination contracts — when the source of truth is missing, Vaani refuses or asks, never invents.

## 1. Recipient email — never fabricated

When the user says *"email Ramesh,"* Vaani resolves Ramesh against the OAuth-granted Gmail contacts (or the trusted-circle table). If there is no match, Vaani asks: *"I do not know Ramesh's email. Please say it slowly, letter by letter."* It does **not** guess `ramesh@gmail.com`. Resolution code path: [../backend/services/email_service.py](../backend/services/email_service.py).

## 2. Message body — never paraphrased without flag

The Gmail send path takes the user's spoken body verbatim. If the user asks Vaani to *draft* a message, Vaani composes it and **reads it back word-for-word** before sending. The model's output is never silently substituted for the user's words once a draft has been confirmed.

## 3. Action timestamp — never invented

Every email-send, emergency trigger, pair-issue, and admin keep-alive carries a server-generated timestamp. The frontend may display a local-time rendering, but the audit-of-record timestamp comes from the backend. See [../DATABASE.md](../DATABASE.md) for the timestamp columns in `oauth_tokens`, `relay_events`, and `feedback_log`.

## 4. Emergency contact names — stored, never invented

Trusted-circle entries are added during onboarding pairing ([../backend/routes/emergency.py](../backend/routes/emergency.py) `pair/issue` → `pair/accept`). At emergency time, Vaani reads names from the `pairs` table. If a name is missing, Vaani says *"calling your first paired contact"* rather than inventing a relationship label.

## 5. Emergency contact numbers — stored, never invented

Same rule for the number itself. If a trusted-circle entry got corrupted, Vaani refuses to dial rather than guess. A cop-number entry is hard-refused by `is_cop_number()` even if stored.

## 6. Legal disclaimer — never omitted

`_enforce_disclaimer()` in [../backend/services/vaani_service.py](../backend/services/vaani_service.py) appends `Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.` if the model forgot. The frontend reads it aloud after every turn.

## 7. Identity line — never omitted on outbound calls

*"I am Chitti, an AI assistant for [user name]."* This is in the system prompt and enforced again at the call-screen layer in Phase 2.
