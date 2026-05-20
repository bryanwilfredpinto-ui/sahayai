# API — Chitti Vaani Android client

This document lists every backend endpoint the Android client calls (today or per the Phase 2 spec) on `chitti-vaani-api-production.up.railway.app`. The full backend spec lives at [`../chitti-vaani/API.md`](../chitti-vaani/API.md) — this file is the **Android-side index** that names the Kotlin call site (or planned call site) for each endpoint.

Today, **all HTTP traffic flows through the WebView** loaded in [`MainActivity.kt`](app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt). The web tier inside the WebView uses standard `fetch()` to talk to the API. There is no native networking layer yet.

Phase 2.4 and beyond will add **native** OkHttp/Retrofit calls from [`VaaniBootService`](app/src/main/java/in/sahayai/chitti/vaani/services/) (planned) and from `FedLearningSyncWorker` (planned, Phase 2.5), because those code paths must work when the WebView is paused (phone locked, app backgrounded).

---

## Base URL

| Environment | URL |
|---|---|
| Local dev | `http://localhost:8003` (allowed only when running from `adb` over USB; not whitelisted by [`network_security_config.xml`](app/src/main/res/xml/network_security_config.xml) — debug overrides needed) |
| Production | `https://chitti-vaani-api-production.up.railway.app` |

Network security: `cleartextTrafficPermitted="false"` (see [`network_security_config.xml`](app/src/main/res/xml/network_security_config.xml)). All production traffic is HTTPS.

---

## Endpoints called today (via WebView)

All callers are JavaScript inside [`https://sahayai.in/chitti_vaani.html`](../chitti_vaani.html). The Android shell does not currently re-issue any of these from Kotlin — it only renders the WebView that issues them.

### App-level

| Endpoint | Method | WebView caller | Android caller | Notes |
|---|---|---|---|---|
| `/` | GET | Health probe in web bootstrap | — (planned: `VaaniBootService.bootCheck()`) | Backend banner |
| `/health` | GET | Web tier liveness probe | — | `{"ok": true}` |

### `/api/vaani/*` — Conversational layer

Spec section: [`../chitti-vaani/API.md#apivaani--conversational-layer`](../chitti-vaani/API.md).

| Endpoint | Method | WebView caller | Android caller | Notes |
|---|---|---|---|---|
| `/api/vaani/ask` | POST | Web tier voice pipeline | — (no plan to call from native; conversational flow stays in WebView) | DeepSeek reply, web tier MUST `speechSynthesis.speak()` the result |
| `/api/vaani/health` | GET | Web tier diagnostic | — | DeepSeek configuration check |
| `/api/vaani/languages` | GET | Web tier language selector | — | UI strings |

### `/api/vaani/email/*` — Gmail OAuth + send-as-user (Phase 1.6)

Spec section: [`../chitti-vaani/API.md#apivaaniemail--gmail-oauth--send-as-user`](../chitti-vaani/API.md).

| Endpoint | Method | WebView caller | Android caller | Notes |
|---|---|---|---|---|
| `/api/vaani/email/status` | GET | Web tier connection probe | — | Per-`user_token` |
| `/api/vaani/email/auth/start` | POST | "Connect Gmail" button | — | Returns Google consent URL |
| `/api/vaani/email/auth/callback` | GET | Browser-side return URL | — | Public (Google can't carry headers) |
| `/api/vaani/email/send` | POST | "Chitti, email Bob" voice path | — (planned: Phase 2.3.1 native fallback if WebView is paused) | Auto-appends Chitti AI signature |
| `/api/vaani/email/disconnect` | POST | Settings → Disconnect | — | Best-effort token revoke |

### `/api/vaani/emergency/*` — 24/7 cascade

Spec section: [`../chitti-vaani/API.md#apivaaniemergency--247-cascade`](../chitti-vaani/API.md).

| Endpoint | Method | WebView caller | Android caller (planned) | Notes |
|---|---|---|---|---|
| `/api/vaani/emergency/trigger` | POST | Web emergency keyword spotter | **Phase 2.4** — `VaaniBootService.onKeywordHit()` via OkHttp | Body: `{user_token, reason, transcript, source}`. Backend fans out to paired Chittis. |
| `/api/vaani/emergency/check-in` | POST | "Theek hun" master-confirm | **Phase 2.4** — `EmergencyCascadeViewModel.userConfirmedOk()` | Aborts cascade, notifies pairs |
| `/api/vaani/emergency/pair/issue` | POST | Web pairing screen | — (no native flow planned; pairing is one-time-setup on web) | Returns 6-digit code valid 5 min |
| `/api/vaani/emergency/pair/accept` | POST | Helper enters code | — | Symmetric pairing |
| `/api/vaani/emergency/pair/unpair` | POST | Settings → Unpair | — | Best-effort row delete |
| `/api/vaani/emergency/pair/list` | GET | Settings → Paired Chittis | — | Shown in web Settings UI |
| `/api/vaani/emergency/poll` | GET/POST | Web tier long-poll relay listener | **Phase 2.4** — replaced by FCM data messages (not polling) for inbound relay | Web tier remains the primary surface; Android adds FCM so the relay arrives even when the user's phone is locked |

---

## Native calls (planned — not implemented yet)

Once the foreground listener service ships (Phase 2.4), these endpoints will be invoked **from Kotlin**, not just from the WebView. Plan: a single Retrofit interface inside `:feature:emergency` (module not yet created — see [ARCHITECTURE.md](ARCHITECTURE.md#5-networking-layer)).

```kotlin
interface VaaniApi {
    @POST("/api/vaani/emergency/trigger")
    suspend fun triggerEmergency(@Body req: EmergencyRequest): EmergencyResponse

    @POST("/api/vaani/emergency/check-in")
    suspend fun checkIn(@Body req: CheckInRequest): CheckInResponse

    // For voice-sample upload — Phase 2.5
    @Multipart
    @POST("/api/vaani/voice/sample")
    suspend fun uploadVoiceSample(
        @Part audio: MultipartBody.Part,
        @Part("user_token") token: RequestBody,
        @Part("language") language: RequestBody,
        @Part("transcript") transcript: RequestBody
    ): VoiceSampleResponse
}
```

| Endpoint | Method | Android caller (planned) | Status of backend endpoint |
|---|---|---|---|
| `/api/vaani/emergency/trigger` | POST | `VaaniBootService.onKeywordHit()` | **Live** — see [`../chitti-vaani/API.md`](../chitti-vaani/API.md) |
| `/api/vaani/emergency/check-in` | POST | `EmergencyCascadeViewModel.userConfirmedOk()` | **Live** |
| `/api/vaani/voice/sample` | POST (multipart) | `FedLearningSyncWorker.doWork()` | **Not yet implemented** — backend endpoint TBD per Phase 2.5 spec |
| FCM device-token register | POST `/api/vaani/device/register` (TBD) | App boot + token refresh | **Not yet implemented** — needed to receive inbound paired-Chitti relay pushes |

---

## Authentication

The Android client sends the same `user_token` UUID the web tier uses. The token is generated on first run inside the WebView (via `crypto.randomUUID()`) and persisted in `localStorage`. Because the WebView's `localStorage` is scoped to the app's WebView profile, the token persists across launches without needing native storage.

When native networking ships (Phase 2.4+), the Kotlin layer will read the token by injecting a small bridge call:

```kotlin
// MainActivity, after onPageFinished
web.evaluateJavascript("localStorage.getItem('chitti_user_token')") { value ->
    nativeTokenStore.set(value)
}
```

Or, more cleanly, the web tier already exposes `ChittiNative.getUserToken()` is a planned addition — to be wired in Phase 2.4.

---

## Cross-references

- Full backend endpoint contracts (request/response schemas, error codes): [`../chitti-vaani/API.md`](../chitti-vaani/API.md)
- Backend implementation (Flask Blueprints): [`../chitti-vaani/backend/routes/`](../chitti-vaani/backend/routes/)
- Network security policy: [`network_security_config.xml`](app/src/main/res/xml/network_security_config.xml)
- Networking layer plan: [ARCHITECTURE.md § 5](ARCHITECTURE.md#5-networking-layer)
