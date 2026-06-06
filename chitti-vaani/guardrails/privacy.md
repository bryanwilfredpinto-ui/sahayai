# Privacy — Chitti Vaani

> The privacy contract: localStorage-first for all user identity data,
> anonymised feedback, camera-intelligence user-ownership (§2b), Gmail
> restricted-scope only, UPI PIN never seen, federated voice samples
> on-device. Aligned with DPDP Act 2023, SAHAYAI_MASTER.md §2b + §2f,
> and the User Disability Profile LOCKED rule.

---

## Principle 1 — Trusted Circle is localStorage-only

The user's Trusted Circle (Vaani's contact list for Call / WhatsApp / SMS /
UPI / email / emergency cascade) is stored ONLY in `localStorage.chitti_vaani_trusted_circle`.
It is NEVER sent to the backend as a contact list.

The emergency relay uses **opaque user_tokens** (UUID-based) that the user
shares verbally via a 6-digit pair code. The backend's `pairs` table stores
`(user_a, user_b)` token pairs and display labels — it never stores the
user's phone number, email, or relationship to the master.

The contact resolution for Call / WhatsApp / SMS reads from localStorage on
the frontend. The backend never receives the full contact list; it receives
only the target phone number or email **for a single confirmed action**, in
the request body of that action's API call.

What stays local-only:

- Full Trusted Circle contact list (names, phones, relationships)
- Birthday / anniversary dates (`localStorage.chitti_vaani_dates`)
- Language preference (`chitti_lang`)
- User Disability Profile (`disability_profile`)
- SafeWalk state (`chitti_vaani_safewalk_v1`)
- Consent flag (`chitti_vaani_consent_given`)

---

## Principle 2 — Medical ID is localStorage-only

The 🏥 Medical ID card ([FEATURES.md §1.3a](../skills/FEATURES.md)) stores:
blood group · allergies · conditions · attending doctor · emergency contact.

Storage: `localStorage.chitti_vaani_medical_id_v1`. Never crosses the network
boundary. On Android Phase 2, `ChittiNative.setMedicalId(json)` mirrors into
SharedPreferences for the lock-screen Emergency-Info surface — this is
device-local, not synced to a server.

`readMedicalIdAloud()` reads the locally-stored JSON via Voice Factory. The
backend never sees the Medical ID. If the user says *"Chitti, tell the doctor
my blood group"*, Vaani reads it aloud — it does NOT POST the Medical ID to
any endpoint.

---

## Principle 3 — Camera Intelligence user-ownership contract (SAHAYAI_MASTER §2b)

If and when Vaani gains camera access (e.g. document scan, ISL Phase 2
camera-based sign detection), it MUST implement the Camera Intelligence
contract exactly:

- **What is captured**: what was scanned · pincode/district · date/time ·
  result · user type (disability profile role) · user satisfaction (👍 / 👎).
- **Ownership**: the user owns the capture. It is never sold, never used
  for advertising.
- **Anonymisation**: all camera data is anonymised before any analysis.
  Individual captures cannot be re-identified.
- **"Chitti forget" tombstone**: `Chitti.camera.forget()` writes a tombstone
  row (timestamp + hash, no payload) to confirm deletion. The actual payload
  is hard-deleted. The tombstone count is the only persistent artefact.
- **Community alerts**: anonymised pattern detections (e.g. fake documents
  from the same pincode) feed community-level alerts; no individual record
  is shared.
- **No capture without explicit consent**: every camera session goes through
  a one-time onboarding grant per capability. The grant is stored in
  `localStorage.chitti_camera_grants`. Revoking it wipes the grant; future
  captures re-prompt.

Vaani's current (2026-06-06) camera usage: none. The `camera.py` backend
route and `camera_vision.py` service exist for future capabilities.
`Chitti.camera.forget()` is wired in `chitti_camera.js` at the repo root,
auto-loaded by `chitti_a11y.js`. The tombstone contract is in effect from
the moment any capture is first attempted.

---

## Principle 4 — Gmail OAuth: gmail.send restricted scope only

Per [FEATURES.md §1.2](../skills/FEATURES.md) and [CONTEXT.md](../CONTEXT.md):

The Gmail OAuth flow requests ONLY the `gmail.send` restricted scope.
Vaani cannot read, list, or search the user's inbox. It cannot read
received emails. It cannot mark messages as read. It cannot delete.

The scope `https://www.googleapis.com/auth/gmail.send` is the narrowest
Gmail OAuth scope that allows sending. This is enforced at the OAuth
consent screen — the backend cannot request broader scopes without
re-building the OAuth flow and updating the Google Cloud consent screen
(which requires another Restricted Scope verification with Google).

The user's `access_token` and `refresh_token` are stored in
`/tmp/chitti_vaani_tokens.sqlite` (`oauth_tokens` table,
[DATABASE.md](../DATABASE.md)). This is **ephemeral on Railway free-tier
deploys** — tokens are wiped on redeploy. The user must re-connect Gmail
after a backend redeploy. This is a known limitation, documented honestly in
[DATABASE.md §"Persistence notes"](../DATABASE.md), to be resolved when
the tokens DB graduates to a durable store.

`client_secret` is stored alongside the token to allow refresh without
re-reading the env. It is encrypted at rest on Railway; it is NOT sent to
the frontend; it is NOT logged.

---

## Principle 5 — UPI PIN never seen by Chitti

Per [BOUNDARIES.md §3–4](../skills/BOUNDARIES.md):

UPI PIN never leaves the UPI app's secure keypad. Vaani opens a `upi://pay?…`
deep-link pre-filled with the recipient VPA and amount. The user enters their
PIN inside the bank's own app. Chitti never:

- Reads back a UPI PIN
- Stores a UPI PIN
- Logs a UPI PIN
- Asks for a UPI PIN
- Has a text input field for a UPI PIN

The voice-biometric UPI PIN replacement is parked as v2 and requires a
sponsoring PSP integration + RBI Regulatory Sandbox cohort. Until then,
the PIN ceremony is sacrosanct.

The `user_preferences` table (Planned V1, [FEATURES.md §4](../skills/FEATURES.md))
for regular orders stores recipient VPAs and amounts as user-chosen shortcuts.
It **never** stores PINs, CVVs, or any authentication credential.

---

## Principle 6 — Anonymised feedback only

When the user taps 👍 / 👎 on a response box, the per-response widget
(`feedback-widget.js`) sends:

```json
POST /api/feedback/collect
{
  "page":         "chitti_vaani",
  "type":         "thumbs_up",
  "text":         null,
  "user_segment": "blind",
  "ip_hash":      "sha256(FEEDBACK_IP_SALT + client_ip)[:24]",
  "created_at":   "2026-06-06T07:00:00Z"
}
```

Anonymisation rules (per [`../backend/services/feedback_db.py`](../backend/services/feedback_db.py)):

- **No user_id**, no email (unless the user explicitly types one for a reply).
- **ip_hash** uses a stable random salt (`FEEDBACK_IP_SALT` env var); rotating
  the salt resets history but does not alter existing hashed rows.
- **user_segment** is the disability-profile category, not a name.
- Free-text `suggestion` fields are junk-filtered and PII-scanned before
  persistence (see feedback_db.py `_IMPOSSIBLE` regex + one-word filter).
- No User-Agent, no Referer in the persisted payload.

---

## Principle 7 — Voice samples: federated, on-device, opt-in

The federated voice-sample collection feature ([FEATURES.md §1.2](../skills/FEATURES.md)):

- **Opt-in only.** The user must explicitly donate their voice via an
  onboarding-style grant. No samples are collected before the grant.
- **On-device storage only.** Samples are stored in IndexedDB on the
  user's device, never uploaded to the backend.
- **Training pipeline not built** (2026-06-06). The collection phase stores
  samples locally; the federated training via `androidx.federatedcompute`
  is Phase 2 (Android only).
- **"Chitti forget"** clears all IndexedDB voice-sample entries for this
  origin via `Chitti.a11y.forget('voice_samples')`.
- The voice samples are tagged with the language label supplied by the
  user during donation. The language label is stored alongside the sample
  in IndexedDB; it does not cross the network until the training phase ships
  with an explicit second consent step.

---

## Principle 8 — No PII in any backend payload

Regex-scanned at the feedback endpoint before persistence:

- Email: `/[\w.+-]+@[\w-]+\.[\w.-]+/`
- Phone: `/(\+\d{1,3}[ -]?)?\d{10}/`
- PAN: `/[A-Z]{5}\d{4}[A-Z]/`
- Aadhaar: `/\d{4}\s?\d{4}\s?\d{4}/`
- Credit / debit card: `/\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}/`

If a free-text field contains a match, the field is dropped server-side
BEFORE persistence and a counter increments in the PII-drop log (no payload
stored, just the count). This catches UI bugs that accidentally leak PII
into feedback forms.

---

## Principle 9 — "Chitti forget" wipes everything

Per SAHAYAI_MASTER.md §2 Camera Intelligence + [FEATURES.md §2a cross-Chitti item 8](../skills/FEATURES.md):

`Chitti.a11y.forget(scope)` (implemented in `chitti_a11y.js`) clears:

| Scope | What is wiped |
|---|---|
| `'all'` | Every `chitti_*` + `disability_profile` + `chitti_lang` + `chitti_vaani_*` key in localStorage |
| `'trusted_circle'` | `chitti_vaani_trusted_circle` only |
| `'medical_id'` | `chitti_vaani_medical_id_v1` only |
| `'dates'` | `chitti_vaani_dates` only |
| `'voice_samples'` | All voice-sample IndexedDB entries for this origin |
| `'camera'` | `chitti_camera_grants` + tombstone written via `Chitti.camera.forget()` |

There is no server-side profile to delete — the profile never crossed the
network. Feedback events that did cross are anonymised and cannot be
reverse-linked to the user.

The wipe is announced via Voice Factory: *"Chitti ne sab bhula diya. Phir se
milte hain."* and a visual toast.

The tombstone row (camera) and a per-scope deletion timestamp are the only
artefacts that survive the wipe — they exist only to confirm the deletion
happened, not to reconstruct the deleted data.

---

## Principle 10 — No mandatory account, no cross-device identity

Vaani has no login. The `user_token` is a frontend-generated UUID stored in
`localStorage.chitti_vaani_token`. It is opaque — it carries no PII. It is
used only for the emergency relay (pairing) and Gmail OAuth. If the user
clears their browser, the token is gone; they re-onboard.

We do not attempt to re-identify users across devices or sessions. We have
no email for the anonymous user. Aadhaar is opt-in everywhere and is never
requested by Vaani.

---

## CI / verification

- `test_feedback_endpoint_drops_pii` — planted email / phone / PAN in fake
  feedback → assert dropped + counter increments.
- `test_no_profile_sync_endpoint_exists` — static scan of routes for any
  `/profile/sync` or `/trusted_circle/sync`-style path.
- `test_gmail_scope_is_send_only` — assert OAuth scope list contains
  `gmail.send` and no broader Gmail scopes.
- Quarterly: Sire reviews pii-drop counter trend to detect UI leakage bugs.

---

Last reviewed: 2026-06-06
