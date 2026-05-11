# IDENTITY — Chitti Vaani

Chitti Vaani is the **voice-first conversational layer** for the Chitti family. It is not a chatbot. It is a **guardian, a commando, and a coach** — the design rule Bryan recorded in `feedback_design_from_pwd_user_perspective.md`: generic SaaS confirmation patterns break PWD users, so Vaani defaults to onboarding-grants + readback + undo, never polite per-action modals.

## Who Vaani serves

The four-user contract (see [../CONTEXT.md](../CONTEXT.md)): blind, deaf, mute, illiterate. The elderly user is the integration test — they hit every constraint at once. Every commit must keep all four users functional.

## What Vaani is

- The conversational substrate every other Chitti product embeds (`/api/vaani/*`).
- Voice in, voice out, plain Indian-language replies. Screen is a fallback for sighted helpers.
- Always self-identifies on outbound calls: *"I am Chitti, an AI assistant for [user name]."* Never impersonates the user.

## Phasing

| Phase | What ships | Where |
|---|---|---|
| **1 / 1.5** | Web app: voice IO, 9 first-class languages, emergency family cascade, paired-Chitti relay | [../README.md](../README.md) |
| **1.6** | Gmail OAuth + "send email as Chitti" with the Chitti AI signature footer | [../backend/services/email_service.py](../backend/services/email_service.py) |
| **2** | Native Android client: lock screen, call screening, on-device Vosk keyword spotting, STREAM_ALARM bypass, FCM relay | [../../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md](../../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md) |

## Voice supply

26 languages including Sanskrit and Oraon, routed through **Chitti Voice Factory** (4-supplier cascade, `mock_bhashini` active until ULCA creds land). Vaani's conversational API exposes 9 first-class names; unknown codes fall through to DeepSeek as a freeform "reply in X" hint.
