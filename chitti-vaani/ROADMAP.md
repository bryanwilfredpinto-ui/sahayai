# ROADMAP — Chitti Vaani

> Honest split of **built · in-flight · spec'd-not-built**.
> "LIVE" = curl-verified on production Railway + screenshot in
> `tools/cert_screenshots/`. "COMING SOON" = spec or skeleton only.
> If a section claims LIVE and you can't reproduce it from a fresh clone,
> file a bug at `HANDOVER/04_BUG_REPORT.md`.
>
> Vaani is the **sole user interface** for the sahayai.in platform
> (SAHAYAI_MASTER.md §2, LOCKED 2026-05-15). Everything else is internal
> infrastructure.

---

## Phase 1 — Web (LIVE, shipped 2026-05-12 → 2026-05-23)

**Status:** Production Railway URL verified. Core journeys tested.

### Conversational Core
- `POST /api/vaani/ask` — text + language + mode → DeepSeek reply with
  server-enforced legal disclaimer (`_enforce_disclaimer()`).
- 9 Indian languages wired (Hindi, English, Tamil, Telugu, Bengali, Marathi,
  Gujarati, Kannada, Malayalam).
- Mode variants: `ask` · `call` · `read` · `translate`.
- Layer-5 LLM fallback env-slots present (DeepSeek → Claude → Gemini),
  wiring active only for DeepSeek today (see `project_layer5_fallback_status`).

### Intent Router (Rules-Only)
- 14 Chitti routing targets — keyword-tier T1/T2/T3/NEG table.
- Confidence banding: ≥ 0.85 → direct; 0.70–0.85 → route + log;
  0.50–0.70 → confirm before route; < 0.50 → Vaani-direct fallthrough.
- Emergency keyword pre-check (BEFORE classification, < 5 ms).
- Session context inheritance (5 turns).
- `confirm_before_route` spoken question at confidence < 0.70.
- Routing accuracy target ≥ 85% — pending judge eval
  (see [`evals/router_accuracy.md`](evals/router_accuracy.md)).

### Pro Card Action Surface
- 📞 Make a Call — `tel:` dialer pre-fill (Android direct-dial in Phase 2).
- 💬 WhatsApp — `wa.me` deep-link.
- 📱 SMS — `sms:` RFC-5724 deep-link.
- 💸 UPI — `upi://pay` deep-link (PIN never leaves UPI app).
- 📧 Email — Gmail OAuth + server-side send (restricted scope).
- 🚶‍♀️ SafeWalk — check-in timer + Trusted Circle fan-out.
- 📵 Fake Incoming Call — WebAudio oscillator overlay.
- 📍 Share Location — `navigator.geolocation` → WhatsApp/SMS.
- 🏥 Medical ID — localStorage + read-aloud on demand.
- 🚑 Ambulance 108 — `tel:108` (108 is NOT in the cop denylist).
- 🗺️ Nearest hospital / chemist — Google Maps category search.

Every Pro Card is gated by `chittiConfirmAndDo()` (Golden Rule — LOCKED).

### Emergency Cascade
- Always-on keyword spotting (EMERGENCY_KEYWORDS — Hindi + English;
  regional langs Q3 2026 — item Q3 in skills/FEATURES.md).
- `POST /api/vaani/emergency/trigger` fan-out to all paired partners.
- `COP_DENYLIST` in `emergency_service.py` refuses 112/100/101/102.
- Chitti-to-Chitti relay via long-poll (`/api/vaani/emergency/poll`)
  — FCM push replaces long-poll in Phase 2.

### Accessibility (Phase 1 implementation)
- Voice-First Mode auto-activates for `disability_profile.blind` or `.illiterate`.
- ISL Phase 1: per-response animation panel + tap-word modal via `chitti_a11y.js`
  + `chitti_isl_dictionary.json`.
- Golden Rule confirm modal: voice listen + Haan/Nahi tap buttons (mute-safe).
- Per-response widget (🔊/🤖/👍/👎) on every `[data-chitti-response]` box.
- User Disability Profile multi-select (first visit, any Chitti page).
- 5 frontend gates wired (see [`QUALITY.md`](QUALITY.md)).

### Local-First Directory (LIVE 2026-05-13)
- Order food, groceries, medicines, salon — Chitti shop directory first,
  external app fallback second.
- Haversine geo-radius filter (5 km metro → auto-expand 25 km tier-2/3).
- "X km away" on each card + nearest match spoken aloud.
- `GET /api/vaani/local/nearby?service=<x>`.

### Cross-Product Hooks
- UPI Fraud Guard ↔ Vaani: fraud detection deep-links to SOS flow.
- Product Scanner ↔ Vaani: result POSTed with `mode=read` for blind users.
- Local directory ↔ Admin dashboard: shared `product_gmail_accounts` table.
- Psychology corpus (`skills/PSYCHOLOGY.md`): PhD-level, helpline cascade
  server-enforced.

---

## Phase 2 — Android OS-Level (SPEC ONLY — no code commits)

**Status:** `chitti-vaani-android/` skeleton exists. Phase 2 is spec-only.
Pro Cards on the web show `📱 Android only` pills.

### Sub-phase 2.1 — APK Skeleton (≈ 2 weeks)
- Kotlin + AndroidX, target API 34, min API 26.
- Jetpack Compose minimal UI (interaction is voice-first).
- WebView wrapper around `chitti_vaani.html` (voice UI stays single-sourced).
- `RECORD_AUDIO` permission, voice in/out parity with web.

### Sub-phase 2.2 — OS Handles (≈ 3 weeks)
- `DevicePolicyManager.lockNow()` — lock phone on voice command.
- `AudioManager.setRingerMode()` — toggle silent / ring.
- Hard-coded refusal: `unlock / kholo` always denied (no public API + keyword block).
- Deep-link senders for WhatsApp / UPI / Gmail ported to Android intents.

### Sub-phase 2.3 — Call Handling (≈ 4 weeks)
- `CallScreeningService` — night-mode call screening (22:00–06:00 IST).
- `InCallService` — default dialer role.
- Day-mode auto-answer flow (answers calls from Trusted Circle).
- **2.3.1** — outbound direct-dial via `ACTION_CALL` + `CALL_PHONE` permission.
  Mute-user "Chitti speaks for me" toggle: speakerphone + TTS via `VaaniInCallService`.

### Sub-phase 2.4 — Night Mode + Emergency Keyword Spotting (≈ 5 weeks)
- On-device Vosk multilingual keyword spotter — foreground service, **never network**.
  Always-on from 22:00–06:00 IST; opt-in 24/7.
- `setRingerMode(NORMAL)` + `setStreamVolume(MAX)` + vibration pattern on detection.
- Emergency callout aloud every 5 s until phone unlocked / call ends.
- **FCM push channel** for Chitti-to-Chitti relay (replaces web long-poll).
- `STREAM_ALARM` bypass — paired-partner alarms ring even on silent.

### Sub-phase 2.5 — Federated Learning (≈ 3 weeks)
- `androidx.federatedcompute` scaffolding.
- Voice samples stay on-device; only model gradients shipped to server.
- Voice donation pipeline (opt-in) for community voice building.

### Sub-phase 2.6 — Google Play Submission (≈ 4 weeks)
- Expect 2–3 rejections on `READ_CALL_LOG` / `SEND_SMS` justification.
- Play Store compliance lines (identity + DPDP Act 2023 grievance officer).
- Privacy policy + video walkthrough for sensitive permissions.

### Hard Refusals (code-level — Phase 2)
- `unlockDevice()` — no public API + keyword denylist.
- UPI PIN over network — PIN never leaves the UPI app's secure keypad.
- Reading other apps' private storage.
- Voice-biometric UPI PIN (parked as v2 — RBI Regulatory Sandbox + bank PSP needed).

---

## Phase 3 — Community Voices Replace Bhashini (FUTURE)

**Status:** Spec in `CHITTI_VOICE_FACTORY_MASTER_SPEC.md`. No code commits.

Per the Voice Strategy LOCKED decision (SAHAYAI_MASTER.md §2a):
- Bhashini is **temporary** — community-donated voices replace it per language
  as each language crosses the quality threshold.
- Hall of Fame for voice contributors (`chitti_voice_hall_of_fame.html`).
- Architecture must support swapping the provider at any time —
  `window.Chitti.a11y.VOICE_FACTORY_URL` is the single swap point.
- ISL Phase 2: camera input → sign recognition.
- ISL Phase 3: community-contributed ISL videos + Hall of Fame.
  For 6 crore deaf Indians who currently have no quality ISL app.

---

## Planned Feature Wave (Queued 2026-05-13)

### V1 — Remember My Preferences (P1)
User says *"usual at Sharma's"* → Vaani pre-fills the order from their
preference store. New `user_preferences` table; onboarding-grant (not
per-order modal); never stores UPI PINs or bank details.

### V2 — Voice Shortcuts (P2)
*"Usual"* / *"wahi wala"* / *"always"* become alias intents. DeepSeek
intent layer maps them → reads preference back aloud → *"haan"* to confirm.
**Always reads back before acting** (commando, but never silent).

### V3 — Daily Check-in for Elderly Users (P0 — safety)
New `daily_checkin` table + cron at user-chosen IST time. Vaani speaks:
*"Aap theek hain?"* → silence after 3 prompts → `/api/vaani/emergency/trigger`
family cascade (NEVER cops). Opt-in by paired family member during onboarding.
Reuses the existing emergency cascade — no parallel family-notification path.

### V4 — Morning Brief 07:00 IST (P0 — LOCKED 2026-05-15)
Weather (open-meteo/IMD) + mandi rates + top 3 reminders + bills due +
health tip + Chitti News headline + **AI Daily Tip from chitti-news-ai**.
The AI tip is one line inside the existing brief — never a separate push.
Internal HTTPS GET to `chitti-news-ai/api/daily-tip?profession=<user>&lang=<user>`;
15 s timeout; honest fallback if upstream 503 (*"Aaj ka AI tip nahi mila — kal dobara"*).
Never re-TTS: upstream `audio_url` played directly via Voice Factory.

### V5 — Confidence Scores on Routing (Q1 — Quality Improvement)
`route_confidence` emitted in the response payload; rendered as a coloured chip
(green ≥ 80%, amber 50–79%, red < 50%) by `Chitti.a11y.renderConfidence()`.
Below 70%: confirm-before-route already fires (SOP-V002 §4).

### V6 — Regional Emergency Keywords (Q3 — Quality Improvement)
Extend `EMERGENCY_KEYWORDS` in `vaani_service.py` with Tamil, Telugu,
Marathi, Bengali, Gujarati, Kannada variants sourced from
`skills/PSYCHOLOGY.md` distress lexicon.

---

## What Is Intentionally NOT on the Roadmap

- Becoming a payment processor (UPI deep-links only; NPCI compliance cost).
- Replacing WhatsApp / SMS (we open them pre-filled; we don't replicate them).
- Social-credit feedback aggregation (happiness meter is anonymised, per-product).
- Mandatory national-ID linking (Aadhaar is opt-in everywhere).
- Autonomous action without user confirm (Golden Rule is locked — never revisited).
- Auto-dialing government emergency numbers (112 / 100 / 102 — COP_DENYLIST, forever).
- Voice-biometric UPI PIN before RBI Regulatory Sandbox approval.

---

## Honesty Footer

- "LIVE" = curl-verified on production Railway + screenshot in `tools/cert_screenshots/`.
- "SPEC ONLY" = no code commits. Android sub-phases listed for transparency
  of what the platform intends to build — not a commitment to ship date.
- "COMING SOON" badges on Pro Cards are honest: they are visible to the user,
  not hidden — per new-products process (SAHAYAI_MASTER.md §2a).
- Planned feature wave (V1–V6) items have no code. They are in
  `skills/FEATURES.md §4` as capability declarations. Code ships only after
  Sire's review and a PR against `main`.

---

Last reviewed: 2026-06-06
