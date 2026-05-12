# BRAILLE — Refreshable Braille Display Support

> "Braille enabled" for Chitti means: every dynamic text change reaches a refreshable braille display (BrailleBack on Android, NVDA + braille on Windows, VoiceOver braille on iOS) through the same channel a screen reader uses — `aria-live` regions, semantic landmarks, and a dedicated **Braille-friendly mode** the user can toggle from any page's top bar.

This is the implementation + audit guide. The matching code lives at [chitti_a11y.js](chitti_a11y.js).

---

## 1. Who this is for

| User                                | Hardware                                       | Surface they read                       |
|-------------------------------------|------------------------------------------------|-----------------------------------------|
| Blind user with refreshable display | 14/20/40-cell USB or Bluetooth braille display | Whatever the screen reader is reading   |
| Blind student with braille notetaker| BrailleSense, Orbit Reader, Mantis Q40         | DOM via screen reader pass-through      |
| Deafblind user                      | Refreshable display + tactile signing          | DOM only — no audio path                |
| Sighted braille learner             | Braille keyboard input devices                 | Same DOM; uses chord input on input field |

For Chitti the deafblind user is the strictest test case: **if the page works without audio and without a sighted glance, it passes.** Voice-OUT is a bonus, not a substitute.

---

## 2. The contract (what every Chitti page must do)

Each Chitti HTML page MUST, in this order:

1. **Load [chitti_a11y.js](chitti_a11y.js) and call `Chitti.a11y.init({ voiceRequired: <true|false> })`** at the top of `<body>`. This injects:
   - The language selector
   - The Voice Required marker (where applicable)
   - The Braille-mode toggle
   - A persistent `aria-live=polite` region (`#chitti-aria-live`)
2. **Use semantic landmarks.** Exactly one `<h1>`. `<nav>`, `<main>`, `<aside>`, `<footer>` where they make sense. No `<div>`-only structures for things that have a role.
3. **Route every dynamic update through `Chitti.a11y.announce(text)`.** When you replace a result panel, append a chat turn, flip a status pill — call it. The braille display only sees what hits the live region.
4. **Give every interactive control an `aria-label` (or visible text label).** Icon-only buttons fail braille immediately.
5. **Mark decorative emojis with `class="emoji-decor"` or `aria-hidden="true"`.** Braille mode hides them so the user doesn't read "grinning face symbol".
6. **Tab order must match reading order.** No `tabindex` values > 0.
7. **Touch targets ≥ 48×48 CSS px.** Same threshold the CONTEXT.md accessibility section already mandates.

If any of the seven fails, the page is not braille-ready and ships with a `TODO.md` entry against it.

---

## 3. Braille-friendly mode

When the user clicks **⠿ Braille mode** in the A11y bar:

| Change                              | Why                                                   |
|-------------------------------------|-------------------------------------------------------|
| Body class `chitti-braille` added   | CSS hooks for the rest of the changes                 |
| Decorative emojis hidden (`emoji-decor`, `aria-hidden`) | Screen readers stop announcing "speaker high volume"  |
| Body font raised to 18 px / 1.6 lh   | Helps low-vision users who pair vision with braille   |
| Multi-column grids collapse to one column | Linear reading order matches braille display flow |
| Focus ring thickened to 4 px gold    | Sighted assistant can see what the braille user is on |
| Spoken text strips emojis            | TTS no longer says "fire" / "rocket"                  |

The setting is persisted in `localStorage` under `chitti_a11y_v1`, so the user toggles it once across the entire Chitti family.

---

## 4. Per-Chitti audit checklist

Each Chitti's `TODO.md` should carry this checklist. Tick it before claiming braille-ready:

```
[ ] chitti_a11y.js included on every public page
[ ] Chitti.a11y.init({...}) called with the correct voiceRequired flag
[ ] One <h1>; <main>; <nav>; <footer> landmarks present
[ ] Every dynamic content swap calls Chitti.a11y.announce(text)
[ ] Every <button>/<a> with icon-only content has aria-label
[ ] Every <img> has alt; decorative ones use alt=""
[ ] Forms: every <input> has <label> or aria-labelledby
[ ] Charts/canvases have a text alternative (table or summary)
[ ] Tabindex audit: no value > 0 anywhere
[ ] Manual test: turn screen off, navigate with keyboard only, complete the primary user flow
[ ] BrailleBack manual test on Android (if APK exists)
```

---

## 5. Voice IN + Voice OUT for braille users

Deafblind users skip voice. **Blind-only** users still benefit from voice OUT, so:

- Voice prompts duplicate, never replace, the on-screen / on-display text.
- Every `Chitti.a11y.speak(text)` call should be **preceded** by an `announce(text)` so the same content hits the braille channel.
- A page may set `voiceRequired: true` (Vaani, Sales coach, MedUPI scan) but the page must still function with voice off — braille users will turn TTS off in their screen reader.

---

## 6. Provider-swappable voice (Bhashini today)

The frontend never names Bhashini. It hits `Chitti.a11y.VOICE_FACTORY_URL/api/voice/speak`. The Voice Factory backend currently routes to:

```
on_device → mock_bhashini → ai4bharat → bhashini_real → sarvam
```

Swapping Bhashini for any future provider (Sarvam → primary, AI4Bharat, on-device ONNX, a hypothetical IndicTTS-v2) is a backend supplier swap inside `chitti-voice-factory/backend/services/`. **No frontend code, no Chitti page, no braille audit changes.**

This is recorded as a hard architectural property in [MASTER_CONTEXT.md](MASTER_CONTEXT.md) §3.

---

## 7. Testing

| Tool                   | Where it runs                  | What it catches                            |
|------------------------|--------------------------------|--------------------------------------------|
| **axe DevTools**       | Chromium / Firefox extension   | Most static WCAG violations                |
| **NVDA + Braille Sim** | Windows                        | Linearised reading flow                    |
| **TalkBack + BrailleBack** | Android device              | Real refreshable display                   |
| **Manual screen-off**  | Any keyboard                   | "Can a deafblind user complete this flow?" |

Add a row to each Chitti's CHANGELOG.md when the manual screen-off test passes for a major flow.

---

## 8. What we will not do

- We will not write a custom braille translation library. The user's screen reader handles UEB / Bharati Braille — our job is to expose clean text to it.
- We will not ship a separate "braille-only" build. The same DOM serves sighted, low-vision, blind, and deafblind users.
- We will not auto-speak on page load. That bypasses the user's screen reader timing and is hostile to braille readers.

---

*Last updated 2026-05-12.*
