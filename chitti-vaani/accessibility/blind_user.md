# Blind User Journey — Chitti Vaani

> Real end-to-end flow for a blind user opening `chitti_vaani.html`.
> Implementation references: `chitti_vaani.html` (`initVoiceFirst`, `chittiConfirmAndDo`),
> `chitti_a11y.js` (substrate), `chitti-vaani/backend/services/vaani_service.py`.
>
> Vaani is the sole user-facing surface for all of sahayai.in. A blind user who
> cannot use Vaani cannot access medicine cost intelligence, legal help, government
> schemes, or the emergency cascade. This journey must work perfectly.

---

## 0. Pre-state — Disability Profile

The user has set `disability_profile.blind = true` at any earlier point on any
Chitti page. The profile is shared across all 15 Chittis on the device:

```js
localStorage.setItem('disability_profile', JSON.stringify({ blind: true }));
```

If this is the user's very first visit to any Chitti page, `chitti_a11y.js`
presents the User Disability Profile multi-select on first paint
(SAHAYAI_MASTER.md §7 — LOCKED). The blind user can multi-select with voice.
The prompt is spoken aloud automatically: *"Are you blind? Deaf? Do you use ISL?
Mute? Limited literacy? Elderly? Tap or say the options that apply to you."*

---

## 1. Page Load → Voice-First Mode Auto-Activation

`chitti_vaani.html` boot path:

```
DOMContentLoaded
  → boot()
  → loadConsentGate()       // reads consent from localStorage; if missing, speaks T&C
  → initDisabilityProfile() // reads disability_profile from localStorage
  → initVoiceFirst()        // fires if dp.blind || dp.illiterate
```

`initVoiceFirst()` checks `disability_profile.blind`. If true:

1. The visual indicator `#vf-indicator` gets class `shown` (sighted helpers
   nearby can see Voice-First is on).
2. After 1.5 s (waiting for the page to settle), a welcome utterance plays
   via the Voice Factory cascade:

   > *"Namaskar, main Chitti hun — aapka dost. Aap kya chahte hain? Call
   >  karna ho, news sunna ho, doctor se baat karni ho, ya kuch aur — bas
   >  bataiye."*

   (English: *"Hello, I am Chitti — your friend. What would you like?
   Make a call, hear news, talk to a doctor — just tell me."*)

3. `SpeechRecognition` (or `webkitSpeechRecognition`) starts in continuous
   mode, language set from the user's `chitti_lang` key in localStorage
   (e.g. `hi-IN`, `ta-IN`, `en-IN`).

---

## 2. Voice Commands — the Complete Action Surface

The recogniser's `onresult` handler routes on the latest transcript.
The user never needs to touch the screen.

| Voice command (example) | Vaani action |
|---|---|
| "Call Mom" / "Maa ko call karo" | `chittiConfirmAndDo("Maa ko call karun?")` → on haan, `tel:` deep-link or Android direct-dial |
| "Send WhatsApp to Raj" | `chittiConfirmAndDo("Raj ko WhatsApp bhejun?")` → `wa.me` link |
| "Paracetamol ka generic" | Route to chitti-medupi, speak medicine-cost result |
| "ITR file karna hai" | Route to chitti-ca, speak CA advice |
| "Bachao" / "Emergency" | Safety Agent VETO → speak emergency question → cascade |
| "News" / "Khabar" | Route to chitti-news, speak top headlines |
| "Scan karo" | Route to chitti-scanner (camera opens with voice confirm) |
| "Stop" / "Ruko" | `window.speechSynthesis.cancel()` + recogniser keeps listening |
| "Help" | Speaks: *"Aap keh sakte hain: call karo, news, doctor, paisa, madad, ruko."* |

The recogniser's `onend` callback restarts it — the user is never required
to re-trigger listening.

---

## 3. Consent Gate — Voice-First Narration

The 6-section T&C consent gate (LOCKED in `chitti_vaani.html`) must work for
a blind user. Implementation:

- Each section has a 🔊 button that reads the section aloud via Voice Factory.
- In Voice-First Mode, sections auto-read in sequence after 1 s each.
- The user says "haan" or taps the large "I AGREE" button (≥ 48×48 px,
  aria-label="I agree to the terms").
- Consent persists in `localStorage.chitti_vaani_consent_given` — the user
  is NEVER re-prompted on subsequent visits.

---

## 4. Every Action Is Gated — Golden Rule (LOCKED 2026-05-23)

**Chitti NEVER acts silently on a blind user.** The Golden Rule is especially
critical for this population because they cannot see what Chitti is about to do.

`chittiConfirmAndDo(question, onYes)`:
1. Speaks the question in the user's language (Voice Factory cascade).
2. Opens the `#chitti-confirm-overlay` modal — Haan / Nahi buttons (≥ 48×48 px,
   aria-label="Yes, do it" / "No, cancel").
3. Parallel `SpeechRecognition` listens for haan/theek/yes/kar do.
4. Fires `onYes()` only on explicit Yes.
5. **Never defaults to Yes. Never times out into Yes. Silence = Chitti waits.**

This is the architecture for all 13+ Pro Card actions (call, SMS, WhatsApp,
UPI, email, lock, silent, camera, maps, SafeWalk, Fake Call, Share Location).

---

## 5. ARIA-Live Announces Every State Change

Every Chitti response section carries:
```html
<div data-chitti-response aria-live="polite" aria-atomic="false">
```

When a route result, Pro Card result, or assistant reply is written into
a section, the screen reader (NVDA / JAWS / TalkBack / VoiceOver) announces
the change automatically. The user never needs to navigate to find new content.

Every `[data-chitti-response]` also auto-attaches the per-response widget
(LOCKED — every box, every page) via `feedback-widget.js`:
- 🔊 "Read aloud" button (aria-label="Read this response aloud").
- 🤖 "Ask Chitti more" button.
- 👍 / 👎 feedback (tap-only; no typing required).

---

## 6. Emergency Cascade — Voice-Guided for Blind Users

If `is_emergency_keyword(text)` fires:

1. Vaani speaks: *"Master, kya aap theek hain? Agar haan, toh keh dijiye theek hun."*
   (10-second window.)
2. If user says "theek hun": `/api/vaani/emergency/check-in` aborts the cascade.
3. If silence or "nahi": ring alarm (STREAM_ALARM bypass on Android;
   WebAudio on web) — this does NOT require any confirm because it is
   the emergency path.
4. Fan out to Trusted Circle via WhatsApp / SMS — each one spoken aloud:
   *"Maa ko message bhej raha hun."*
5. Chitti-to-Chitti relay fires (FCM or long-poll). No cops — ever.
   (SAHAYAI_MASTER.md §2, emergency protocol LOCKED.)

---

## 7. Voice Factory Cascade (Honest Ledger)

Every utterance Vaani speaks follows the 4-supplier cascade:
- Tier A: Bhashini (mock_bhashini active until ULCA creds).
- Tier B: Browser Web Speech API (`SpeechSynthesisUtterance`).
- Tier C: Honest fallback — if no voice available, Vaani says
  *"Voice service is not available right now. Here is the text answer:
  [text]."* — **NEVER silent failure.**

For a blind user, Tier C text fallback is announced via the aria-live region
so the screen reader picks it up.

---

## 8. Slow Mode for Elderly + Blind Users

If `disability_profile.elderly = true` (alone or combined with blind),
the DeepSeek prompt includes the slow-mode instruction
(per `CONTEXT.md` conversational mode):
- Short sentences.
- Important info repeated twice.
- Confirm with *"Kya aapko samajh aaya?"* after each reply.

Elderly users are the integration stress test — every blind-user constraint
plus slower speech recognition and smaller hearing range.

---

## 9. Read-Back of Routed Responses

When a route sends the query to an internal Chitti and a response returns,
Vaani speaks a route provenance line before the answer:

> *"Chitti MedUPI se answer aa raha hai:"* (spoken)

Then the answer is read aloud via Voice Factory. The provenance chip is
also shown visually (a small badge) for sighted helpers nearby — it is
never the only announcement.

---

## 10. Failure Modes (Honest)

| Failure | What the blind user hears |
|---|---|
| SpeechRecognition not supported (Safari iOS pre-14.5) | Welcome utterance plays; follow-up: *"Voice commands not available on this browser. Use the buttons or ask a helper."* aria-live announces this. |
| Voice Factory all tiers fail | *"Voice service unavailable. Text answer: [text]."* Screen reader reads the aria-live region. |
| Target Chitti backend 5xx | *"Chitti [X] abhi uplabdh nahi hai. Thodi der mein try karein."* Layer-5 fallback (Claude → Gemini) attempted. |
| Emergency cascade — Trusted Circle unreachable | Ring alarm fires; Vaani speaks: *"Family ko message nahi pahuncha — alarm baja raha hun."* Never silent. |
| Golden Rule modal silence | Chitti waits — no timeout, no default Yes. |

---

## 11. What We Never Do to a Blind User

- Never display a CAPTCHA or visual-only confirm as the only path.
- Never auto-play an unrelated audio ad or unrelated speech that blocks
  the screen reader.
- Never use colour-only signals — every colour carries a voice + text equivalent.
- Never rely on hover/swipe as the only gesture — tap + voice covers every action.
- Never silently fail voice output — if voice is unavailable, we say so.
- Never auto-route an action without the Golden Rule spoken question first.
- Never expose an internal Chitti slug name — say "Chitti Tax Expert",
  not "chitti-ca".

---

## 12. Verification

- Manual: NVDA on Windows + TalkBack on Android Chrome.
- Automated: `axe-core` WCAG 2.1 AA on every CI build — see
  [`../evals/accessibility_eval.md`](../evals/accessibility_eval.md).
- Cert artefact: 375 px screenshot written to
  `tools/cert_screenshots/chitti_vaani_blind_375.png` per CTO visual
  screenshot mandatory rule (SAHAYAI_MASTER.md §7).

---

Last reviewed: 2026-06-06
