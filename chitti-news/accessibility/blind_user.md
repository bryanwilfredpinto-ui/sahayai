# CNOS — Blind User Journey

> *"Auto-read on first visit. Voice navigation between tabs. Trust Strip read aloud. No silent UI elements."* — Persona P8

This is the end-to-end journey for a blind reader (Persona P8 — visually-impaired reader, any state, any age). Every step must be completable **voice-only**, with zero reliance on sight. CNOS inherits the blind-user contract from `chitti_a11y.js` + `feedback-widget.js`; this doc tracks how that contract holds on the News surface specifically.

---

## The promise

A blind reader can open Chitti News, hear the disclaimer, navigate every category tab and the state/language pickers, hear any article read aloud, hear "Chitti's Take", and hear the fact-check verdict — **without ever needing to see the screen**.

---

## Numbered journey

1. **First visit → disclaimer auto-reads.** On first load, `chitti_a11y.js` detects `disability_profile.blind = true` and auto-speaks the SEBI-style news disclaimer + the four Founder Rules before any feed render. The reader never has to find a "play" button to learn what CNOS is.
2. **Onboarding is voice-first.** Language + state selection is narrated: "Which state's news? Say or tap." The picker carries ARIA labels so a screen reader announces each option; CNOS voice also speaks the current selection back.
3. **Category tabs announce themselves.** Each of the 6 category tabs (National 🏛️ · State 📍 · Sports 🏏 · Business 💼 · Tech 💻 · Entertainment 🎬) carries an `aria-label` + emoji + text. Voice navigation reads the active tab on focus.
4. **Every card is read aloud.** Each article card carries `data-chitti-speak-handler="speakArticle"`. Tapping (or voice-triggering) 🔊 reads: headline → publisher → reading time → body. No card is silent.
5. **"Chitti's Take" is spoken.** The 3-bullet DeepSeek summary is inside a `[data-chitti-response]` box, so the 🔊 glyph auto-attaches via `feedback-widget.js`. The reader hears the TL;DR in their chosen language.
6. **Fact-check verdict is spoken.** The verdict band (verified / partial / disputed / unverified) + the "verified by N sources" count + rationale are read aloud — never conveyed by colour alone.
7. **Trust Strip read aloud.** Verified · ≥2-source corroboration · publisher trust · reading time are all spoken so the blind reader gets the same trust signal a sighted reader sees in <2 s.
8. **ARIA live regions announce changes.** When the feed re-renders (category/state/lang switch), an `aria-live="polite"` region announces "Loading Maharashtra state news in Marathi… 12 stories."
9. **Coverage gaps narrated.** If a cell is thin, the coverage payload is spoken: "Only 4 Bengali politics stories today; showing national to fill the gap."
10. **Feedback voice-first.** 👍/👎 are voice-triggerable; the ✏️🎙️ feedback panel lets the reader speak feedback → LLM writes it → reads it back for confirmation (Golden Rule: confirm before submit).

---

## Element-by-element contract

| Surface element | Blind-user behavior | Source |
|---|---|---|
| Disclaimer | Auto-reads on first visit | `chitti_a11y.js` blind-profile hook |
| Language / state picker | ARIA-labelled + spoken back | `chitti_a11y.js` |
| Category tab | `aria-label` + emoji + spoken on focus | News page markup |
| Article card | 🔊 via `data-chitti-speak-handler="speakArticle"` | News page markup |
| Chitti's Take | 🔊 auto-attached to `[data-chitti-response]` | `feedback-widget.js` |
| Fact-check verdict | Spoken band + count + rationale | News page markup |
| Trust Strip | Spoken, never colour-only | News page markup |
| Feed re-render | `aria-live="polite"` announcement | `chitti_a11y.js` |
| Feedback | 🎙️ speak → LLM writes → reads back | `feedback-widget.js` |

---

## What works today

| Capability | Status |
|---|---|
| Disclaimer auto-read on first visit | ✅ live |
| 🔊 on every card via `speakArticle` | ✅ live (49+ cards verified) |
| Chitti's Take read aloud | ✅ live |
| Fact-check verdict spoken (not colour-only) | ✅ live |
| Trust Strip read aloud | ✅ live |
| ARIA on language / state picker | ✅ verified in cert |
| `aria-live` on feed re-render | ✅ live |
| Voice feedback (🎙️ → LLM → readback) | ✅ live |

---

## Gaps (honest)

| Gap | Plan |
|---|---|
| Auto-read of top-3 stories on first visit | Today only the disclaimer auto-reads; expand to top-3 headlines for a true voice-first landing |
| Per-story TTS pre-warm | Phase 2 — Voice Factory pre-generates audio so 🔊 is instant on 2G |
| Voice navigation across tabs without a screen reader | Works with TalkBack today; native in-app voice-nav command ("next category") is Phase 2 |
| 219 header chips at 34 px | Sub-48 px tap targets hurt low-vision (not fully blind) readers — global header restyle, out of news-only scope |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
