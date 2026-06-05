🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# guardrails/privacy.md

> DPDP Act 2023 + IT Rules 2021 + the Camera Intelligence user-ownership contract
> ([§2b](../../SAHAYAI_MASTER.md)).

## Rules

- **Local-first.** Scan history, Universal Memory, and the local Family Graph live in the
  browser and **never leave the device** unless the user opts into cross-device sync.
- **Stateless backend.** Raw images are processed in-memory, never persisted server-side.
- **KYC masking.** Aadhaar / PAN / account numbers are read back **masked (last 4 only)**
  in the UI and never stored raw.
- **No write until verified.** No backend write until the Turso shim is verified on
  chitti-scanner (RED item). Cross-device features stay COMING SOON.
- **Anonymise before aggregate.** Camera-intelligence captures drop the user token + round
  GPS to pincode centroid before any cross-user analysis.
- **"Chitti forget" deletes all** — voice or button wipes every capture for the user token;
  a tombstone replaces the row so aggregate counts stay honest.
- **Never sold.** No third-party access, no ad targeting. Community alert + annual FSSAI
  report are the only outward flows, both anonymised.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
