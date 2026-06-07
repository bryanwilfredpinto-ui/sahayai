🎖️ World Class Chitti Legal OS — Commando Discipline. Zero Excuses.

# ARCHITECTURE — Chitti Legal OS

## Doctrine: rules are the product, the LLM is an enhancement

```
            ┌──────────────────────────────────────────────────────────┐
  USER ───► │  chitti_legal_os.html  (accessible UI: 8 tabs, 12 cards)  │
 (voice/    │   • Vaani-canonical #lang-select  (chitti_lang.js, 26 lg) │
  tap/      │   • chitti_a11y.js substrate (ISL, disability profile,    │
  type)     │     feedback-widget, features, camera, bottom-nav)        │
            │   • controller wires UI → engine, renders a11y result box │
            └───────────────┬──────────────────────────────────────────┘
                            │ (no legal conclusion is produced in the page)
                            ▼
            ┌──────────────────────────────────────────────────────────┐
            │  chitti_legal_os_engine.js  (DETERMINISTIC, dependency-   │
            │  free, node-testable). VERSIONED rule tables → L1…L10.    │
            │  Every result: { confidence, risks[], sources[] }.        │
            │  Works with the internet DOWN and DeepSeek 429.           │
            └───────────────┬──────────────────────────────────────────┘
                            │ (enhancement only, never a dependency)
                            ▼
            ┌──────────────────────────────────────────────────────────┐
            │  DeepSeek (via Vaani routing, BO11) — PHRASING ONLY:       │
            │  translate/explain the engine's output in the user's      │
            │  language; OCR a scanned notice. Never computes a deadline.│
            │  Server-enforced "not legal advice" disclaimer.            │
            └──────────────────────────────────────────────────────────┘
```

## Layers

1. **Presentation** — `chitti_legal_os.html`. Accessibility-first (BO1–BO5): skip-link,
   single `<h1>`, `role=tab`/`tabpanel`, `aria-live` result hosts, ≥44px targets,
   symbol+word status (never colour-only), reduced-motion/contrast/forced-colors, ≥17px base.
2. **Language** — `chitti_lang.js` owns `#lang-select` (Vaani-canonical, 26 languages).
   It snapshots text nodes (`_chittiOrig`), sets `html[lang]`, persists `chitti_lang`,
   auto-translates static text. **The page never hand-rolls language.** ([SAHAYAI_MASTER §2 row 1](../../SAHAYAI_MASTER.md)).
3. **Accessibility substrate** — `chitti_a11y.js` auto-injects ISL, the disability
   profile, the per-response feedback widget, feature discovery, camera and bottom-nav.
   Every page that loads it inherits the five frontend gates.
4. **Deterministic engine** — `chitti_legal_os_engine.js`. The product. Versioned
   `RULES` tables (limitation, cheque138, consumer thresholds, helplines) + knowledge
   bases (`RIGHTS`, `NOTICES`, `CHECKLISTS`, `CASE_STAGES`, `AID_CATEGORIES`, scam/contract
   flags). Pure functions; node-testable; UTC date math (timezone-stable deadlines).
5. **LLM enhancement (BO11)** — DeepSeek, reached only via Vaani routing, for phrasing
   the engine's output in the user's language and OCR of scanned notices. Honest stub
   (`unavailable`) on 429/no-key — never fabricates a deadline or a section.

## Data & privacy

- **Legal Twin is on-device** (`localStorage` `chitti_legal_os_twin_v1`). Nothing leaves
  the phone by default. `twin.forget()` wipes everything ("Chitti forget").
- Server-side (when wired): per-Chitti Turso via the direct-HTTPS shim ([SAHAYAI_MASTER §2](../../SAHAYAI_MASTER.md)),
  feedback + quality only, never the user's documents.
- See [guardrails/privacy.md](guardrails/privacy.md).

## Why deterministic for law

A limitation date or a forum jurisdiction is the legal equivalent of "money math": it
must be exact and reproducible, and it must work when the network is down. An LLM that
*sometimes* gets a section number right is unacceptable for a HIGH-risk product. So the
engine computes; the LLM only explains.

## Backend (Vaani-sole-interface)

Per [SAHAYAI_MASTER §2 row 1](../../SAHAYAI_MASTER.md), the user-canonical surface is
Vaani; `chitti_legal_os.html` is the internal service + dev/debug surface. The existing
`chitti-legal/backend/` (Flask + DeepSeek + server-enforced disclaimer) provides the
LLM-explain path; the deterministic engine is shipped client-side so it works offline.

---
> **World Class Chitti Legal OS — Commando Discipline. Zero Excuses.**
