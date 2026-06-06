# Illiterate User Journey — Chitti Vaani

> Real end-to-end flow for an illiterate (or limited-literacy) user opening
> `chitti_vaani.html`. Implementation references: `chitti_vaani.html`
> (`initVoiceFirst`, emoji-label system), `chitti_a11y.js` (substrate),
> `chitti-vaani/backend/services/vaani_service.py` (slow-mode DeepSeek prompt).
>
> Vaani exists primarily for Tier-2/3 India — rural, elderly, vernacular
> users who may not read Hindi let alone English. The illiterate user is not
> an edge case; they are the primary user. Every interaction must work with
> zero reading required.

---

## 0. Pre-state — Disability Profile

The user has set `disability_profile.illiterate = true`. This setting
is NEVER inferred from behaviour — it must be explicitly tapped by the user
(privacy + dignity rule, mirroring the chitti-news-ai pattern).

```js
localStorage.setItem('disability_profile', JSON.stringify({ illiterate: true }));
```

The User Disability Profile prompt (SAHAYAI_MASTER.md §7 — LOCKED) uses
emoji icons for every option so the user can tap without reading:

```
👁️  Blind (cannot see screen)
👂  Deaf (cannot hear)
🤐  Mute (cannot speak)
📖  Limited reading
👴  Elderly
♿  Limited mobility
🧠  Cognitive support
```

The prompt speaks each option aloud as the user hovers or focuses on it.
The user taps the matching emoji. No reading required to complete the profile.

---

## 1. Page Load → Voice-First Mode Auto-Activates

`initVoiceFirst()` in `chitti_vaani.html` checks:

```js
if (dp.blind || dp.illiterate) { ... }
```

For an illiterate user the SAME voice-first path triggers as for a blind user.
The visual layer is RETAINED (unlike the screen-reader-only path for blind) — the
emoji-rich UI is still visible and functional. The illiterate user's device
is often shared with a sighted family member who uses the visual layer.

Welcome utterance plays within 1.5 s of first paint:

> *"Namaskar, main Chitti hun — aapka dost. Aap kya chahte hain?
>  Call karna ho, khabar sunna ho, doctor ki madad chahiye, ya kuch
>  aur — bas bataiye."*

`SpeechRecognition` starts in continuous mode.

---

## 2. Emoji Icons Before Every Label — No Text Required for Navigation

Every interactive element, section heading, and CTA carries an emoji prefix
the user can pattern-match without reading:

| Section / Action | Emoji | Voice description on focus |
|---|---|---|
| Make a Call | 📞 | *"Call button — tap to call someone"* |
| Send WhatsApp | 💬 | *"WhatsApp button — tap to send a message"* |
| Send SMS | 📱 | *"SMS button — tap to send a text"* |
| Pay UPI | 💸 | *"UPI payment — tap to pay"* |
| Email | 📧 | *"Email button — tap to send an email"* |
| SafeWalk | 🚶‍♀️ | *"SafeWalk — tap if you are going somewhere alone"* |
| Emergency | 🆘 | *"Emergency button — tap if you need help"* |
| Fake Call | 📵 | *"Fake call — tap to get a fake call in 2 minutes"* |
| News | 📰 | *"News — tap to hear today's news"* |
| Medicine | 💊 | *"Medicine — tap to ask about medicine price"* |
| Government | 🏛️ | *"Government schemes — tap to hear about schemes for you"* |
| Trusted Circle | 👨‍👩‍👧‍👦 | *"Family — tap to manage your family contacts"* |

When Voice-First Mode is on, Chitti speaks each button's voice description
automatically as the user's finger moves across the screen (hover / focus).
The user identifies the card they want by sound, then taps.

---

## 3. Voice Input — Say It, Don't Type It

The input field is available for typing, but for an illiterate user the
primary input is voice:

1. `SpeechRecognition` is continuously listening.
2. The user speaks their request in their language (Hindi, Tamil, Telugu,
   Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi…).
3. Transcription appears in the input field (for reference — the user does
   not need to read it).
4. `POST /api/vaani/ask` fires automatically 1 s after silence.
5. Response arrives and is spoken aloud via Voice Factory cascade.

The user experiences Vaani as a voice conversation — the screen is a
visual confirmation layer, not the primary interface.

---

## 4. Quick Cards — Tap Once, No Typing

For the most common actions (call, food order, medicine, emergency), the user
never needs to type or say anything beyond the initial tap:

**"Call Maa" flow (illiterate user, zero typing):**
1. User taps 📞 (Call card).
2. Vaani speaks: *"Kise call karna hai? Apna contact tap karein."*
3. Trusted Circle shows face-photo tiles + first-name labels in large text +
   audio on hover.
4. User taps "Maa" tile (photo + name).
5. `chittiConfirmAndDo` modal: Vaani speaks *"Maa ko call karun?"* → buttons:
   ✅ HAAN | ❌ NAHI.
6. User taps ✅ or says "haan".
7. Dialer opens.

Zero reading. Zero typing. Three taps total.

---

## 5. Voice-Readback on Every Section

When the user scrolls to (or taps) any section, `chitti_a11y.js` triggers
a one-line voice summary via `window.Chitti.a11y.speak()`:

| Section | Voice readback |
|---|---|
| Home / Pro Cards | *"Yeh Chitti ka main page hai. Koi bhi card tap karein — ya bataiye kya chahiye."* |
| Trusted Circle | *"Yeh aapke family contacts hain. Kisi ek ko tap karein."* |
| Language selector | *"Bhasha badlein — apni bhasha tap karein."* |
| Settings / Profile | *"Aapki setting. Apni zaroorat tap karein."* |
| Emergency cascade active | *"Main madad ke liye aapke ghar walon ko phone kar raha hun."* |

The readback fires once per section visit (not on every scroll tick) to
avoid interrupting a user who is moving through the page quickly.

---

## 6. DeepSeek Slow Mode for Illiterate Users

When `disability_profile.illiterate = true`, the DeepSeek system prompt
(in `vaani_service.py`) switches to slow mode (same as elderly mode):
- Short sentences — maximum 10 words per sentence.
- Repeat important information twice.
- Use the simplest available vocabulary in the target language.
- Avoid jargon, abbreviations, and numbers above 100 (spell out "ek sau" not "100").
- End every response with: *"Kya aapko samajh aaya? Haan keh dijiye ya dobara
  sunne ke liye tap karein."*

This is the deepest voice UX customisation layer — it changes not just what
is shown but what is said and how.

---

## 7. Consent Gate — Voice-Narrated, Emoji-Anchored

The T&C consent gate (6 sections) for an illiterate user:

- Each section reads aloud automatically in sequence (Voice-First Mode).
- Section headings carry emoji anchors (🔒 Privacy, 📞 Calls, 💸 Payments…).
- The "I AGREE" button is large (≥ 72×72 px), labeled with ✅ emoji + spoken
  prompt: *"Agar aap raazi hain toh green button tap karein."*
- The user never needs to read the T&C text — they hear it. Consent persists
  in localStorage after the first session.

---

## 8. Emergency for Illiterate Users — Say the Word

An illiterate user in distress can say any emergency word in their language:

- Hindi: *bachao, madad, dard, gir gaya*
- Tamil: *udavi, aabathu*
- Telugu: *sahaayam, pramadam*
- Bengali: *bachaao, sahojyo koro*
- Marathi: *mala madad kara, aapad*

The Safety Agent keyword list covers all 26 Voice Factory languages
(Quality improvement Q3 — item from `skills/FEATURES.md` §Q3).

On detection:
1. Vaani speaks: *"Master, kya aap theek hain? Agar haan, toh keh dijiye."*
2. If silence: family cascade fires.
3. The screen shows 🆘 full-screen (visual cue for sighted people nearby).

No reading required. No tapping required. A single spoken word triggers safety.

---

## 9. Feedback Widget — Voice After Thumbs

Every `[data-chitti-response]` box carries 👍 / 👎. For an illiterate user:
- Thumbs icons are unambiguous — no text labels needed.
- After a thumbs-down: instead of a text "tell us more" field, the substrate
  shows: *"🎤 Hold to speak — why didn't you like this?"*
- The user holds the mic button, speaks their reason.
- Audio blob + transcript are sent anonymously to `/api/feedback/collect`.

No typing ever required for feedback.

---

## 10. Voice Factory Honest Fallback

If the user's selected language has no TTS coverage (Tier C):

> *"[Language name] mein awaaz abhi nahi hai — Hindi mein bol raha hun."*
> ("[Language] voice is not yet available — speaking in Hindi.")

This is spoken in the fallback language (never in English unless the
user has English selected). The user is told what language Chitti is
using and why. Never silent.

---

## 11. Composability with Other Modalities

| Combined profile | Effective path |
|---|---|
| `illiterate + blind` | Voice-First Mode on; visual layer secondary; emoji prefixes help sighted family members. |
| `illiterate + deaf` | ISL panel + emoji-rich UI; voice readback disabled; all feedback via thumbs + ISL. |
| `illiterate + mute` | Voice-First Mode for output; recogniser disabled; tap-only input; emoji-rich UI; Chitti reads every card aloud on focus. |
| `illiterate + elderly` | Slow mode (already on for illiterate); largest font size; high-contrast mode; longest tap-hold window. |

---

## 12. What We Never Do to an Illiterate User

- Never make text the only way to navigate.
- Never require typing for any first-journey action.
- Never use colour-only or number-only signals.
- Never assume the user reads Hindi or any script.
- Never assume "they will figure it out" — every card has a voice cue on focus.
- Never infer the illiterate profile from behaviour (only set by explicit tap).
- Never penalise voice-only feedback in the signal aggregation.
- Never speak faster than the slow-mode pace for this profile.

---

## 13. Verification

- Manual: voice-only walkthrough with an illiterate UAT participant
  (rural-development partner recruitment, 60 min session).
- Automated: `axe-core` aria-live + label-association scan.
- Cert artefact: 375 px screenshot in
  `tools/cert_screenshots/chitti_vaani_illiterate_375.png` showing
  emoji-prefixed Pro Cards and a confirm modal with HAAN / NAHI buttons.

---

Last reviewed: 2026-06-06
