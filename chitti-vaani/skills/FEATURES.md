# Chitti Vaani — FEATURES

Honest, code-verified inventory of what the Chitti Vaani product actually
does today. Three sections: **Built & working** (verified by reading
backend routes + frontend handlers, not just docs), **Planned**
(referenced in [`../TODO.md`](../TODO.md) or has a UI button but the
underlying handler is unimplemented), and **Future** (needs partnership,
regulatory access, or platform approval before any code is worth writing).

Last verified against the working tree on **2026-05-12**. When in doubt,
re-grep `chitti-vaani/backend/routes/` for the endpoint and
`chitti_vaani.html` for the handler before claiming "built".

> **CHITTI GOLDEN RULE — applies to every feature below (LOCKED 2026-05-23).** Chitti NEVER acts on its own. Every feature in this file that performs a side-effecting action (call, SMS, WhatsApp, email, UPI, lock, silent, flashlight, camera, app launch, navigation, alarm, reminder, anything) routes through the `chittiConfirmAndDo()` gate in [chitti_vaani.html](../../chitti_vaani.html). Chitti asks *"Sire, shall I do X?"* in the user's language, waits for explicit haan/yes/theek (voice or tap), and fires the action ONLY on Yes. Silence = wait. Never defaults. Never times out into Yes. See [SAHAYAI_MASTER.md §2g](../../SAHAYAI_MASTER.md) and [CONTEXT.md](../CONTEXT.md).

---

## 1. Built and working on the web

These are wired end-to-end: a real HTTP endpoint OR a frontend handler
that produces a visible, externally-observable effect.

### 1.1 Conversational core (DeepSeek)
- `POST /api/vaani/ask` — `{text, language?, mode?}` → DeepSeek reply
  with mandatory legal disclaimer appended.
  Modes: `ask` · `call` (summarise call notes) · `read` (read aloud) ·
  `translate`. 9 languages. Source: [`backend/routes/vaani.py`](../backend/routes/vaani.py),
  [`backend/services/vaani_service.py`](../backend/services/vaani_service.py).
- `GET /api/vaani/health` · `GET /api/vaani/languages`.

### 1.2 Pro Actions — Chitti acts for you (existing cards)

| Action | What actually happens | Surface |
|---|---|---|
| **Make a call** | `tel:` deep-link opens the OS dialer pre-filled. Native `ChittiNative.makeCall` path is wired in JS but the Android bridge is Phase 2 — on web it always falls through to the dialer. | Web ✓ (dialer pre-filled) |
| **Send WhatsApp** | `https://wa.me/<phone>?text=<msg>` opens WhatsApp with recipient + message; user taps the green arrow to send. | Web ✓ |
| **Send SMS** | `sms:<phone>?body=<msg>` (RFC 5724) opens the user's own SMS app pre-filled — the SMS goes from the user's own SIM, no server-side telephony provider needed. Phase-2 Android bridge `ChittiNative.sendSMS(phone, body)` sends directly via `SmsManager` after `SEND_SMS` permission is granted. Trusted-circle + free-text fallback + voice readback + "haan" confirmation + 30-second undo — same shape as the WhatsApp card. | Web ✓ (SMS app pre-filled) |
| **Send UPI payment** | `upi://pay?pa=…&am=…&pn=…` opens the user's UPI app pre-filled; user enters PIN in the UPI app (Chitti never sees the PIN — NPCI rule). | Web ✓ |
| **Send email as Chitti AI** | Full Gmail OAuth (`gmail.send` restricted scope) + server-side send via Gmail API. Chitti AI footer auto-appended. **The only Pro Action that performs the network action server-side** rather than handing off to an app. Requires Railway env `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (+ Google Cloud OAuth consent screen verified for `gmail.send` Restricted Scope) AND each user must complete the Connect-Gmail flow once per device. `GET /api/vaani/channels/health` shows which env vars are missing. | Web ✓ (after Gmail OAuth connect) |
| **Trusted Circle** | localStorage contact list, voice-buildable, read-aloud, used to populate the Call / WhatsApp / UPI / Email modals. | Web ✓ |
| **Audit log + 30-second undo** | Every action a user takes from a Pro card writes an entry; `undo()` is a closure on each entry, valid for 30 s. | Web ✓ |
| **Federated voice-sample collection** | Opt-in. Samples in 9+ Indian languages stored in IndexedDB on the device. **Training pipeline does not exist yet** — see "Planned". | Web ✓ collecting only |

### 1.3 Order & book — Chitti business first, external app fallback (NEW)
Single shared modal driven by [`/api/vaani/local/nearby?service=<x>`](../backend/routes/local.py).
**Always** queries the Chitti shop directory first, **then** offers external-app deep links as a fallback. Chitti business comes first; the external app is opt-in.

| Card | Local-Chitti directory queried | External-app fallback (web deep-link) |
|---|---|---|
| **Order food** | `chittirestaurant` | Zomato (`zomato.com/search?q=`), Swiggy (`swiggy.com/search?query=`) |
| **Order groceries** | `chittikirana` · `chittigrocery` · `chittidairy` | Blinkit (`blinkit.com/s/?q=`), BigBasket (`bigbasket.com/ps/?q=`) |
| **Order medicine** | `chittipharmacy` · `chittimedical` | _none_ — pharmacy refills stay local |
| **Book salon** | `chittisalon` | _none_ — salon bookings stay local |
| **Book a cab** | _no Chitti substrate yet_ | Ola (`book.olacabs.com/?drop_name=`), Uber (`m.uber.com/ul/?action=setPickup…`), Rapido (homepage — no documented param schema) |
| **Book movie tickets** | _no Chitti substrate yet_ | BookMyShow (`in.bookmyshow.com/explore/movies-<city>`) |
| **Book train ticket** | _no Chitti substrate yet_ | IRCTC (`irctc.co.in/nget/train-search` — captcha + booking on IRCTC) |

Directory data is the existing `product_gmail_accounts` table seeded by
[`admin_seed.py`](../backend/scripts/admin_seed.py) (12 shop Chittis
since May 2026). Each card shows the shop's connection status (CONNECTED
vs BEING ONBOARDED) and offers **📧 Contact via email** — which opens
the existing Vaani email modal pre-filled with that shop's mailbox.
The user still types the body and says **"haan"** to send.

**Honest limits** (verified by reading [`local_chitti_service.py`](../backend/services/local_chitti_service.py)):
- "Nearby" today means "in the Chitti shop directory" — there is **no
  geo / lat-lng column** on `product_gmail_accounts` yet. So the
  directory is country-wide, not radius-bound.
- External deep links open the merchant's mobile site / app. Chitti
  does **not** auto-book, auto-pay, or auto-confirm anything. The final
  tap is always the user's, inside the merchant app — exactly the same
  pattern as the existing WhatsApp / UPI cards.
- Rapido + IRCTC fall through to their homepages because neither
  publishes a stable param-based deep-link schema. The modal labels
  these "opens — set pickup & drop / captcha + booking happen there".

### 1.3a Safety surface (spec §5.3 — landed 2026-05-23)

Six new Pro Cards added per [CHITTI_FULL_ACCESS_AGENT_v1.docx](../../CHITTI_FULL_ACCESS_AGENT_v1.docx) §5.3 Safety + §5.1 Health. All route through the [Golden Rule single-confirm](../../SAHAYAI_MASTER.md#2g-chitti-golden-rule--confirm-before-every-action-locked-2026-05-23) gate.

| Card | What | Web behaviour | Android-only delta |
|---|---|---|---|
| 🚶‍♀️ **SafeWalk mode** | Check-in timer that alerts Trusted Circle if user goes silent past the deadline. Reuses the family-cascade, NEVER auto-dials 112. | `setTimeout` + `chittiConfirmAndDo` re-prompt 30 s before deadline · `navigator.geolocation` on escalation · `wa.me?text=` fan-out to picked Trusted Circle members. State persists across reloads via `localStorage.chitti_vaani_safewalk_v1`. | Phase-2 Vosk wake-word path lets SafeWalk fire even when the screen is off. |
| 📵 **Fake incoming call** | Simulates a ringing call in 2 minutes so the user can leave an unsafe situation. | Fullscreen overlay + WebAudio oscillator beat. | `ChittiNative.triggerFakeIncomingCall()` → real ringtone via `RingtoneManager.TYPE_RINGTONE` + full-screen notification (`CATEGORY_CALL`, `PRIORITY_MAX`). |
| 📍 **Share my live location** | One-shot location share to a Trusted Circle pick over WhatsApp or SMS. | `navigator.geolocation` → `https://maps.google.com/?q=lat,lng` → `wa.me?text=` or `sms:?body=`. | `ChittiNative.shareLocation(phone, channel)` uses `LocationManager.getLastKnownLocation` if the WebView's geolocation API is blocked (MIUI quirk). |
| 🏥 **Medical ID** | Local store for blood group / allergies / conditions / doctor / emergency contact. Spoken on demand. | `localStorage.chitti_vaani_medical_id_v1`; `readMedicalIdAloud()` uses Voice Factory cascade. | `ChittiNative.setMedicalId(json)` mirrors into SharedPreferences for the (Phase-2) system Emergency-Info lock-screen surface. |
| 🚑 **Ambulance 108** | Direct shortcut to 108 (medical line). **Separate from the cop denylist** — 112/100/102/108 are not all the same; 108 is the one Chitti CAN dial. | `tel:108` (after Golden Rule confirm). | `ChittiNative.makeCall("108")` direct dial when CALL_PHONE granted. |
| 🏪 **Nearest hospital / chemist** | Maps category search scoped to user's location. Optional "open now" toggle adds "24 hours" qualifier. | `https://www.google.com/maps/search/?api=1&query=<kind>+near+me`. | `ChittiNative.openMaps(query)` opens the Maps app directly. |

Voice-intent shortcuts wired in the same commit: `"safewalk … min"` / `"main akeli ja rahi hun"` · `"fake call"` / `"2 minute mein call dikha"` · `"meri location bhejo"` / `"share my location"` · `"ambulance"` / `"108"` · `"nearest chemist"` / `"aaspaas ka hospital"` · `"medical id"` / `"emergency info"`.

### 1.4 24/7 emergency cascade (family-only, never cops)
Real backend, real fan-out. Refuses to dial 112/100/101/102/108/1098/1930/139
by code-level denylist — see [`emergency_service.py`](../backend/services/emergency_service.py).
- `POST /api/vaani/emergency/trigger` — fan out to every paired partner.
- `POST /api/vaani/emergency/check-in` — master says "theek hun" to abort.
- `POST /api/vaani/emergency/pair/issue` · `/pair/accept` · `/pair/unpair`
  · `GET /pair/list` — Chitti-to-Chitti pairing via 6-digit codes.
- `GET|POST /api/vaani/emergency/poll` — partner devices long-poll for
  queued emergency events.

### 1.4a Channels health — single curl, honest answer

`GET /api/vaani/channels/health` returns the real-time configured-state
of every outbound channel (Gmail send · MSG91 SMS · Twilio SMS · combined
sms_any · WhatsApp Business · outbound telephony). For each path it
returns `{configured, missing_env, note}` so a sysadmin can curl one
endpoint and see exactly which env vars are missing on Railway. No
secrets are leaked — only the names of the missing keys.

Wired in [`backend/routes/channel_verify.py`](../backend/routes/channel_verify.py)
`_health_bp`; registered in [`main.py`](../backend/main.py). The Pro
Card pills on `chitti_vaani.html` flip from "Awaiting provider" to
"Web ✓" automatically once the channel reports `configured: true` —
**no hard-coded demo-mode flag any more** (the previous
`DEMO_MODE_DEFAULT = True` block has been removed; demo is now driven
purely by `_provider_configured(channel)`, with `CHITTI_CHANNEL_FORCE_DEMO=1`
as the only admin override).

### 1.5 Cross-product feedback + Admin dashboard
- `POST /api/feedback/collect` (open, rate-limited 1/s + 60/h per IP)
  + admin endpoints (gated by `ADMIN_SECRET`). Source:
  [`feedback.py`](../backend/routes/feedback.py).
- Daily 06:00 IST report scheduler computes top-3 suggestions + 👍/👎
  ratios per page.
- `/api/admin/products/*` — product Gmail OAuth + monthly keep-alive +
  per-product action log. Gated by `ADMIN_SECRET` header/query.

### 1.6 Consent gate + quality framework
- 6-section T&C modal locks every feature until the user taps **I AGREE**.
  Each section has a 🔊 button that reads it aloud in the user's language.
  Acceptance persisted in `localStorage.chitti_vaani_consent_given`.
- Quality hooks wrap DeepSeek calls; `/api/feedback` + `/metrics` blueprints
  registered. Founder report scheduled at 07:00 IST. Tables auto-created
  at `sqlite:////tmp/chitti_vaani_quality.db`.

---

## 2. Requires the Android app (Phase 2 — spec only)

The web cannot do any of these. Each has a Pro Card on the web with a
`📱 Android only` pill; the `nativeAction()` shim no-ops outside the
Phase 2 APK, which is **spec only** today. Build phases 2.1 → 2.6
(~5 months total) are tracked in [`../TODO.md`](../TODO.md).

| # | Capability | Android API |
|---|---|---|
| 1 | Lock the phone on voice command | `DevicePolicyManager.lockNow()` (DEVICE_ADMIN) |
| 2 | Hard refusal to unlock (no `unlockNow()` exists for 3rd-party apps + code-level deny list) | — |
| 3 | Toggle silent / ring mode | `AudioManager.setRingerMode()` |
| 4 | Auto-answer / day-mode call handling | `InCallService` (Default Dialer role) |
| 5 | Night-mode call screening (22:00–06:00) | `CallScreeningService` |
| 6 | Direct dial (no `tel:` hop) for Make-a-call | `ACTION_CALL` + `CALL_PHONE` permission |
| 7 | "Open WhatsApp **and tap send** autonomously" | `AccessibilityService` scoped to WhatsApp send-button node + 2 s silent-cancel readback |
| 8 | On-device Vosk emergency keyword spotting (continuous, foreground service, never network) | `RECORD_AUDIO` + foreground service + Vosk multilingual model |
| 9 | STREAM_ALARM bypass for paired-partner alarms (rings even on silent) | `AudioManager.STREAM_ALARM` |
| 10 | FCM push channel for Chitti-to-Chitti relay (replaces web's `/emergency/poll`) | Firebase Cloud Messaging |
| 11 | Federated learning **training** on collected voice samples | `androidx.federatedcompute` (alpha as of 2026 Q1) |
| 12 | Read SMS / call log / WhatsApp notifications aloud | Tier B `READ_SMS` / `READ_CALL_LOG` + `NotificationListenerService` |
| 13 | Voice-biometric UPI PIN replacement | Bank-PSP partnership + RBI Regulatory Sandbox (parked as v2) |

---

## 3. Future — needs partnership, regulator, or new directory data

Not in code, not in [`../TODO.md`](../TODO.md). Listed here because
prospective users ask. None of these have a single line of code in the
Vaani backend or frontend.

### 3.1 Closing the local-Chitti gap (data, not code)
The directory map in [`local_chitti_service.py`](../backend/services/local_chitti_service.py)
has empty `local_chitti_keys` for **cab / movies / train / auto / tickets**.
There is currently no Chitti shop product for these categories. To make
"local Chitti first" mean something for cabs, we would need either:
- A Chitti Cab / Chitti Auto / Chitti Driver product (new shop-Chitti
  rows in `admin_seed.py` + driver onboarding flow), or
- A partnership with an existing aggregator's driver-partner API
  (still external, but identified as "local" inside Vaani).

Until then, cab / movies / trains honestly route straight to the
external fallback — and the modal says so.

### 3.2 Geo-aware "actually nearby" — ✅ **SHIPPED 2026-05-13**

**Was P0 (correctness bug). All 5 substeps live on `main`** —
commits `650eec0` · `e89fc0d` · `4e607dc` · `6067e14` · (this commit).
The "Mumbai user sees Chennai kiranas" failure mode is now closed.

| # | Substep | Where it landed |
|---|---|---|
| 1 | **GPS / pincode capture, cached** | `window.Chitti.location.get()` in [chitti_a11y.js](../../chitti_a11y.js) — every product page inherits it. |
| 2 | **`lat / lng / pincode / service_radius_km` columns** | Hand-written `ALTER TABLE` in [`admin_db.py`](../backend/services/admin_db.py) `_migrate_added_columns()`. Backfill endpoint at `PATCH /api/admin/products/<id>/geo`. |
| 3 | **Haversine + radius filter** | [`local_chitti_service.nearby()`](../backend/services/local_chitti_service.py) — `_haversine_km`, `_default_radius_for_pincode` (5 km metro prefixes, 25 km tier-2/3), `_annotate_distance`, `_filter_and_sort`. |
| 4 | **"X km away" on each card + speak nearest** | `renderLocalChitti()` in [chitti_vaani.html](../../chitti_vaani.html). Three distance states: haversine / pincode_exact / unknown. Nearest confirmed match spoken aloud. |
| 5 | **5 km → 25 km auto-expansion + honest empty state** | Server-side in `nearby()` (only fires when caller did not override `radius_km`, default was metro 5 km, and zero confirmed-in-radius hits). Frontend banner explicitly says *"No Chitti business within 5 km — expanded search to 25 km."* Empty state spoken aloud. Never silent. |

Honesty knobs preserved:
- **No-geo shops** stay in the list when the user supplied location
  (admins who haven't backfilled yet aren't punished) but carry a
  *"Distance unknown"* pill and do NOT count toward the expansion check
  — that's the precise bug we fixed.
- **No location supplied** falls back to directory-wide mode with
  `geo_applied: false` and a frontend banner reading *"No location set
  — Chitti is showing the full directory"* + a **Set location** link.
- **Pincode tier table.** The current metro-prefix set
  (`400/110/560/600/700/500/411/380/201/122`) is the honest v1 of the
  `chitti-pincode-tier.json` plan. Swap the prefix set for a real
  gazetteer when one ships; no other code changes needed.

End-to-end verified on a seeded SQLite test DB — Mumbai user sees the
Mumbai shop at 0.806 km; Bangalore shop is filtered; auto-expansion
fires when the user has only out-of-radius matches.

### 3.3 Merchant-side actions (still future, even after directory geo)
| Capability | Partner / regulator needed |
|---|---|
| **Auto-place a Zomato / Swiggy order** | Closed B2B API + business agreement. Not realistic for a personal-use assistant. |
| **Auto-book an Ola / Uber ride** | Driver-partner APIs are B2B-gated. |
| **Auto-book BookMyShow / IRCTC tickets** | No public booking API; IRCTC is captcha-walled by design. |
| **Read SMS aloud** (web) | Cannot — browser sandbox forbids it. Android Tier B only. |
| **Bill payment / recharge** | BBPS via a TSP (Razorpay / Cashfree / Setu); per-biller KYC. |
| **Government scheme submission** | DigiLocker partner status + per-scheme RTI / DEPwD / NSAP API access. Tracked in `project_chitti_government_spec.md`, not Vaani. |

---

## 4. Planned — queued 2026-05-13

Founder wave (Bryan, 2026-05-13). All three are voice-first and tie to
the four-user contract.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| V1 | **"Remember my preferences"** — Chitti learns regular orders (food, groceries, medicines) | **P1** | Cuts the number of voice turns per order; raises completion for illiterate + elderly users. | New `user_preferences` table keyed by (user_id, service). Hooks into the order/book modal so "the usual at Sharma's" pre-fills the existing card. Onboarding-grant (`feedback_design_from_pwd_user_perspective`), not per-order modal. |
| V2 | **Voice shortcuts** — say "usual" and Chitti knows | **P2** | Companion to V1; "usual" / "wahi wala" / "always" become alias intents. | DeepSeek intent layer picks `usual` → reads back the matched preference → "haan" to confirm. **Always reads back before acting** (commando, but never silent). |
| V3 | **Daily check-in for elderly users** | **P0** | Safety contract. If the elderly user doesn't respond within window, this is the same path as `emergency/trigger` — family cascade, never cops (`project_chitti_vaani_emergency_protocol`). | New `daily_checkin` table + cron at user-chosen IST time → Vaani speaks "Aap theek hain?" → user says "haan" → silence after 3 prompts triggers `/emergency/trigger`. Opt-in by paired family member during onboarding. |
| V4 | **Morning brief — 07:00 IST, including AI Daily Tip from `chitti-news-ai`** (LOCKED 2026-05-15) | **P0** | Existing PA contract ([CHITTI_PA_MASTER §5.6](../../CHITTI_PA_MASTER.md)) — weather + mandi rates + top 3 reminders + bills + health tip + news headline + **AI tip**. AI tip rides this one brief, never a separate notification. | New 07:00 IST APScheduler job in `chitti-vaani/backend/main.py`. Internal HTTPS GET to `chitti-news-ai-api`: `/api/daily-tip?profession=<user>&lang=<user>` (15 s timeout — honest fallback line if upstream 503: *"Aaj ka AI tip Chitti dhoondh nahi paya — kal subah dobara"*). Voice-first delivery via Voice Factory cascade using the upstream `audio_url` (never re-TTS). Multi-turn follow-up *"AI tip ke baare mein aur batao"* proxies back to chitti-news-ai for deeper explanation. Full contract: [`CHITTI_NEWS_AI_MASTER_SPEC.md §10a`](../../CHITTI_NEWS_AI_MASTER_SPEC.md#10a-ai-daily-tip--part-of-chitti-pa-morning-brief-locked-2026-05-15). |

**How to apply:**
- V3 reuses the emergency cascade — **do not invent a parallel
  family-notification path**. Confirm-with-master → ring alarm bypass →
  spouse → family → Chitti-to-Chitti relay. Same denylist on 112 / 100
  / 102.
- V1 + V2 are preference state, not financial state. They never store
  UPI PINs, bank details, or anything subject to RBI (`project_chitti_product_scope_clarifications`).
- V4 must never spawn a second notification — the AI tip is **one line
  inside the existing 07:00 IST brief**, not its own push. If
  `chitti-news-ai` returns 503, the brief still ships; the tip line
  honestly says it could not be fetched. No silent fallback to a stale
  cached tip — matches the §3 *Honest stubs over fake demos* rule.
- All four are voice-only on the surface. Web cards exist for
  inspection / undo, but the primary affordance is spoken.

---

## Cross-product hooks (already wired)

- **UPI Fraud Guard ↔ Vaani** — when fraud is detected on
  `chitti_upi.html`, the page deep-links to Vaani's SOS flow.
- **Product Scanner ↔ Vaani** — scanner result POSTed to
  `/api/vaani/ask` with `mode=read` so the result is read aloud for
  blind / low-literacy users.
- **Local-first directory ↔ Admin dashboard** — every Chitti shop
  surfaced by `/api/vaani/local/nearby` is a row in the same
  `product_gmail_accounts` table the admin panel manages. Adding a new
  Chitti business in the dashboard immediately makes it visible to
  Vaani's order/book cards (no separate import step).

---

## How to keep this file honest

Sections renumbered after the 2026-05-13 planned wave: §1 Built · §2 Phase 2 (Android) · §3 Future · §4 Planned (new wave) · Cross-product hooks.

Update rules:
1. Move an item from "Phase 2" → "Built" **only after** you have
   curled the endpoint on production (per
   `feedback_verify_before_handover.md`) OR clicked the UI button in a
   real Android build and observed the side-effect.
2. Move an item from "Future" → "Phase 2" / "Built" **only after** a
   partner agreement is in place AND a [`../TODO.md`](../TODO.md) entry
   tracks the implementation work.
3. Never describe a deep-link as "Chitti sent the X" — say "Chitti
   opened X pre-filled, user tapped send". Email is the only exception,
   because the Gmail API call happens server-side after voice "haan".
4. When adding a new Chitti shop to [`admin_seed.py`](../backend/scripts/admin_seed.py),
   update `SERVICE_CATEGORIES` in
   [`local_chitti_service.py`](../backend/services/local_chitti_service.py)
   in the same commit — otherwise the new shop won't appear in the
   local-first lookup.
---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

### Quality

| # | Item | How to apply |
|---|---|---|
| Q1 | Confidence score on every routed response — *e.g. "90% sure this is a medical question — routed to Chitti MedUPI"*. Implementation: backend emits a `route_confidence` field on the router response; frontend renders via [`Chitti.a11y.renderConfidence`](../../chitti_a11y.js). | Wires through the existing `route_intent()` in `vaani_service.py` — add the DeepSeek classifier's top-1 probability to the response payload. |
| Q2 | Confidence < 70% → confirm before routing — *"I think this is a CA question, shall I route to Chitti CA?"* spoken aloud + tap-to-confirm. Reuses the existing aria-live region. | Add a confirmation step in the router when `route_confidence < 0.70`. Voice-confirm by saying "haan" (same pattern as the consent gate). Never silently route on low confidence. |
| Q3 | Emergency keyword list — add Bangla / Tamil / Telugu / Marathi regional words (today the spotter is Hindi + English). | Extend `EMERGENCY_KEYWORDS` in `vaani_service.py` with regional variants. Sourced from `chitti-vaani/skills/PSYCHOLOGY.md` distress lexicon + medical glossary. |
| Q4 | Psychology responses **must always end with helpline cascade** — Tele-MANAS 14416 + iCall + Vandrevala + NIMHANS (per [PSYCHOLOGY.md](PSYCHOLOGY.md) therapist-boundary lock). | Server-enforced disclaimer at the response footer for any reply where the DeepSeek system prompt selected the psychology corpus path. Never client-controlled. |


**Q5 *(rejected — see "Rejected items" below)*:** *"Did Chitti understand you? YES/NO after every routed response"* — conflicts with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md). The per-response widget already collects 👍 / 👎 per box; a second YES/NO modal pesters blind / mute / illiterate users with a forced choice every turn.


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | Daily Good Morning briefing | P1 | User's chosen language; weather (open-meteo or IMD) + top news (Chitti News API) + health tip (curated). Time configurable per user (default 07:00 IST). |
| S2 | Birthday + anniversary reminders | P2 | Local-only storage (`chitti_vaani_dates` localStorage key); never sent to a server; rings on the day at user-chosen time. |
| S3 | "Chitti, remind me" — voice reminder system | P1 | Voice-trigger keyword + duration parser ("in 2 hours" / "at 3 pm" / "tomorrow morning"); reminders fire via Notification API + read-aloud. |
| S4 | Nearest hospital / police / fire — always available offline (cached) | **P0** (safety) | Cached district-level emergency-service list per pincode; `chitti_offline.js` service-worker keeps the last-known list per device. Reads from `Chitti.location` + a bundled `emergency_services_by_pincode.json`. |
| S5 | "Chitti, I am lost" — current location + nearest landmark | P1 | Uses `Chitti.location.get()` + reverse-geocode (Nominatim or open-source); spoken aloud + WhatsApp-shareable so a family member can come find them. |

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\|'md'\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.
