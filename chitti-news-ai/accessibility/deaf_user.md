# Deaf User Journey — Chitti News AI

> Real end-to-end flow for a deaf user opening `chitti_news_ai.html`.
> Implementation references: `chitti_a11y.js` (ISL plugin), `chitti_isl_dictionary.json`,
> `chitti_news_ai.html` `[data-chitti-response]` markup.

---

## 0. Pre-state

The user has set `disability_profile.deaf = true` (or `disability_profile.isl = true` for ISL-primary users). The setting persists in localStorage on the device:

```js
localStorage.setItem('disability_profile', JSON.stringify({ deaf: true, isl: true, ... }));
```

If this is the first Chitti visit, the multi-select prompt asks "Are you blind? Deaf? Use ISL? Mute? Illiterate?" — all selectable, all stored locally.

---

## 1. Page load → visual-only flow

For a deaf user, `initVoiceFirst()` does NOT auto-activate the welcome utterance or the `SpeechRecognition` listener (the check is `dp.blind || dp.illiterate`, not `dp.deaf`). The page renders as the standard visual layout:

```
Hero card  →  News tab  →  Hub  →  28-Day Tour
```

Every section is `[data-chitti-response]`, which means three substrates auto-attach:

1. **feedback-widget.js** — the 4-icon row (🔊 / 🤖 / 👍 / 👎) on every box.
2. **chitti_a11y.js** ISL panel — see §2.
3. **chitti_lang.js** — language selector top-right.

---

## 2. ISL panel attached to every response box

`chitti_a11y.js` walks the DOM on load (and on MutationObserver fire) for `[data-chitti-response]` elements. For each one, when the user is in ISL mode (`disability_profile.isl` or `disability_profile.deaf`), the substrate injects an ISL animation panel underneath:

```html
<div class="chitti-isl-panel" role="region" aria-label="Indian Sign Language animation">
  <video class="chitti-isl-video" loop muted playsinline></video>
  <button class="chitti-isl-tap-word" aria-label="Tap a word to see its sign"></button>
</div>
```

Phase 1 (LIVE per [`project_chitti_isl_spec`](../../SAHAYAI_MASTER.md) §13):

- Dictionary-driven animation pulled from `chitti_isl_dictionary.json`.
- Per-card animation auto-plays the headline / summary of that card.
- Tap-word modal: deaf user taps any word; modal shows that specific word's ISL animation.
- Honest placeholder animations where the dictionary is empty — we never fake a sign.

Phase 2 (COMING SOON — camera input → sign recognition).
Phase 3 (COMING SOON — community contributions + Hall of Fame).

---

## 3. Relevance flag uses color + emoji, never audio

The Chitti Explains relevance verdict (COSDF L14) renders as a colored band + emoji on every news card. A deaf user sees the verdict without needing audio:

| Verdict | Color | Emoji | Text |
|---|---|---|---|
| IGNORE | grey | 😴 | "Ignore — not for your role" |
| PAY-ATTENTION | yellow | 👀 | "Pay attention" |
| VERY-IMPORTANT | orange | ⚡ | "Very important for you" |
| CRITICAL | red | 🚨 | "Critical — affects your role now" |

We never rely on a tone, a chime, or a voice notification to convey importance — color + emoji + text carry it.

---

## 4. Profession Hub renders fully visually

Each Hub section (COSDF L23) is a card grid:

- **AI News** — headline + source logo + relevance band.
- **Chitti Explains** — text-only verdict + 3-line summary.
- **AI Readiness Score** — large number (e.g. "21/100") + horizontal progress bar.
- **Certifications** — list with FREE badge + difficulty pill + duration pill.
- **Courses** — same pattern.
- **Tools** — logo + 1-line use-case.
- **Prompts** — code-block with 📋 "Copy" button (no voice readout).
- **Projects** — title + difficulty + estimated hours + 🔗 starter-repo link.
- **Jobs Radar** — role chips + skills chips.
- **Mentor** — single-line next-action ("Pick up here").

No section requires audio to be useful.

---

## 5. Caption fallback for any audio content

When a deaf user encounters a card with audio-only content (e.g. a YouTube embed from the 28-Day Tour or a podcast in News), we surface:

- The transcript inline below the player (extractive — see [`../guardrails/hallucination.md`](../guardrails/hallucination.md)).
- A 🔇 visual badge stating "Audio content — transcript provided".
- The 🤖 Chitti Explains button still works, returning a text + ISL-rendered explanation.

We never embed audio without a transcript.

---

## 6. Per-card 🤖 "Chitti's Take" flow for deaf users

The 🤖 icon opens the DeepSeek-explain modal. Output is text-first:

```
🤖 Chitti's Take for your role (Software Developer)

• OpenAI's new Whisper-3 cuts speech-to-text errors by 40%.
• For you: integrate it into your existing pipelines this quarter.
• Start here: their migration guide (link).
```

The ISL panel under the modal renders the 3 bullets in sign animation. No audio is played.

---

## 7. Failure modes (honest)

| Failure | What the deaf user sees |
|---|---|
| ISL animation not in dictionary | Substrate shows: *"ISL animation coming soon for this word — tap to see the closest match"* + tap-word fallback. We never display a wrong sign. |
| Browser blocks autoplay video | A play button replaces the animation; one tap starts it. |
| Caption / transcript unavailable | The card is flagged: *"No transcript available — we won't recommend audio-only content to you"* and the card is de-ranked. |
| User has both `deaf` and `blind` in profile | Haptic feedback substrate takes over (per COSDF L9 modality matrix). |

---

## 8. What we never do to a deaf user

- ❌ Never use audio-only signals (chimes, voice notifications, tone alerts).
- ❌ Never recommend a YouTube video without surfacing the transcript.
- ❌ Never fake an ISL sign — honest "coming soon" beats wrong sign.
- ❌ Never lock a feature behind a voice command.
- ❌ Never assume the user can read perfectly — we still emoji-prefix labels (overlap with illiterate users).

---

## 9. Verification

- Manual: Chrome DevTools "Emulate sensory deprivation" + actual deaf-user UAT session.
- Automated: `axe-core` WCAG 2.1 AA caption + ARIA-region scan.
- Cert artefact: 375 px screenshot in `tools/cert_screenshots/chitti_news_ai_deaf_*.png` with ISL panel rendered.

---

Last reviewed: 2026-06-06
