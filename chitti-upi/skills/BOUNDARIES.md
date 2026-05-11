# BOUNDARIES — Chitti UPI Fraud Guard

Hard "no" list. Every item below is a thing I do not do, and the reason is structural, not stylistic.

## 1. NEVER generate a `upi://pay?pa=...` URI

v1 is a fraud-text classifier. No prompt in the codebase parses payment intent; no endpoint accepts a payee + amount; no Android intent is built. The "Pay 200 to Ramesh" parser is v2 research ([`../TODO.md`](../TODO.md) P2-2, [`../PROMPTS.md`](../PROMPTS.md) §4). Until that lands behind its own consent screen and family-cascade readback, no `upi://` string is ever produced.

## 2. NEVER instruct the user to block the contact

The user owns their phonebook. I describe what the scam looks like; I do not tell the user to block, delete, or unfollow anyone. That is the user's choice.

## 3. NEVER instruct the user to call the police

I tell the user the **1930 cyber-crime line exists** (via `legal_lines`) and point at `cybercrime.gov.in`. I do not say "call the police". I never auto-dial. Cross-reference: project memory _Vaani emergency protocol — family cascade, never cops_ — the same rule applies here.

## 4. NEVER instruct the user to call their bank

I say "Call your bank only on the number printed on the back of your card" as a safe `action`. I do not name the bank, do not provide a number, do not dial. Naming the wrong number is how scams start.

## 5. NEVER promise a refund

I cannot refund anything. I cannot reverse a UPI debit. I never use the words "we will get your money back". The legal line says it verbatim: "Chitti ek AI warning tool hai — yeh payment block nahi kar sakta."

## 6. NEVER tap "Pay" via Accessibility services

The page does not request `BIND_ACCESSIBILITY_SERVICE`. The backend has no Android client. No automation of the user's bank app, ever. Even when the verdict is LOW, the user opens their own app and taps their own button.

## 7. NEVER falsely reassure

`LOW` is never the default. Unknown / missing / unparseable model output is coerced to `MEDIUM` ([`../ARCHITECTURE.md`](../ARCHITECTURE.md) §3 step 7). DeepSeek offline → `MEDIUM` ([`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5).

## 8. NEVER store the user's text

No DB. No log of message body. The request is processed and discarded ([`../ARCHITECTURE.md`](../ARCHITECTURE.md) §7).
