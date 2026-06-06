# Mute User Journey — Chitti Vaani

> Real end-to-end flow for a mute user opening `chitti_vaani.html`.
> Implementation references: `chitti_vaani.html` (Pro Cards, `chittiConfirmAndDo`),
> `chitti_a11y.js` (substrate), `feedback-widget.js`.
>
> A mute user cannot speak commands but can hear Chitti's responses and use
> touch input. Every Vaani capability — calls, SMS, WhatsApp, UPI, emergency,
> routing queries to every Chitti — must be completable by tap alone.

---

## 0. Pre-state — Disability Profile

The user has set `disability_profile.mute = true`:

```js
localStorage.setItem('disability_profile', JSON.stringify({ mute: true }));
```

A mute user may also have other settings (deaf, illiterate, elderly).
Those journeys compose — this doc covers the mute-primary path.

---

## 1. Page Load → Tap-Only Flow

For a mute user, `initVoiceFirst()` does NOT auto-activate `SpeechRecognition`
(the check is `dp.blind || dp.illiterate`, not `dp.mute`). Even if it did,
the user cannot speak. The substrate detects `disability_profile.mute = true` and:

- Suppresses all *"say X to do Y"* hints in the UI.
- Replaces the welcome voice prompt instruction with a visible:
  *"Welcome — tap any card to start. Voice is available if you'd like to listen."*
  (Vaani CAN speak TO the mute user; the mute contract is INPUT-only — the user
  cannot speak, but can still hear Chitti's voice output.)
- Ensures all tap targets ≥ 48 × 48 px.

---

## 2. Query Input — Typed Text, Never Forced Voice

The Vaani input field:

```html
<textarea id="vaani-input"
  placeholder="📝 Type your question here — or use a Quick Card below"
  aria-label="Type your question for Chitti"
  rows="2"
  autocomplete="off">
</textarea>
<button id="vaani-send" aria-label="Send question">
  ➤ Send
</button>
```

Voice input button (`🎤`) is present but:
- For a mute user, the button is labeled "Voice input not available for your profile"
  and is visually deprioritised (not hidden — removing it would be confusing for
  sighted helpers).
- The user can still activate Quick Cards below the input field — these are
  tap-only and never require typing.

---

## 3. Quick Cards — Zero Typing, One Tap Per Action

Every Pro Card on `chitti_vaani.html` is a large tap target. A mute user can
reach every Chitti capability without typing a single character:

| Card | Tap result |
|---|---|
| 📞 Call Mom | `chittiConfirmAndDo` modal: "Call Maa?" → YES tap → dialer opens |
| 💬 WhatsApp Raj | Pre-filled recipient + message template → tap to customise text → YES |
| 📱 Send SMS | Pre-filled recipient + quick template selection → YES |
| 💸 UPI payment | Amount field (number keypad only) + recipient → YES → UPI app |
| 📧 Email | To field + template picker → compose text → YES → Gmail API sends |
| 🚶‍♀️ SafeWalk | Duration picker (5 / 10 / 15 / 30 min tiles) → Start tap |
| 📵 Fake Call | "In 2 minutes" / "In 5 minutes" tile picker → Start tap |
| 📍 Share Location | Contact picker → Channel picker (WhatsApp / SMS) → YES tap |
| 🏥 Medical ID | Pre-filled form (blood group dropdown, condition chips) → Save |
| 🚑 Ambulance 108 | `chittiConfirmAndDo` modal: "Call 108?" → YES tap → dialer |
| 🗺️ Nearest hospital | One tap → Google Maps opens near me search |

Every card completes in ≤ 3 taps for the primary use case.
No voice command required at any step.

---

## 4. Golden Rule Confirm Modal — Always Has Tap Buttons

The most critical mute-user contract is that `chittiConfirmAndDo()` ALWAYS
provides tap buttons alongside the voice question (SAHAYAI_MASTER.md §2g — LOCKED):

```
┌─────────────────────────────────────────────────────────┐
│ 📞 Maa ko call karun?                                    │
│ Shall I call Maa?                                        │
│                                                         │
│   [ ✅ HAAN / YES ]      [ ❌ NAHI / NO ]               │
│       (≥ 72 × 72 px)          (≥ 72 × 72 px)           │
└─────────────────────────────────────────────────────────┘
```

The modal:
1. Speaks the question aloud (for the mute user who CAN hear).
2. Displays the question in text (large font, user's script).
3. Has two large buttons — no voice required to confirm.
4. Parallel `SpeechRecognition` is active for haan / nahi (in case voice
   becomes available, e.g. user uses text-to-speech relay).
5. Never auto-closes. Never times out. The user taps when ready.

---

## 5. Query Routing — Text-First

When a mute user submits a text query from the input field:

1. Text is sent to `POST /api/vaani/ask` — no difference from a voice-transcribed query.
2. Router Agent classifies the intent and routes to the correct Chitti.
3. Response is returned as text + speech (Chitti speaks the answer aloud).
4. Vaani speaks: *"Chitti MedUPI se answer: Paracetamol 500mg ka generic
   version ₹3.50 par hai Jan Aushadhi mein."*

The mute user hears the answer even if they can't speak the question.
This is the primary modality inversion — input is text/tap; output is voice + text.

---

## 6. Emergency — Mute User Path

A mute user in danger cannot shout a keyword. Vaani provides:

1. **Large SOS button** on every screen, always visible, ≥ 72×72 px,
   labeled "🆘 SOS — Emergency" (no voice required).
2. **Touch-and-hold gesture** (2 seconds) on the SOS button fires emergency
   without confirming (because the mute user cannot say "haan"). The long-press
   design replaces voice-confirm for emergency ONLY (all other actions still
   require the Yes tap from the modal).
3. `chittiConfirmAndDo` is NOT interposed for emergency — emergency is the
   one exception to the Golden Rule confirm gate
   (see `CONTEXT.md` emergency cascade section).
4. Emergency fan-out fires: WhatsApp + SMS to Trusted Circle — all shown
   on screen as each message sends.

---

## 7. Trusted Circle — Tap-Only Build

A mute user builds their Trusted Circle without speaking:

1. Tap "Add Contact" → type name + number (keyboard input).
2. Alternatively: tap "Import from Contacts" → contact picker opens
   (no voice required).
3. Each contact is assigned a relationship (Maa / Papa / Spouse / Friend) via
   a tap-chip picker.
4. The Trusted Circle is stored in localStorage — never synced to the backend
   (privacy), never requires a server round-trip to read aloud.

---

## 8. Feedback Widget — Tap-Only Thumbs

Every `[data-chitti-response]` carries the per-response widget:

```
[🔊]  [🤖]  [👍]  [👎]
```

For a mute user:
- 🔊 = play audio (Chitti speaks the response aloud — the mute user can hear).
- 🤖 = tap to open extended explanation (text + voice).
- 👍 / 👎 = single tap; optional "tell us more" typed text field opens after
  a thumbs-down. Typing is optional — the thumbs signal is already captured
  on tap.

The "tell us more" field for a mute user is a text area (never a voice hold
button as the primary path — the voice option is added below the text area as
an alternative).

---

## 9. Language Selector — Tap-Only

The language selector (`chitti_lang.js`) is a `<select>` element:
- tap to open the dropdown (OS native select — works on every mobile browser).
- Rendered from the canonical T dict in `chitti_lang.js`.
- No voice required.

---

## 10. Composability with Other Modalities

| Combined profile | Effective path |
|---|---|
| `mute + blind` | Voice output (Chitti speaks); no voice input. Recogniser is disabled. Haptic confirmation on tap (Phase 2 Android). |
| `mute + deaf` | Touch input + visual output. ISL panel attaches. No voice in either direction — text is the sole communication channel. |
| `mute + illiterate` | Voice output (Chitti speaks in user's language); emoji-rich UI; tap-only input. Recogniser disabled. |
| `mute + elderly` | Large tap targets (already ≥ 48 px); slow-mode replies; font size large default. |

---

## 11. Failure Modes (Honest)

| Failure | What the mute user sees / hears |
|---|---|
| Tap target < 48 × 48 px | Violation of the 8-Gate done-definition. Auto-flagged by CI axe-core `target-size` rule. |
| Text input field is not focusable on tap | WCAG 2.1 AA violation; fails CI. |
| Golden Rule modal has no tap buttons | Not possible — `chittiConfirmAndDo` always renders both tap buttons + voice listener. |
| CAPTCHA appears from a third-party card | We never use captcha. If a third-party iframe shows one, the card is labelled "third-party challenge — skip" and de-ranked. |
| Virtual keyboard auto-opens without explicit tap | Violation — `textarea` must not have `autofocus` globally; only opens on explicit tap. |
| Emergency touch-and-hold gesture not registered | Fallback: double-tap the SOS button fires emergency without the long-press. Both gestures are registered. |

---

## 12. What We Never Do to a Mute User

- Never gate any action behind a voice command as the ONLY path.
- Never require microphone permission for any core feature.
- Never display "please speak" as the only instruction with no tap alternative.
- Never auto-open the virtual keyboard without explicit user tap.
- Never use tap targets < 48 × 48 px.
- Never penalise a tap-only interaction — a 👍 from a mute user counts
  equal to a 👍 from any other user in the swarm quality aggregation.
- Never require voice to build the Trusted Circle — text + contact picker
  is always available.

---

## 13. Verification

- Manual: emulate "no microphone, keyboard and tap navigation only" walkthrough.
- Automated: `axe-core` WCAG 2.1 AA + `target-size` rule on every CI build.
- Cert artefact: 375 px screenshot in
  `tools/cert_screenshots/chitti_vaani_mute_375.png` showing a Pro Card
  confirm modal with Haan / Nahi tap buttons visible.

---

Last reviewed: 2026-06-06
