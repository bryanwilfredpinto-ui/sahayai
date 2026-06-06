# EVAL — Fraud detection (gate: 95%, low false-positive)

**Claim:** the Fraud Shield classifies scheme-impersonation messages correctly.

## Method
Labelled corpus of `{message → likely_fraud | suspicious | likely_genuine}` spanning
the 8 pattern families (fake PM-Kisan e-KYC/APK, electricity-disconnection,
Aadhaar/PAN-update fee, digital-arrest, scholarship processing-fee, courier-customs,
fake DBT link, job/loan deposit) **plus genuine government SMS** (real DBT credit
notices, real PIB updates) to measure false positives.

## Pass
- Recall on fraud ≥ 95%.
- **False-positive rate low** — genuine government messages must not be flagged
  ([guardrails/fraud_honesty.md](../guardrails/fraud_honesty.md)).
- Every verdict carries reason + confidence band + report channel (1930 /
  cybercrime.gov.in / Chakshu).

## Dataset
[datasets/fraud_cases.json](datasets/fraud_cases.json).
