# Eval — Rights mapping (target ≥ 95%)

- **What:** does `rightsCoach(topic)` return the correct statutory rights + basis + first
  steps for each persona/situation?
- **Method:** reference rights set per topic (arrest, employee, tenant, women, senior,
  consumer, cyber, student) vs the KB.
- **Status:** 🟢 deterministic — asserted in `tools/legal_os_engine_test.mjs` (arrest cites
  BNSS, ≥5 rights, helpline present; women found).
- **Maintenance:** rights tied to BNS/BNSS/BSA 2023 — re-validate on statutory amendment.
