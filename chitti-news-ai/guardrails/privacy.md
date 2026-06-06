# Privacy — Chitti News AI

> The privacy contract: localStorage-only user profile, anonymised feedback,
> no PII, "Chitti forget" wipes everything. Aligned with DPDP Act 2023 +
> the User Disability Profile LOCKED rule + Camera Intelligence LOCKED rule.

---

## Principle 1 — Profile is localStorage-only

The user's coach profile (`chittiCoachProfile_v1`, schema key `chitti_user_profile`) is stored ONLY in browser localStorage. It is NEVER sent to the backend. Schema in [`../memory/life_twin.md`](../memory/life_twin.md):

- profession, experience, salary_band
- current_skills[], goal, hours_per_week, language
- done_items[], skipped_items[], in_progress[], earned_credentials[]
- ai_usage, prompting, automation
- tour_days_done[], curric_<id>_days

This data never crosses the network boundary. There is no `/api/profile/sync` endpoint. There never will be.

The same applies to:
- `disability_profile` — set by the User Disability Profile prompt; localStorage-only.
- `chitti_lang` — language selection; localStorage-only.
- `chitti_coach_feedback` — per-item 👍 / 👎 aggregate; localStorage-only.

---

## Principle 2 — Anonymised feedback to /api/feedback/collect

When the user taps 👍 / 👎 on a card, the per-response widget (`feedback-widget.js`) sends an event to `/api/feedback/collect`:

```json
{
  "event": "vote",
  "card_id": "news-a4b9c2e1",
  "vote": "up",
  "ip_hash": "sha256(client_ip + daily_salt)",
  "lang": "en",
  "profession_tag": "software-developer",
  "timestamp": "2026-06-06T07:00:00Z"
}
```

Anonymisation rules:
- **No user_id**, no email, no device fingerprint.
- **ip_hash** uses a salt rotated DAILY (`daily_salt = hash(date + secret)`). This means the same IP voting on consecutive days yields different hashes — temporal de-correlation.
- **profession_tag** is the *role group*, not the user's free-text role title. ("software-developer", not "Senior Python dev at Flipkart since 2019".)
- **No referer**, no User-Agent in the payload (the request line still has them; we drop them in the application layer before persisting).

---

## Principle 3 — No PII in any payload

Regex-scanned at the feedback endpoint:
- Email (`/[\w.+-]+@[\w-]+\.[\w.-]+/`)
- Phone (`/(\+\d{1,3}[ -]?)?\d{10}/`)
- PAN (`/[A-Z]{5}\d{4}[A-Z]/`)
- Aadhaar (`/\d{4}\s?\d{4}\s?\d{4}/`)
- Credit card (`/\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}/`)

If a free-text "tell us more" field contains a match, the field is dropped server-side BEFORE persistence and a counter increments in `chitti-founder/pii_drop_count.db` (no payload stored, just the count). This is to detect bugs in our UI that leak PII into feedback.

---

## Principle 4 — "Chitti forget" wipes everything

The User Disability Profile prompt includes a "Chitti forget" option. When invoked, the substrate (`chitti_a11y.js`) clears:

- `chitti_user_profile`
- `disability_profile`
- `chitti_coach_feedback`
- `chitti_lang`
- All `curric_<id>_days` keys
- All `chitti_*` keys in localStorage

There is no server-side data to delete because the profile never crosses the network. The feedback events that DID cross are already anonymised; we cannot reverse-link them to the user even if we wanted to.

The wipe is announced via voice (Voice-First Mode) and a visual toast: *"Chitti has forgotten you. Welcome back, stranger."*

---

## Principle 5 — Voice samples never persisted

When an illiterate user records a 🎤 "Hold to speak" feedback note (per [`../accessibility/illiterate_user.md`](../accessibility/illiterate_user.md) §7), the audio is:

1. Transcribed client-side (using `SpeechRecognition` API).
2. The transcript is PII-scanned per Principle 3.
3. ONLY the cleaned transcript is sent to `/api/feedback/collect`. The audio blob is discarded.

If `SpeechRecognition` is not available, the audio blob is held in IndexedDB temporarily and dropped on next page close. We never upload audio.

---

## Principle 6 — Camera Intelligence does not apply

Chitti News AI does NOT use the device camera. The [Camera Intelligence LOCKED](../../SAHAYAI_MASTER.md) rule applies to other Chittis (Scanner, Health, MedUPI, Logo & Video). News AI never requests `getUserMedia({ video: true })`.

If a future feature does (e.g. ISL Phase 2 sign-language input), it must implement the Camera Intelligence contract: user-owned capture, anonymised, "Chitti forget" wipes.

---

## Principle 7 — Third-party iframes are sandboxed

Embedded YouTube videos (from the Coach Picks library) load in a `sandbox="allow-scripts allow-same-origin"` iframe with `loading="lazy"`. We do NOT pass the user's profile or language to the iframe via query params. The user's interaction with the iframe is invisible to us.

We use `youtube-nocookie.com` URLs to suppress tracking cookies.

---

## Principle 8 — Backend logs strip PII

Backend logs (per [`../observability/logs.md`](../observability/logs.md)):
- Never log full IPs (only the daily-salted hash).
- Never log request bodies for `/api/feedback/collect`.
- Never log the `chitti_lang` per-user (aggregate counter only).

The log retention is 30 days; aggregate dashboards retain longer but contain no per-user data.

---

## Principle 9 — Data export and deletion

Per DPDP Act 2023:
- **Export**: a user can copy their `chitti_user_profile` from browser dev-tools — it's plain JSON in localStorage. There is no server-side copy to export.
- **Delete**: "Chitti forget" wipes all on-device state. There is no server-side copy to delete.
- **Correction**: in-product editing of profile fields via the intake flow.

We do not require an account. We have no email of the user. We cannot identify the user across devices or sessions.

---

## CI / verification

- `test_feedback_endpoint_drops_pii` — planted email / phone / PAN in fake feedback → assert dropped + counter increments.
- `test_no_profile_sync_endpoint_exists` — static scan of routes for any `/profile/sync`-style path.
- Quarterly: Sire reviews `pii_drop_count.db` trend to detect UI leakage bugs.

---

Last reviewed: 2026-06-06
