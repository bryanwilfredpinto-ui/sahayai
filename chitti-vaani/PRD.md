# PRD — Chitti Vaani

**Version:** v1.5 (Phase 1 + 1.5 + 1.6 live) · **Phase 2 Android: spec only.**
**Status:** F0–F6 live on `sahayai.in/chitti_vaani.html`; F7 live; F8–F9 planned;
Android-only capabilities marked 📱.

Cross-references: [`skills/FEATURES.md`](skills/FEATURES.md) · [`CONTEXT.md`](CONTEXT.md)
· [`CONSTITUTION.md`](CONSTITUTION.md) · [`CHITTI_SOP.md`](../CHITTI_SOP.md) §1
· [`SAHAYAI_MASTER.md`](../SAHAYAI_MASTER.md) §2 locked decisions.

---

## Feature index

| Feature | ID | Phase | Status |
|---|---|---|---|
| Conversational core + intent router | F0 | 1 | ✅ Live |
| Pro Actions — call / SMS / WhatsApp / UPI / email | F1 | 1 / 1.6 | ✅ Live |
| 24/7 emergency cascade (family-only, never cops) | F2 | 1.5 | ✅ Live |
| Order & book — local-Chitti-first directory | F3 | 1.5 | ✅ Live |
| Safety surface — SafeWalk / Fake Call / Location / Medical ID / 108 | F4 | 1.5 | ✅ Live |
| Geo local-business — haversine + 5/25 km auto-expand | F5 | 1.5 | ✅ Live |
| Consent gate + quality framework | F6 | 1 | ✅ Live |
| Psychology corpus — therapist-boundary + helpline cascade | F7 | 1 | ✅ Live |
| Daily Good Morning brief + AI daily tip | F8 | planned P0 | ⚠️ Planned V4 |
| Daily elderly check-in cron | F9 | planned P0 | ⚠️ Planned V3 |
| Android OS-level capabilities | F10 | Phase 2 📱 | Spec only |

---

## F0 — Conversational core + intent router

**Status:** ✅ Live · `POST /api/vaani/ask` · `GET /api/vaani/health` · `GET /api/vaani/languages`

### What it does
Single DeepSeek-powered endpoint that accepts a spoken or typed utterance in any
of 9 first-class languages (`hi en ta te bn mr gu kn ml`) and returns a reply that
the frontend reads aloud. The reply carries a mandatory legal disclaimer appended
server-side by `_enforce_disclaimer()` in `vaani_service.py` — even if DeepSeek
omits it, the footer is never missing.

Modes: `ask` (conversational) · `call` (summarise call notes) ·
`read` (read aloud a pasted text) · `translate` (translate to another Indian language).

Intent router classifies the utterance and routes to one of the 14 internal Chittis.
Confidence < 70% triggers a readback-confirm before routing: *"I think this is a CA
question — shall I route to Chitti CA? Say haan to proceed."*

### Quality requirements
- Fail-open: with DeepSeek unavailable, endpoint returns honest error state —
  never a silent failure or a fabricated reply.
- Layer-5 fallback chain: DeepSeek → Gemini (PLANNED — 0/1 backends wired today).
- Language auto-detection from `chitti_lang` substrate; unknown codes pass through
  as a freeform *"reply in X"* hint to DeepSeek.
- Per-response widget auto-attaches via `feedback-widget.js`.
- ISL Phase 1 panel auto-attaches via `chitti_a11y.js`.

### Acceptance criteria
- AC-F0.1: `POST /api/vaani/ask` returns 200 with `{ok, reply, source, language, model, tokens}` ✅
- AC-F0.2: Legal disclaimer present in every reply body ✅
- AC-F0.3: Fail-open: returns meaningful error when `DEEPSEEK_API_KEY` unset ⚠️ (Gemini fallback not yet wired)
- AC-F0.4: Language auto-detect fires within 500 ms of page load ✅

---

## F1 — Pro Actions (call / SMS / WhatsApp / UPI / email)

**Status:** ✅ Live (all five channels). Every action routes through
`chittiConfirmAndDo()` — constitutional requirement, not a feature flag.

### What it does

| Action | Web behaviour | Android delta (Phase 2 📱) |
|---|---|---|
| **Make a call** | `tel:` deep-link opens OS dialer pre-filled | `ChittiNative.makeCall()` direct-dials with `ACTION_CALL` + `CALL_PHONE` permission |
| **Send SMS** | `sms:<phone>?body=<msg>` opens user's SMS app pre-filled. Voice readback + haan confirm + 30 s undo. | `ChittiNative.sendSMS()` via `SmsManager` after `SEND_SMS` permission |
| **Send WhatsApp** | `https://wa.me/<phone>?text=<msg>` opens WhatsApp with message pre-filled; user taps green arrow | `ChittiNative.openWhatsAppAndTapSend()` via `AccessibilityService` scoped to WhatsApp send-button + 2 s cancel window 📱 |
| **Send UPI** | `upi://pay?pa=…&am=…&pn=…` opens user's UPI app; user enters PIN in UPI app. Vaani never sees the PIN — NPCI rule. | Same; no change in Phase 2 |
| **Send email as Chitti AI** | Full Gmail OAuth (`gmail.send` restricted scope) + server-side send via Gmail API. Chitti AI footer auto-appended. **The only Pro Action where the network call happens server-side.** | Same |

Trusted Circle (localStorage contact list, voice-buildable, read-aloud) populates
all five modals. Audit log + 30-second undo on every action.

### Quality requirements
- `chittiConfirmAndDo()` gate on every action — no bypass, no timeout-to-yes.
- Chitti speaks action description before execution: *"I will send this WhatsApp to Raj — body says: 'Running late.' Say cancel to stop."*
- UPI PIN never logged, never spoken, never stored.
- Channels health endpoint `GET /api/vaani/channels/health` returns honest configured-state of every outbound channel; Pro Card pills flip from "Awaiting provider" to "Web ✓" automatically.

### Acceptance criteria
- AC-F1.1: All five channels reachable via `channels/health` ✅
- AC-F1.2: Golden Rule gate present on every channel card ✅
- AC-F1.3: Trusted Circle voice-buildable and read-aloud ✅
- AC-F1.4: 30-second undo after every state-mutating Pro Action ✅
- AC-F1.5: Gmail send confirmed e2e on production with OAuth ✅

---

## F2 — 24/7 emergency cascade (family-only, never cops)

**Status:** ✅ Live · `POST /api/vaani/emergency/trigger` · `POST /api/vaani/emergency/check-in` · pair/issue · pair/accept · pair/unpair · pair/list · poll

### What it does

Four-step local cascade, always in this order:
1. **Confirm with master, 10 s** — *"Master, are you OK? Say theek hun."* Silence or distress word advances. *"Theek hun"* aborts and notifies pairs.
2. **Ring alarm, 10 s, bypassing silent** — Web Audio on web; `STREAM_ALARM` on Android Phase 2.
3. **Escalate to spouse / family** — outbound call to Trusted Circle via `tel:` (web) / `ACTION_CALL` (Phase 2 Android).
4. **Fire Chitti-to-Chitti relay** — paired partners poll `/api/vaani/emergency/poll` (web) or receive FCM push (Phase 2 Android 📱) and ring their own alarm even on silent.

`COP_DENYLIST = {112, 100, 101, 102, 108, 1098, 1930, 139}` enforced via `is_cop_number()`. 108 is separately available as a direct shortcut in the Safety surface (F4) — it is the medical line, not a cop line — but the cascade never auto-dials it.

Always-on keyword spotting in any Chitti-mediated audio. Multilingual emergency keywords: Hindi + English live; Bangla / Tamil / Telugu / Marathi regional variants queued (Q3 planned improvement).

### Quality requirements
- Cop-denylist is not a configuration option. Enforced at protocol layer.
- Emergency trigger must not require network to fire the local alarm (Web Audio is offline-capable).
- Honest failure state: if family cascade is unreachable (no network, no trusted circle configured), ring alarm locally and surface spoken: *"Chitti connected partner se nahi mil paya — alarm baj raha hai."*

### Acceptance criteria
- AC-F2.1: `COP_DENYLIST` enforced even for misconfigured trusted-circle entry ✅
- AC-F2.2: `/api/vaani/emergency/trigger` → paired partner receives event within relay poll window ✅
- AC-F2.3: Check-in aborts cascade and notifies pairs ✅
- AC-F2.4: Emergency alarm fires without network dependency (Web Audio) ✅
- AC-F2.5: FCM push for Phase 2 Android 📱 — spec only ⚠️

---

## F3 — Order & book — local-Chitti-first directory

**Status:** ✅ Live · `GET /api/vaani/local/nearby?service=<x>` · `GET /api/vaani/local/categories`

### What it does

Single modal shared across all booking categories. **Always** queries the Chitti
shop directory first; offers external-app deep links as opt-in fallback.

| Card | Chitti directory queried | External fallback |
|---|---|---|
| Order food | `chittirestaurant` | Zomato / Swiggy (mobile web) |
| Order groceries | `chittikirana` · `chittigrocery` | Blinkit / BigBasket |
| Order medicine | `chittipharmacy` · `chittimedical` | None — pharmacy stays local |
| Book salon | `chittisalon` | None — salon stays local |
| Book a cab | No Chitti substrate yet | Ola / Uber / Rapido (homepage — no stable param schema) |
| Book movie | No Chitti substrate yet | BookMyShow |
| Book train | No Chitti substrate yet | IRCTC (captcha + booking on IRCTC) |

"Nearby" means haversine-filtered by the user's GPS / pincode via `Chitti.location.get()`.
5 km metro → 25 km auto-expand when zero confirmed-in-radius hits. Honest empty
state spoken aloud when directory has no match.

External deep-links open the merchant's mobile site. Chitti does not auto-book,
auto-pay, or auto-confirm anything. Final tap is always the user's — same pattern
as the WhatsApp / UPI Pro Actions.

### Acceptance criteria
- AC-F3.1: Chitti directory queried before any external app deep-link ✅
- AC-F3.2: Haversine + 5/25 km auto-expand live ✅
- AC-F3.3: Honest empty state spoken aloud; never silent ✅
- AC-F3.4: Auto-book / auto-pay / auto-confirm: never. Final tap is user's ✅

---

## F4 — Safety surface (SafeWalk / Fake Call / Live Location / Medical ID / 108)

**Status:** ✅ Live (all 6 cards, voice intents wired) · Android delta for Phase 2 📱

| Card | What | Web behaviour | Android delta 📱 |
|---|---|---|---|
| 🚶‍♀️ **SafeWalk** | Check-in timer; alerts Trusted Circle if user goes silent past deadline. Never auto-dials cops. | `setTimeout` + `chittiConfirmAndDo` re-prompt 30 s before deadline · `navigator.geolocation` on escalation · `wa.me?text=` fan-out | Vosk wake-word path lets SafeWalk fire when screen is off |
| 📵 **Fake Call** | Simulates a ringing call in 2 minutes so user can leave an unsafe situation | Fullscreen overlay + WebAudio oscillator beat | `ChittiNative.triggerFakeIncomingCall()` → real ringtone via `RingtoneManager.TYPE_RINGTONE` + `PRIORITY_MAX` notification |
| 📍 **Share live location** | One-shot location share to Trusted Circle pick via WhatsApp or SMS | `navigator.geolocation` → `maps.google.com/?q=lat,lng` → `wa.me?text=` or `sms:?body=` | `ChittiNative.shareLocation()` uses `LocationManager.getLastKnownLocation` for MIUI quirk |
| 🏥 **Medical ID** | Local store for blood group / allergies / conditions / doctor / emergency contact. Spoken on demand. | `localStorage.chitti_vaani_medical_id_v1`; read aloud via Voice Factory cascade | `ChittiNative.setMedicalId(json)` mirrors into SharedPreferences for Phase 2 lock-screen Emergency-Info surface |
| 🚑 **Ambulance 108** | Direct shortcut to 108 (medical line). Separate from `COP_DENYLIST`. 108 is the one Chitti CAN dial. | `tel:108` after Golden Rule confirm | `ChittiNative.makeCall("108")` direct dial when `CALL_PHONE` granted |
| 🏪 **Nearest hospital / chemist** | Maps category search scoped to user's location. Optional "open now" toggle. | `https://www.google.com/maps/search/?api=1&query=<kind>+near+me` | `ChittiNative.openMaps(query)` opens Maps app directly |

Voice intents wired: *"safewalk … min"* · *"main akeli ja rahi hun"* · *"fake call"* ·
*"meri location bhejo"* · *"ambulance"* · *"aaspaas ka hospital"* · *"medical id"*.

### Acceptance criteria
- AC-F4.1: SafeWalk timer fires family-cascade, never cops ✅
- AC-F4.2: Fake Call overlay functional on web (WebAudio + fullscreen) ✅
- AC-F4.3: Live location shared as Google Maps URL via WhatsApp or SMS ✅
- AC-F4.4: Medical ID stored only in localStorage — never sent to server ✅
- AC-F4.5: 108 card routes through Golden Rule gate (`tel:108` on confirm) ✅
- AC-F4.6: Vosk wake-word path for SafeWalk on screen-off 📱 — spec only ⚠️

---

## F5 — Geo local-business (haversine + 5/25 km auto-expand)

**Status:** ✅ Shipped 2026-05-13. Documented in `skills/FEATURES.md` §3.2.

Haversine distance + automatic metro (5 km) / tier-2/3 (25 km) radius expansion
via `local_chitti_service.nearby()`. Shops without geo data carry a *"Distance unknown"*
pill and do not count toward expansion check. No-location fallback shows the
full directory with a spoken *"No location set — Chitti is showing the full
directory"* banner + **Set location** link. End-to-end verified: Mumbai user
sees Mumbai shop at 0.806 km; Bangalore shop filtered.

---

## F6 — Consent gate + quality framework

**Status:** ✅ Live

6-section T&C modal locks every feature until the user taps **I AGREE**. Each
section has a 🔊 button that reads it aloud in the user's language. Acceptance
persists in `localStorage.chitti_vaani_consent_given`.

Quality framework: per-response widget (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️) on every
`[data-chitti-response]` box via `feedback-widget.js`. Daily 06:00 IST report
computes top-3 suggestions + 👍/👎 ratios per page. Channels health endpoint
returns real configured-state of every outbound channel.

SEBI sticky banner remains on every page — never demoted to footer.

---

## F7 — Psychology corpus (therapist-boundary + helpline cascade)

**Status:** ✅ Live (server-enforced) · Source: `skills/PSYCHOLOGY.md`

Psychology queries routed to a bounded peer-support mode. Vaani provides
empathetic conversation; it never claims to be a licensed therapist.

**Every psychology response ends with the helpline cascade** — enforced server-side
for any reply where DeepSeek selects the psychology corpus path:
- Tele-MANAS 14416 (government, free)
- iCall (TISS)
- Vandrevala Foundation (24/7)
- NIMHANS

The cascade is server-enforced in `vaani_service.py` — never client-controlled.
HIGH-risk corpus changes (psychology, emergency cascade, helpline numbers) require
Sire's review before merge.

---

## F8 — Daily Good Morning brief + AI daily tip (PLANNED P0)

**Status:** ⚠️ Planned V4 — spec committed in `skills/FEATURES.md` §4

07:00 IST APScheduler job in `chitti-vaani/backend/main.py`. Content: weather
(open-meteo or IMD) + top news (Chitti News API) + health tip (curated) + top 3
reminders + bills + **AI daily tip from Chitti News AI**.

AI tip: internal HTTPS GET to `chitti-news-ai-api`: `/api/daily-tip?profession=<user>&lang=<user>`
(15 s timeout). Honest fallback if upstream 503: *"Aaj ka AI tip Chitti dhoondh nahi
paya — kal subah dobara."* Never silently falls back to a stale cached tip.

The AI tip is **one line inside the existing 07:00 IST brief** — never a separate
notification.

---

## F9 — Daily elderly check-in cron (PLANNED P0)

**Status:** ⚠️ Planned V3 — spec committed in `skills/FEATURES.md` §4

New `daily_checkin` table + cron at user-chosen IST time → Vaani speaks
*"Aap theek hain?"* → user says *"haan"* → silence after 3 prompts triggers
`/emergency/trigger` (family cascade, never cops — same protocol as F2).
Opt-in by paired family member during onboarding. Never spawns a parallel
family-notification path — reuses the emergency cascade.

---

## F10 — Android OS-level capabilities (Phase 2 — spec only)

**Status:** 📱 Spec only — Phase 2 APK not yet built

| # | Capability | Android API |
|---|---|---|
| 1 | Lock the phone on voice command | `DevicePolicyManager.lockNow()` (DEVICE_ADMIN) |
| 2 | Hard refusal to unlock (no `unlockNow()` for 3rd-party apps — code-level denylist) | — |
| 3 | Toggle silent / ring mode | `AudioManager.setRingerMode()` |
| 4 | Auto-answer / day-mode call handling | `InCallService` (Default Dialer role) |
| 5 | Night-mode call screening (22:00–06:00) | `CallScreeningService` |
| 6 | Direct dial (no `tel:` hop) | `ACTION_CALL` + `CALL_PHONE` permission |
| 7 | "Open WhatsApp and tap send" autonomously | `AccessibilityService` scoped to WA send-button + 2 s cancel |
| 8 | On-device Vosk emergency keyword spotting (continuous, offline, foreground service) | `RECORD_AUDIO` + foreground service + Vosk multilingual model |
| 9 | STREAM_ALARM bypass for paired-partner alarms (rings on silent) | `AudioManager.STREAM_ALARM` |
| 10 | FCM push for Chitti-to-Chitti relay | Firebase Cloud Messaging |
| 11 | Federated learning on collected voice samples | `androidx.federatedcompute` (alpha) |
| 12 | Read SMS / call log / WA notifications aloud | `READ_SMS` / `READ_CALL_LOG` + `NotificationListenerService` |
| 13 | Voice-biometric UPI PIN replacement | Bank-PSP partnership + RBI Regulatory Sandbox (parked v2) |

---

## Non-functional requirements

### NFR-1 — Performance

| Bar | Target | Status |
|---|---|---|
| `/api/vaani/ask` p50 latency (after DeepSeek responds) | < 2 s | ⚠️ untested under load |
| Frontend first-paint on 4G | < 3 s | ⚠️ untested |
| Frontend first-paint on 2G | < 12 s | ⚠️ untested |
| Voice synthesis start (first audio byte) | < 1.5 s from reply receipt | ⚠️ untested |

### NFR-2 — Reliability

| Bar | Target | Status |
|---|---|---|
| Fail-open with all LLM env vars unset | Returns honest error state | ⚠️ Layer-5 fallback not yet wired |
| Emergency alarm without network | Fires via Web Audio (offline-capable) | ✅ |
| Chitti-to-Chitti relay across restarts | Survives Railway redeploy | ✅ Turso wired |

### NFR-3 — Accessibility

| Bar | Status |
|---|---|
| 🔊 Speaker + 🤖 Chitti + 👍 / 👎 + ✏️🎙️ on every response box | ✅ via `feedback-widget.js` |
| ISL Phase 1 panel per response | ✅ via `chitti_a11y.js` |
| Colour-only feedback: 0 occurrences | ⚠️ design rule enforced; automated scan pending |
| Tap targets ≥ 48×48 px on 375 px | ⚠️ not yet measured in cert harness |
| TalkBack + BrailleBack compatible | ⚠️ design rule; no CI test yet |

---

## Out of scope (deferred)

- Auto-book / auto-pay any external service (Zomato, IRCTC, Ola) — closed B2B APIs
- Bill payment / recharge — BBPS via TSP; per-biller KYC required
- Government scheme submission — DigiLocker partner status pending
- Voice-biometric UPI PIN — RBI Regulatory Sandbox cohort required
- Chitti Offline P2P Transfer — Phase 2.7 post-Play Store submission
- Aadhaar-linked authentication — opt-in only; no mandatory biometrics

---

**World Class Chitti Vaani — Commando Discipline. Zero Excuses.**
