# Chitti Vaani — Android (Phase 2 skeleton)

Native Android wrapper around the deployed Chitti Vaani web UI (`https://sahayai.in/chitti_vaani.html`). Adds the OS-level capabilities the browser cannot reach: phone lock, silent mode, day-mode call answer, night-mode auto-answer with emergency-keyword wake, autonomous WhatsApp send.

**Hard rules — enforced in code, not just policy:**

- ❌ Chitti will **never** unlock the phone. There is no `unlockPhone()` method anywhere — Android does not expose one to 3rd-party apps. `SafetyChecks.refuseUnlock()` traps any inbound JS bridge call whose name even *resembles* unlock.
- ❌ Chitti will **never** ask for or pass a UPI PIN. `SafetyChecks.refuseIfPinLike()` rejects any 4 / 6-digit string in payment-related call paths.
- ❌ The WhatsApp accessibility tap is scoped strictly to the `com.whatsapp` package and the send-button node — it requires a one-shot 2-second arm window after voice "haan" (`VaaniAccessibilityService.armWhatsAppSend()`).

## Layout

```
chitti-vaani-android/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
└── app/
    ├── build.gradle.kts
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/in/sahayai/chitti/vaani/
        │   ├── MainActivity.kt                 — WebView host + ChittiNative JS bridge
        │   ├── services/
        │   │   ├── VaaniDeviceAdminReceiver.kt — for lockNow() (no unlock)
        │   │   ├── VaaniCallScreeningService.kt— pre-ring screening (night mode)
        │   │   ├── VaaniInCallService.kt       — answer call as Chitti AI
        │   │   ├── VaaniAccessibilityService.kt— scoped autonomous WA send
        │   │   └── NightModeReceiver.kt        — 22:00 IST / 06:00 IST boundary
        │   └── util/
        │       ├── SafetyChecks.kt             — refuseUnlock / refuseIfPinLike
        │       └── AuditLog.kt                 — append-only DPDP audit log
        └── res/
            ├── xml/{device_admin, accessibility_service_config, network_security_config}.xml
            └── values/{strings, colors, themes}.xml
```

## Build (developer machine)

You need **Android Studio Iguana (2024.1.2) or newer** with **JDK 17**.

```
cd chitti-vaani-android
# First-time only: generate the gradle wrapper
gradle wrapper --gradle-version=8.7

# Build a debug APK
./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk

# Or open the folder in Android Studio: File → Open → chitti-vaani-android
```

Note the wrapper jar is intentionally NOT committed to keep the repo binary-free; `gradle wrapper` regenerates it locally.

## What this skeleton does today

- ✅ Compiles + installs as `Chitti Vaani`
- ✅ Loads `https://sahayai.in/chitti_vaani.html` in a WebView
- ✅ Forwards mic permission requests from the WebView to native runtime mic permission
- ✅ Exposes `ChittiNative.lockPhone()` / `setSilentMode()` / `requestCallScreening()` / `requestDialerRole()` / `requestAccessibility()` / `openWhatsApp()` / `openUpiPay()` to the WebView's JavaScript
- ✅ Refuses any inbound `unlockPhone()` / `bypassLock()` call with a clear `SecurityException`
- ✅ Boot-time alarm for night-mode 22:00 IST / 06:00 IST boundary
- ✅ Manifest declares all Tier A / B / C permissions Phase 2 needs

## What this skeleton does NOT do yet (next milestones)

| Milestone | Scope | Files to flesh out |
|---|---|---|
| **2.2** | Wire web UI to call `ChittiNative.lockPhone()` and the role-prompt entry points | `chitti_vaani.html` JS bridge detection (already added: `getUserToken()`; will add `if (window.ChittiNative)`-guards next) |
| **2.3** | Day-mode "Chitti, answer call" — voice-armed `call.answer()` | `VaaniInCallService.kt` + a foreground voice service (`VaaniBootService.kt`, not yet present) |
| **2.4** | Night-mode emergency-keyword spotter | Vosk integration in `VaaniCallScreeningService.kt`. Drop the `vosk-android-0.3.47.aar` into `app/libs/` and uncomment the dependency line in `app/build.gradle.kts`. Bundle the small Hindi + English models (~50 MB each) into `app/src/main/assets/vosk/`. |
| **2.5** | Federated learning upload pipeline | New `services/FedLearningSyncWorker.kt` (WorkManager) batching the IndexedDB voice samples to `/api/vaani/voice/sample` (backend endpoint TBD) |
| **2.6** | Play Store submission cycle | `app/src/main/play/` listing assets, screenshots, video walkthrough, permissions justification text |

## Compliance notes for Play Store

The `RECEIVE_SMS` / `READ_SMS` / `SEND_SMS` / `READ_CALL_LOG` permissions are on Google Play's [Restricted Permissions list](https://support.google.com/googleplay/android-developer/answer/9047303). Justification template (paste verbatim into the Permissions Declaration form):

> *"Chitti Vaani is an accessibility AI assistant for blind, deaf, mute, and illiterate users. The SMS permissions are used to read incoming SMS aloud (RECEIVE/READ) and to send SMS on the user's spoken command (SEND), in every case identifying as 'Chitti AI on behalf of [user]' in the message body. The READ_CALL_LOG permission lets Chitti tell a blind user who called recently. No SMS or call-log content is sent to any server; processing is on-device only."*

Privacy policy URL (must be live before submission):
- Suggested: `https://sahayai.in/privacy/chitti-vaani`

## Test users (during Google verification window)

While `gmail.send` is in OAuth Testing mode, only emails listed under **OAuth consent screen → Test users** in Google Cloud Console can use Phase 1.6 email send. Add Bryan + early users (max 100). Production traffic needs the CASA security audit.
