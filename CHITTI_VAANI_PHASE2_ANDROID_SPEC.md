# Chitti Vaani — Phase 2 (Android Native App)

Web Vaani (Phase 1, deployed) handles voice in/out, email/WhatsApp/UPI deep-links, and federated language sample collection. Phase 2 is the Android app — built specifically because **the following capabilities are physically impossible in a browser**:

| # | Capability | Why web can't | Android API |
|---|---|---|---|
| 1 | Lock the phone on voice command | Browsers cannot control the OS lock screen | `DevicePolicyManager.lockNow()` (DEVICE_ADMIN) |
| 2 | **Refuse all unlock commands by code** | Same | DEVICE_ADMIN — Chitti's `lockNow()` does NOT have an `unlockNow()` counterpart for 3rd-party apps; this is the OS-level guarantee |
| 3 | Toggle silent / ring mode | Browsers cannot change ringer | `AudioManager.setRingerMode()` (NotificationPolicyAccess) |
| 4 | Auto-answer calls during the day on user command | Browsers can't intercept incoming calls at all | `InCallService` + Default Dialer role |
| 5 | Night-mode (10 PM – 6 AM) auto-answer + emergency-keyword wake | Same | `CallScreeningService` + on-device speech recognition (Android `SpeechRecognizer`) for keyword spotting (emergency / ambulance / hospital) → `setRingerMode(RINGER_MODE_NORMAL)` to flip silent → ring |
| 9b | Open WhatsApp **and tap send autonomously** | Browser can only open via deep-link; the user has to tap send inside WA | `AccessibilityService` with strict scope: only fires `ACTION_CLICK` on a node matching the WhatsApp send button after Chitti's voice readback + 2s silent-cancel window |
| 11b | Voice-biometric replacement for UPI PIN | NPCI mandates PIN entry on UPI app's secure keypad | Bank PSP partnership required (Sahayai cannot do this alone — needs ICICI / Axis / HDFC sponsorship at the PSP layer) |
| — | Read incoming SMS / WhatsApp aloud automatically | No browser API | `NotificationListenerService` |
| — | Read native call log | No browser API | `READ_CALL_LOG` |
| — | Read local files (Aadhaar PDF in Downloads, etc.) by voice | Browser only opens via picker per session | Scoped storage + `MediaStore` (read-only) |

## Night mode (the killer feature for elderly users)

```
22:00 IST: Chitti enters night mode automatically.
  Phone is on silent.
  CallScreeningService is registered as the system call screener.

Incoming call at 02:14 IST:
  CallScreeningService receives ringing event BEFORE phone rings.
  Chitti reads caller aloud at low volume: "Mom is calling. Answer?"
  Listens for 10 seconds for user voice ("haan" / "no" / silence).

  If user says "haan" → AudioManager.setRingerMode(RINGER_MODE_NORMAL)
                       → call rings normally → user picks up.
  If user says "no" or silent for 10s →
       CallScreeningService.respondToCall(SILENT) — call goes through silently.
       Chitti picks up via InCallService:
         "This is Chitti AI. The user is sleeping. Is this an emergency?"
       On-device SpeechRecognizer listens for keywords:
         emergency | ambulance | hospital | accident | bachao | madad | dard
         (multi-language list, on-device only — NEVER leaves the phone)
       If keyword detected:
         setRingerMode(NORMAL) + setStreamVolume(MAX) +
         vibrator.vibrate([0,1000,500,1000,500,1000]) (long-pulse)
         Chitti shouts: "Emergency call from [caller]! Wake up master!"
         Emergency callout repeats every 5s until phone is unlocked
         OR call ends.
       If no keyword in 30s → Chitti politely hangs up:
         "Thank you. Please call back after 6 AM."
```

## Permissions taxonomy

Android Phase 2 needs the following — listed by sensitivity tier so we know what Play Store will scrutinise:

### Tier A — declared in manifest, granted at install (low scrutiny)
- `RECORD_AUDIO` — already in spec Phase 1
- `MODIFY_AUDIO_SETTINGS` — silent/ring toggle
- `VIBRATE` — emergency-wake pulses
- `INTERNET` — DeepSeek calls

### Tier B — runtime-prompted (medium scrutiny)
- `READ_CONTACTS` — to resolve "Mom" → 9876543210 from native contacts (alternative: Chitti's own trusted circle, which is what Phase 1.5 ships)
- `READ_PHONE_STATE` — call state monitoring
- `POST_NOTIFICATIONS` — reading notifications back to blind users
- `RECEIVE_SMS` + `READ_SMS` — reading SMS aloud (heavily restricted; Google Play requires justification + privacy policy URL + video walkthrough)
- `SEND_SMS` — same restriction
- `ANSWER_PHONE_CALLS` (API 26+) — auto-pickup
- `READ_CALL_LOG` — heavily restricted; same justification process

### Tier C — special role / setting (high scrutiny)
- **DEVICE_ADMIN** — for `lockNow()`. User must manually enable in Settings → Security → Device admin apps.
- **CallScreeningService** role — request via `RoleManager.createRequestRoleIntent(ROLE_CALL_SCREENING)`. User must accept.
- **InCallService** (Default Dialer) role — `RoleManager.createRequestRoleIntent(ROLE_DIALER)`. User accepts.
- **NotificationListenerService** — Settings → Apps → Special access → Notification access → enable Chitti.
- **AccessibilityService** for autonomous WhatsApp tap-send — Settings → Accessibility → Chitti enable. **Scope must be locked to specific apps and specific node IDs** (the WA send button only) to pass Google Play's accessibility-misuse review.

### Hard refusal in code (Chitti will never do these)
- `unlockDevice()` — there is no public API to do this from a 3rd-party app *and* Chitti's code refuses any request matching `/unlock|kholo|khol do/i` even if a user later tries to add it. Hard-coded deny list.
- Send UPI PIN over network — UPI PIN never leaves the UPI app's secure keypad.
- Read other apps' private storage (sandbox respected).
- Modify lockscreen pattern / face unlock / fingerprint.

## Onboarding flow (voice-first, never text-first)

Same pattern as Phase 1.5 web onboarding (already shipping in this commit):

1. Chitti reads each capability aloud in user's language. Each section gets a 🔊 button.
2. After all capabilities read, asks: *"Sab kuch samajh aaya? Boliye haan, ya tap karein."*
3. Captures voice "haan" via on-device SpeechRecognizer (no network).
4. Trusted-circle dictation: *"Aapke kareebi log kaun hain? Naam aur number boliye."*
5. Each capability is then activated by triggering the appropriate Android role/permission flow with Chitti narrating: *"Ab settings khulegi. 'Chitti enable' likha hai woh tap karein. Main bata rahi hun kya karna hai."*
6. After all permissions granted, Chitti confirms: *"Sab tayar hai. Ab boliye, aaj kya madad chahiye?"*

## Tech stack (proposed)

- **Kotlin** + AndroidX, target API 34, min API 26 (covers ~92% of Indian devices per StatCounter Q1 2026).
- **Jetpack Compose** for the (minimal) UI — most interaction is voice; UI only for setup + emergency override.
- **MediaStore** for scoped storage; no `MANAGE_EXTERNAL_STORAGE`.
- **Tauri / native WebView** to embed `chitti_vaani.html` — keep one source of truth for the voice UI; the Android app adds the OS-level capabilities as services around it. Saves us maintaining two UIs.
- **Vosk** (on-device, multilingual) for keyword spotting in night mode — no network for emergency-keyword detection. Privacy-critical.
- **DeepSeek** for normal voice replies (online, identical to web Vaani).
- **Federated learning**: `androidx.federatedcompute` (still in alpha as of 2026 Q1) for on-device fine-tuning per user. Voice samples stay on-device; only model gradients ship to server.

## Build phases for the Android app (within Phase 2)

| Sub-phase | Duration | Deliverable |
|---|---|---|
| 2.1 | 2 weeks | APK with WebView wrapper, MIC permission, voice in/out parity with web |
| 2.2 | 3 weeks | Phone lock (DEVICE_ADMIN), silent toggle, deep-link senders for WA / UPI / Gmail |
| 2.3 | 4 weeks | CallScreeningService + InCallService + day-mode "answer call" |
| 2.4 | 5 weeks | Night mode + on-device emergency keyword spotting (Vosk) + ringer flip |
| 2.5 | 3 weeks | Federated learning scaffolding + voice sample upload pipeline |
| 2.6 | 4 weeks | Google Play submission cycle (expect 2-3 rejections on `READ_CALL_LOG` / `SEND_SMS` justification) |
| **Total** | **~5 months** | Production app on Play Store |

## What ships in Phase 1.5 (web Vaani — this commit)

| # | From the Final Requirements | Phase 1.5 web | Phase 2 Android |
|---|---|---|---|
| 1 | Lock phone | ❌ | ✅ DEVICE_ADMIN |
| 2 | Never unlock | — | ✅ no API surface, hard-coded refusal |
| 3 | Silent mode | ❌ | ✅ AudioManager |
| 4 | Day call answer | ⚠️ Twilio bridge optional | ✅ on user's SIM |
| 5 | Night auto-answer + emergency wake | ❌ | ✅ |
| 6 | Email read/send as Chitti | ⚠️ Phase 1.6 (Gmail OAuth scaffold present, button stubbed) | ✅ |
| 7 | Digital voice (Hindi/English) | ✅ already shipped | ✅ |
| 8 | Federated language learning | ✅ voice-sample collector + local IndexedDB store + opt-in upload | ✅ on-device fine-tune |
| 9 | Open WhatsApp | ✅ `whatsapp://` deep-link | ✅ |
| 10 | Send WA message | ✅ `wa.me/<num>?text=<msg>` deep-link, user taps send | ✅ AccessibilityService taps send |
| 11 | UPI payment | ✅ `upi://pay?…` deep-link, user enters PIN in UPI app | ✅ same — NPCI rule |

## Voice-biometric UPI PIN — v2 research direction

NPCI's 2026 framework allows "additional factor" but PIN entry on UPI app's keypad is non-negotiable in v1. Voice-biometric as a PIN replacement requires:

1. PSP-layer integration with a sponsoring bank (ICICI / Axis / HDFC have shown openness).
2. RBI sandbox application (Regulatory Sandbox cohort entry — cohorts open quarterly).
3. Voice-biometric SDK (Phonexia, Pindrop, or in-house with Wav2Vec2 fine-tune) — needs FAR < 0.001%.
4. Liveness detection (anti-replay).
5. ~9-month engagement timeline.

Park this in a v2 spec doc; design the Phase 1.5 UPI flow such that swapping in voice-biometric is a 1-screen change later.

## Compliance lines that must show on the Android app's Play Store listing

- *"Chitti is an AI assistant. Chitti will never unlock your phone. Chitti will never enter your UPI PIN. Chitti will never claim to be you on a call — every call begins with 'I am Chitti, an AI assistant for [user name].'"*
- DPDP Act 2023 grievance officer: sire@sahayai.in
- Permissions justification text per Tier B/C permission, written for the Play Store reviewer
