# TRUTH SOURCES — Chitti Vaani Android

What Chitti Vaani Android relies on to answer "is this true / can we do this?". Cross-reference these before adding any new capability.

## Authoritative documents

| Source | Location | What it owns |
|---|---|---|
| Phase 2 spec | [`../../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md`](../../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md) (repo root) | Sub-phase decomposition, Play Store justifications, permission tiers, emergency-protocol policy |
| Native architecture | [`../ARCHITECTURE.md`](../ARCHITECTURE.md) | Gradle modules, Activity/Service tree, audio pipeline, JS bridge surface, networking plan |
| Native context | [`../CONTEXT.md`](../CONTEXT.md) | Why a native client exists; four-user contract; hard refusals; DPDP audit policy |
| Native progress | [`../TODO.md`](../TODO.md), [`../CHANGELOG.md`](../CHANGELOG.md) | What is built vs pending per sub-phase |
| Database plan | [`../DATABASE.md`](../DATABASE.md) | Room schema for queued voice samples (Phase 2.5) |
| Auto-memory: emergency protocol | [`project_chitti_vaani_emergency_protocol`](../CONTEXT.md#3-the-vaani-emergency-protocol-family-only-never-cops) | Family-only cascade, never cops |

## Backend — `chitti-vaani-api-production.up.railway.app`

Hosted at `chitti-vaani-api-production.up.railway.app`. The Android client today calls every endpoint **via the WebView**; native OkHttp/Retrofit calls land in Phase 2.4 (emergency) and Phase 2.5 (federated voice upload).

- Endpoint index (Android-side call sites): [`../API.md`](../API.md)
- Full request/response contracts: [`../../chitti-vaani/API.md`](../../chitti-vaani/API.md)
- Flask blueprints (implementation): [`../../chitti-vaani/backend/routes/`](../../chitti-vaani/backend/routes/)
- All LLM calls (DeepSeek) live on the backend — **never** in the Android client.

## On-device STT — Vosk (planned Phase 2.4)

`com.alphacephei:vosk-android:0.3.47@aar`. Drop into [`app/libs/`](../app/libs/) and uncomment the dep in [`app/build.gradle.kts`](../app/build.gradle.kts). Models for Hindi + English shipped as Play Asset Delivery packs (see [DEVILS_ADVOCATE.md §4](DEVILS_ADVOCATE.md)). Used only for emergency-keyword spotting; audio never leaves the device.

## FCM for paired-device relay (planned Phase 2.5)

Firebase Cloud Messaging replaces the WebView's long-poll of [`/api/vaani/emergency/poll`](../API.md#apivaaniemergency--247-cascade) so inbound relay arrives even when the user's phone is locked and the app is backgrounded. `google-services.json` and the FCM project itself are listed pending in [`../TODO.md`](../TODO.md#cross-cutting--housekeeping). Data messages only; no notification analytics.

## What is **not** a truth source

Yahoo Finance (blocked from Railway, see [`project_data_sources`](../CONTEXT.md)). The Android client never queries it directly anyway — all market data flows through backend services.
