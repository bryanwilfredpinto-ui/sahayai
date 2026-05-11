# CHANGELOG — Chitti Vaani Android

Generated from `git log --oneline --reverse -- chitti-vaani-android/` against the monorepo root [`C:\Users\DELL\sahayai\sahayai`](../).

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
