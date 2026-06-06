# Illiterate User Journey — Chitti News AI

> Real end-to-end flow for an illiterate (or limited-literacy) user opening `chitti_news_ai.html`.
> Implementation references: `chitti_news_ai.html` lines 587-617 (`initVoiceFirst`),
> `chitti_a11y.js` substrate, `chitti_coach.js` profile intake.

---

## 0. Pre-state

The user has set `disability_profile.illiterate = true` (or it was inferred from a "I can't read well" tap in the Disability Profile prompt):

```js
localStorage.setItem('disability_profile', JSON.stringify({ illiterate: true, ... }));
```

This setting is locked never to be inferred from behaviour — it must be explicitly tapped by the user (privacy + dignity rule).

---

## 1. Page load → Voice-First Mode auto-activates

`initVoiceFirst()` in `chitti_news_ai.html` (line 588) checks:

```js
if (dp.blind || dp.illiterate) { ... }
```

For an illiterate user, the SAME path triggers as for a blind user — the welcome utterance plays, `SpeechRecognition` starts in continuous mode. From the page's perspective these two users share the voice-first scaffolding. But the visual layer is RETAINED for the illiterate user (unlike the blind user who relies on screen reader only).

> *"Welcome to Chitti News AI, your A.I. career coach. Say 'tour' to start your 28-day tour, 'news' to hear today's top A.I. story, or 'help' for more."*

---

## 2. Emoji icons before every label

Per the COSDF L9 modality matrix (Illiterate row: "Voice + Thumbs / Voice + Icons / Emoji"), every interactive label in `chitti_news_ai.html` carries an emoji prefix the user can pattern-match without reading:

| Section | Label as text | Emoji prefix |
|---|---|---|
| News tab | "AI News" | 📺 |
| Tools tab | "AI Tools" | 🔧 |
| Bharat AI tab | "Bharat AI" | 🇮🇳 |
| Prashikshan tab | "Prashikshan" | 📖 |
| Hub | "Profession Hub" | 👤 |
| Tour | "28-Day Tool Tour" | 🗓️ |
| Mark Done | "Mark Done" | ✅ |
| Save | "Save" | 💾 |
| Skip | "Skip" | ⏭️ |

The user navigates by tapping the emoji icon. They never need to decode the text.

---

## 3. Six face-emoji role buttons

The Hero profession picker for an illiterate user is rendered with **face emojis representing the role**, not job titles:

```
[ 🩺 ]  [ 📊 ]  [ 👩‍🏫 ]
[ ⚖️ ]  [ 💻 ]  [ 🎓 ]
```

A short voice clip plays on hover / focus: *"This is Doctor"* — *"This is Teacher"* — etc. The user identifies their role by ear, taps the emoji, and the Hub renders.

If the user wants a role outside the 6, the "More" tile opens a voice-narrated list — the user says (or taps) the matching emoji.

---

## 4. Mission cards open with 📺 / 📖 / ✍️ / 🚀 icons

The Weekly Mission card (COSDF L16 — already LIVE via `missionThisWeek` in `chitti_coach.js`) has 4 sub-tasks, each prefixed with an unambiguous emoji:

```
📋 THIS WEEK'S MISSION

📺  Watch    LinkedIn Recruiter AI demo (15 min)
📖  Read     Hung Lee: Recruiting Brainfood (5 min)
✍️  Practice Write 1 Boolean → AI-rewritten prompt (5 min)
🚀  Try      Eightfold free trial — paste 1 JD (5 min)

[ ▶️ Start ]   [ ⏭️ Skip ]
```

The user can:
- Tap an emoji to do that one sub-task.
- Tap ▶️ to have Chitti walk through them by voice.
- Tap ⏭️ to skip the whole mission this week.

No reading is required to act.

---

## 5. Voice readback per section

When the user scrolls to (or taps) any section, `chitti_a11y.js` triggers a one-line voice summary via `window.Chitti.a11y.speak()`:

| Section reached | Voice readback |
|---|---|
| Hero | *"Pick your role. Tap a face."* |
| News | *"Today's top AI news for your role. Five stories. Tap to hear any one."* |
| Hub > Readiness Score | *"Your AI readiness is 21 out of 100. Tap the green button to see the next thing to learn."* |
| Hub > Mentor | *"Your mentor says: do this one thing this week."* |
| Tour > today's day | *"Day 5: ChatGPT for planning. 15 minutes. Tap done when you finish."* |

The voice readback uses the user's `chitti_lang` and routes through Voice Factory's tier cascade.

---

## 6. Per-card 🤖 "Chitti's Take" — voice-first output

When the user taps 🤖 on a news card, DeepSeek explains the article in the user's language. Because Voice-First Mode is on, the response is **spoken automatically** (the text is still rendered for fallback / shared-screen scenarios). The user hears:

> *"This story says: OpenAI made a new voice model. For you, the teacher: this means you can soon teach in Tamil voice. Try it next week."*

The 3-bullet structure is preserved; the voice reads each bullet with a small pause between.

---

## 7. Feedback widget — thumbs + voice

The 👍 / 👎 icons on every `[data-chitti-response]` are unambiguous emoji-only. After a thumbs-down, instead of showing a typed "tell us more" field (which an illiterate user can't fill), the substrate offers:

```
[ 🎤 Hold to speak ]   [ Skip ]
```

The user holds the mic button, speaks their reason, and `chitti_a11y.js` sends an audio blob + transcript anonymously to `/api/feedback/collect` (see [`../observability/metrics.md`](../observability/metrics.md)). No typing, ever.

---

## 8. Failure modes (honest)

| Failure | What the illiterate user hears |
|---|---|
| `chitti_lang` is set to a language with no TTS coverage | Falls back to the closest supported language with an honest note: *"Speaking in Hindi — your language not yet available"* (never silent). |
| Browser blocks autoplay audio | The welcome utterance won't play; we fall back to a single big 🔊 button at the top with voice prompt: *"Tap to start"*. |
| User taps a card while another is mid-speech | We cancel the in-flight speech and read the new card (`window.speechSynthesis.cancel()` before each utterance). |

---

## 9. What we never do to an illiterate user

- ❌ Never make text the only way to navigate.
- ❌ Never require typing.
- ❌ Never use color-only or number-only signals.
- ❌ Never assume "the user will figure it out" — every card has a voice cue.
- ❌ Never penalize voice-only feedback in the signal aggregation.

---

## 10. Composability

| Combined profile | Effective path |
|---|---|
| `illiterate + blind` | Voice-First Mode on; visual layer becomes irrelevant; emoji prefixes still help any sighted helper looking at the screen with the user. |
| `illiterate + deaf` | ISL panel + emoji-rich UI; voice readback disabled; all feedback via thumbs + ISL animation. |
| `illiterate + mute` | Voice-First Mode for output; speech recognizer disabled; tap-only input; emoji-rich UI. |

---

## 11. Verification

- Manual: voice-only walkthrough with an illiterate UAT participant.
- Automated: `axe-core` ARIA-live + label-association scan.
- Cert artefact: 375 px screenshot in `tools/cert_screenshots/chitti_news_ai_illiterate_*.png` showing the 6-face role grid + emoji-prefixed labels.

---

Last reviewed: 2026-06-06
