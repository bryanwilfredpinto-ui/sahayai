# Guardrail — privacy & data ownership

- **Legal Twin is on-device first.** Documents, matters and deadlines live in
  `localStorage` (`chitti_legal_os_twin_v1`). Nothing leaves the phone by default.
- **"Chitti, forget everything"** (`twin.forget()`) wipes it all — matches the Vaani
  forget-me semantics and the [Camera Intelligence](../../../SAHAYAI_MASTER.md) contract.
- **Never sold, never ad-targeted** (Trust > Revenue).
- **Legal matters are sensitive.** No document content is sent to any server by default;
  only anonymised quality signals (👍/👎) reach the Founder dashboard.
- **DPDP Act 2023 posture.** Purpose-limited, consent-based, user-controlled, deletable.
- When server features land (BO11), per-Chitti Turso via the direct-HTTPS shim stores
  feedback/quality only — never the user's legal documents.
