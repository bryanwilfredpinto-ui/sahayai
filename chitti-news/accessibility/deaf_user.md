# CNOS — Deaf User Journey

> *"Plain text version of every audio element. ISL panel for any explainer video. Reading time visible."* — Persona P9

This is the end-to-end journey for a deaf reader (Persona P9). The governing rule is simple and absolute: **CNOS is never audio-only.** Everything a hearing reader can hear, a deaf reader can read. CNOS inherits the deaf-user contract from `chitti_a11y.js` (ISL panel auto-on) + `chitti_isl.js`; this doc tracks how that contract holds on the News surface.

---

## The promise

A deaf reader gets the **full** CNOS experience in text — every headline, every "Chitti's Take", every fact-check verdict, the entire Trust Strip — and, when `disability_profile.isl = true`, an ISL (Indian Sign Language) panel renders alongside content. No information lives only in sound.

---

## Numbered journey

1. **Text-first everything.** The feed is text-native. Headlines, body, Chitti's Take, and verdicts are all rendered as readable text — audio (🔊) is an *option*, never a *requirement*.
2. **ISL panel auto-on.** On first load, `chitti_a11y.js` reads `disability_profile.isl`. If `true`, `chitti_isl.js` mounts the ISL panel automatically — the reader never has to toggle it on.
3. **ISL per response box.** Each `[data-chitti-response]` box (Chitti's Take, verdict explainer) can drive a per-response ISL animation, so the deaf reader gets sign-language for the parts that matter most.
4. **Trust Strip readable without audio.** Verified · ≥2-source · publisher trust · reading time are rendered as text + pills + counts. The trust signal is fully legible silently — never spoken-only.
5. **Reading time visible.** Every card shows reading time as a number ("4 min"), so a deaf reader plans their session exactly like a hearing reader.
6. **Captions + large-text for any audio.** Any audio element (TTS playback, future explainer clips) carries a synchronized caption track + a large-text transcript. No audio ships without its text twin.
7. **Fact-check verdict shown, not just spoken.** The verdict band, the "verified by N sources" count, and the rationale are all on-screen text + colour-coded pills (never colour-only — text label always present).
8. **Category tabs are text + emoji.** All 6 tabs carry visible text labels plus the emoji glyph; no tab relies on an audio cue.
9. **Feedback is type-first.** 👍/👎 are taps; the ✏️ feedback panel accepts typed text. The 🎙️ mic is optional and never blocks submission.
10. **Coverage gaps shown in text.** The coverage payload renders as a visible banner ("Only 4 Bengali politics stories today") — not narrated-only.

---

## Element-by-element contract

| Surface element | Deaf-user behavior | Source |
|---|---|---|
| Feed body | Text-native, audio optional | News page markup |
| ISL panel | Auto-on when `isl: true` | `chitti_isl.js` via `chitti_a11y.js` |
| Per-response ISL | Drives off `[data-chitti-response]` | `chitti_isl.js` |
| Trust Strip | Text + pills + counts, no audio dependency | News page markup |
| Reading time | Visible number on every card | News page markup |
| Any audio | Caption track + large-text transcript | `chitti_a11y.js` |
| Fact-check verdict | On-screen band + count + rationale text | News page markup |
| Category tabs | Visible text + emoji | News page markup |
| Feedback | Type-first; 🎙️ optional | `feedback-widget.js` |

---

## What works today

| Capability | Status |
|---|---|
| Text-native feed (no audio required) | ✅ live |
| ISL panel auto-on when `isl: true` | ✅ live (Phase 1 dictionary + per-response panel) |
| Trust Strip readable silently | ✅ live |
| Reading time on every card | ✅ live |
| Fact-check verdict shown as text + pill | ✅ live |
| Category tabs text + emoji | ✅ live |
| Type-first feedback | ✅ live |
| Coverage gaps shown as text banner | ✅ live |

---

## Gaps (honest)

| Gap | Plan |
|---|---|
| ISL panel per-card coverage report | Sample 100 cards, confirm ISL panel renders per card (cert TODO) |
| ISL animation accuracy | Phase 1 uses honest placeholder animations; never claims accuracy. Phase 2 camera + Phase 3 community-donated signs |
| Captions on future explainer video | No explainer video ships today; caption pipeline must precede any video feature |
| Large-text mode polish | Inherited from `chitti_a11y.js`; news-specific large-text audit pending |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
