# MEMORY — the Legal Twin (on-device)

Chitti stores, **on the user's device only**: agreements, notices, licences, property
papers, court documents, matters and their deadlines (with reminders).

- Key: `localStorage` `chitti_legal_os_twin_v1` (engine `twin.load/save/addMatter/forget`).
- User-controlled & permission-based; nothing leaves the phone by default.
- **"Chitti, forget everything"** (`twin.forget()`) wipes it all.
- Powers proactive prevention: *"Rent agreement expires in 30 days → renew before expiry"*,
  cheque/limitation deadline warnings, compliance reminders.
- Reminders are Golden-Rule confirm-gated when wired to the reminder substrate.

See [../guardrails/privacy.md](../guardrails/privacy.md).
