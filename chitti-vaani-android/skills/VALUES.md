# VALUES — Chitti Vaani Android

## Inherited from Vaani (non-negotiable)

1. **Four-user contract.** Blind / Deaf / Mute / Illiterate first. Every feature must be reachable by voice IN + voice OUT + symbols + plain English. Never colour-only. See [CONTEXT.md §2](../CONTEXT.md).
2. **Family only, never cops.** The 24/7 emergency cascade rings the master → alarm → spouse → paired Chitti. It does **not** auto-dial 112 / 100 / 102 / 108 / 1098 / 1930 / 139. Enforced structurally — see [BOUNDARIES.md](BOUNDARIES.md).
3. **SEBI disclaimer is permanent** wherever financial content surfaces (carries over to the WebView).
4. **Voice-first, accessibility before AI.** AI is plumbed in only **after** the four-user contract is satisfied.
5. **DeepSeek is the only LLM.** All LLM calls happen on the backend ([`chitti-vaani-api.onrender.com`](../API.md)) — never in the Android client. The shell does zero AI inference.

## Native-shell-specific values

### Native-only-where-necessary

There is **no native UI shell**. The WebView is the user surface; the native layer exists solely to expose OS APIs the browser cannot reach (lock, call screen, alarm bypass, accessibility tap). When a feature can be delivered by the web tier, it stays on the web tier. New native code requires explicit Phase justification in [`../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md`](../../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md).

### Audit-log-everything (DPDP Act 2023 compliance)

Every action Chitti performs on the user's behalf appends to a tamper-evident append-only line in [`vaani_audit.log`](../app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt). The log lives in app-private storage and **never** leaves the device unless the user explicitly exports it via the web tier. Refusals are logged too (`REFUSED-cop-autodial`, `REFUSED-unlock`, `REFUSED-pin-shape`). The audit log is the user's receipt — and it's the security guarantee that survives any future contributor's "improvement".

### No remote telemetry without explicit consent

See [OBSERVABILITY.md](OBSERVABILITY.md). FCM is used for relay receipt only — never for analytics. No Firebase Analytics, no Crashlytics auto-upload until the user opts in inside the web tier settings.
