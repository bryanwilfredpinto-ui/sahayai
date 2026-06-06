🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# GUARDRAIL — Privacy (DPDP Act 2023)

## What stays on the device — always
- **Wardrobe photos NEVER leave the device.** Stored in browser IndexedDB; only a short **text**
  snapshot (category:colour:occasion) can reach the optional model. Photos are never transmitted, never used for AI training.
- **Profile, preferences, learning, impact ledger, size** — `localStorage`, on-device only.
- **No account, no server-side PII, no auth required** — there is nothing to breach server-side.

## Consent + control
- First-visit consent notice (DPDP-compliant) before any capture.
- **"Chitti forget"** deletes all on-device data.
- Family "wearers" are multiple profiles on **one** device — no cross-device sync (by design).

## Honest gaps
- `localStorage` is **not encrypted** (data class is non-sensitive style prefs — KI-05).
- No export/import yet (KI-06).

## Verified
No API keys in the frontend (grep-verified); `esc()` output-encoding ×109 (XSS); axe-core 0 violations.
See [../observability/logs.md](../observability/logs.md) for what is (not) logged.
