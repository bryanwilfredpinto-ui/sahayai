# SALES BRIEF — Chitti Vaani Android

Why the native Android app exists when the Vaani web app already does most of the conversational work.

## Ten pain points specific to Android delivery

1. **The browser tab closes.** A user nudges the home button at 11pm; the Vaani PWA suspends and the emergency listener dies. The native foreground service survives the home button.
2. **The phone is locked.** Elderly users sleep with the phone locked on the nightstand. The browser cannot run the mic when the screen is off; the Phase 2.4 foreground service with `FOREGROUND_SERVICE_PHONE_CALL` + `WAKE_LOCK` can.
3. **A blind user cannot read the incoming-call screen.** They don't know if it's "Mom" or a spam call. `CallScreeningService` (pre-ring) lets Chitti speak the caller's name **before** the phone rings.
4. **A mute user cannot tap the WhatsApp green send button.** The web tier opens `wa.me/<num>?text=...`, but the user is then stranded at the WhatsApp compose screen. `AccessibilityService` taps the send button after voice "haan".
5. **DND / silent mode defeats every emergency mechanism.** Browser `Audio` cannot bypass DND. `RingtoneManager` via `AudioAttributes.USAGE_ALARM` on `STREAM_ALARM` does.
6. **A user who realises they handed the phone to a stranger needs voice "Chitti, phone lock now".** `DevicePolicyManager.lockNow()` is a native-only API.
7. **A spouse calling in the middle of an emergency must auto-answer.** Day-mode "Chitti, uthao" arms `call.answer()` via `InCallService` — impossible from a browser.
8. **An illiterate user cannot read a deep-link preview screen.** Browser deep-links open another app's chooser dialog. Native intents go straight to the target.
9. **Battery-optimisation kills background tabs in seconds on most Indian phones.** Xiaomi, Vivo, OPPO, Realme — all aggressively kill PWA tabs. The native foreground service is whitelisted by OS contract.
10. **The PWA cannot receive an inbound paired-Chitti relay when the phone is asleep.** FCM data messages can wake the device; the long-poll endpoint cannot.

## Ten benefits Chitti Vaani Android delivers

1. **Always-on emergency keyword spotting, lock-screen or not.** Same listener as the web tier, but it survives sleep.
2. **Pre-ring caller identification spoken in user's language** — through `CallScreeningService` + DeepSeek backend.
3. **Voice-armed WhatsApp send** for mute and blind users, scoped to one node, 2-second window, single-shot. See [BOUNDARIES.md](BOUNDARIES.md).
4. **DND-bypass alarm** that fires through silent mode in genuine emergencies — and only those, audit-logged.
5. **Voice "phone lock now"** via Device Admin force-lock. No unlock surface — see [BOUNDARIES.md](BOUNDARIES.md).
6. **Day-mode auto-answer** so a confused or hands-busy elderly user never misses a family call.
7. **Family-only cascade** — never cops, structurally enforced in `refuseAutoDialCops()`. See [`project_chitti_vaani_emergency_protocol`](../CONTEXT.md#3-the-vaani-emergency-protocol-family-only-never-cops).
8. **DPDP-compliant audit log** the user can export from the web tier — proof that Chitti did exactly what Chitti said it did.
9. **One conversational identity across both surfaces.** The WebView hosts the same UI, so a user who configured Vaani on the web has zero re-onboarding.
10. **No native UI shell to learn.** The web tier is the screen; the native layer is invisible plumbing.
