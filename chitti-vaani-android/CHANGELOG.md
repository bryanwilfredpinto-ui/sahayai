# CHANGELOG — Chitti Vaani Android

Generated from `git log --oneline --reverse -- chitti-vaani-android/` against the monorepo root [`C:\Users\DELL\sahayai\sahayai`](../).

---

## 2026-05-22 — bridge parity with the web tier (YouTube / Music / Maps / Camera / Flashlight / Alarm / Reminder)

Bryan: *"in Chitti Vaani, all the web version should be in Android as well. Chitti should have access to my files, folders, sms, emails, so that Chitti Vaani can remind me through SMS, WhatsApp or through notifications."*

Web parity — seven new methods on `ChittiNativeBridge` (`MainActivity.kt`):

| JS bridge method | Native intent / API |
|---|---|
| `openYouTube(query)` | `vnd.youtube://results?search_query=…` to `com.google.android.youtube`, falls back to `https://www.youtube.com/results?search_query=…` |
| `openMusic(query)` | `https://music.youtube.com/search?q=…` targeted at `com.google.android.apps.youtube.music`, web fallback otherwise |
| `openMaps(query, mode)` | `google.navigation:q=…&mode={d,w,b,r}` to `com.google.android.apps.maps`, falls back to `https://www.google.com/maps/dir/?api=1&…` |
| `openCamera()` | `MediaStore.ACTION_IMAGE_CAPTURE`, then `android.media.action.STILL_IMAGE_CAMERA` if the first isn't resolvable |
| `toggleFlashlight()` | `CameraManager.setTorchMode(…)` — picks the first camera id reporting `FLASH_INFO_AVAILABLE`. Returns `"on"` / `"off"` / `"unavailable"`. State tracked in `flashlightOn` (field on the bridge instance). |
| `setAlarm(hour, minute, label)` | `AlarmClock.ACTION_SET_ALARM` with `EXTRA_HOUR` / `EXTRA_MINUTES` / `EXTRA_MESSAGE` — opens the system Clock app pre-filled |
| `scheduleReminder(text, atIsoTime, channel)` | Currently honours `channel="notification"` — enqueues a one-shot `ReminderWorker` (`OneTimeWorkRequest`) via WorkManager, which fires a `NotificationCompat.Builder` with `IMPORTANCE_HIGH` on the `chitti_reminders` channel at the scheduled time. Returns `"scheduled"` on success, `"bad_time"` / `"past_time"` on bad input, `"needs_phase_2_7"` for `sms` / `whatsapp` / `email` channels (those require the user opt-in + Gmail OAuth + WhatsApp Business linkage that's queued for Phase 2.7). |

What also landed in this commit:

- New worker: [`ReminderWorker.kt`](app/src/main/java/in/sahayai/chitti/vaani/ReminderWorker.kt) — `CoroutineWorker` that posts the reminder notification. Falls back to logging "skipped (no POST_NOTIFICATIONS)" if the runtime permission isn't granted on Android 13+, instead of silently dropping.
- Build deps: [`androidx.work:work-runtime-ktx:2.9.1`](app/build.gradle.kts) added.
- New manifest entries:
  - `CAMERA`, `FLASHLIGHT` permissions + `android.hardware.camera{,.flash}` `<uses-feature required="false">`.
  - `com.android.alarm.permission.SET_ALARM`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM` permissions.
  - `<queries>` extended with `com.google.android.youtube`, `com.google.android.apps.youtube.music`, `com.google.android.apps.maps`, and `<intent>` entries for `vnd.youtube`, `google.navigation`, `IMAGE_CAPTURE`, `SET_ALARM` so Android 11+ resolves the targeted intents.
- Hard refusals preserved — `unlockPhone()` and `bypassLock()` still throw `SecurityException`; the new methods never request the Tier-C device-admin / accessibility roles.
- AuditLog every new method writes `(action, summary)` to `filesDir/vaani_audit.log` so the user can review what Chitti did, exactly per DPDP.

Web-side counterparts (in [`../chitti_vaani.html`](../chitti_vaani.html)):

- Eight new pro-action cards in the "Chitti can act for you" grid: 🎬 YouTube · 🎵 Music · 📺 Video · 🗺️ Maps · 🔎 Search · 📷 Camera · 🔦 Flashlight · ⏰ Alarm · ⏱️ Reminder.
- Each card opens its modal with a text field + 🎙️ mic + 🔊 read-back, calls the bridge when `hasNativeBridge()` returns true, falls back to a `_openExternal(url)` / `alert(steps)` / `window.open(calendar.google.com/render?TEMPLATE)` web path otherwise.
- Pills (`#pill-camera`, `#pill-flashlight`, `#pill-alarm`, `#pill-reminder`) flip from "Android only" → "Native ✓" inside `tagNativeBridgeIfPresent()` when the WebView hosts the bridge.

E2E tests (all in `tools/`):
- `test_vaani_send.mjs` (WA / UPI / Call empty-state + free-text + URL generation): **10/10 pass**
- `test_vaani_media.mjs` (YouTube / Music / Video / Maps / Search / Alarm / Camera / Flashlight web URLs + deferral): **18/18 pass**
- `test_vaani_demo.mjs` (🎬 Demo button on every box bar): **9/9 pass**
- `test_vaani_reminder.mjs` (default tomorrow date, native bridge stub returns "scheduled", web fallback opens calendar.google.com, past-time alert): **10/10 pass**

Deferred to Phase 2.7 (called out in the Reminder modal copy + `scheduleReminder("…", "…", "sms"|"whatsapp"|"email")` returns `"needs_phase_2_7"`):
- SMS reminders — needs `SEND_SMS` opt-in flow + the user's own number stored in Trusted Circle.
- WhatsApp reminders — needs WhatsApp Business linkage (Phase 2.7).
- Email reminders — needs Gmail OAuth completion (Phase 1.6).
- File / folder reading — needs SAF flow on Android 11+; not implemented yet (Phase 2.7 alongside the WhatsApp linkage).

---

## 2026-05-22 (later) — Channel verify-then-grant (WhatsApp / SMS / Email OTP)

Bryan: *"For whats app linkage, use mobile number & send read code from the message. Same goes with sms. For email, confirm email addresses via code. Once u get all 3, u have the access."*

Three-channel OTP verification — the user-consent layer that gates the SMS / WhatsApp / Email reminder paths. Lands on the web tier this round; the Android bridge picks up the verified contacts from `localStorage["chitti_vaani_channels_v1"]` when it implements the real sends.

WEB SIDE — chitti_vaani.html:
- New `🔔 Reminder channels` section under Trusted Circle — three rows (WhatsApp / SMS / Email). Each row: contact input → "📨 Send code" → 6-digit OTP input → "✓ Verify" → Disconnect.
- `startChannelVerify(channel)` → POST `/api/vaani/channel/verify/start` (falls back to honest demo mode if backend unreachable).
- `confirmChannelVerify(channel)` → POST `/api/vaani/channel/verify/confirm` (or local demo verification against `123456`).
- Reminder modal's channel `<select>` now uses `refreshReminderChannelSelect()` — unverified options are disabled and labelled `⚠️ verify above`, verified options labelled `✓ verified`.
- Honest demo-mode banner under the section: *"the WhatsApp / SMS / email sender providers are not wired yet (Phase 2.7). Until then, every code Chitti 'sends' is the same: 123456."*

BACKEND — chitti-vaani/backend/routes/channel_verify.py (new Blueprint):

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/vaani/channel/verify/start` | `{user_token, channel, contact}` | `{ok, sent_to, expires_at_iso, demo_mode, hint?}` |
| `POST /api/vaani/channel/verify/confirm` | `{user_token, channel, code, contact}` | `{ok, channel, contact, verified_at}` |
| `GET /api/vaani/channel/status?user_token=…` | — | `{whatsapp: …\|null, sms: …, email: …}` |
| `POST /api/vaani/channel/disconnect` | `{user_token, channel}` | `{ok, channel}` |

- Constant-time HMAC-SHA256 over `(user_token, channel, contact, code)` with a server pepper. We never store the raw code — only the hash + 10-minute TTL.
- `_provider_configured(channel)` returns False until env vars land: `WHATSAPP_BUSINESS_TOKEN` + `WHATSAPP_BUSINESS_PHONE_ID` (WhatsApp), `MSG91_AUTH_KEY` or `TWILIO_AUTH_TOKEN` (SMS), `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (Email). When False, the code is `"123456"` and the response includes `hint`.
- `_dispatch_code(channel, contact, code)` is the only path Phase 2.7 needs to swap in for real sends.

E2E TEST — tools/test_vaani_channels.mjs in headless Chromium: **13/13 pass**.

Regression check on the four earlier web suites — all green (send 10/10 · media 18/18 · demo 9/9 · reminder 10/10).

When the Android bridge implements the SMS / WhatsApp / Email sends (Phase 2.7), it'll read `localStorage["chitti_vaani_channels_v1"]` (or call `/api/vaani/channel/status?user_token=…`) before deciding whether `scheduleReminder(..., channel="sms")` returns `"scheduled"` or `"needs_phase_2_7"`.

---

The Android client was bootstrapped in commit `059ab22` (2026-05-09) and has received two follow-up commits the same day. Both follow-ups apply to the broader Vaani product (web + Android together) and touch this directory because the JS bridge signatures evolved.

---

## 2026-05-09 — `059ab22`  feat(vaani): Phase 1.6 Gmail OAuth + Phase 2 Android skeleton

Bootstrapped the entire `chitti-vaani-android/` tree as a buildable Android Studio project, alongside the Phase 1.6 Gmail OAuth work on the web tier.

What landed in this commit:

- `settings.gradle.kts`, top-level [`build.gradle.kts`](build.gradle.kts), [`gradle.properties`](gradle.properties) — Gradle wiring for AGP 8.5.2 + Kotlin 1.9.24 + JDK 17.
- [`app/build.gradle.kts`](app/build.gradle.kts) — namespace `in.sahayai.chitti.vaani`, `minSdk 26`, `targetSdk 34`, deps for AppCompat, WebKit, Lifecycle, Material; Vosk dependency line **commented out** for Phase 2.4 introduction.
- [`AndroidManifest.xml`](app/src/main/AndroidManifest.xml) — declared every Tier A / B / C permission Phase 2 needs, declared all four background system services and the boot/alarm receiver, declared the `<queries>` block for WhatsApp + UPI app resolution.
- [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt) — WebView host wired to `https://sahayai.in/chitti_vaani.html`, with `ChittiNativeBridge` exposing the initial JS bridge surface: `canHostNative` / `lockPhone` / `requestDeviceAdmin` / `setSilentMode` / `requestNightMode` / `requestCallScreening` / `requestDialerRole` / `requestAccessibility` / `openWhatsApp` / `openUpiPay`, plus `unlockPhone` and `bypassLock` as **hard-refusal** stubs that throw `SecurityException`.
- [`SafetyChecks.kt`](app/src/main/java/in/sahayai/chitti/vaani/util/SafetyChecks.kt) — code-level invariants: `requireNotUnlock()`, `refuseUnlock()`, `refuseIfPinLike()`.
- [`AuditLog.kt`](app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt) — append-only DPDP audit log to `filesDir/vaani_audit.log`.
- [`VaaniDeviceAdminReceiver.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniDeviceAdminReceiver.kt) — `force-lock` policy only; no unlock surface.
- [`VaaniCallScreeningService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniCallScreeningService.kt) — pre-ring screening stub that silences calls when night mode is active; Phase 2.4 TODO comment for the 10s "Mom is calling — answer?" loop.
- [`VaaniInCallService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniInCallService.kt) — lifecycle logging stub; Phase 2.3 TODO for `call.answer()` on voice "uthao".
- [`VaaniAccessibilityService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniAccessibilityService.kt) — scoped strictly to `com.whatsapp` send button, single-shot 2s arm window after voice "haan", refuses any PIN-shaped sibling text.
- [`NightModeReceiver.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/NightModeReceiver.kt) — boot-time + alarm at 22:00 / 06:00 IST, IST-clock-aware so it tracks travel.
- [`res/xml/device_admin.xml`](app/src/main/res/xml/device_admin.xml) — declares only `<force-lock />`. No `<reset-password />`, no `<wipe-data />`.
- [`res/xml/accessibility_service_config.xml`](app/src/main/res/xml/accessibility_service_config.xml) — `android:packageNames="com.whatsapp"`, `canPerformGestures="false"`, tight scope for the Google Play accessibility-misuse review.
- [`res/xml/network_security_config.xml`](app/src/main/res/xml/network_security_config.xml) — `cleartextTrafficPermitted="false"`.
- [`res/values/strings.xml`](app/src/main/res/values/strings.xml) — Device Admin description explicitly states "Chitti will NEVER unlock — Android does not expose any unlock API to apps."
- [`proguard-rules.pro`](app/proguard-rules.pro) — keeps `@JavascriptInterface` methods so they survive R8 obfuscation.
- [`.gitignore`](.gitignore) — excludes `build/`, `.gradle/`, `.idea/`, `local.properties`, `app/libs/*.aar`.

This commit also shipped Phase 1.6 Gmail OAuth scaffolding on the web tier ([`chitti-vaani/backend/routes/email.py`](../chitti-vaani/backend/routes/email.py)) but the Android-tier work in this commit is purely the skeleton above.

---

## 2026-05-09 — `e9aaf6c`  feat(vaani): outbound calls — Chitti makes calls too, not just takes

Extended the JS bridge to let Chitti dial out on the user's voice command, not just take incoming calls.

Files touched in this directory:

- [`AndroidManifest.xml`](app/src/main/AndroidManifest.xml) — added `<uses-permission android:name="android.permission.CALL_PHONE"/>` to Tier B block. Permission justification comment added.
- [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt):
  - New `ChittiNative.makeCall(phoneE164)` — uses `ACTION_CALL` when `CALL_PHONE` is granted (direct-dial), falls back to `ACTION_DIAL` (opens pre-filled dialer) when not. Returns `"dialing"` / `"needs_permission"`.
  - New `ChittiNative.requestCallPhonePermission()` — runtime permission prompt; throws if bridge context is not an Activity.
  - Defensive: `makeCall()` runs `SafetyChecks.refuseIfPinLike()` if the cleaned digits are 4–6 long (a number that short can only be a slipped PIN).
  - Every call attempt appends to `AuditLog` with the cleaned phone string.

The web tier (in [`../chitti-vaani/`](../chitti-vaani/)) was extended in the same commit to call `ChittiNative.makeCall()` from the "Chitti, call Mom" voice path; the mute-user English-Partner toggle (speakerphone + Chitti TTS on the line) was scoped to Phase 2.3.1 and left as a comment for [`VaaniInCallService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniInCallService.kt).

---

## 2026-05-09 — `ce0d260`  feat(vaani): 24/7 emergency cascade — family only, never cops

Encoded the emergency-cascade protocol as enforceable Android code.

Files touched in this directory:

- [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt):
  - New `ChittiNative.triggerEmergencyAlarm(reason)` — sets `STREAM_ALARM` volume to max, plays the system default alarm tone routed through `AudioAttributes.USAGE_ALARM` (bypasses silent/DND), fires a long-pulse `VibrationEffect`. The "wake-master" mechanism, never a cop call.
  - New `ChittiNative.refuseAutoDialCops()` — structural fence. Even if the web tier is ever compromised or modified, this method audits a `REFUSED-cop-autodial` line and returns a clear "Chitti never auto-dials cops or government emergency lines." string. Bryan's product rule, encoded.
  - Comment block reaffirming: never auto-dial 112 / 100 / 102 / 108 / 1098 / 1930 / 139.

The web tier in the same commit added the master-confirm-10s loop, the spouse-call escalation, and the paired-Chitti relay POST to `/api/vaani/emergency/trigger`. The Android tier's responsibility is exclusively the **OS-bypass parts** (`STREAM_ALARM`, `VibrationEffect`).

---

## Earlier history

No commits before `059ab22`. The `chitti-vaani-android/` directory did not exist prior to 2026-05-09.

## Upcoming (not yet committed)

Tracked in [TODO.md](TODO.md). High-level: foreground listening service (Phase 2.4), Vosk integration, Room database, federated learning sync worker, Play Store submission assets.
