# CONTEXT — Chitti Vaani Android

This document answers: **why does Chitti Vaani need a native Android app at all** when Phase 1 (a web app) already shipped, and **how must it be built so that blind, deaf, mute, and elderly users come first**.

---

## 0. Hard refusals (code-level security feature, not policy)

Chitti Vaani Android enforces its safety rules **structurally in code**, not as policy that a future contributor could quietly drop. Any code path that violates one of these rules short-circuits and writes a `REFUSED-*` line to the on-device audit log. These are security features, audited at compile time:

| Hard refusal | Where it's enforced | What it blocks |
|---|---|---|
| **Never auto-dial cops** | `ChittiNativeBridge.refuseAutoDialCops()` + `emergency_service.COP_DENYLIST` (web tier) | 112, 100, 101, 102, 108, 1098, 1930, 139 — even if the LLM prompt or a future code change asks for it |
| **Never offer a device-unlock surface** | No `BIND_DEVICE_ADMIN` policy that exposes unlock; `MainActivity` ships zero unlock UI | Bypassing the user's lock-screen credential |
| **Never read or echo a UPI PIN** | `VaaniAccessibilityService` filters out any node whose IME shape matches a numeric PIN entry; PIN-shape strings dropped before reaching the LLM | Capturing or relaying a 4–6 digit numeric secret |
| **WhatsApp tap is single-shot + scoped** | `AccessibilityService` matches only `com.whatsapp:id/send`, single-shot, 2-second arm window, then re-disarms | Becoming a generic auto-tap surface for any app |

A future contributor who tries to "improve" emergency response by adding `112` dialling will get the same refusal in the audit log. The fence is structural — see [VaaniCallScreeningService.kt](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniCallScreeningService.kt) and [util/AuditLog.kt](app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt).

---

## 1. Why a native Android client is necessary

Phase 1 ([`../chitti-vaani/`](../chitti-vaani/)) is a Progressive Web App. It does voice IN, voice OUT, DeepSeek replies, Gmail OAuth send-as-user, emergency-keyword detection, paired-Chitti relay, WhatsApp / UPI / `mailto:` deep-links. It works beautifully **while the browser tab is in the foreground**.

The browser cannot do four things that this product physically requires:

| # | Browser limitation | Why it matters for our users | Android API that lifts the limit |
|---|---|---|---|
| 1 | Cannot run when the phone is locked | Elderly users sleep with the phone on the nightstand, locked. Emergency keyword detection must keep working at 02:14 IST. | Foreground service with `FOREGROUND_SERVICE_PHONE_CALL` + `WAKE_LOCK`. Microphone-while-locked is permitted for a foreground service with `RECORD_AUDIO`. |
| 2 | Cannot intercept incoming calls | Night-mode auto-answer + emergency-wake is the killer feature for elderly users living alone. | `CallScreeningService` (pre-ring) + `InCallService` (Default Dialer role). |
| 3 | Cannot toggle phone ringer or fire an alarm bypass | "Silent" defeats every emergency mechanism. We need to flip silent → ring **and** play an alarm tone through `STREAM_ALARM` that bypasses DND. | `AudioManager.setRingerMode()` + `STREAM_ALARM` route via `AudioAttributes.USAGE_ALARM`. |
| 4 | Cannot tap-send autonomously inside another app | Blind / mute / illiterate users cannot tap the WhatsApp green send button. The web tier can open `wa.me/...`, but the user is then stuck. | `AccessibilityService` (scoped to `com.whatsapp:id/send` — one node, one app, single-shot 2-second arm window). |
| 5 | Cannot lock the device | A user who realises they handed the phone to a stranger needs voice "Chitti, phone lock now". | `DevicePolicyManager.lockNow()` via Device Admin receiver. |

Phase 2's design choice: **embed the existing web UI in a WebView** ([`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt)) and surface OS-only capabilities through a `JavascriptInterface` named `ChittiNative`. The web tier feature-detects `window.ChittiNative` and only invokes native methods when running inside the wrapper. One UI, two delivery surfaces.

---

## 2. The four-user accessibility contract (Android implementation)

Every Sahay AI / Chitti product is built around four primary users. The Android client must serve each of them **before** any AI feature is added. The contract is non-negotiable; see the user's [auto-memory note `project_four_user_contract.md`](../) for the canonical statement.

### 2.1 Blind users — voice IN, voice OUT, screen-reader compatible

| Requirement | Android implementation |
|---|---|
| Voice IN | `RECORD_AUDIO` granted at install (Tier A in manifest). WebView's `onPermissionRequest()` in [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt) forwards Web Audio mic requests to the runtime permission. |
| Voice OUT | `mediaPlaybackRequiresUserGesture = false` so TTS autoplays. Emergency alarm uses `RingtoneManager.getDefaultUri(TYPE_ALARM)` (guaranteed available on every Android device). |
| TalkBack compatible | The native shell renders essentially zero UI; the WebView's HTML is the user surface, and the web tier is already TalkBack-friendly (semantic landmarks, aria-labels). Native settings prompts (Device Admin, Accessibility, Notification Policy) are first-party OS screens — they are TalkBack-correct by definition. |
| BrailleBack | Same path — every label resource in [`strings.xml`](app/src/main/res/values/strings.xml) is plain text, no images-only. |
| No image-only buttons | Native UI ships no buttons; voice-only navigation is the default. The only native UI elements are the OS-rendered permission dialogs. |

### 2.2 Deaf users — fully visual, no audio dependency

Phase 1 web tier already renders subtitles for every TTS turn. The native shell preserves this: the WebView hosts the same HTML, so subtitles work identically. Native services that speak (e.g. [`VaaniInCallService.kt`](app/src/main/java/in/sahayai/chitti/vaani/services/VaaniInCallService.kt) reading "I am Chitti AI") must also fire a notification through `POST_NOTIFICATIONS` so the deaf user sees the same content visually.

### 2.3 Mute users — text and gesture input

Phase 1.5 already supports text input as an alternative to voice. Phase 2.3.1 (planned, not built) lets a mute user pre-record a typed message that Chitti speaks aloud on the call via `VaaniInCallService` + speakerphone routing. This requires no extra permission beyond `MODIFY_AUDIO_SETTINGS`.

### 2.4 Elderly users — large touch targets, simple flows

All in-app surfaces are voice-first. The WebView renders the web UI which already enforces large fonts and 48dp+ touch targets. The native shell adds only system-rendered dialogs (Device Admin, Accessibility, etc.) which honour the user's system font size and contrast settings.

---

## 3. The Vaani emergency protocol (family only, never cops)

This Android client encodes the rule from the user's pinned memory: **never auto-dial cops**. The cascade is:

1. **Master-confirm** — 10s "Are you OK?" via TTS. Web tier already handles this loop.
2. **Alarm bypass-silent** — [`ChittiNativeBridge.triggerEmergencyAlarm()`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt) fires `RingtoneManager` through `STREAM_ALARM` with `USAGE_ALARM` so DND is bypassed.
3. **Spouse / family call** — `ChittiNative.makeCall(<spouse number>)` directly dials via `ACTION_CALL`, or falls back to `ACTION_DIAL` if `CALL_PHONE` was not granted.
4. **Chitti-to-Chitti relay** — handled by the web tier hitting `POST /api/vaani/emergency/trigger` on `chitti-vaani-api.onrender.com`. The Android shell only handles the OS-bypass parts.

At every step, `ChittiNativeBridge.refuseAutoDialCops()` is the structural fence: if any code path is ever modified to call 112/100/102/108/1098/1930/139, this method short-circuits and writes a `REFUSED-cop-autodial` line to [`AuditLog`](app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt).

---

## 4. DPDP Act 2023 — audit trail

Every action Chitti takes on the user's behalf is appended to a tamper-evident on-device log file (`vaani_audit.log`) in app-private storage via [`AuditLog.append()`](app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt). The log never leaves the device unless the user explicitly exports it (export UI is on the web tier). Privacy policy URL committed for Play Store: `https://sahayai.in/privacy/chitti-vaani`.

---

## Accessibility Requirements (Non-Negotiable)
Every Chitti app must be built accessibility first before AI features are added.

### Target Users
- Blind users: Full voice navigation, TalkBack compatible
- Deaf users: Full visual, no audio dependency
- Mute users: Text/gesture input only
- Elderly users: Large touch targets, high contrast

### Android Accessibility Compliance
- Every button must have a text label
- Every image must have alt text
- Logical tab and reading order
- High contrast mode support
- Large touch targets minimum 48x48dp
- Compatible with TalkBack screen reader
- Compatible with BrailleBack for Braille display users
- No image-only content, always have text alternative

### Accountability
Once accessibility is confirmed, AI powers the Chitti.
Chitti is then accountable for keeping all content fresh and updated daily.

### Founder Dashboard
All feature status visible at sahayai.in/founder
