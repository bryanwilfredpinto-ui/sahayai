# Deaf User Journey — Chitti Vaani

> Real end-to-end flow for a deaf user opening `chitti_vaani.html`.
> Implementation references: `chitti_a11y.js` (ISL plugin),
> `chitti_isl_dictionary.json`, `chitti_vaani.html` `[data-chitti-response]`
> markup, `feedback-widget.js`.
>
> Vaani is the sole user interface across sahayai.in. A deaf user must be able
> to make calls (Chitti speaks for them), get legal / medical answers, access
> government schemes, and trigger the emergency cascade — all without audio.

---

## 0. Pre-state — Disability Profile

The user has set `disability_profile.deaf = true` (or `.isl = true` for
ISL-primary users). The profile persists in localStorage on the device:

```js
localStorage.setItem('disability_profile', JSON.stringify({ deaf: true, isl: true }));
```

On first visit to any Chitti page, the substrate `chitti_a11y.js` presents the
User Disability Profile multi-select (SAHAYAI_MASTER.md §7 — LOCKED).
For a deaf user this is a visual multi-select with large tap targets (≥ 48×48 px)
and emoji labels (no audio required to complete it).

---

## 1. Page Load → Visual-First Flow

For a deaf user, `initVoiceFirst()` in `chitti_vaani.html` does NOT
auto-activate the welcome utterance or `SpeechRecognition` (the check is
`dp.blind || dp.illiterate`, not `dp.deaf`). The page renders the standard
full-feature visual layout:

- Pro Cards grid (call, SMS, WhatsApp, UPI, email, SafeWalk, Fake Call,
  Share Location, Medical ID, Ambulance, Food Order, Groceries, Medicines…).
- Trusted Circle contact list.
- Language selector top-right.
- Disability Profile icon (a11y bar).

Three substrates auto-attach to every `[data-chitti-response]`:
1. **feedback-widget.js** — 4-icon row (🔊 / 🤖 / 👍 / 👎) on every box.
2. **chitti_a11y.js ISL panel** — see §2.
3. **chitti_lang.js** — language selector, script-aware rendering.

---

## 2. ISL Panel on Every Response Box

`chitti_a11y.js` walks the DOM on load (and on every MutationObserver fire)
for `[data-chitti-response]` elements. For each, when `disability_profile.isl`
or `disability_profile.deaf` is true, it injects:

```html
<div class="chitti-isl-panel" role="region"
     aria-label="Indian Sign Language animation">
  <video class="chitti-isl-video" loop muted playsinline
         aria-label="ISL animation for this response"></video>
  <button class="chitti-isl-tap-word"
          aria-label="Tap a word to see its sign">
    👆 Tap any word to sign it
  </button>
</div>
```

**Phase 1 (LIVE):**
- Dictionary-driven animation pulled from `chitti_isl_dictionary.json`.
- Per-response animation auto-plays the headline / summary of that response.
- Tap-word modal: the deaf user taps any word in the response text; a modal
  shows that word's ISL animation.
- Honest placeholder for dictionary gaps: *"ISL animation coming soon for
  this word — tap for the nearest match."* We NEVER show a wrong sign.

**Phase 2 (COMING SOON):** camera input → sign recognition.
**Phase 3 (COMING SOON):** community-contributed ISL videos + Hall of Fame.

---

## 3. All Signals Are Color + Emoji + Text — Never Audio-Only

No information is conveyed to a deaf user by audio alone. Every state change
uses a visual band + emoji + text label:

| Event | Audio | Visual band | Emoji | Text |
|---|---|---|---|---|
| Route to chitti-medupi | (voice for others) | Blue chip | 💊 | "Chitti MedUPI" |
| Route confidence low | (voice for others) | Amber chip | ⚠️ | "Low confidence — confirm?" |
| Emergency keyword detected | (alarm for others) | Red full-banner | 🚨 | "Emergency detected — tap to confirm you are safe" |
| Golden Rule confirm | (voice for others) | Modal overlay | ✅ / ❌ | "Shall I do X? YES / NO" |
| SafeWalk timer active | (voice for others) | Green countdown bar | 🚶‍♀️ | "SafeWalk active — [time] remaining" |
| Emergency cascade fan-out | (ring alarm) | Full-screen red | 🆘 | "Sending alert to [contacts]" |
| Pro Card action complete | (voice confirm) | Green tick flash | ✅ | "[Action] done" |

---

## 4. Golden Rule Confirm Modal — Visual + Tap

For a deaf user, the `chittiConfirmAndDo` modal must be fully visual
(SAHAYAI_MASTER.md §2g — Golden Rule):

1. Full-screen overlay with the confirm question in text (large font).
2. ISL animation of the question plays automatically (if in dictionary).
3. Two large buttons: **✅ HAAN / YES** and **❌ NAHI / NO** (≥ 72×72 px
   for high-visibility interaction).
4. `SpeechRecognition` parallel listener is also active — but the deaf user
   taps; the voice listener is for other modalities sharing the same code path.
5. If the user taps YES: action fires.
6. If the user taps NO or dismisses: action cancelled.

The modal never auto-closes. No timeout. No default. The deaf user sees the
question until they tap.

---

## 5. Mute-on-Behalf (Vaani Calls for Deaf Users)

A deaf user may need to make a phone call. The "Make a Call" Pro Card:

1. Opens the `chittiConfirmAndDo` modal — text: "Call [Name] on [number]?".
2. On YES: calls open with the OS dialer pre-filled (web) or
   `ChittiNative.makeCall()` (Android Phase 2).
3. On Android Phase 2, if the user has opted in to Vaani's ROLE_DIALER:
   Vaani announces *"I am Chitti, an AI assistant for [user name]"* aloud —
   the deaf user does not need to speak; Chitti speaks for them.
4. During the call: a live transcription strip at the bottom of the screen
   shows what the other party is saying (NotificationListenerService on
   Android Phase 2; `webkitSpeechRecognition` in remote-speaker mode on web).

The deaf user can send a pre-written message: text input → Vaani reads it
aloud → the other party hears it. No voice from the user is ever required.

---

## 6. Emergency Cascade — Visual Emergency for Deaf Users

If a deaf user triggers the emergency manually (large SOS button, touch-and-hold
gesture) OR an emergency keyword is detected in text input:

1. The screen goes full-screen red with 🆘 banner.
2. ISL animation of *"Emergency — calling for help"* plays.
3. Screen flashes repeatedly to attract attention of anyone nearby.
4. Fan-out to Trusted Circle: WhatsApp + SMS messages sent — shown on screen
   as confirmation: *"Sent to Maa (📱), Raj (📱)"*.
5. Chitti-to-Chitti relay fires (paired partner Chittis ring STREAM_ALARM).
6. NEVER auto-dials 112 / 100 / 102 (COP_DENYLIST enforced in `emergency_service.py`).

The emergency cascade never requires the deaf user to hear anything.

---

## 7. Pro Card Text-Input Path

For actions like "Send WhatsApp" or "Send SMS" that normally involve voice
composing a message, a deaf user uses text input:

1. The card shows a text area with emoji-tagged placeholders:
   📝 "Type your message here".
2. Autofill suggestions from prior messages (Trusted Circle history).
3. On text submit: `chittiConfirmAndDo` modal confirms with the full
   message text displayed + ISL animation.
4. On YES: Vaani sends via the appropriate channel.

The deaf user has full Vaani capability through text; voice is optional, not required.

---

## 8. Feedback Widget — Tap-Only Thumbs

Every `[data-chitti-response]` carries the per-response widget:

```
[🔊]  [🤖]  [👍]  [👎]
```

For a deaf user:
- 🔊 = skip (the user cannot hear it; but the button is still present and
  aria-labelled so sighted helpers know it's there).
- 🤖 = open Chitti's extended explanation (text + ISL panel).
- 👍 / 👎 = single tap; no audio played on activation.

After thumbs-down, the "tell us more" field is text input. A deaf user can
type feedback — no voice required.

---

## 9. Failure Modes (Honest)

| Failure | What the deaf user sees |
|---|---|
| ISL animation not in dictionary | Honest stub: *"ISL coming soon for this word — tap to see nearest match."* Never a wrong sign. |
| Browser blocks autoplay video | A ▶️ Play button replaces the animation. One tap starts it. |
| Golden Rule modal accidentally plays audio | aria-checked: `aria-live="off"` on the modal prevents the screen reader from re-reading the question — only the ISL animation and tap buttons matter for this user. |
| Both `deaf` and `blind` in profile | Haptic feedback substrate (Phase 2 Android vibration pattern) takes over for emergency events. On web: full-screen flash is the primary signal. |
| Emergency cascade — Trusted Circle unreachable | Screen shows: *"Could not send alert — [contacts] unreachable. Try 108 (tap to open dialer)."* Never silent. |

---

## 10. What We Never Do to a Deaf User

- Never use audio-only notifications, chimes, or voice alerts.
- Never recommend a YouTube video without providing the transcript.
- Never fake an ISL sign — honest "coming soon" is better than a wrong sign.
- Never lock any feature behind a voice command as the only path.
- Never assume the user can read easily — overlap with illiterate profile;
  emoji prefixes are always present.
- Never auto-start the microphone (no `SpeechRecognition` for deaf users).
- Never play the T&C consent narration without a visible mute option.

---

## 11. ISL Phase Roadmap (Honest)

| Phase | Status | Description |
|---|---|---|
| Phase 1 | LIVE | Dictionary + per-response animation + tap-word modal |
| Phase 2 | COMING SOON | Camera input → ISL gesture recognition |
| Phase 3 | COMING SOON | Community contributions + Hall of Fame |

Phase 2 and 3 are spec only — no code commits. The honest skeleton
on the ISL panel panel shows "📷 ISL Camera Input — COMING SOON"
with no fake recognition. See SAHAYAI_MASTER.md §2 (ISL decision LOCKED).

---

## 12. Verification

- Manual: Chrome DevTools "Emulate sensory deprivation" + actual deaf-user UAT.
- Automated: `axe-core` WCAG 2.1 AA caption + ARIA-region scan.
- Cert artefact: 375 px screenshot in
  `tools/cert_screenshots/chitti_vaani_deaf_375.png` showing the ISL panel
  and visual-only emergency banner.

---

Last reviewed: 2026-06-06
