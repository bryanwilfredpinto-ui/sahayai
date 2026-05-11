# IDENTITY — Chitti Vaani Android

Chitti Vaani Android is the **native delivery surface** for Chitti Vaani — Sahay AI's voice-first guardian for blind, deaf, mute, and elderly users. This is **Phase 2** of the Vaani product line. Phase 1 (the PWA at [`../../chitti-vaani/`](../../chitti-vaani/)) ships the conversational identity, the DeepSeek reply layer, language selection, and emergency-keyword detection. Phase 2 keeps that identity intact and adds **only the OS-level capabilities the browser cannot deliver**.

## Same identity, new surface

The voice, the warmth, the four-user contract, the family-only emergency cascade — all unchanged. The web UI is embedded in a `WebView` inside [`MainActivity.kt`](../app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt). The web tier feature-detects `window.ChittiNative` and short-circuits to native paths when running inside the wrapper. One conversational identity, two delivery surfaces.

## Native-only touchpoints

These are the four reasons this app exists at all (see [CONTEXT.md §1](../CONTEXT.md)):

| Capability | Android API | Why the browser can't |
|---|---|---|
| Always-on listening when locked | Foreground service with `FOREGROUND_SERVICE_PHONE_CALL` + `WAKE_LOCK` + `RECORD_AUDIO` | Browser tabs suspend on lock |
| Incoming-call interception | `CallScreeningService` (pre-ring) + `InCallService` (Default Dialer role) | Browser has no telecom hook |
| Alarm bypass through silent / DND | `RingtoneManager` via `AudioAttributes.USAGE_ALARM` on `STREAM_ALARM` | Browser cannot route past DND |
| Scoped WhatsApp send tap | `AccessibilityService` scoped to `com.whatsapp:id/send`, 2s arm window, single-shot | Browser cannot tap inside another app |

## Phase position

Phase 2 of Vaani. Phase 1 PWA still ships every conversational feature. The Android app is the **OS-bypass layer**, nothing more. See [CHANGELOG.md](../CHANGELOG.md) for sub-phase progress.
