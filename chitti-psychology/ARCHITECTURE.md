# ARCHITECTURE — Chitti Psychology

> How the system is built. Doctrine: **rules are the product, the LLM enhances** —
> mirrors `chitti_fashion_engine.js` and `chitti_legal_os_engine.js`.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Chitti Vaani (sole user surface) — intent router            │
│     "I feel..." / "my teen won't study" / "calm me down"     │
└───────────────┬─────────────────────────────────────────────┘
                │ routes to →
┌───────────────▼─────────────────────────────────────────────┐
│  chitti_psychology.html  (dev/debug + parity page)           │
│   • chitti_lang.js  → owns #lang-select (26-lang Vaani)       │
│   • chitti_a11y.js  → Disability Profile, ISL, voice, braille │
│   • feedback-widget.js → per-response 🔊/🤖/👍/👎 on every box │
│   • chitti_features.js → Feature Discovery (reads FEATURES.md)│
│   • chitti_psychology_app.js → controller                    │
└───────────────┬─────────────────────────────────────────────┘
                │ calls (ZERO LLM dependency) →
┌───────────────▼─────────────────────────────────────────────┐
│  chitti_psychology_os_engine.js  (DETERMINISTIC BRAIN)       │
│   1 detectCrisis()      ← OUT-OF-BAND classifier (safety)    │
│   2 mirrorEmotion()     ← possible emotions + reflection     │
│   3 copingFor(feeling)  ← coping-skills-by-feeling library   │
│   4 breathing()/ground()← R1/R2/R3 exercise scripts          │
│   5 psychoEd(topic)     ← psychoeducation cards              │
│   6 nvcCompose()        ← R8 communication composer          │
│   7 relationshipCoach() ← F2 reflect→need→suggestion→repair  │
│   8 parentingGuide()    ← F3 age-specific                    │
│   9 analyzeCommunication()← F4 clarity/empathy/aggression    │
│  10 woop()/ifThen()     ← R13 goal cards                     │
│  11 helplines(lang)     ← maintained config, in-language     │
│  12 confidence()+explain← WHY, deterministically             │
└───────────────┬─────────────────────────────────────────────┘
                │ ONLY warm reflection, fenced by detectCrisis() →
┌───────────────▼─────────────────────────────────────────────┐
│  DeepSeek via chitti-vaani-api  (OPTIONAL enhancement, P1)   │
│   • never sees a crisis-flagged turn unsupervised            │
│   • server-enforced disclaimer + anti-sycophancy refusals    │
└─────────────────────────────────────────────────────────────┘
```

## The out-of-band crisis classifier (safety-critical)

`detectCrisis(text, history)` runs **first on every turn**, independent of any LLM:
- multilingual + indirect-cue lexicon (per-language euphemisms);
- multi-turn cumulative risk (not per-message), lower threshold once elevated;
- returns `{ level: 0|1|2|3, signals[], action }`. Level 3 → crisis SOP immediately,
  bypassing all other agents (Safety Agent supreme).

Because it is deterministic, it is testable (`tools/psychology_os_engine_test.mjs`),
auditable, and **cannot be jailbroken** the way an LLM can. The LLM is never on the
safety path.

## Swarm (9 agents)

Every reflective response passes through the [swarm/](swarm/): Emotion → Behavior →
Communication → Relationship → Parenting → Leadership → Accessibility → Trust →
**Safety (supreme, can veto)**. The shown response is the synthesised verdict.

## Data & privacy

- Journals, mood history, Emotional Twin → **on-device IndexedDB**. Only short text
  reaches any model. "Chitti forget" wipes all (tombstone for honest counts). DPDP 2023.
- Helplines, psychoeducation cards, coping library, crisis lexicon → versioned config
  bundled with the engine (no per-user data).

## Backend

v1.0 is **frontend-deterministic** (no dedicated backend required to be safe). The P1
warm layer reuses the shared `chitti-vaani-api` (`POST /api/vaani/ask`) — DeepSeek
only, server-enforced disclaimer, no new secrets. If a standalone backend is later
added it mirrors the chitti-government layout (Flask + Turso via `turso_http.py`).

## Rollback

The page + engine are static assets versioned by `?v=` query string. Rollback = point
the `<script src>` back to the prior `?v=`. The deterministic engine has a gold-test
gate (`tools/psychology_os_engine_test.mjs`) that must be 100% green before any new
`?v=` ships — a failing crisis test is a **P0 block**, never a warning.
