# Blind User Journey — Chitti News AI

> Real end-to-end flow for a blind user opening `chitti_news_ai.html`.
> Implementation references: `chitti_news_ai.html` lines 587-617 (`initVoiceFirst`),
> `chitti_coach.js` (the rules-only coach), `chitti_a11y.js` (substrate).

---

## 0. Pre-state

The user has set `disability_profile.blind = true` at any earlier point in any Chitti — the User Disability Profile is shared across all 15 Chittis on the device. The setting persists via:

```js
localStorage.setItem('disability_profile', JSON.stringify({ blind: true, ... }));
```

If this is the user's very first Chitti visit, the substrate prompts the multi-select profile on first paint (see [User Disability Profile LOCKED](../../SAHAYAI_MASTER.md) §7). The user can multi-select with voice.

---

## 1. Page load → Voice-First Mode auto-activation

`chitti_news_ai.html` boot path:

```
DOMContentLoaded
  → boot()
  → renderAll()     // Hero, Hub, Tour, News
  → initVoiceFirst() // reads disability_profile from localStorage
```

`initVoiceFirst()` checks `dp.blind || dp.illiterate`. If either is true:

1. The visual indicator `#vf-indicator` gets class `shown` (sighted helpers can see Voice-First is on).
2. After 1.2 s (waiting for the page to settle), a welcome `SpeechSynthesisUtterance` plays:

   > *"Welcome to Chitti News AI, your A.I. career coach. Say 'tour' to start your 28-day tour, 'news' to hear today's top A.I. story, or 'help' for more."*

3. `SpeechRecognition` (or `webkitSpeechRecognition`) is started in continuous mode, language set from `chitti_lang` (`hi-IN` for Hindi, `en-IN` otherwise — extends to other Indic codes as Voice Factory matures).

---

## 2. Five voice commands → actions

The recognizer's `onresult` handler routes by regex match on the latest transcript. The user never has to touch the screen.

| Voice command | Regex | Action |
|---|---|---|
| "tour" / "twenty-eight day tour" | `/tour\|28 day/` | `window.ccScroll('tour-section')` — scrolls to and announces the 28-Day AI Tool Tour |
| "news" | `/news/` | `window.ccScroll('news-section')` — scrolls to today's top AI news |
| "hub" / "profession" | `/hub\|profession/` | `window.ccScroll('hub-section')` — scrolls to the Profession Hub |
| "help" | `/help/` | Speaks: *"Commands: tour, news, hub, help, stop."* |
| "stop" | `/stop/` | `window.speechSynthesis.cancel()` — stops all in-flight speech |

The recognizer's `onend` callback restarts the recognizer, so the user is never required to re-trigger listening.

---

## 3. ARIA-live announces content as it renders

Every section in `chitti_news_ai.html` carries:

```html
<section ... data-chitti-response aria-live="polite">
```

When `renderHero` / `renderHub` / `renderTour` / `renderNews` write new HTML into a section, the screen reader (NVDA / JAWS / TalkBack / VoiceOver) announces the change automatically. The user hears:

- Hero: *"Hero — what do you want today"*
- News: *"Top AI news for your role"*
- Hub: *"Your Profession Hub"*
- Tour: *"28-Day AI Tool Tour"*

Each card is also `data-chitti-response`, so the per-card feedback widget (`feedback-widget.js`) auto-attaches its 4-icon row (🔊 / 🤖 / 👍 / 👎) which screen readers announce as buttons.

---

## 4. Per-card "Read aloud" flow

The 🔊 icon on every card is a button labeled "Read this article aloud". When activated by tap or by voice ("read this"), `chitti_a11y.js` calls `window.Chitti.a11y.speak(text, lang)`, which routes to Voice Factory:

- Tier A (Bhashini) — currently `mock_bhashini` until ULCA creds land.
- Tier B (DeepSeek + local TTS) — fallback.
- Tier C — honest "voice not available in <lang>" announcement (never silent failure per Voice Factory contract).

The user can interrupt with "stop" at any time.

---

## 5. Per-card 🤖 "Chitti's Take" flow

The 🤖 icon triggers DeepSeek to explain the article through the user's profession lens. Output is text + voice — the speech is read automatically because Voice-First Mode is on. No screen interaction needed.

---

## 6. Mark-Done on the 28-Day Tour

When the user says "done" (or any of the voice-command extension words), the current tour day is marked complete:

```js
profile.tour_days_done.push(dayNumber);
```

`chitti_coach.js` re-renders the tour; the next day's card is announced. The Mentor card (Hub section 10) updates: *"You completed 5 days. At this pace, AI readiness in 14 months."*

---

## 7. Failure modes (honest)

| Failure | What the user hears |
|---|---|
| SpeechRecognition not supported (Safari iOS pre-14.5, some Firefox builds) | The welcome utterance still plays, then a follow-up: *"Voice commands aren't available on this browser. Use the buttons or ask a helper."* |
| Browser is offline | The cached corpus is read; new news is not announced; a subtle "(offline mode)" is appended to the welcome utterance. |
| No `disability_profile` set | Voice-First Mode does NOT auto-activate. The user must enable it from the Disability Profile prompt or the a11y substrate menu. |
| User says an unknown command | Nothing happens; the recognizer keeps listening. We do not interrupt with "I didn't understand" — the silence is intentional. |

---

## 8. What we never do to a blind user

- ❌ Never display a CAPTCHA, modal dialog, or visual confirm prompt as the only path forward.
- ❌ Never auto-play an audio ad or unrelated speech that blocks the screen reader.
- ❌ Never require a swipe gesture (mute / motor-impaired users can't always swipe).
- ❌ Never use color-only signals — every color carries a voice/text equivalent.
- ❌ Never silently fail — if voice is unavailable, we say so.

---

## 9. Verification

- Manual: NVDA on Windows + TalkBack on Android Chrome.
- Automated: `axe-core` WCAG 2.1 AA on every CI build — see [`../evals/accessibility_eval.md`](../evals/accessibility_eval.md).
- Cert artefact: 375 px screenshot + recorded audio sample stored in `tools/cert_screenshots/chitti_news_ai_blind_*.png` per [CTO visual screenshot mandatory](../../SAHAYAI_MASTER.md) rule.

---

Last reviewed: 2026-06-06
