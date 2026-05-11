# OBSERVABILITY — Chitti Vaani Android

How we know the app is working in the field — without violating DPDP Act 2023 or the user's trust.

## Signals we collect

### 1. `vaani_audit.log` (on-device, app-private storage)

The primary observability artefact. Append-only, tamper-evident, lives in app-private storage via [`AuditLog.append()`](../app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt). Every JS bridge call, every refusal (`REFUSED-cop-autodial`, `REFUSED-unlock`, `REFUSED-pin-shape`), every permission grant timestamp, every emergency cascade step. The log **never leaves the device** unless the user explicitly exports it through the web tier. Used for debugging, DPDP receipts, and incident reconstruction.

### 2. Play Store crash reports (Google-managed)

Google Play's built-in Android Vitals captures crashes and ANRs. We opt **out** of any auto-upload that includes PII; the default crash stack-trace upload is acceptable because it contains no user content (the WebView's HTML and `localStorage` are not in the dump). Reviewed weekly during the Phase 2.6 rollout window.

### 3. FCM delivery receipts (Phase 2.5)

When the paired-Chitti relay fires [`POST /api/vaani/emergency/trigger`](../API.md#apivaaniemergency--247-cascade), the backend sends an FCM data message to the user's Android. FCM delivery receipts confirm the data message landed — not what it contained. Receipts go to backend logs, not a third-party analytics service.

### 4. Vosk wake-word miss rate (Phase 2.4)

`VaaniBootService` will record locally: total spotter activations, false positives (master said "Theek hun" within 10s), confirmed cascades. Aggregated weekly to a single counter blob the user can opt in to share. Default is **off** — counter stays on-device.

## Signals we deliberately do **not** collect

| Signal | Why not |
|---|---|
| Firebase Analytics events | Tracks user behaviour; violates DPDP minimisation principle |
| Crashlytics auto-upload of WebView state | Could leak `localStorage` contents (user token, queued messages) |
| Mic audio uploaded anywhere | Vosk runs on-device; audio never crosses the JNI boundary into an uploadable buffer (see [`ARCHITECTURE.md §3`](../ARCHITECTURE.md#3-audio-capture-pipeline)) |
| Contact list, call log content | `READ_CONTACTS` and `READ_CALL_LOG` are used **locally only**; never POSTed |
| Location | No location permission declared in [`AndroidManifest.xml`](../app/src/main/AndroidManifest.xml) |

## Rule

**No remote telemetry without explicit consent.** Consent is collected in the web tier settings UI, never via a per-launch popup. The Android shell respects whatever the web tier's `localStorage.telemetry_opt_in` says.
