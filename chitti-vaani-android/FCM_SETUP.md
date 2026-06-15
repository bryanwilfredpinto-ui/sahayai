# FCM Setup — Chitti Vaani Android
### World Class Chitti Vaani — Commando Discipline. Zero Excuses.

This document tells **Sire** exactly what to do to activate FCM (Firebase push for emergency relay).
The code is already written. You just need to drop two files and un-comment two lines.

---

## Step 1 — Create Firebase project (5 minutes)

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `chitti-vaani`
3. Disable Google Analytics (not needed)
4. Click **Add Android app**
5. Package name: `in.sahayai.chitti.vaani`
6. App nickname: `Chitti Vaani`
7. Click **Register app**
8. Download `google-services.json`
9. **Drop `google-services.json` into `chitti-vaani-android/app/`** (same folder as this file's parent)

---

## Step 2 — Un-comment build.gradle.kts (2 lines)

Open `app/build.gradle.kts`. Find this block near the bottom:

```kotlin
// implementation(platform("com.google.firebase:firebase-bom:33.1.0"))
// implementation("com.google.firebase:firebase-messaging-ktx")
```

Remove the `//` from both lines.

Also un-comment the plugin at the top of the same file:

```kotlin
// id("com.google.gms.google-services")
```

> **Note:** The plugin line needs to be added to the `plugins {}` block at the top of `app/build.gradle.kts`. Add it as a new line inside that block.

---

## Step 3 — Sync and build

In Android Studio: **File → Sync Project with Gradle Files** → wait for sync → **Build → Make Project**.

If it compiles with zero errors, FCM is live.

---

## Step 4 — Test a push (optional, from Firebase Console)

1. Firebase Console → Messaging → **Send your first message**
2. Notification title: `Test Emergency`
3. Target: your device (copy the FCM token from the AuditLog or Logcat)
4. Send — Chitti should show the emergency notification

---

## What activates automatically after this

- `ChittiFcmService.kt` registers itself and sends the FCM token to `https://sahayai.in/api/vaani/fcm/register`
- Incoming `emergency_relay` push → alarm + vibration + TTS + MainActivity to foreground
- Incoming `reminder` push → notification (from voice-scheduled reminders on other Chittis)

---

## VOSK AAR — same pattern

Drop `vosk-android-0.3.47.aar` into `app/libs/` (already created and in `.gitignore`-safe state).

Then in `app/build.gradle.kts`, un-comment:
```kotlin
// implementation("com.alphacephei:vosk-android:0.3.47@aar")
```

Also place Hindi model files in:
```
app/src/main/assets/vosk/hi/
  ├── am/
  ├── conf/
  ├── graph/
  └── ...
```

Download Hindi model from: https://alphacephei.com/vosk/models (`vosk-model-small-hi-0.22.zip`, ~50 MB)

---

*Written by Chitti CTO — 2026-06-12*
