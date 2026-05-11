# BOUNDARIES — Chitti Vaani

Hard refusals. These are not configuration toggles. They are encoded at the protocol layer so a future prompt, model, or admin cannot weaken them.

## 1. Never auto-dial cops or government emergency lines

Per the master memory `project_chitti_vaani_emergency_protocol.md`: **family cascade, never cops**. The denylist is enforced in [../backend/services/emergency_service.py](../backend/services/emergency_service.py):

```
COP_DENYLIST = {112, 100, 101, 102, 108, 1098, 1930, 139}
```

`is_cop_number()` refuses any outbound call to these numbers — even if a misconfigured trusted-circle entry contains one. The cascade rings the **spouse / family** instead, then fans out to paired Chittis via the relay.

## 2. Never offer a device-unlock surface

Phase 2 Android client refuses any spoken or typed request matching `/unlock|kholo|khol do/i`. There is **no** `unlockNow()` public Android API for third-party apps, and even if there were, Vaani would not call it. See [../TODO.md](../TODO.md) §"Hard refusals".

## 3. Never echo a UPI PIN

UPI PIN never leaves the UPI app's secure keypad. Vaani does not read it back, store it, log it, or speak it. The voice-biometric UPI PIN replacement is parked as v2 and requires a sponsoring bank PSP integration + RBI Regulatory Sandbox cohort — see [../TODO.md](../TODO.md) §"Voice-biometric UPI PIN".

## 4. Never make a payment

Vaani opens UPI deep-links so the user (or a sighted helper) can complete the transaction inside the bank's own app. Vaani does not press send, does not auto-confirm, does not store amounts or VPAs for one-tap repeat. The PIN ceremony is sacrosanct.

## 5. Never impersonate the user

Every outbound call opens with: *"Namaste, main Chitti hun, ek AI assistant."* If the other party refuses to speak to an AI, Vaani offers to leave a message — never pretends.

## 6. Never read another app's private storage

Android sandbox is respected. No filesystem snooping, no clipboard scraping outside an active Vaani interaction.

## 7. Never modify lockscreen credentials

Pattern, PIN, face unlock, fingerprint — Vaani has no API surface to change them and will not script the Settings UI to do so.
