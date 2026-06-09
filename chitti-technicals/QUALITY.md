🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# QUALITY — the bar, and who we inherit it from

> Level: Quality. Subordinate to [CONSTITUTION.md](CONSTITUTION.md). This file states the **quality targets** (the ≥ bar) and the **inherited gates** (platform 5-frontend-gate + CTO 8-gate). It does **not** claim any target is met — see [evals/RESULTS.md](evals/RESULTS.md) and [CERTIFICATION.md](CERTIFICATION.md) for the honest scoreboard (all 🔵 PENDING).

---

## The quality bar (targets — stated, not yet achieved)

| Dimension | Target (≥) | Proof harness | Status |
|---|---|---|---|
| Indicator accuracy | **100% deterministic** | `tools/test_technical_engine.mjs` | 🔵 PENDING |
| Confluence accuracy | **100% deterministic** | `tools/test_confluence.mjs` | 🔵 PENDING |
| Accessibility | **100% · axe-core 0 serious/critical** (9 archetypes × 5 devices) | `tools/test_accessibility.mjs` · `tools/cert_chitti_technical_ai.mjs` | 🔵 PENDING |
| Hallucination | **< 1% · 0 fabricated accuracy %** | `tools/cert_chitti_technical_ai.mjs` | 🔵 PENDING |
| Safety violations | **0** (stop-loss · crisis · spiral · NOT-SEBI) | `tools/cert_chitti_technical_ai.mjs` | 🔵 PENDING |
| Tip Shield | **0 misses on gold · 0 false positives** | `tools/test_tip_shield.mjs` | 🔵 PENDING |
| Languages | **26 / 26 · no Hinglish · EN proper-nouns** | `tools/test_languages.mjs` | 🔵 PENDING |
| Journals + AI insight | **deterministic** | `tools/test_journals.mjs` | 🔵 PENDING |

> These are the only hard targets we may **state**. None is **claimed achieved** until its harness emits the number and a 375px screenshot is saved.

## Inherited gate 1 — Platform 5 frontend gates (no page ships without all five)

Per SAHAYAI_MASTER §7 and [frontend_quality_gates_locked], every Chitti page is audited on five gates. Chitti Technicals inherits them via substrate (`chitti_a11y.js` auto-injection):

| # | Gate | Substrate | Status |
|---|---|---|---|
| 1 | `feedback-widget.js` + `data-chitti-response` on every box | feedback-widget.js | 🔵 PENDING |
| 2 | `chitti_a11y.js` injected | chitti_a11y.js | 🔵 PENDING |
| 3 | User Disability Profile prompt (first visit) | chitti_a11y.js | 🔵 PENDING |
| 4 | Language auto-detect + `#lang-select` re-render | chitti_lang.js | 🔵 PENDING |
| 5 | ISL plugin | chitti_isl.js | 🔵 PENDING |

## Inherited gate 2 — CTO 8-gate (every feature, before "done")

Per [eight_gates_done_definition], every feature passes 8 gates before "done":

1. 👁️ Blind — verdict 100% recoverable with screen off.
2. 🦻 Deaf — verdict 100% recoverable with sound off.
3. 🤫 Mute — full flow, zero voice.
4. 📖 Illiterate — usable with zero reading.
5. Every response box carries the per-response widget.
6. Renders in all (26) languages.
7. Usable at 375px width.
8. All tap targets ≥ 48×48px.

| Gate | Status |
|---|---|
| 8-gate (all 8) | 🔵 PENDING |

## Visual-cert rule (locked)

Cert validates **rendered output** — canvas pixels, animation frames over time, post-click state — never just DOM existence ([cto_must_visual_cert]). Every cert check writes a **375px screenshot** to `tools/cert_screenshots/` on **all 5 devices** (Desktop 1920×1080 · Laptop 1366×768 · iPad · iPhone · Android) before any GREEN ([cto_visual_screenshot_mandatory]).

## Where quality is proven

- Evals: [EVALS.md](EVALS.md) → [evals/RESULTS.md](evals/RESULTS.md)
- Observability: [OBSERVABILITY.md](OBSERVABILITY.md)
- The explicit gate checklist: [QUALITY_GATES.md](QUALITY_GATES.md)
- The cert report: [CERTIFICATION.md](CERTIFICATION.md) (🔵 PENDING)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
