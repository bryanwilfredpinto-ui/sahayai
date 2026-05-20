# ARCHITECTURE — Chitti Vaani Android

This document covers the build system (Gradle modules + dependencies), the Activity/Service tree, ViewModel placement (planned), the always-on listening foreground service (planned), the audio capture pipeline, the JS bridge surface between the WebView and the native shell, and the networking layer that talks to `chitti-vaani-api-production.up.railway.app`.

---

## 1. Gradle module structure

The project is a **single-module Android application** today. The root [`settings.gradle.kts`](settings.gradle.kts) declares the project name and the one module:

```kotlin
rootProject.name = "Chitti Vaani"
include(":app")
```

### 1.1 Top-level [`build.gradle.kts`](build.gradle.kts)

```kotlin
plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
```

- **Android Gradle Plugin (AGP):** 8.5.2 — requires JDK 17.
- **Kotlin:** 1.9.24.
- Dependency resolution mode: `FAIL_ON_PROJECT_REPOS` — every dep must come from `google()` or `mavenCentral()`. No surprise repos.

### 1.2 [`app/build.gradle.kts`](app/build.gradle.kts)

| Setting | Value | Rationale |
|---|---|---|
| `namespace` | `in.sahayai.chitti.vaani` | Application ID + Kotlin package |
| `compileSdk` | 34 | Android 14 |
| `minSdk` | 26 | Android 8.0+, covers ~92% of Indian devices per StatCounter Q1 2026 |
| `targetSdk` | 34 | Latest target; required for Play Store from Aug 2024 |
| `versionCode` / `versionName` | 1 / 1.0.0 | Pre-launch |
| `sourceCompatibility` / `targetCompatibility` | JVM 17 | Matches AGP 8.5+ requirement |
| `buildFeatures.viewBinding` | true | Reserved for future native screens; current shell uses raw `WebView` |

### 1.3 Dependencies

Currently lean by design — most product logic lives in the embedded web UI.

| Dep | Version | Why |
|---|---|---|
| `androidx.core:core-ktx` | 1.13.1 | Kotlin extensions for Android framework |
| `androidx.appcompat:appcompat` | 1.7.0 | `AppCompatActivity` base for `MainActivity` |
| `androidx.activity:activity-ktx` | 1.9.0 | `ComponentActivity` + result APIs for future RoleManager flows |
| `androidx.webkit:webkit` | 1.11.0 | Modern WebView features (safe-browsing toggles, JS bridge hygiene) |
| `com.google.android.material:material` | 1.12.0 | Material3 components for future native screens |
| `androidx.lifecycle:lifecycle-runtime-ktx` | 2.8.4 | Coroutine scopes for `ViewModel` (planned) |
| `androidx.lifecycle:lifecycle-service:` | 2.8.4 | `LifecycleService` base for `VaaniBootService` (planned, Phase 2.3) |
| `com.alphacephei:vosk-android:0.3.47@aar` | commented out | On-device speech recognition for emergency keyword spotting (Phase 2.4). Drop the `.aar` into `app/libs/` and uncomment when wiring. |

### 1.4 Planned future modules

| Module | When | Why |
|---|---|---|
| `:feature:voice` | Phase 2.3 | Foreground service + Vosk + audio pipeline. Isolated so unit tests don't pull in the WebView. |
| `:feature:emergency` | Phase 2.5 | Cascade orchestrator. Pure Kotlin, easy to test. |
| `:data:room` | Phase 2.5 | Room database (see [DATABASE.md](DATABASE.md)). |

---

## 2. Application surface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MainActivity (foreground)                                               │
│   ├── WebView ──── loads https://sahayai.in/chitti_vaani.html           │
│   │     ▲                                                               │
│   │     │  window.ChittiNative.*       (JS → Kotlin)                    │
│   │     ▼                                                               │
│   └── ChittiNativeBridge (@JavascriptInterface methods)                 │
│         │                                                               │
│         ▼                                                               │
│      SafetyChecks / AuditLog / Android system services                  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼ system-bound (out-of-process callbacks)
┌─────────────────────────────────────────────────────────────────────────┐
│ Background system services (declared in AndroidManifest)                │
│   • VaaniDeviceAdminReceiver     — BIND_DEVICE_ADMIN, force-lock only   │
│   • VaaniCallScreeningService    — BIND_SCREENING_SERVICE, ROLE_CALL_SCREENING │
│   • VaaniInCallService           — BIND_INCALL_SERVICE, ROLE_DIALER     │
│   • VaaniAccessibilityService    — BIND_ACCESSIBILITY_SERVICE, scoped to com.whatsapp │
│   • NightModeReceiver            — BOOT_COMPLETED + NIGHT_MODE_TICK alarm │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Activities

There is one Activity. By design.

| File | Role |
|---|---|
| [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt) | Hosts the WebView, wires the JS bridge, forwards mic permission, handles WebView back navigation. Set as `LAUNCHER` in [`AndroidManifest.xml`](app/src/main/AndroidManifest.xml). |

Key WebView settings (read [`MainActivity.kt:59-65`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt)):

```kotlin
javaScriptEnabled = true
domStorageEnabled = true
mediaPlaybackRequiresUserGesture = false   // autoplay TTS
allowContentAccess = false
allowFileAccess    = false
```

The `WebChromeClient.onPermissionRequest()` override forwards `RESOURCE_AUDIO_CAPTURE` from the web tier to the runtime `RECORD_AUDIO` permission — the user is prompted **once** at install/first-use, never again per session.

### 2.2 ViewModels (planned)

Today there is no ViewModel because the Activity is purely a WebView host. Phase 2.3 introduces:

- `VoiceListenerViewModel` — holds the always-on listener state (idle / armed-for-answer / armed-for-WA-send / emergency-keyword-detected). Backed by `viewModelScope` from `lifecycle-runtime-ktx`.
- `EmergencyCascadeViewModel` — tracks cascade state machine (master-confirm-pending → alarm-firing → calling-spouse → resolved). Survives configuration changes.
- `PermissionsViewModel` — single source of truth for which Tier B/C roles the user has granted, surfaced back to the web tier via a `ChittiNative.permissionsState()` JSON blob.

These will live in `:feature:voice` and `:feature:emergency` modules respectively.

### 2.3 Services and receivers

| File | Type | Manifest binding | Trigger |
|---|---|---|---|
| [`VaaniDeviceAdminReceiver.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniDeviceAdminReceiver.kt) | `DeviceAdminReceiver` | `BIND_DEVICE_ADMIN`, `DEVICE_ADMIN_ENABLED` | User enables Device Admin in Settings |
| [`VaaniCallScreeningService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniCallScreeningService.kt) | `CallScreeningService` | `BIND_SCREENING_SERVICE`, `android.telecom.CallScreeningService` | Incoming call ringing event (pre-ring) |
| [`VaaniInCallService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniInCallService.kt) | `InCallService` | `BIND_INCALL_SERVICE`, `android.telecom.InCallService` | App is set as Default Dialer + call lifecycle events |
| [`VaaniAccessibilityService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniAccessibilityService.kt) | `AccessibilityService` | `BIND_ACCESSIBILITY_SERVICE`, scoped to `com.whatsapp` via [`accessibility_service_config.xml`](app/src/main/res/xml/accessibility_service_config.xml) | WhatsApp window content change events, single-shot 2s arm after voice "haan" |
| [`NightModeReceiver.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/NightModeReceiver.kt) | `BroadcastReceiver` | `BOOT_COMPLETED` + custom `in.sahayai.chitti.vaani.NIGHT_MODE_TICK` | Device boot, or `AlarmManager` exact-allow-while-idle at 22:00 / 06:00 IST |

### 2.4 Foreground service for always-on listening (planned, Phase 2.4)

Phase 2.4 introduces `VaaniBootService` — a `FOREGROUND_SERVICE_PHONE_CALL` foreground service that:

1. Starts on boot (via `NightModeReceiver` chaining) and on first launch.
2. Acquires a partial `WAKE_LOCK` and holds a persistent notification ("Chitti is listening for emergencies").
3. Runs the **Vosk** on-device speech recognizer against the mic stream.
4. Spotter keywords: `emergency`, `ambulance`, `hospital`, `accident`, `bachao`, `madad`, `dard` — multi-language list. Audio **never leaves the device**.
5. On a hit, fires:
   - `ChittiNativeBridge.triggerEmergencyAlarm()` for the STREAM_ALARM bypass
   - POST to `/api/vaani/emergency/trigger` for the paired-Chitti relay
   - Outbound dial to the first trusted-circle number via `ChittiNative.makeCall()`

Service declaration to be added to [`AndroidManifest.xml`](app/src/main/AndroidManifest.xml) at Phase 2.4:

```xml
<service
    android:name=".services.VaaniBootService"
    android:foregroundServiceType="phoneCall"
    android:exported="false"/>
```

`FOREGROUND_SERVICE_PHONE_CALL` is already declared at the manifest top, so this addition is purely the `<service>` block.

---

## 3. Audio capture pipeline

```
┌──────────────────┐   onPermissionRequest()    ┌──────────────────────────┐
│   WebView UI     │  ─────────────────────────►│  RECORD_AUDIO runtime    │
│   getUserMedia() │                            │  permission              │
└──────────────────┘                            └──────────────────────────┘
        │                                                  │
        │ Web Speech API (online,                          │ AudioRecord
        │  via DeepSeek STT proxy)                         │   16 kHz, 16-bit
        ▼                                                  ▼
┌──────────────────┐                            ┌──────────────────────────┐
│  Web tier voice  │                            │  Vosk recogniser         │
│  pipeline        │                            │  (planned, Phase 2.4)    │
│  (Phase 1, live) │                            │  on-device only          │
└──────────────────┘                            └──────────────────────────┘
                                                            │
                                                            ▼ keyword hit
                                          fires EmergencyCascadeViewModel
```

Two pipelines coexist:

1. **Online voice pipeline** — runs in the WebView. Uses `getUserMedia()` + Web Speech API for STT, or streams audio chunks to the backend's DeepSeek STT proxy. Used for all conversational queries.
2. **On-device emergency-keyword spotter** — runs in `VaaniBootService` (planned). Uses Vosk's `Recognizer` against an `AudioRecord` stream. Bypasses the WebView. **Privacy-critical**: audio never crosses the JNI boundary into any uploadable buffer.

The two pipelines share the **same mic** — Android's `AudioRecord` is mutually exclusive between processes, so the WebView's `MediaRecorder` and the service's `AudioRecord` must coordinate. The plan (Phase 2.4): the service uses Vosk's low-bandwidth feature path; when the WebView wants the mic, the service drops to silent and resumes on release.

---

## 4. JavaScript bridge surface (`window.ChittiNative`)

Exposed from [`ChittiNativeBridge`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt) via `web.addJavascriptInterface(..., "ChittiNative")`. Every method is `@JavascriptInterface`-annotated. ProGuard keeps these via [`proguard-rules.pro`](app/proguard-rules.pro).

| JS call | Kotlin → does | Returns |
|---|---|---|
| `canHostNative()` | Feature probe | `true` |
| `lockPhone()` | `DevicePolicyManager.lockNow()` if Device Admin granted | `"locked"` / `"needs_device_admin"` |
| `requestDeviceAdmin()` | Opens Settings → Device admin apps | `"prompt_shown"` |
| `setSilentMode(on)` | `AudioManager.RINGER_MODE_SILENT/NORMAL` after `NotificationPolicyAccess` | `"silent"` / `"ring"` / `"needs_notification_policy"` |
| `requestNightMode()` | Broadcasts `NIGHT_MODE_TICK` to schedule alarms | `"scheduled"` |
| `requestCallScreening()` | `RoleManager.createRequestRoleIntent(ROLE_CALL_SCREENING)` | `"prompt_shown"` / `"unsupported_on_this_android"` |
| `requestDialerRole()` | `RoleManager.createRequestRoleIntent(ROLE_DIALER)` | same as above |
| `requestAccessibility()` | `Settings.ACTION_ACCESSIBILITY_SETTINGS` | `"settings_opened"` |
| `makeCall(phoneE164)` | `ACTION_CALL` if `CALL_PHONE` granted, else `ACTION_DIAL` | `"dialing"` / `"needs_permission"` |
| `requestCallPhonePermission()` | Runtime `CALL_PHONE` prompt | `"prompt_shown"` |
| `openWhatsApp(phoneE164, message)` | `wa.me/<num>?text=<msg>` intent to `com.whatsapp` | `"opened"` |
| `openUpiPay(payeeUpi, payeeName, amountInr, note)` | `upi://pay?…` intent | `"opened"` |
| `triggerEmergencyAlarm(reason)` | `STREAM_ALARM` ringtone + long-pulse vibration | `"alarm_fired"` / `"alarm_error:..."` |
| `refuseAutoDialCops()` | Audit-log only — structural fence | `"REFUSED — ..."` |
| `unlockPhone()` / `bypassLock()` | Throws `SecurityException` via `SafetyChecks.refuseUnlock()` | (never returns) |

Every method calls `SafetyChecks.requireNotUnlock(name)` first where applicable, and every successful action appends to [`AuditLog`](app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt).

---

## 5. Networking layer

Today there is **no native networking** — all HTTP traffic flows from the WebView to `chitti-vaani-api-production.up.railway.app` and `sahayai.in`. The web tier uses standard `fetch()` and benefits from the OS HTTP stack.

Outbound endpoints called from the WebView are documented in [API.md](API.md).

### 5.1 Planned native networking (Phase 2.4 — emergency cascade, Phase 2.5 — federated learning upload)

When the foreground service needs to POST `/api/vaani/emergency/trigger` **while the WebView is paused** (phone locked, app backgrounded), it cannot rely on the WebView's `fetch()`. Plan:

| Layer | Choice | Why |
|---|---|---|
| HTTP client | **OkHttp 4.x** | Industry standard, plays nicely with Vosk + WorkManager |
| Serialization | **kotlinx.serialization** | Lightweight, no reflection at runtime |
| Service interface | **Retrofit 2.x** | Type-safe Kotlin DSL; isolates URL strings in one place |
| Background work | **WorkManager 2.9+** | Guaranteed delivery across boot for `FedLearningSyncWorker` |
| Network security | [`network_security_config.xml`](app/src/main/res/xml/network_security_config.xml) — `cleartextTrafficPermitted="false"` | All traffic to `sahayai.in` and `chitti-vaani-api-production.up.railway.app` is HTTPS only |

Retrofit interface sketch (lives in `:feature:emergency` once introduced):

```kotlin
interface VaaniApi {
    @POST("/api/vaani/emergency/trigger")
    suspend fun triggerEmergency(@Body req: EmergencyRequest): EmergencyResponse

    @GET("/api/vaani/emergency/poll")
    suspend fun pollRelay(@Query("user_token") token: String): RelayEvents
}
```

### 5.2 Off-network P2P transfer (Phase 2.7 — `:feature:transfer`)

Locked 2026-05-15. Spec: [`../CHITTI_OFFLINE_TRANSFER_SPEC.md`](../CHITTI_OFFLINE_TRANSFER_SPEC.md). Skill file: [`skills/FILE_TRANSFER.md`](skills/FILE_TRANSFER.md).

The transfer module is the **only path in this app that does not require internet**. It uses **Google Nearby Connections** (`com.google.android.gms:play-services-nearby:19.x`) — same primitive Google Quick Share is built on. Two tracks share the module:

1. **Emergency-relay offline tier** — `VaaniBootService` (Phase 2.4) advertises in parallel with the FCM POST in §5.1 when the on-device keyword spotter fires. Auth-code step skipped because the `cascadeJSON` payload is signed with the sender's paired-Chitti private key.
2. **General share** — substrate `chitti_share.js` at the repo root surfaces Share / Receive on every Chitti page.

| Layer | Choice | Why |
|---|---|---|
| Discovery + transport | **Google Nearby Connections** (`play-services-nearby:19.x`) | Picks BT / BLE / Wi-Fi Direct internally based on payload size + range; one-tap auto-discovery by service-id; same primitive Quick Share uses. |
| Foreground hold | **`FOREGROUND_SERVICE_DATA_SYNC` foreground service** | Keeps the transfer alive when the WebView pauses or the user backgrounds the app. |
| Auth (general) | **Nearby's 4-digit OOB code**, spoken aloud + voice "haan" | A11y-first; works for blind / illiterate users without device pickers. |
| Auth (emergency) | **Ed25519 signature** with paired-Chitti private key | Receiver verifies before firing alarm; auth-code skipped. |
| Honest stub | Return `"transfer_unsupported_no_play_services"` on AOSP / GMS-less devices | Same pattern as `triggerEmergencyAlarm`'s error path. |
| Bridge surface | 7 new `ChittiNative.*` methods (see [§4](#4-javascript-bridge-surface-windowchittinative)) | Same `SafetyChecks` → action → `AuditLog` discipline. |

Permission delta is documented in [`../CHITTI_OFFLINE_TRANSFER_SPEC.md §6`](../CHITTI_OFFLINE_TRANSFER_SPEC.md) — critically, `neverForLocation` flags on `BLUETOOTH_SCAN` and `NEARBY_WIFI_DEVICES` mean we **do not** add `ACCESS_FINE_LOCATION`. Ships as a separate Play Store submission after Phase 2.6 lands ([`TODO.md` Phase 2.7](TODO.md)).

---

## 6. Permission model — install-time, runtime, and special roles

See [`AndroidManifest.xml`](app/src/main/AndroidManifest.xml) for the canonical list and [`CHITTI_VAANI_PHASE2_ANDROID_SPEC.md`](../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md) for the policy-tier rationale.

| Tier | Examples | Granted via | Code path |
|---|---|---|---|
| **A** (install-time) | `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `VIBRATE`, `WAKE_LOCK`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_PHONE_CALL`, `RECEIVE_BOOT_COMPLETED` | Manifest declaration | n/a |
| **B** (runtime-prompted) | `READ_CONTACTS`, `READ_PHONE_STATE`, `POST_NOTIFICATIONS`, `ANSWER_PHONE_CALLS`, `READ_CALL_LOG`, `CALL_PHONE`, `RECEIVE_SMS`, `READ_SMS`, `SEND_SMS` | `ActivityCompat.requestPermissions()` | Triggered from `ChittiNativeBridge.requestCallPhonePermission()` etc., or from web onboarding |
| **C** (special role / setting) | `BIND_DEVICE_ADMIN`, `ROLE_CALL_SCREENING`, `ROLE_DIALER`, `BIND_ACCESSIBILITY_SERVICE` | Settings deep-links or `RoleManager.createRequestRoleIntent()` | `ChittiNativeBridge.requestDeviceAdmin / requestCallScreening / requestDialerRole / requestAccessibility` |

### 6.1 Hard-refusal permissions

There is **no manifest entry** for any unlock / lock-pattern-modify permission. Android does not expose those to third-party apps. The absence is the guarantee.

---

## 7. Resources

| File | Role |
|---|---|
| [`res/xml/device_admin.xml`](app/src/main/res/xml/device_admin.xml) | Declares **only** `force-lock` — explicitly no `reset-password`, no `wipe-data`. |
| [`res/xml/accessibility_service_config.xml`](app/src/main/res/xml/accessibility_service_config.xml) | Scopes the AccessibilityService to `com.whatsapp` only, `canPerformGestures="false"`, `canRetrieveWindowContent="true"`. |
| [`res/xml/network_security_config.xml`](app/src/main/res/xml/network_security_config.xml) | Forbids cleartext traffic. |
| [`res/values/strings.xml`](app/src/main/res/values/strings.xml) | All user-facing strings — including Device Admin description that reads "Chitti will NEVER unlock — Android does not expose any unlock API to apps." |
