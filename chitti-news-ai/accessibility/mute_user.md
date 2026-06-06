# Mute User Journey — Chitti News AI

> Real end-to-end flow for a mute user opening `chitti_news_ai.html`.
> Implementation references: `chitti_news_ai.html` 6-button role grid,
> `chitti_coach.js` profile intake, `chitti_a11y.js` substrate.

---

## 0. Pre-state

The user has set `disability_profile.mute = true`:

```js
localStorage.setItem('disability_profile', JSON.stringify({ mute: true, ... }));
```

A mute user may also have other settings (deaf, illiterate). The journeys compose — but this doc covers the mute-primary path.

---

## 1. Page load → tap-only flow

For a mute user, `initVoiceFirst()` does NOT auto-activate `SpeechRecognition` (the check is `dp.blind || dp.illiterate`, not `dp.mute`). Even if it did, the user cannot speak commands. The substrate detects `disability_profile.mute = true` and:

- Suppresses any "say X to do Y" hints.
- Replaces the welcome voice prompt with a visible "Welcome — tap any card to start" banner.
- Ensures every interactive element has a tap target ≥ 48 × 48 px (per the 8-Gate done-definition).

---

## 2. Six quick-pick role buttons — no typing required

The Hero card's profession picker is rendered as a 6-tile grid that covers the most common roles for the user's region (defaults: Doctor · CA · Teacher · Lawyer · Software Developer · Student). A 7th tile "More roles…" opens a full grid; a footer "Type your role" link is present but never required.

```
[ 🩺 Doctor ]      [ 📊 CA ]         [ 👩‍🏫 Teacher ]
[ ⚖️ Lawyer ]      [ 💻 Software ]   [ 🎓 Student ]
[ 🔍 More roles… ] [ ⌨️ Type… ]
```

One tap sets `profile.profession` and re-renders the Hub. The user has reached the personalized state with **one tap** and **zero typing**.

---

## 3. Profession Hub renders without text input

Every Hub section (COSDF L23) is read-only by default — the user consumes content, doesn't input it:

- **AI News** — scroll + tap a card to expand.
- **Chitti Explains** — tap 🤖 to expand the relevance verdict.
- **Readiness Score** — number + bar (no input).
- **Certifications / Courses / Tools** — tap to open in new tab.
- **Prompts** — tap 📋 to copy to clipboard (no typing).
- **Projects** — tap to open starter repo.
- **Jobs Radar** — scroll-only.
- **Mentor** — single "Pick up here" tap.

The 8-question intake (which extends the 5-question one for AI Readiness — COSDF L15) is rendered as **tap-only buttons**, never free-text:

| Question | Tap options |
|---|---|
| Experience | [0-2 yrs] [3-5 yrs] [5-10 yrs] [10+ yrs] |
| Hours per week | [2] [5] [8] [12+] |
| AI usage | [None] [Low] [Med] [High] |
| Prompting | [Beginner] [Intermediate] [Advanced] [Expert] |
| Automation | [None] [Some] [Many] |
| Goal | profession-specific tap list from `GOAL_VOCAB[profession]` |
| Current skills | profession-specific multi-select chips from `SKILL_VOCAB[profession]` |
| Language | already in `chitti_lang` |

A mute user can complete the entire intake with taps.

---

## 4. Tour Mark-Done is a tap

The 28-Day Tour day-cards (lines 571-582 of `chitti_news_ai.html`) each render a "Mark Done" button. One tap:

```js
profile.tour_days_done.push(dayNumber);
window.ChittiCoach.markTourDayDone(dayNumber);
```

The next day's card auto-scrolls into view. The Mentor card updates. No voice required.

---

## 5. Feedback widget — tap-only thumbs

Every `[data-chitti-response]` box carries the per-response widget (LOCKED 2026-05-13 — every box, not page-footer):

```
[🔊]  [🤖]  [👍]  [👎]
```

For a mute user:
- 🔊 = play audio (skipped — user is mute, not deaf — voice still serves *their* ears).
- 🤖 = open Chitti's Take (tap to expand).
- 👍 / 👎 = single tap feedback, stored in `chitti_coach_feedback` + sent anonymously to `/api/feedback/collect`.

The optional "tell us more" field is a *typed* field; for mute users it is OPTIONAL and never blocks the thumbs-up / thumbs-down action from registering.

---

## 6. Search field — never required

When a mute user does want a role outside the 6 tiles, they tap "More roles…" which opens a 30-tile grid (the 13 hardcoded hubs + 17 common adjacent roles). If they tap "Type your role" they get a text field with autocomplete — but this is the LAST-resort path, not the FIRST.

For Phase 2 dynamic ANY-role mapping, the user can paste a role name from their CV via clipboard — still no keyboard required.

---

## 7. Failure modes (honest)

| Failure | What the mute user sees |
|---|---|
| Their role is not in the 6 tiles or 30-tile grid | "More roles…" expands; "Type your role" is the fallback. Phase 2 ANY-role mapping will close this. |
| Intake question requires free-text | This is a bug — every intake question must have tap options. File against [`../guardrails/safety.md`](../guardrails/safety.md). |
| Tap target < 48 × 48 px | Violation of the 8-Gate done-definition. Auto-flagged by CI. |
| Captcha appears | We never use captcha in our flows. If a third-party iframe shows one, the card is de-ranked and a "third-party challenge — skip" badge appears. |

---

## 8. What we never do to a mute user

- ❌ Never gate any action behind a voice command as the ONLY path.
- ❌ Never require typing for first-journey personalization.
- ❌ Never use tap targets < 48 × 48 px.
- ❌ Never auto-open a virtual keyboard without explicit user action.
- ❌ Never penalize a tap-only interaction in the personalization signal (👍 from a mute user counts equal to 👍 from any other user).

---

## 9. Composability with other modalities

| Combined profile | Effective path |
|---|---|
| `mute + blind` | Touch input + voice output. Voice-First Mode auto-activates from `blind`; we never expect the user to speak back. Recognizer is disabled; haptic confirmation on tap. |
| `mute + deaf` | Touch input + visual output. ISL panel attaches; thumbs feedback only. |
| `mute + illiterate` | Touch input + voice output + emoji labels. Voice-First Mode auto-activates from `illiterate`; recognizer disabled. |

---

## 10. Verification

- Manual: emulate "no microphone, keyboard navigation only" + tap-only walkthrough.
- Automated: `axe-core` WCAG 2.1 AA + tap-target-size check.
- Cert artefact: 375 px screenshot in `tools/cert_screenshots/chitti_news_ai_mute_*.png` showing the 6-tile role picker.

---

Last reviewed: 2026-06-06
