# CNOS — Mute User Journey

> *"Every input is text-first. Voice optional via 🎙️ mic icon."* — Persona P10

This is the end-to-end journey for a mute reader (Persona P10). The governing rule is absolute: **voice is never required.** Every action — read, save, cancel, switch category, give feedback, ask Chitti — is completable by tap and type alone. CNOS inherits the mute-user contract from `feedback-widget.js` (type-first feedback, 🎙️ optional); this doc tracks how that contract holds on the News surface.

---

## The promise

A mute reader completes a full CNOS session — onboarding, reading, fact-checking, saving, cancelling, and giving feedback — **using only taps and typed text.** The 🎙️ mic icon exists everywhere it makes sense, but it is always optional and never blocks a flow.

---

## Numbered journey

1. **Onboarding is tap-first.** Language + state selection is a tappable picker. Nothing requires the reader to speak. (A blind+mute reader uses a screen reader to drive the same taps.)
2. **Reading is tap-only.** Open a card, scroll, read body — all touch. The 🔊 read-aloud is available but never mandatory.
3. **Category switch is a tap.** All 6 category tabs switch on tap. No voice command is ever required to change category, state, or language.
4. **Save (Read Later) is tap-only.** The 🔖 Read Later action is a single tap. No voice confirmation required.
5. **Cancel (Cancelled folder) is tap-only.** Dismissing a story to the Cancelled folder is a tap; restoring it is a tap. Per Golden Rule the action is confirmed — but confirmation is also a tap, never a spoken "haan".
6. **Ask Chitti is text-first.** The Ask box accepts typed questions. The 🎙️ mic is an optional accelerator — typing always works end-to-end.
7. **Feedback is text-first.** 👍/👎 are taps; the ✏️ feedback panel accepts typed text and submits on tap. The 🎙️ "speak feedback" path is optional.
8. **Fact-check trigger is a tap.** Requesting a verdict (🤖 / fact-check) is a tap; the verdict renders as readable text.
9. **No voice-gated confirmations.** No CNOS confirmation ever *requires* a spoken yes. Where the Golden Rule asks "shall I do X?", a tap on ✓ satisfies it.
10. **Cross-device parity.** The mute-first flows behave identically whether the reader uses touch on Android or keyboard via a screen reader.

---

## Element-by-element contract

| Surface action | Mute-user path | Voice status | Source |
|---|---|---|---|
| Select language / state | Tap picker | optional 🎙️ | `chitti_a11y.js` |
| Read article | Tap card / scroll | optional 🔊 | News page markup |
| Switch category | Tap tab | none needed | News page markup |
| Save (Read Later) | Tap 🔖 | none needed | News page markup |
| Cancel story | Tap → tap ✓ confirm | none needed | News page markup |
| Ask Chitti | Type → tap send | optional 🎙️ | News page markup |
| Feedback 👍/👎 | Tap | none needed | `feedback-widget.js` |
| Feedback comment | Type → tap submit | optional 🎙️ | `feedback-widget.js` |
| Fact-check | Tap 🤖 | none needed | News page markup |

---

## What works today

| Capability | Status |
|---|---|
| Tap-first onboarding | ✅ live |
| Tap-only reading + scroll | ✅ live |
| Tap-only category / state / lang switch | ✅ live |
| Tap-only Read Later save | ✅ live |
| Tap-only Cancel + restore | ✅ live (4/4 cert PASS) |
| Type-first Ask Chitti | ✅ live |
| Type-first feedback (🎙️ optional) | ✅ live |
| Tap-only fact-check trigger | ✅ live |
| No voice-gated confirmation anywhere | ✅ verified |

---

## Gaps (honest)

| Gap | Plan |
|---|---|
| 219 header chips at 34 px | Sub-48 px taps hurt mute users with limited mobility too — global header restyle to ≥48 px, out of news-only scope |
| Typed-feedback character limit polish | Inherited from `feedback-widget.js`; news-specific UX audit pending |
| Keyboard-only nav order audit | Tab order works; formal cert of focus order across all 6 tabs is TODO |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
