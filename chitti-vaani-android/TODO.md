# TODO — Chitti Vaani Android

Outstanding work, broken down by the sub-phases declared in [`CHITTI_VAANI_PHASE2_ANDROID_SPEC.md`](../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md#build-phases-for-the-android-app-within-phase-2).

Today's status: skeleton compiles, WebView loads the web tier, JS bridge is live for `lockPhone / setSilentMode / makeCall / openWhatsApp / openUpiPay / triggerEmergencyAlarm / refuseAutoDialCops`. None of the deep OS integrations (foreground listener, Vosk, call screening flows, federated learning) are wired yet.

---

## Inline TODO / FIXME / XXX in Kotlin code

Two TODOs are present in the codebase today:

| File | Line | Note |
|---|---|---|
| [`VaaniCallScreeningService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniCallScreeningService.kt) | 54 | `// TODO: Phase-2.4 — initiate the 10s "Mom is calling — answer?" loop here.` |
| [`VaaniInCallService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniInCallService.kt) | 33 | `// TODO Phase 2.3:` — listen for voice "answer"/"uthao" and invoke `call.answer(VideoProfile.STATE_AUDIO_ONLY)`, then start live transcription pipeline. |

No `FIXME` or `XXX` markers in the Kotlin source today.

---

## Phase 2.1 — WebView wrapper + voice parity (2 weeks)

Spec: APK with WebView wrapper, MIC permission, voice IN/OUT parity with web.

| Item | Status | Notes |
|---|---|---|
| WebView host Activity | Done | [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt) |
| Mic permission forwarding | Done | `onPermissionRequest()` in `WebChromeClient` |
| Web UI loads from `sahayai.in/chitti_vaani.html` | Done | `DEFAULT_URL` constant in `MainActivity.kt` |
| Network security config (HTTPS only) | Done | [`network_security_config.xml`](app/src/main/res/xml/network_security_config.xml) |
| Production launch icon (raster) | **Pending** | Currently using the AGP-default vector launcher icons — replace with the Chitti brand mark before Play Store submission |
| Generate gradle wrapper artifacts | **Pending** | Run `gradle wrapper --gradle-version=8.7` on developer machine; do NOT commit the wrapper jar (keeps repo binary-free) |

---

## Phase 2.2 — Phone lock + deep-link senders (3 weeks)

Spec: Device Admin lock, silent toggle, WA / UPI / Gmail deep-links wired end-to-end.

| Item | Status | Notes |
|---|---|---|
| Device Admin receiver | Done | [`VaaniDeviceAdminReceiver.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniDeviceAdminReceiver.kt), `force-lock` policy only |
| `ChittiNative.lockPhone()` | Done | Guarded by `SafetyChecks.requireNotUnlock()` |
| `ChittiNative.requestDeviceAdmin()` flow | Done | Opens system Settings dialog |
| `ChittiNative.setSilentMode()` | Done | Honours `NotificationPolicyAccess` |
| Night-mode boundary alarm | Done | [`NightModeReceiver.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/NightModeReceiver.kt) IST-aware |
| WhatsApp deep-link send | Done | `ChittiNative.openWhatsApp()` |
| UPI deep-link payment | Done | `ChittiNative.openUpiPay()` + PIN-shape refusal |
| Gmail send-as-user | Web tier (Phase 1.6) | Backend at [`../chitti-vaani/backend/routes/email.py`](../chitti-vaani/backend/routes/email.py); Android shell just hosts the WebView that calls it |
| **Wire web UI to use `window.ChittiNative` when available** | **Pending** | The web tier needs `if (window.ChittiNative)` feature-detects on each capability button (lock, silent, WA send, UPI, makeCall). Currently the web tier uses deep-link fallbacks; native short-circuit pending. |

---

## Phase 2.3 — Day-mode answer call (4 weeks)

Spec: CallScreeningService + InCallService + day-mode "Chitti, uthao" voice-armed `call.answer()`.

| Item | Status | Notes |
|---|---|---|
| `VaaniInCallService` skeleton | Done | Manifest declares `BIND_INCALL_SERVICE` + `IN_CALL_SERVICE_UI=true` |
| `ChittiNative.requestDialerRole()` | Done | Uses `RoleManager.createRequestRoleIntent(ROLE_DIALER)` |
| **Foreground voice listener service (`VaaniBootService`)** | **Pending** | Needed for always-on voice "uthao". Will use `FOREGROUND_SERVICE_PHONE_CALL` (permission already declared). |
| **Voice "uthao" / "answer" arms `call.answer()`** | **Pending** | TODO at [`VaaniInCallService.kt:33`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniInCallService.kt) |
| **Live transcription pipeline** | **Pending** | DeepSeek STT or on-device — feeds back into WebView via `evaluateJavascript(...)` |
| **Mute-user English-Partner (Phase 2.3.1)** | **Pending** | Speakerphone toggle + TTS through `AudioManager.STREAM_VOICE_CALL`, so the other party hears Chitti speaking on the user's behalf |

---

## Phase 2.4 — Night mode + emergency keyword spotting (5 weeks)

Spec: `CallScreeningService` 10s "answer?" loop + Vosk on-device emergency keyword spotter + ringer-flip + cascade kick-off.

| Item | Status | Notes |
|---|---|---|
| `VaaniCallScreeningService` skeleton | Done | Silences inbound calls when night mode active |
| `ChittiNative.requestCallScreening()` | Done | `ROLE_CALL_SCREENING` prompt |
| `ChittiNative.triggerEmergencyAlarm()` | Done | `STREAM_ALARM` bypass + long-pulse vibration |
| `ChittiNative.refuseAutoDialCops()` | Done | Structural fence against 112/100/102/108/1098/1930/139 |
| **10s "Mom is calling — answer?" loop** | **Pending** | TODO at [`VaaniCallScreeningService.kt:54`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniCallScreeningService.kt) |
| **Vosk on-device keyword spotter** | **Pending** | Drop `vosk-android-0.3.47.aar` into `app/libs/`, uncomment line 51 in [`app/build.gradle.kts`](app/build.gradle.kts), bundle small Hindi + English models (~50 MB each) into `app/src/main/assets/vosk/` |
| **Keyword set: emergency / ambulance / hospital / accident / bachao / madad / dard** | **Pending** | Multi-language list, on-device only — must never leave the phone |
| **Ringer flip on keyword hit** | **Pending** | `setRingerMode(NORMAL)` + `setStreamVolume(MAX)` + alarm fire |
| **Spouse / family outbound call on cascade** | **Pending** | Uses existing `ChittiNative.makeCall()`. Web tier owns the contact-resolution; Android tier just dials. |
| **FCM push for inbound paired-Chitti relay** | **Pending** | When a paired Chitti fires `/api/vaani/emergency/trigger`, the user's Android must receive an FCM data message and run its local cascade |

---

## Phase 2.5 — Federated learning + voice-sample upload (3 weeks)

Spec: on-device fine-tune + voice-sample batch upload via WorkManager.

| Item | Status | Notes |
|---|---|---|
| **`FedLearningSyncWorker` (WorkManager)** | **Pending** | Batch IndexedDB voice samples from the WebView, POST to `/api/vaani/voice/sample` (backend endpoint TBD) |
| **Room database for queued samples** | **Pending** | See [DATABASE.md](DATABASE.md) — `queued_voice_samples` table |
| **`androidx.federatedcompute` integration** | **Pending** | Alpha as of 2026 Q1; track API stability before committing |
| **Opt-in flow with voice consent** | **Pending** | Web tier already collects samples with consent; Android extension adds on-device fine-tune toggle |

---

## Phase 2.6 — Google Play submission cycle (4 weeks)

Spec: expect 2–3 rejections on `READ_CALL_LOG` / `SEND_SMS` justifications.

| Item | Status | Notes |
|---|---|---|
| **`app/src/main/play/` listing assets** | **Pending** | Title, short description, full description in en-IN + hi-IN |
| **Screenshots (4 phone, 2 tablet)** | **Pending** | Must show TalkBack + large-text mode |
| **Promo video walkthrough (max 30s)** | **Pending** | Required for accessibility apps to pass review |
| **Permissions Declaration text** | **Pending** | Per-permission justification — template at end of [README.md](README.md) |
| **Privacy policy URL live** | **Pending** | Target: `https://sahayai.in/privacy/chitti-vaani` — DPDP grievance officer line included |
| **Restricted permissions form** | **Pending** | For `RECEIVE_SMS` / `READ_SMS` / `SEND_SMS` / `READ_CALL_LOG` — paste from [README.md](README.md) |
| **Accessibility service justification** | **Pending** | Explain narrow scope (WhatsApp send button only, 2s arm window, refused if PIN-shaped sibling) — Google Play reviewers will scrutinise heavily |

---

## Phase 2.7 — Offline P2P transfer (post-2.6 release, separate Play Store submission)

Locked 2026-05-15. Spec: [`../CHITTI_OFFLINE_TRANSFER_SPEC.md`](../CHITTI_OFFLINE_TRANSFER_SPEC.md). Skill file: [`skills/FILE_TRANSFER.md`](skills/FILE_TRANSFER.md). Memory: [`project_chitti_offline_p2p_transfer_locked`](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_offline_p2p_transfer_locked.md).

**Hard precondition:** Phase 2.6 (current SMS / CallLog / Accessibility submission) must be approved and on the Play Store before any 2.7 work touches the release branch. Permission diffs cannot be bundled — compound review risk.

| Item | Status | Notes |
|---|---|---|
| **Permissions in `AndroidManifest.xml`** | **Pending** | `BLUETOOTH_SCAN` / `BLUETOOTH_ADVERTISE` / `BLUETOOTH_CONNECT` (API 31+, `neverForLocation`), `NEARBY_WIFI_DEVICES` (API 33+, `neverForLocation`), `ACCESS_WIFI_STATE`, `CHANGE_WIFI_STATE`, `FOREGROUND_SERVICE_DATA_SYNC`, plus legacy `BLUETOOTH` / `BLUETOOTH_ADMIN` / `ACCESS_COARSE_LOCATION` for API ≤ 30 via `maxSdkVersion`. No `ACCESS_FINE_LOCATION`. |
| **Dependency** | **Pending** | `com.google.android.gms:play-services-nearby:19.x` in [`app/build.gradle.kts`](app/build.gradle.kts). ~250 KB APK delta. |
| **New Gradle module `:feature:transfer`** | **Pending** | Kotlin package `in.sahayai.chitti.vaani.transfer`. Isolated so unit tests don't pull WebView. |
| **`TransferManager.kt`** | **Pending** | Wraps `ConnectionsClient`. State machine: idle → advertising → connecting → authenticating → transferring → done / error. |
| **`FileTransferService.kt`** | **Pending** | `FOREGROUND_SERVICE_DATA_SYNC` foreground service holds the transfer open across WebView pauses. Persistent notification "Chitti is sharing a file…". |
| **`TransferAuth.kt`** | **Pending** | OOB 4-digit code verification (Nearby Connections' built-in token), spoken aloud for blind users, accepted via voice "haan". Emergency-relay tier skips this — payload is signed. |
| **Extend `SafetyChecks.kt`** | **Pending** | Add `requireTransferGranted()`. Honest refusal `"transfer_unsupported_no_play_services"` on AOSP / GMS-less devices. |
| **Extend `AuditLog.kt`** | **Pending** | New kinds: `TRANSFER_ADVERTISE`, `TRANSFER_DISCOVER`, `TRANSFER_AUTHENTICATED`, `TRANSFER_COMPLETED`, `TRANSFER_REFUSED_NO_PLAY_SERVICES`. |
| **7 new JS bridge methods on `ChittiNativeBridge`** | **Pending** | `advertiseForTransfer`, `discoverNearby`, `connectTo`, `acceptIncoming`, `sendFile`, `cancelTransfer`, `transferState`. Each follows `SafetyChecks → action → AuditLog` pattern. Document in [`ARCHITECTURE.md §4`](ARCHITECTURE.md). |
| **`chitti_share.js` substrate at repo root** | **Pending** | Auto-loaded by [`../chitti_a11y.js`](../chitti_a11y.js). Mirrors [`../chitti_camera.js`](../chitti_camera.js) / [`../chitti_features.js`](../chitti_features.js) pattern. |
| **Quick-Share-style modal flow** | **Pending** | Sender + receiver flows in the substrate — voice readouts at every step, 4-digit auth code spoken aloud, "haan" to accept. |
| **Surface on every Chitti page** | **Pending** | Substrate auto-loads everywhere — no per-page edits. Same "no page ships without" precedent as the per-response widget. |
| **QR escape hatch (web-only, zero native)** | **Pending** | `qrcode.min.js` + `BarcodeDetector` probe in `chitti_share.js`. Payloads ≤ 2.9 KB render as QR; iPhones read via Camera app. |
| **Emergency cascade integration** | **Pending** | `VaaniBootService` (Phase 2.4 listener) fires `TransferManager.advertiseForRelay(cascadeJSON)` in parallel with FCM. Signed payload via paired-Chitti private key — auth-code step skipped. See [`project_chitti_vaani_emergency_protocol`](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_vaani_emergency_protocol.md). |
| **Unit tests for `TransferManager` state machine** | **Pending** | Pure Kotlin, no Android Framework dep. Mocks `ConnectionsClient`. |
| **Instrumented two-emulator test** | **Pending** | Verify 20 MB transfer end-to-end in under 15 s, audit rows present on both sides, manifest honours `neverForLocation`. |
| **Play Store Data Safety form delta** | **Pending** | New row "File and document data — local-only, never leaves device, never collected by us." |
| **Privacy policy update** | **Pending** | `sahayai.in/privacy/chitti-vaani` — add Nearby-Connections section explaining phone-to-phone, never-our-servers. |
| **Release tagging** | **Pending** | After 2.6 store approval: tag `v1.0.0-store` on `main`, branch `phase-2.7-offline-transfer`, ship as isolated permission-diff submission. |

---

## Cross-cutting / housekeeping

| Item | Status | Notes |
|---|---|---|
| Production launcher icon (PNG + adaptive) | **Pending** | Currently AGP defaults at [`res/drawable/ic_launcher_*.xml`](app/src/main/res/drawable/) and [`res/mipmap-anydpi-v26/`](app/src/main/res/mipmap-anydpi-v26/) |
| Translation of `strings.xml` to 26 languages | **Pending** | Should mirror [`../chitti-voice-factory/`](../chitti-voice-factory/) coverage incl. Sanskrit + Oraon |
| Unit tests for `SafetyChecks` | **Pending** | Critical — these are the hard refusals; should be JUnit-tested independently of Android Framework |
| Instrumented tests for the JS bridge | **Pending** | UiAutomator + a stub web page in `androidTest` assets |
| ProGuard / R8 final pass | **Pending** | Currently `isMinifyEnabled = false` in release build type; flip on after Phase 2.6 listing assets land |
| `app/libs/` directory creation | **Pending** | Needed for `vosk-android-0.3.47.aar` drop |
| FCM project + `google-services.json` | **Pending** | Required for inbound relay push notifications in Phase 2.4 |

---

## Cross-references

- Web tier outstanding work: [`../chitti-vaani/TODO.md`](../chitti-vaani/TODO.md)
- Backend endpoints needed (some not yet implemented): [API.md](API.md)
- Room database plan: [DATABASE.md](DATABASE.md)
