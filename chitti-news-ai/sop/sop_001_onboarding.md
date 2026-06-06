# SOP-001 — User First-Visit Onboarding

> Standard Operating Procedure for the very first visit to `chitti_news_ai.html`.
> Three steps: User Disability Profile → Profession picker → First news view.
> Total target time: ≤ 90 seconds end-to-end.

---

## Triggered when

- The user's browser has no `disability_profile` localStorage key (first Chitti visit on this device), OR
- The user's `chitti_user_profile.profession === 'everyone'` (Chitti visited before but no profession set), OR
- The user explicitly invoked "Chitti forget" and refreshed.

---

## Step 1 — User Disability Profile prompt

Source: `chitti_a11y.js` substrate (loaded by `<script src="chitti_a11y.js?v=20260606.1">` in `chitti_news_ai.html` line 257).

Substrate detects missing `disability_profile` localStorage key and renders:

```
Welcome to Chitti.

How can we help you best?  (Tap all that apply)

  [ 👁️ I am blind ]      [ 👂 I am deaf ]
  [ 🤟 I use ISL ]       [ 🗣️ I cannot speak ]
  [ 📖 I cannot read ]   [ 👵 I am elderly ]
  [ ♿ Limited mobility ]  [ 🧠 Cognitive ]
  [ ✓ None of these ]

  [ Skip ]
```

Substrate behaviour:
- Voice-reads the question aloud at low volume.
- Multi-select; user taps any combination.
- Confirms aloud: *"You selected: blind, illiterate. Saving on this device only."*
- Writes to `localStorage.disability_profile` as JSON.
- Emits `chitti:disability_profile` event so `chitti_news_ai.html` line 634's listener re-runs `initVoiceFirst`.

If user taps "Skip", `disability_profile = {}` is set; the substrate does NOT re-prompt (anti-nag rule).

---

## Step 2 — Profession picker (Hero)

Source: `chitti_coach.js` `_hasIntake(profile)` returns false → `renderHero` paints the 6-tile picker.

```
Tell us what you do — pick once, never asked again.

  [ 🩺 Doctor ]   [ 📊 CA ]      [ 👩‍🏫 Teacher ]
  [ ⚖️ Lawyer ]   [ 💻 Software ] [ 🎓 Student ]
  [ 🔍 More roles… ]   [ ⌨️ Type your role ]
```

Substrate behaviour by disability state:
- **Blind / Illiterate**: Voice-First Mode reads each tile name as the user navigates (Tab key) or focuses (touch).
- **Mute**: Tap the tile. No voice required.
- **Deaf / ISL**: Tile labels are emoji-prefixed; ISL panel under the picker plays the role-name sign on focus.
- **Default visual**: Just tap.

On tap:
1. `profile.profession = '<slug>'` written to `chitti_user_profile`.
2. `renderAll()` triggers, painting Hub + Tour + News.
3. The user is now in the personalized state. **One tap. Zero typing.**

---

## Step 3 — First news view

Source: `chitti_news_ai.html` `renderNews()` reads `/api/news-ai/feed/news?profession=<slug>&lang=<lang>`.

User sees:

- Top 5 news cards for their profession.
- Each card carries:
  - Headline + source logo + relevance band (color + emoji + text).
  - 🤖 button → DeepSeek "Chitti's Take" 3-bullet explainer.
  - 🔊 button → voice readout via Voice Factory.
  - 👍 / 👎 buttons → per-card feedback.
  - 🤟 ISL panel (auto-attached if `disability_profile.isl=true`).
- Below the news block: Hub preview (top of the user's Profession Hub).
- Below that: Day 1 of the 28-Day AI Tool Tour.

Voice-First Mode (active for blind / illiterate users) reads:

> *"Today's top AI news for software developers. Five stories. First story is about [headline]. Tap to hear more, or say 'next'."*

---

## Failure modes

| Failure | Recovery |
|---|---|
| `chitti_a11y.js` failed to load | The disability prompt does NOT render. User sees the default visual hero. The voice-first benefits are degraded but the product still works. Logged as RED. |
| User taps "Skip" on disability prompt | We proceed as default-visual. We never re-prompt. The user can tap the 👤 menu later to change profile. |
| Backend `/api/news-ai/feed/news` fails | Hero, Hub, Tour still render from local data. News card shows: *"Reconnecting to news. Try in a moment."* Mentor card still serves. |
| User's chosen language has no TTS | Voice-First Mode falls back to closest covered language; honest banner: *"Speaking in Hindi — your language coming soon."* |

---

## Verification

- Manual: incognito Chrome session → verify Step 1 → Step 2 → Step 3 in ≤ 90 s.
- Automated: `tools/qa_news_ai_onboarding.mjs` (Playwright) records the full journey and asserts the 3 steps occur in order.
- Cert artefact: `tools/cert_screenshots/chitti_news_ai_onboarding_*.png` per disability profile.

---

## What we never do during onboarding

- ❌ Never ask for email or phone number.
- ❌ Never ask for age.
- ❌ Never auto-prompt for notification permission.
- ❌ Never auto-prompt for camera / mic permission EXCEPT when Voice-First Mode is starting and the user has `blind=true` (and even then, with an honest "I need to listen for your commands — okay?" prompt).
- ❌ Never block the user from skipping any step.
- ❌ Never re-ask after Skip.

---

Last reviewed: 2026-06-06
