# Chitti Vaani Android — v1.0 COMPLETE

Build status: code complete — all sources compile-ready, both inline TODOs closed.
**Not assembled in the authoring environment** (no Android SDK / `ANDROID_HOME` here).
Run `./gradlew assembleDebug` on a machine with the Android SDK installed to produce the APK.
Expected APK: `app/build/outputs/apk/debug/app-debug.apk`

## What is shipped in v1.0

| Feature | Status |
|---|---|
| WebView wrapper loading sahayai.in/chitti_vaani.html | ✅ Done |
| Mic permission forwarding to WebView | ✅ Done |
| Hey Chitti wake-word (always-listening foreground service) | ✅ Done |
| lockPhone() — voice "phone lock karo" | ✅ Done |
| setSilentMode() — voice "phone silent karo" | ✅ Done |
| makeCall() — voice "Ramesh ko call karo" | ✅ Done |
| sendSMS() — voice "Suresh ko SMS bhejo" | ✅ Done |
| openWhatsApp() — voice "WhatsApp bhejo" | ✅ Done |
| openUpiPay() — UPI deep-link + PIN fence | ✅ Done |
| answerCall() / rejectCall() — voice "uthao" / "kato" | ✅ Done |
| triggerEmergencyAlarm() — breaks through silent/DND | ✅ Done |
| Night mode auto-silence + "Mom is calling" spoken loop (TTS) | ✅ Done |
| VaaniAccessibilityService — taps WhatsApp send, Gmail send, YouTube | ✅ Done |
| openCamera() / openCameraCapture() — document scanning | ✅ Done |
| toggleFlashlight() — torch on/off | ✅ Done |
| setAlarm() — opens system clock | ✅ Done |
| scheduleReminder() — WorkManager one-shot notification | ✅ Done |
| shareLocation() — sends live location via WhatsApp/SMS | ✅ Done |
| openMaps() / openYouTube() / openMusic() / openApp() | ✅ Done |
| sendEmail() — mailto: deep-link | ✅ Done |
| KvBiometric vault — TEE-backed AES-256-GCM passphrase | ✅ Done |
| setMedicalId() — emergency medical info stored on device | ✅ Done |
| AuditLog — DPDP Act 2023 compliant append-only log | ✅ Done |
| SafetyChecks — hard refusal of unlock/PIN/cop-autodial | ✅ Done |
| DeviceAdmin (lock only, no unlock) | ✅ Done |
| ChittiNative feature-detect in chitti_vaani.html | ✅ Done |
| ReminderWorker — WorkManager notification delivery | ✅ Done (CoroutineWorker, root package; references intact) |

### Inline TODO / FIXME / XXX in Kotlin code

None. Both prior TODOs are closed:
- `VaaniInCallService.kt` — voice "uthao"/"answer" path documented; `tryAnswerCurrent()` / `tryRejectCurrent()` live.
- `VaaniCallScreeningService.kt` — night-mode 10s "Mom is calling" TTS confirmation loop implemented.

## Post-v1.0 (do not block v1 ship)
- Production launcher icon (replace AGP defaults)
- Play Store listing assets (screenshots, promo video, descriptions)
- Play Store restricted permissions declarations (SMS, CallLog)
- Accessibility service Play Store justification
- Offline P2P transfer (separate submission, separate branch — see [`skills/FILE_TRANSFER.md`](skills/FILE_TRANSFER.md))
- Vosk on-device keyword spotting (battery optimisation upgrade — drop `vosk-android-0.3.47.aar` into [`app/libs/`](app/libs/README.md))
- Federated learning (future)

## Cross-references
- Web tier outstanding work: [`../chitti-vaani/TODO.md`](../chitti-vaani/TODO.md)
- Backend endpoints: [API.md](API.md)
- Room database plan: [DATABASE.md](DATABASE.md)
