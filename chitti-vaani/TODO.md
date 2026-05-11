# TODO — Chitti Vaani

Tracked against `CHITTI_VAANI_PHASE2_ANDROID_SPEC.md` (the Android client) plus the admin / feedback work currently sitting untracked in the working tree.

## Phase 2 — Android native app

The Android client is **spec only** at this point. Phase 1 / 1.5 / 1.6 ship the web equivalents wherever a browser can do the job. Phase 2 unlocks the capabilities a browser physically cannot deliver.

### Sub-phase 2.1 — APK skeleton (≈2 weeks)
- [ ] Kotlin + AndroidX, target API 34, min API 26
- [ ] Jetpack Compose minimal UI (most interaction is voice)
- [ ] WebView wrapper around `chitti_vaani.html` so the voice UI stays single-sourced
- [ ] `RECORD_AUDIO` permission, voice in / out parity with web

### Sub-phase 2.2 — OS handles + deep links (≈3 weeks)
- [ ] `DEVICE_ADMIN` registration → `DevicePolicyManager.lockNow()` for "lock phone"
- [ ] `AudioManager.setRingerMode()` for silent / ring toggle
- [ ] Deep-link senders for WhatsApp / UPI / Gmail (already in web — port to Android intent)
- [ ] Hard-coded refusal: `/unlock|kholo|khol do/i` always denied. No `unlockNow()` API surface exists for 3rd-party apps

### Sub-phase 2.3 — Call handling (≈4 weeks)
- [ ] `CallScreeningService` registration (Call Screening role)
- [ ] `InCallService` registration (Default Dialer role)
- [ ] Day-mode auto-answer flow ("answer call from Mom?")
- [ ] **2.3.1** — outbound call direct-dial via `ACTION_CALL` + `CALL_PHONE` permission, with `ACTION_DIAL` fallback. Mute-user "Chitti speaks for me" toggles speakerphone + TTS through `VaaniInCallService`

### Sub-phase 2.4 — Night mode + emergency keyword spotting (≈5 weeks)
- [ ] Night-mode 22:00–06:00 IST automatic enter/exit
- [ ] On-device Vosk multilingual keyword spotter — foreground service, **never network**
- [ ] `setRingerMode(NORMAL)` + `setStreamVolume(MAX)` + long-pulse vibrator on detection
- [ ] Emergency callout: "Emergency call from [caller]! Wake up master!" every 5 s until phone unlocked / call ends
- [ ] FCM inbound channel for Chitti-to-Chitti relay (replaces web's `/api/vaani/emergency/poll`)
- [ ] STREAM_ALARM bypass for paired-partner alarms (rings even on silent)

### Sub-phase 2.5 — Federated learning (≈3 weeks)
- [ ] `androidx.federatedcompute` scaffolding (alpha as of 2026 Q1)
- [ ] Voice samples stay on-device; only model gradients ship to server
- [ ] Voice sample upload pipeline (opt-in)

### Sub-phase 2.6 — Google Play submission (≈4 weeks)
- [ ] Expect 2–3 rejections on `READ_CALL_LOG` / `SEND_SMS` justification
- [ ] Required Play Store listing compliance lines:
  - "Chitti is an AI assistant. Chitti will never unlock your phone. Chitti will never enter your UPI PIN. Chitti will never claim to be you on a call — every call begins with 'I am Chitti, an AI assistant for [user name].'"
  - DPDP Act 2023 grievance officer: `sire@sahayai.in`
- [ ] Permissions justification text per Tier B / C permission, written for the Play Store reviewer
- [ ] Privacy policy URL + video walkthrough for `READ_SMS` / `SEND_SMS` / `READ_CALL_LOG`

### Tier B runtime permissions (medium scrutiny)
- [ ] `READ_CONTACTS` — resolve "Mom" → number (alternative: trusted circle from Phase 1.5)
- [ ] `READ_PHONE_STATE` — call-state monitoring
- [ ] `POST_NOTIFICATIONS` — read aloud for blind users
- [ ] `RECEIVE_SMS` + `READ_SMS` — read SMS aloud
- [ ] `SEND_SMS`
- [ ] `ANSWER_PHONE_CALLS`
- [ ] `READ_CALL_LOG`

### Tier C special roles (high scrutiny)
- [ ] `DEVICE_ADMIN` (manual enable in Settings)
- [ ] `RoleManager.createRequestRoleIntent(ROLE_CALL_SCREENING)`
- [ ] `RoleManager.createRequestRoleIntent(ROLE_DIALER)`
- [ ] `NotificationListenerService` (manual enable in Special access)
- [ ] `AccessibilityService` — **scoped to WhatsApp send-button node only**, with 2 s voice-readback silent-cancel window (to pass Google Play's accessibility-misuse review)

### Hard refusals (code-level deny lists)
- [ ] `unlockDevice()` — no public API + hard-coded keyword refusal
- [ ] UPI PIN over network — PIN never leaves the UPI app's secure keypad
- [ ] Reading other apps' private storage (sandbox respected)
- [ ] Modifying lockscreen pattern / face unlock / fingerprint

### Voice-biometric UPI PIN (parked as v2)
- [ ] Sponsoring bank (ICICI / Axis / HDFC) PSP-layer integration
- [ ] RBI Regulatory Sandbox cohort application
- [ ] Voice-biometric SDK (Phonexia / Pindrop / in-house Wav2Vec2 fine-tune) — FAR < 0.001%
- [ ] Liveness detection (anti-replay)
- [ ] ~9-month engagement timeline
- [ ] Park as v2 spec; design Phase 1.5 UPI flow such that swapping in voice-biometric is a 1-screen change

## Admin Dashboard (untracked in git as of 2026-05-11)

Files present in the working tree, not yet committed:
- [routes/admin.py](backend/routes/admin.py)
- [services/admin_db.py](backend/services/admin_db.py)
- [services/admin_oauth.py](backend/services/admin_oauth.py)
- [services/admin_scheduler.py](backend/services/admin_scheduler.py)
- [scripts/admin_seed.py](backend/scripts/admin_seed.py)
- `chitti_admin_products.html` (repo root)

Outstanding:
- [ ] First-pass curl test on production for every `/api/admin/products/*` endpoint with `ADMIN_SECRET` set (per `feedback_verify_before_handover.md`)
- [ ] Add the new `ADMIN_OAUTH_REDIRECT_URI` to the Google Cloud Console OAuth client's "Authorized redirect URIs" list before any product can be authorized
- [ ] Set `ADMIN_DATABASE_URL` to the Supabase Postgres URL in Render (SQLite at `/tmp` is ephemeral on free tier and will lose state on every deploy)
- [ ] Manually walk one product mailbox through `authorize → callback → keepalive` to confirm the refresh path works end-to-end before the monthly cron is trusted
- [ ] Surface the mismatch warning in the dashboard UI when `connected_email != gmail_address`
- [ ] Commit the admin files together with `chitti_admin_products.html`

## Cross-product feedback widget (untracked in git as of 2026-05-11)

Files present, not yet committed:
- [routes/feedback.py](backend/routes/feedback.py)
- [services/feedback_db.py](backend/services/feedback_db.py)
- [services/feedback_scheduler.py](backend/services/feedback_scheduler.py)
- `chitti_admin_feedback.html` + `feedback-widget.js` (repo root)

Outstanding:
- [ ] Set `FEEDBACK_IP_SALT` in Render env to a stable random string
- [ ] Verify the widget posts cleanly from every Chitti HTML page (Vaani / News / MedUPI / CA / Legal / Government / Fundamentals / Technical / UPI / Scanner / Voice Factory) — `_PAGE_RE` is `^[a-z][a-z0-9_]{1,63}$`
- [ ] Replace placeholder `Effort = 1.0` in [`feedback_db.filter_and_score_suggestions`](backend/services/feedback_db.py) with a human-tagged value once the admin dashboard exposes the tagging UI
- [ ] Add `is_junk` toggle to admin dashboard list view (route already exists at `POST /api/feedback/<id>/junk`)
- [ ] Commit the feedback files together with `chitti_admin_feedback.html` + `feedback-widget.js`

## Phase 1 hardening (not blocking, nice-to-have)

- [ ] Graduate SQLite token store to shared Postgres alongside the admin tables (same row shape works — `email_db.py` notes this)
- [ ] FCM push channel for paired Chittis (web-only today)
- [ ] Continuous-listening Web Audio implementation for keyword spotting (Vosk-WASM on the web until Android v2)
- [ ] Move from `apscheduler` BackgroundScheduler to a single Render cron service when we get past free-tier (single-worker source of truth)
- [ ] No `TODO` / `FIXME` markers were found inside `chitti-vaani/` source on this pass — open work lives in this file and the master spec
