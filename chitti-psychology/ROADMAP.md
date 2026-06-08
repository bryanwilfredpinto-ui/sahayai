# ROADMAP — Chitti Psychology

> Priorities follow SAHAYAI_MASTER §8 + the Founder Rule (safety & dignity first).

## P0 — CEOS v1.0 (this build, 2026-06-07)

- [x] Full CEOS doc set (L0–L12) mirroring chitti-fashion.
- [x] Research folded in (17 net-new cited techniques + competitive analysis).
- [x] Deterministic engine `chitti_psychology_os_engine.js` — emotion-labeling,
      coping library, breathing/grounding, psychoeducation, SOP flows, **out-of-band
      crisis classifier + helpline routing** (zero LLM dependency).
- [x] Accessible page `chitti_psychology.html` — Vaani language dropdown
      (`chitti_lang.js` owns `#lang-select`), 4-user a11y, 5 frontend gates.
- [x] Engine gold-test `tools/psychology_os_engine_test.mjs` + visual cert
      `tools/cert_psychology_os.mjs`.

## P1 — Warm conversational layer (blocked on DeepSeek key)

- [ ] DeepSeek reflective-conversation enhancement via `chitti-vaani-api`, fenced by
      the deterministic crisis classifier (LLM never sees a flagged turn unsupervised).
- [ ] Multilingual crisis-lexicon expansion (per-language distress euphemisms) —
      HIGH-risk, Sire-reviewed.
- [ ] Voice-out for all 26 languages via Voice Factory.

## P2 — Reflection & memory

- [ ] Emotional Twin (on-device IndexedDB): communication style, stress triggers,
      confidence trend; plain-language weekly insight ("calmer on days you talked to
      family"), never charts-only.
- [ ] Reminiscence / life-story pack for seniors.
- [ ] Exam-stress, parenting, grief, postpartum packs as guided multi-technique flows.

## P3 — Community of care

- [ ] Swarm-learned coping wisdom (anonymised → ≥100 confirmations → HIGH-risk human
      review → push to skills/*.md). Locked decisions never learnable.
- [ ] Vernacular emotion lexicon co-built with users + Hall of Fame for translators.
- [ ] Family-cascade integration with the platform emergency protocol.

## Blocked / external

- **DeepSeek key** (Sire's unblock) — warm conversational layer.
- **Bhashini ULCA / community voices** — full 26-lang voice-out quality.
- **Real device + human-AT testing** — Sire's slot (iPhone/Android, screen reader, ISL).

## Never (locked, not roadmap items)

- ❌ Diagnosis / prescription / clinical assessment as verdict.
- ❌ "Therapy" branding or medical-device claims.
- ❌ Auto-dialling emergency services.
- ❌ Engagement/attachment optimisation.
