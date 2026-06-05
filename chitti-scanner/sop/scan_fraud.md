🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# sop/scan_fraud.md — Level 5 (SAFETY-FIRST)

**Trigger:** category = `fraud_signal` (UPI, QR, OTP, prize, lottery, KYC-update, pay-link,
refund, "click link", bank screenshot). **This trigger has supreme precedence** — it
overrides any co-detected commerce/invoice route.

**Steps**
1. Route → **UPI Fraud Guard** (`chitti_upi.html`, sessionStorage handoff) **before** anything
   else.
2. Reason explicitly names the scam signals ("I saw OTP + prize words — common scam markers").
3. Do **not** initiate any payment; UPI Guard is a classifier, not a payment intent.

**Never:** dismiss a fraud signal as "probably fine." When uncertain, escalate to Fraud
Guard. A missed fraud route on a known-scam case is a P0 ([evals/safety_eval.md](../evals/safety_eval.md)).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
