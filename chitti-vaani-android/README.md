# Chitti Vaani — Android (Phase 2)

Native Android client for **Chitti Vaani**, Sahay AI's voice-first assistant for blind, deaf, mute, and illiterate users. This is the Phase 2 native implementation of the spec at [`CHITTI_VAANI_PHASE2_ANDROID_SPEC.md`](../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md) (repo root). The Phase 1 web app lives at [`../chitti-vaani/`](../chitti-vaani/) and is deployed at `https://sahayai.in/chitti_vaani.html`.

> **Why a native client?** The Phase 1 web app does everything voice-first inside the browser, but the browser cannot lock the phone, cannot intercept incoming calls, cannot keep a microphone open after the screen is locked, and cannot tap-send autonomously inside another app. Phase 2 wraps the existing web UI in a native shell that adds **exactly** those OS-level capabilities — nothing more.

---

## Product surface — what this app does

| # | Capability | OS surface used | Status |
|---|---|---|---|
| 1 | Lock the phone on voice command | `DevicePolicyManager.lockNow()` + Device Admin | Live (skeleton) |
| 2 | **Refuse all unlock commands by code** | Hard-coded `SafetyChecks.refuseUnlock()`; no API surface | Live, enforced |
| 3 | Toggle silent / ring mode | `AudioManager.setRingerMode()` + NotificationPolicyAccess | Live |
| 4 | Day-mode auto-answer ("Chitti, uthao") | `InCallService` + `ROLE_DIALER` | Phase 2.3 (stub) |
| 5 | Night-mode auto-answer + emergency-keyword wake | `CallScreeningService` + Vosk on-device | Phase 2.4 (stub) |
| 5b | 24/7 emergency cascade — **family only, never cops** | `STREAM_ALARM` bypass + `/api/vaani/emergency/*` relay | Live (alarm + manifest); relay pending |
| 6 | Email read/send as Chitti | WebView → Phase 1.6 `/api/vaani/email/*` | Live (web tier) |
| 7 | WhatsApp autonomous send after voice "haan" | `AccessibilityService` scoped to `com.whatsapp` send button | Live (skeleton; not wired to voice arm yet) |
| 8 | UPI deep-link payment | `upi://pay?…` intent | Live |
| 9 | Outbound call | `ACTION_CALL` (direct-dial) or `ACTION_DIAL` (fallback) | Live |
| 10 | Federated voice-sample upload | WorkManager (TBD) → backend | Phase 2.5 (not started) |

The conversational layer (DeepSeek reply, voice IN/OUT, language selector, emergency-keyword monitor, paired-Chitti relay UI) is rendered by the existing web UI, embedded in a `WebView` inside [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt). The native shell exposes a JavaScript bridge (`window.ChittiNative`) that the web tier feature-detects with `if (window.ChittiNative)`.

---

## Hard rules — enforced in code, not just policy

1. **No unlock.** There is no `unlockPhone()` method anywhere — the OS does not expose one to 3rd-party apps. [`SafetyChecks.refuseUnlock()`](app/src/main/java/in/sahayai/chitti/vaani/util/SafetyChecks.kt) traps any inbound JS bridge call whose name resembles `unlock | kholo | khol do | bypassLock`.
2. **No UPI PIN handling.** [`SafetyChecks.refuseIfPinLike()`](app/src/main/java/in/sahayai/chitti/vaani/util/SafetyChecks.kt) rejects any 4 / 6-digit string in payment-related call paths.
3. **No cop dialing.** [`ChittiNativeBridge.refuseAutoDialCops()`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt) refuses any auto-dial to 112 / 100 / 102 / 108 / 1098 / 1930 / 139. Cascade is **family only** — see [Vaani emergency protocol](../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md#5b).
4. **WhatsApp accessibility tap is scoped to one node.** Only fires on the WhatsApp send-button node, inside a 2-second arm window after voice "haan" ([`VaaniAccessibilityService.armWhatsAppSend()`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniAccessibilityService.kt)). Refuses if any sibling node text looks PIN-shaped.

---

## Repository layout

```
chitti-vaani-android/
├── settings.gradle.kts             — Gradle multi-project root (single :app module today)
├── build.gradle.kts                — Top-level Gradle config; AGP 8.5.2 + Kotlin 1.9.24
├── gradle.properties               — JVM args + AndroidX flags
└── app/
    ├── build.gradle.kts            — namespace, minSdk 26, targetSdk 34, deps
    ├── proguard-rules.pro          — keep @JavascriptInterface methods
    └── src/main/
        ├── AndroidManifest.xml     — permissions (Tier A/B/C), receivers, services
        ├── java/in/sahayai/chitti/vaani/
        │   ├── MainActivity.kt                 — WebView host + ChittiNative JS bridge
        │   ├── services/
        │   │   ├── VaaniDeviceAdminReceiver.kt — BIND_DEVICE_ADMIN; lockNow() only
        │   │   ├── VaaniCallScreeningService.kt— pre-ring screening (night mode)
        │   │   ├── VaaniInCallService.kt       — day-mode answer-call flow
        │   │   ├── VaaniAccessibilityService.kt— scoped autonomous WA send
        │   │   └── NightModeReceiver.kt        — 22:00 / 06:00 IST boundary
        │   └── util/
        │       ├── SafetyChecks.kt             — refuseUnlock / refuseIfPinLike
        │       └── AuditLog.kt                 — append-only DPDP audit log
        └── res/
            ├── xml/{device_admin, accessibility_service_config, network_security_config}.xml
            └── values/{strings, colors, themes}.xml
```

For module mapping, foreground services, audio pipeline, and ViewModel placement see [ARCHITECTURE.md](ARCHITECTURE.md).
For permissions taxonomy and accessibility user contract see [CONTEXT.md](CONTEXT.md).
For backend endpoints called see [API.md](API.md).
For Room/SQLite plan see [DATABASE.md](DATABASE.md).
For outstanding milestones see [TODO.md](TODO.md).
For commit history see [CHANGELOG.md](CHANGELOG.md).

---

## Build

Requires **Android Studio Iguana (2024.1.2) or newer** with **JDK 17**.

```bash
cd chitti-vaani-android

# First-time only: generate the gradle wrapper (intentionally not committed)
gradle wrapper --gradle-version=8.7

# Build a debug APK
./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk

# Or open the folder in Android Studio: File → Open → chitti-vaani-android
```

The gradle wrapper jar is intentionally **not** committed to keep the repo binary-free; `gradle wrapper` regenerates it locally.

---

## What this skeleton does today

- Compiles and installs as **Chitti Vaani**.
- Loads `https://sahayai.in/chitti_vaani.html` in a WebView (cleartext blocked by [`network_security_config.xml`](app/src/main/res/xml/network_security_config.xml)).
- Forwards mic permission from WebView to runtime `RECORD_AUDIO`.
- Exposes `ChittiNative.lockPhone()` / `setSilentMode()` / `requestCallScreening()` / `requestDialerRole()` / `requestAccessibility()` / `openWhatsApp()` / `openUpiPay()` / `makeCall()` / `triggerEmergencyAlarm()` / `refuseAutoDialCops()` to JavaScript.
- Refuses any inbound `unlockPhone()` / `bypassLock()` call with `SecurityException`.
- Boot-time alarm for the night-mode boundary at 22:00 IST and 06:00 IST.
- Manifest declares all Tier A / B / C permissions Phase 2 needs.

For what is **not** done yet, see [TODO.md](TODO.md).

---

## Play Store compliance

The `RECEIVE_SMS` / `READ_SMS` / `SEND_SMS` / `READ_CALL_LOG` permissions are on Google Play's [Restricted Permissions](https://support.google.com/googleplay/android-developer/answer/9047303) list. The accessibility service will additionally face a manual policy review. Justification template lives at [`CHITTI_VAANI_PHASE2_ANDROID_SPEC.md`](../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md#compliance-lines-that-must-show-on-the-android-apps-play-store-listing).

Privacy policy URL (must be live before submission): `https://sahayai.in/privacy/chitti-vaani`.
