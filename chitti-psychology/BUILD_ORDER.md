# BUILD_ORDER — Chitti Psychology

> The sequenced plan. Safety-critical items first; nothing ships before its gate is
> green. Mirrors the Chitti Fashion / Legal-OS build discipline.

## Doctrine recap

**Rules are the product; the LLM enhances.** Psychoeducation, every coping exercise,
and **all crisis handling** are deterministic (zero LLM). The LLM is fenced to warm
reflection behind the out-of-band crisis classifier. (Why: the entire AI-psychology
category's failures trace to LLMs in the safety path — see RESEARCH_BEST_APPS.md.)

## BO0 — CEOS docs ✅ (this build)
Full L0–L12 doc set + research folded in (17 cited techniques + competitive analysis).

## BO1 — Deterministic engine `chitti_psychology_os_engine.js` ✅
UMD (window + module.exports). Functions:
1. `detectCrisis(text, history)` — **out-of-band classifier** (multilingual lexicon,
   indirect cues, multi-turn). Returns `{level, signals, action}`. **Safety-critical.**
2. `mirrorEmotion(text)` — possible emotions + reflective question (never asserts).
3. `copingFor(feeling)` — coping-skills-by-feeling library.
4. `breathing(kind)` / `grounding()` — R1/R2/R3 exercise scripts.
5. `psychoEd(topic)` — psychoeducation cards.
6. `nvcCompose(parts)` — R8 communication composer.
7. `relationshipCoach(input)` — F2 reflect→need→suggestion→repair.
8. `parentingGuide(age, behaviour)` — F3 age-specific.
9. `analyzeCommunication(text)` — F4 clarity/empathy/aggression/confidence.
10. `woop(parts)` / `ifThen(parts)` — R13 goal cards.
11. `helplines(lang)` — maintained config, in-language.
12. `a11ySupport(feature)` — capability flags (all true) for the accessibility contract.
13. `respond(text, ctx)` — orchestrator: crisis-first, then mirror+coping, disclaimer.

## BO2 — Engine gold test `tools/psychology_os_engine_test.mjs` ✅
- Crisis recall ≥99% on `crisis_cases.json`; false-positive 0 on controls.
- Safety assertions: no diagnosis/means/feelings/promise in any output.
- Emotion overlap >90% on `emotion_cases.json`.
- Helpline accuracy: Tele-MANAS 14416 present, exact config match.
- a11y: all features support all 5 user modes.
- **A failing crisis test is a P0 block.**

## BO3 — Accessible page `chitti_psychology.html` ✅
- `chitti_lang.js` owns `#lang-select` (Vaani-canonical 26-lang dropdown) — **the user's
  explicit requirement** that the language dropdown works for blind/deaf/mute/illiterate.
- `chitti_a11y.js` (Disability Profile, ISL, voice, braille), `feedback-widget.js`
  (per-response 🔊/🤖/👍/👎 on every `data-chitti-response` box), `chitti_features.js`
  (Feature Discovery reads FEATURES.md).
- Cards: Emotional Mirror · Calm Me Now · Coping by feeling · Understand a feeling ·
  Say it without a fight · Relationship · Parenting · Journal · **Crisis (always visible)**.
- Hard disclosure banner + sticky crisis button.

## BO4 — Controller `chitti_psychology_app.js` + i18n `chitti_psychology_i18n.js` ✅
Wires UI → engine (deterministic, no network). Crisis path rendered with Tele-MANAS
button. i18n bag for the 9 primary languages; engine output i18n via substrate.

## BO5 — Visual cert `tools/cert_psychology_os.mjs` ✅
375px render cert + screenshot `tools/cert_screenshots/chitti_psychology_375.png`;
asserts crisis card + Tele-MANAS button + lang dropdown present.

## BO6 — Wire into platform (P1)
- Add to Vaani intent router (psychology intents → this engine).
- Add row to CHITTI_SOP.md + QUALITY_STATUS.md.
- DeepSeek warm layer via `chitti-vaani-api` (blocked on key).

## Gate order (hard)
BO1+BO2 green (esp. crisis) → BO3+BO4 → BO5 green → commit. No step skips its gate.
