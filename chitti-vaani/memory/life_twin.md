# Life Twin — Chitti Vaani Per-User Memory Model

> Vaani's on-device memory schema. Everything Vaani "knows" about the user
> lives in the user's own browser (localStorage / IndexedDB), never in a
> backend database. The backend holds only opaque tokens and anonymised
> event counters.
>
> Design principle: **Vaani is a guardian, not a data collector.**
> The richer the memory, the more helpful Vaani is — and the more damage
> a data breach would do. The safest architecture is to keep the data
> where it belongs: on the user's device.

---

## Memory layers

| Layer | Storage | Backend-synced? | "Chitti forget" wipes? |
|---|---|---|---|
| Trusted Circle | `localStorage` | No | Yes |
| Medical ID | `localStorage` (+ SharedPreferences Phase 2) | No | Yes |
| Language preference | `localStorage` | No | Yes |
| User Disability Profile | `localStorage` | No | Yes |
| User preferences ("the usual") | `localStorage` | No | Yes |
| Dates (birthdays / anniversaries) | `localStorage` | No | Yes |
| Session history (last 5) | `localStorage` | No | Yes |
| Voice samples (donated) | `IndexedDB` | No (Phase 2 opt-in only) | Yes |
| Emergency pairing tokens | `localStorage` + backend `pairs` table | Token pair only | Tombstone |
| Gmail OAuth token | Backend SQLite (ephemeral `/tmp`) | Token only | On revoke / forget |

---

## localStorage key registry

| Key | Schema summary | Set by |
|---|---|---|
| `chitti_vaani_token` | UUID string — opaque relay identity | frontend on first visit |
| `chitti_vaani_trusted_circle` | `TrustedContact[]` (see below) | user onboarding + voice commands |
| `chitti_vaani_medical_id_v1` | `MedicalID` (see below) | Medical ID card |
| `chitti_vaani_dates` | `ChittiDate[]` (see below) | Dates card (planned S2) |
| `chitti_vaani_safewalk_v1` | `SafewalkState` | SafeWalk card |
| `chitti_vaani_consent_given` | `boolean` | T&C consent gate |
| `chitti_vaani_preferences_v1` | `UserPreferences` (see below) | "Remember my preferences" (planned V1) |
| `chitti_vaani_session_history` | `SessionEntry[5]` (FIFO ring) | every conversation turn |
| `chitti_lang` | language code string e.g. `"hi"` | language selector / voice auto-detect |
| `disability_profile` | `DisabilityProfile` (see below) | User Disability Profile prompt |
| `chitti_camera_grants` | `{[capability]: granted_at}` | camera capability onboarding |

---

## TrustedContact schema

```js
{
  id:           string,    // uuid — stable across edits
  name:         string,    // display name; spoken by Voice Factory
  phone:        string,    // E.164 format preferred; used for Call/SMS/WhatsApp
  upi_vpa:      string,    // optional; used for UPI card
  email:        string,    // optional; used for Email card
  relationship: string,    // free text: "Maa" / "Spouse" / "Doctor"
  is_emergency: boolean,   // true = included in emergency cascade fan-out
  added_at:     string,    // ISO timestamp
  updated_at:   string,
}
```

The contact list is **voice-buildable**: *"Add Maa as emergency contact,
her number is 98XXXXXXXX"* → Vaani reads back *"Shall I save Maa's number as
98XXXXXXXX?"* → Golden Rule confirm → saved.

The `is_emergency` flag determines which contacts receive the WhatsApp / SMS
fan-out during a SafeWalk timeout or emergency cascade. If no contacts have
`is_emergency: true`, Vaani prompts: *"No emergency contacts set — shall I
add one now?"*

---

## MedicalID schema

```js
{
  blood_group:       string,   // e.g. "B+"
  allergies:         string[], // e.g. ["penicillin", "nuts"]
  conditions:        string[], // e.g. ["Type 2 diabetes", "hypertension"]
  medications:       string[], // current regular meds — free text
  doctor_name:       string,
  doctor_phone:      string,
  emergency_contact: string,   // name + phone — may duplicate Trusted Circle
  notes:             string,   // free text; read aloud on demand
  updated_at:        string,
}
```

`readMedicalIdAloud()` reads every non-empty field via Voice Factory in the
user's language. For deaf users, the full card is displayed as a styled modal.
For illiterate users, field labels are symbol-annotated (🩸 blood group,
⚕️ allergies, etc.).

Phase 2: `ChittiNative.setMedicalId(json)` mirrors into Android SharedPreferences
for the lock-screen Emergency-Info surface. This is device-local only.

---

## DisabilityProfile schema

```js
{
  blind:           boolean,
  deaf:            boolean,
  mute:            boolean,
  illiterate:      boolean,
  elderly:         boolean,
  limited_mobility:boolean,
  cognitive:       boolean,
  isl:             boolean,   // Indian Sign Language user — Phase 1 panel enabled
  asked_at:        string,    // ISO timestamp of first prompt
  updated_at:      string,
}
```

The prompt is shown once on first visit to any Chitti page. The substrate
(`chitti_a11y.js`) auto-injects the language selector, Voice Required marker,
Braille mode toggle, and aria-live region based on the profile. ISL Phase 1
animation panel is enabled when `isl: true`.

The profile is **never re-asked** after the initial prompt. The user can update
it via the a11y bar settings icon. It is **never sent to the backend**.

---

## UserPreferences schema (planned V1)

```js
{
  v:         1,
  orders: {
    [service_key]: {
      label:       string,   // "the usual at Sharma's"
      shop_id:     string,   // product_gmail_accounts.product_key
      details:     string,   // free-text order notes
      added_at:    string,
    }
  },
  language:  string,        // defensive copy of chitti_lang
  updated_at:string,
}
```

The `orders` map enables the *"the usual"* shortcut ([FEATURES.md §4 V1–V2](../skills/FEATURES.md)).
When the user says *"the usual at Sharma's"*, Vaani reads back the stored details
and uses Golden Rule confirm before opening the order modal. This preference is
**never stored server-side** — the backend sees only the confirmed order action.

---

## ChittiDate schema (planned S2)

```js
[
  {
    id:       string,
    label:    string,   // "Maa's birthday" / "Anniversary"
    date:     string,   // MM-DD (no year — recurs annually)
    reminder_time: string,  // HH:MM IST
    added_at: string,
  }
]
```

Stored in `localStorage.chitti_vaani_dates`. Reminders fire via
`Notification API` + Voice Factory readback on the day at the chosen time.
The date list is **never sent to the backend**. Per [FEATURES.md §2a S2](../skills/FEATURES.md),
this is a planned feature — not yet wired.

---

## Session history (last 5)

```js
// localStorage.chitti_vaani_session_history
[
  {
    id:          string,  // request_id from /api/vaani/ask response
    user_text:   string,  // truncated to 500 chars
    chitti_text: string,  // truncated to 500 chars
    lang:        string,
    routed_to:   string,  // e.g. "chitti-ca", "chitti-medupi", "vaani"
    ts:          string,
  },
  // ... up to 5 entries; oldest dropped on overflow (FIFO ring)
]
```

History is used for two things:

1. **Context on follow-up questions.** The last 3 entries are included in
   the DeepSeek system prompt for `POST /api/vaani/ask` to allow *"tell me
   more"* style follow-ups without restating the full question.
2. **"What did I ask Chitti?"** voice query: *"Chitti, what did I ask you
   before?"* reads back the last 5 questions.

The history is **never sent to the backend as a bulk payload** — only the
last 3 entries are injected into the single `/api/vaani/ask` request body.
The backend does not store the history independently.

---

## "Chitti forget" wipe contract

`Chitti.a11y.forget('all')` (from `chitti_a11y.js`) clears every
`chitti_*` and `disability_profile` and `chitti_lang` key in localStorage,
plus all IndexedDB voice-sample entries, plus all `chitti_camera_grants`.

For emergency pairing: the `pairs` table row in the backend (the opaque
token pair) is **not automatically deleted** on frontend forget — the user
must unpair explicitly via *"Chitti, unpair [name]"* or the Trusted Circle
settings. This is intentional: a paired family member may be relying on the
relay. The user is told: *"Your pairing with [name] is still active — say
'unpair [name]' to remove it."*

The Gmail OAuth token in the backend SQLite is not automatically deleted on
frontend forget — the user must explicitly revoke via the Gmail settings card.
The revoke flow calls `DELETE /api/vaani/email/token` which drops the row
from `oauth_tokens`.

---

## Honest gaps (2026-06-06)

- ❌ No cross-device sync (intentional — privacy).
- ❌ No export UI — users must copy localStorage manually. DPDP Act §11
  export contract is met by the fact that it's plain JSON readable in dev-tools.
- ❌ `UserPreferences` schema not yet wired (Planned V1).
- ❌ `ChittiDate` reminders not yet wired (Planned S2).
- ❌ Session history not yet injected into DeepSeek context (Planned).
- 🟡 Emergency pairing survives frontend forget (by design — family safety).
- 🟡 Gmail OAuth token ephemeral on Railway free-tier (known limitation).

---

Last reviewed: 2026-06-06
