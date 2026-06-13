🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# GUARDRAIL — Privacy (local storage only)

The user's vehicle life stays on the user's device.

- **Document Vault is `localStorage` only.** RC, insurance, PUC, DL, service bills,
  warranty, the Vehicle Twin timeline, and Ownership Scores never leave the phone.
- **No PII to any LLM.** RC number, chassis/engine number, insurance number, Aadhaar,
  location are never sent to DeepSeek or any service. The LLM only ever sees
  de-identified, user-approved context for an *explanation*.
- **Location only on explicit confirm.** Breakdown/accident location sharing passes the
  Golden Rule; otherwise location stays on device.
- **Swarm contributions are anonymised** before they ever leave — patterns only, no
  identifiers (see [../swarm/README.md](../swarm/README.md)).
- **"Chitti forget" wipes everything** — Vault, Twin, scores, reminders, and any pending
  anonymised swarm contribution. Forget means forget, everywhere.

A leaked RC/insurance/location/identifier, or PII reaching an LLM, is a **P0 incident.**

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
