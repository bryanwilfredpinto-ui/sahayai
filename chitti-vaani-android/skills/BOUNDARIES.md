# BOUNDARIES — Chitti Vaani Android

These are **code-level hard refusals**, not policy. Each one short-circuits in Kotlin and writes a `REFUSED-*` line to [`vaani_audit.log`](../app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt). A future contributor who tries to "improve" any of them gets the same refusal at runtime. See [CONTEXT.md §0](../CONTEXT.md) for the canonical statement.

## The four structural fences

### 1. `refuseAutoDialCops()`

Location: [`ChittiNativeBridge` in `MainActivity.kt`](../app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt). Blocks any auto-dial to **112, 100, 101, 102, 108, 1098, 1930, 139** — the COP_DENYLIST in the web tier's `emergency_service`. Even if the LLM prompt or a future code path requests it, the call is refused and audit-logged. The Vaani cascade is family only (see [`project_chitti_vaani_emergency_protocol`](../CONTEXT.md#3-the-vaani-emergency-protocol-family-only-never-cops)).

### 2. No unlock surface

Location: [`SafetyChecks.refuseUnlock()`](../app/src/main/java/in/sahayai/chitti/vaani/util/SafetyChecks.kt). No `BIND_DEVICE_ADMIN` policy exposes unlock. The Device Admin XML declares **only** `force-lock` — explicitly no `reset-password`, no `wipe-data`. Inbound JS bridge calls matching `unlock | kholo | khol do | bypassLock` throw `SecurityException`. Android itself does not expose an unlock API to third-party apps; this fence makes the absence explicit and audited.

### 3. PIN-shape filtering in `VaaniAccessibilityService`

Location: [`VaaniAccessibilityService.kt`](../app/src/main/java/in/sahayai/chitti/vaani/services/VaaniAccessibilityService.kt) + [`SafetyChecks.refuseIfPinLike()`](../app/src/main/java/in/sahayai/chitti/vaani/util/SafetyChecks.kt). Any accessibility node whose IME shape matches a 4–6 digit numeric PIN entry is dropped before reaching the LLM or audit log. Sibling-node PIN detection refuses the WhatsApp tap if a payment-entry field is visible. Chitti never captures, echoes, or relays a UPI PIN.

### 4. Single-shot WhatsApp tap with 2s arm window

Location: [`VaaniAccessibilityService.armWhatsAppSend()`](../app/src/main/java/in/sahayai/chitti/vaani/services/VaaniAccessibilityService.kt). The AccessibilityService is scoped via [`accessibility_service_config.xml`](../app/src/main/res/xml/accessibility_service_config.xml) to `com.whatsapp` only, `canPerformGestures="false"`, `canRetrieveWindowContent="true"`. It fires on **exactly one node** (`com.whatsapp:id/send`), inside a 2-second window after voice "haan", then re-disarms. This is not a generic auto-tap surface — it cannot become one without re-writing the manifest scope.

## Why these are code-level, not policy

A policy can be quietly dropped in a refactor. A `SecurityException` cannot. The fences are JUnit-testable independently of the Android Framework (see [`TODO.md` cross-cutting](../TODO.md#cross-cutting--housekeeping)).
