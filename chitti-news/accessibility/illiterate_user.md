# CNOS — Illiterate User Journey

> *"Voice-first onboarding. Emoji glyphs on every tab. Numbers + colour-coded pills for verified/unverified — never colour-only."* — Persona P11

This is the end-to-end journey for an illiterate reader (Persona P11 — rural, any age; and Persona P5 Ramesh, the Vidarbha farmer). The governing rule is absolute: **no reading is required, end to end.** Every label is spoken; every category is an emoji glyph; every folder is a picture. CNOS inherits the illiterate-user contract from `chitti_a11y.js` (voice-first onboarding) + `feedback-widget.js`; this doc tracks how that contract holds on the News surface.

---

## The promise

An illiterate reader opens Chitti News, hears what each thing is, taps a picture to choose a category, hears the news read aloud in their language, hears whether a story is verified, and saves or dismisses stories using pictures — **without reading a single word.**

---

## Numbered journey

1. **Voice-first onboarding.** On first load, CNOS speaks: "Namaste. Which state's news? Tap your state. Which language? Tap or say." No written instruction is required to begin.
2. **Emoji glyph on every category tab.** Each of the 6 tabs leads with a picture: National 🏛️ · State 📍 · Sports 🏏 · Business 💼 · Tech 💻 · Entertainment 🎬. The reader recognizes the picture, not the word.
3. **Every label is spoken.** On focus or tap, CNOS speaks the label of any control — category name, picker option, folder name. Nothing is silent text-only.
4. **News is read aloud.** Each card's 🔊 reads headline + body in the reader's language via `speakArticle`. The reader listens; they never have to decode text.
5. **Chitti's Take is spoken.** The 3-bullet summary is read aloud, so the reader gets the gist in <90 seconds without reading.
6. **Verified status is spoken + pictured.** The fact-check verdict is read aloud ("This story is verified by 3 sources") AND shown as a coloured pill with an icon + number — never colour-only, so it survives both blindness-to-text and colour-blindness.
7. **Coverage gap narrated by voice.** If a cell is thin, CNOS speaks: "Only a few Marathi farming stories today; here is national news too." The reader is never left confused by an empty screen.
8. **Read Later is a picture.** The save folder uses a 🔖 picture; its contents are spoken back ("You saved 3 stories"). No reading required to manage it.
9. **Cancelled is a picture.** The dismiss folder uses a picture; restore is a tap on a picture. The reader curates their feed entirely by icon + voice.
10. **Feedback by voice or tap-picture.** 👍/👎 are pictures; the ✏️🎙️ panel lets the reader speak feedback → LLM writes → reads it back for confirmation. No typing or reading required.

---

## Element-by-element contract

| Surface element | Illiterate-user behavior | Source |
|---|---|---|
| Onboarding | Voice-first; spoken prompts | `chitti_a11y.js` |
| Category tabs | Emoji glyph leads each tab | News page markup |
| Any label | Spoken on focus / tap | `chitti_a11y.js` |
| Article card | 🔊 reads headline + body via `speakArticle` | News page markup |
| Chitti's Take | Read aloud | `feedback-widget.js` |
| Verified status | Spoken + pill + icon + number (never colour-only) | News page markup |
| Coverage gap | Narrated by voice | News page markup |
| Read Later | 🔖 picture; contents spoken | News page markup |
| Cancelled | Picture; restore by tap-picture | News page markup |
| Feedback | Picture 👍/👎; 🎙️ speak → LLM → readback | `feedback-widget.js` |

---

## What works today

| Capability | Status |
|---|---|
| Voice-first onboarding | ✅ live |
| Emoji glyph on every category tab | ✅ live |
| Spoken labels on controls | ✅ live |
| 🔊 reads headline + body per card | ✅ live |
| Chitti's Take read aloud | ✅ live |
| Verified status spoken + pictured (never colour-only) | ✅ live |
| Coverage gap narrated | ✅ live |
| Read Later / Cancelled iconography | ✅ live |
| Voice/picture feedback (🎙️ → LLM → readback) | ✅ live |

---

## Gaps (honest)

| Gap | Plan |
|---|---|
| Auto-read of top-3 stories on first visit | Today only the disclaimer auto-reads; expand so an illiterate reader lands straight into spoken news |
| 2G voice latency (Ramesh, P5) | Per-story TTS pre-warm (Phase 2) so 🔊 is instant on entry-Android 2G |
| Fully icon-driven settings | Some settings still show text labels (spoken, but not yet pictured) — picture-first settings audit pending |
| Number-only trust indicators audit | Confirm every verified/unverified state carries a number + icon, not colour alone, across 100 cards |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
