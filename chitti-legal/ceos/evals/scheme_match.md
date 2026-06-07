# Eval — Free-legal-aid / entitlement match (target ≥ 90%)

- **What:** does `legalAid(profile)` correctly identify s.12 LSA Act eligibility, and does
  `govtLegalLayer(topic)` return the right free helplines?
- **Method:** category test set (woman → always eligible; child <18; SC/ST; disabled;
  senior; custody; disaster; industrial; low-income < state limit).
- **Status:** 🟢 deterministic — asserted in `tools/legal_os_engine_test.mjs` (woman
  eligible + category; low-income eligible; advice offered even when not in a category).
- **The moat metric:** count of FREE-aid referrals surfaced (free help the user was owed).
