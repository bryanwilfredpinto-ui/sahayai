# GUARDRAILS — Chitti Vaani Android

Guardrails are the runtime state Chitti checks before acting and the artefacts it produces after acting. Where [BOUNDARIES.md](BOUNDARIES.md) lists structural refusals, this file lists the **mutable state** that gates day-to-day behaviour.

## On-device state Chitti consults

### 1. Emergency contact phone numbers

Stored on-device in WebView `localStorage` (Phase 1) and mirrored to the planned Room database (Phase 2.5 — see [DATABASE.md](../DATABASE.md)). The cascade dials these in priority order: master → spouse → family-1 → family-2. Numbers **never** leave the device unless the user explicitly invokes the paired-Chitti relay at [`POST /api/vaani/emergency/trigger`](../API.md#apivaaniemergency--247-cascade), which only sends a `user_token` — not the dialled number.

### 2. Audit log entries

[`vaani_audit.log`](../app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt) is **append-only** and tamper-evident. Every JS bridge invocation appends a line: timestamp, method, args (PIN-shape redacted), result. Refusals are first-class log entries (`REFUSED-cop-autodial`, `REFUSED-unlock`, `REFUSED-pin-shape`). The log lives in app-private storage; export is web-tier-only and user-initiated. This is the DPDP Act 2023 receipt.

### 3. Gmail token presence — sync state with web tier

The Android shell does not store the Gmail OAuth token natively. The web tier handles Phase 1.6 OAuth and persists state server-side keyed by `user_token` (see [`/api/vaani/email/status`](../API.md#apivaaniemail--gmail-oauth--send-as-user)). Chitti checks token presence by calling that endpoint before claiming "I can email Bob now". If absent, Chitti says "Connect your Gmail first" and surfaces the web tier's connect button — it does not silently retry.

### 4. Permission grant timestamps

For every Tier B / C permission ([CONTEXT.md §6](../ARCHITECTURE.md#6-permission-model--install-time-runtime-and-special-roles)), the audit log records the grant timestamp on first acceptance. `PermissionsViewModel` (planned, Phase 2.3) exposes a `ChittiNative.permissionsState()` JSON blob to the web tier so it can render "You haven't granted Notification Policy access yet — voice 'open settings' to grant" without re-prompting per-action. This is the onboarding-grant pattern from the user's [PWD-perspective design memory](../../CHITTI_TECHNICAL_MASTER_SPEC.md).

## Guardrail evaluation order

Before every native bridge call: `SafetyChecks.requireNotUnlock(name)` → permission state check → readback prompt → action → audit log append. Failure at any step writes a `REFUSED-*` or `ABORTED-*` line.
