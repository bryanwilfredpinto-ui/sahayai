# CNOS — Accessibility Eval

> *"A+ four-user contract on every card, every page. No green without it."*

CNOS serves Blind, Deaf, Mute and Illiterate readers as first-class users, in 26
languages. This eval certifies that every news card and every page meets the
accessibility contract *before* it ships. Per SAHAYAI_MASTER §7, no page ships
without all five frontend gates.

---

## The card contract — 5 mandatory elements + lang selector

Every single news card MUST carry, via `feedback-widget.js`:

| Element | Purpose | User served |
|---|---|---|
| 🔊 | speak this card aloud (TTS in user's language) | Blind, Illiterate |
| 🤖 | "Chitti's Take" — 3-bullet summary in user's language | all |
| 👍 | thumbs-up → `quality_feedback` | all |
| 👎 | thumbs-down (+ optional correction) → `quality_feedback` | all |
| ✏️🎙️ | type **or** voice a correction (Mute-safe + Illiterate-safe) | Mute, Illiterate |

Plus the page-level **🌐 language selector** (26 languages) injected by the
shared `chitti_a11y.js` substrate.

---

## Four-user contract

| User | What CNOS guarantees | Verified by |
|---|---|---|
| **Blind** | every card 🔊-readable; aria-live region; feed reads top-down | axe-core + cert TTS hook |
| **Deaf** | no audio-only info; verdict + summary always in text | DOM cert (text present per card) |
| **Mute** | every feedback path has a non-voice route (✏️ type) | cert (✏️🎙️ both present) |
| **Illiterate** | every text path has a voice route (🔊) + symbol cues; never colour-only | cert (🔊 + symbol present) |

---

## Pass bars

| Check | Bar | Source / harness |
|---|---|---|
| 5 mandatory elements per card | 100% of cards (≥ 5 elements) | `cert_chitti_news_v2.mjs` |
| 🌐 lang selector present | present on every page | `chitti_a11y.js` injection check |
| 26-language render | all 26 render without layout break at 375px | `cert_news_omnibus.mjs` (TO BUILD) |
| axe-core WCAG 2.1 AA | **0 serious / 0 critical** violations | axe-core in cert harness |
| Tap targets | **≥ 44 × 44 px** | cert tap-target measurement |
| Colour independence | no colour-only meaning (verdict carries text + icon) | cert + manual |
| Cancelled-story respect | cancelled card never re-appears | `cert_cancelled_story.mjs` |

---

## Cert harnesses

| Harness | Scope | Status |
|---|---|---|
| [`cert_chitti_news_v2.mjs`](../../tools/cert_chitti_news_v2.mjs) | per-card elements, Trust Strip, 375px mobile cert | ✅ 13/14 PASS |
| `tools/cert_news_omnibus.mjs` | 26-lang × axe × multi-viewport omnibus | ❌ TO BUILD |
| [`cert_cancelled_story.mjs`](../../tools/cert_cancelled_story.mjs) | cancelled-story respect | ✅ 4/4 PASS |

---

## Current status — honest

| Gate | Status |
|---|---|
| 5 mandatory card elements | ✅ inherited via `feedback-widget.js` (13/14 cert PASS) |
| 🌐 lang selector | ✅ injected by `chitti_a11y.js` substrate |
| 26-language render | ⚠️ en/hi verified live; regional langs stubbed for v1.1; omnibus harness TO BUILD |
| axe-core WCAG 2.1 AA | ⚠️ run via v2 cert; full omnibus axe sweep pending |
| Tap targets ≥ 44px | ❌ **KNOWN DEBT** — substrate header chips currently < 44px; card-level controls pass |
| Colour independence | ✅ verdict = text + icon, never colour-only |
| Cancelled-story respect | ✅ 4/4 PASS |

**Known debt to clear before A+ green:** raise substrate header chip tap targets
to ≥ 44px and ship `cert_news_omnibus.mjs` for the full 26-lang × axe sweep.
Until both land, accessibility is YELLOW, not green — we will not claim A+ early.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
