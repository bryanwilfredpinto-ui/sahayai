# SKILL 7 — Fraud Detection (Government Fraud Shield)

Classify SMS/WhatsApp/email/call as `likely_fraud | suspicious | likely_genuine` +
reason + confidence band + report channel. Deterministic patterns over 8 scam families
(fake PM-Kisan e-KYC/APK, electricity-disconnection, Aadhaar/PAN-update fee,
digital-arrest, scholarship processing-fee, courier-customs, fake DBT link, job/loan
deposit). States the government-never truths (no OTP, no fee for free schemes,
.gov.in only, no digital arrest, no APK installs). Always ends with **1930 /
cybercrime.gov.in / Sanchar Saathi–Chakshu**; **never auto-dials police**. Honest both
ways — genuine messages must not be flagged
([guardrails/fraud_honesty.md](../guardrails/fraud_honesty.md)). Backed by
[Fraud Agent](../swarm/fraud-agent.md).
