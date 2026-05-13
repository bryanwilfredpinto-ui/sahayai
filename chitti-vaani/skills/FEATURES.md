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
| **Send UPI payment** | `upi://pay?pa=…&am=…&pn=…` opens the user's UPI app pre-filled; user enters PIN in the UPI app (Chitti never sees the PIN — NPCI rule). | Web ✓ |
| **Send email as Chitti AI** | Full Gmail OAuth (`gmail.send` restricted scope) + server-side send via Gmail API. Chitti AI footer auto-appended. **The only Pro Action that performs the network action server-side** rather than handing off to an app. | Web ✓ (after Gmail OAuth connect) |
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

### 1.4 24/7 emergency cascade (family-only, never cops)
Real backend, real fan-out. Refuses to dial 112/100/101/102/108/1098/1930/139
by code-level denylist — see [`emergency_service.py`](../backend/services/emergency_service.py).
- `POST /api/vaani/emergency/trigger` — fan out to every paired partner.
- `POST /api/vaani/emergency/check-in` — master says "theek hun" to abort.
- `POST /api/vaani/emergency/pair/issue` · `/pair/accept` · `/pair/unpair`
  · `GET /pair/list` — Chitti-to-Chitti pairing via 6-digit codes.
- `GET|POST /api/vaani/emergency/poll` — partner devices long-poll for
  queued emergency events.

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

### 3.2 Geo-aware "actually nearby"
The `nearby()` endpoint is directory-wide today. To become truly
location-aware:
- Add `lat`, `lng`, `pincode`, `service_radius_km` columns to
  `product_gmail_accounts`.
- Frontend geolocation prompt (already a Tier-A permission on the web).
- Server-side radius filter in `local_chitti_service.nearby()`.

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
