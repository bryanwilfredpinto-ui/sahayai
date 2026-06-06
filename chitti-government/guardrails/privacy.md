# GUARDRAIL — Privacy (Citizen data never leaves the device unbidden)

**Rule:** The [Citizen Digital Twin](../memory/citizen_digital_twin.md) lives in
`localStorage`. It is sent to a server **only** as anonymous JSON for one eligibility
evaluation, never stored server-side, never sold. Target bar: **100%**.

## Never collected / never required
- Aadhaar **number**, OTP, UPI PIN, bank account number, card details — Chitti never
  needs these to *help* you. (Document *presence* yes; document *numbers* no.)
- No login required to use any feature.

## Contracts
- **"Chitti forget"** wipes the Twin (tombstone preserved for honest counts).
- Eligibility POST payload is anonymised (no name/contact) — see [API.md](../API.md).
- Camera captures follow the [camera-intelligence contract](../../SAHAYAI_MASTER.md)
  (§2b): anonymised before any aggregate, user-owned, forgettable.
- Aligns with DPDP 2023 consent-first + data-minimisation; mirrors DigiLocker/Aadhaar
  consent and Code-for-America privacy-by-design.

## Enforcement
[Memory Agent](../swarm/memory-agent.md) holds the Twin on-device;
[Trust Agent](../swarm/trust-agent.md) blocks any answer requesting unnecessary PII.
