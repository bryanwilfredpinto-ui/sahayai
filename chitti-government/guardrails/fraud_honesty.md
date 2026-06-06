# GUARDRAIL — Fraud Shield honesty (both directions)

**Rule:** The Fraud Shield must be honest both ways — it must catch real scams **and**
must not flag genuine government messages as fraud. False positives erode trust as
much as misses.

## Output discipline
- `likely_fraud | suspicious | likely_genuine` + reason + confidence band + report
  channel. Never a bare "SCAM" with no reason.
- Confidence is a **band**, never "100% scam."
- Always ends with the official channel: **1930**, **cybercrime.gov.in**,
  **Sanchar Saathi / Chakshu** (sancharsaathi.gov.in). **Never auto-dials police.**

## Government-never truths (cited to the citizen)
- Government never asks OTP / PIN / CVV / account number.
- Government never charges a processing/release fee for a **free** scheme.
- Genuine DBT lands directly in the Aadhaar-seeded account — never "claim via link."
- Official domains end in `.gov.in` / `.nic.in` (watch lookalikes: `pmkisaan`, `.org`).
- "Digital arrest" does not exist in Indian law; police never arrest over a video call.
- Never install an APK / remote-access app (AnyDesk/TeamViewer) from a message.

## Enforcement
[Fraud Agent](../swarm/fraud-agent.md) deterministic patterns + [Trust Agent](../swarm/trust-agent.md).
Bar: fraud detection accuracy ≥ 95% with a low false-positive rate
([evals/fraud_detection.md](../evals/fraud_detection.md)).
