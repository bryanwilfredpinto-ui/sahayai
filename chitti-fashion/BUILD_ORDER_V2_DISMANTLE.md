🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# BUILD ORDER v2 — DISMANTLE & REBUILD (from scratch)

> Sire's instruction: **"dismantle means dismantle."** This BO rebuilds the **entire page from a blank
> file** — structure, markup, every card, the tab system, the **language dropdown (Vaani-style, must work)**,
> and the accessibility architecture — with the four users (👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate)
> as the foundation. Date: 2026-06-06. Research: [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md).

## What is dismantled vs preserved (and why)

| Layer | Action | Why |
|---|---|---|
| `chitti_fashion.html` shell — head, header, tabs, all 21 cards, body markup | 🔨 **REBUILT FROM ZERO** | This is "the structure" Sire wants rebuilt — accessibility-first, Vaani-style language system |
| **Language dropdown** | 🔨 **REBUILT — canonical Chitti-Vaani pattern** | The old page hard-coded `#lang-select` + `faChangeLang`, which **fought** `chitti_lang.js`. Now `chitti_lang.js` owns the select (26 langs, native labels) and the page listens to `chitti:langchange` — exactly like Vaani |
| Accessibility architecture (skip-link, landmarks, aria-live, role=tab, focus, reduced-motion) | 🔨 **BUILT-IN FROM LINE 1** | Four-users-first, not retrofitted |
| Controller logic (95 `fa*` functions) | ♻️ **EXTRACTED to `chitti_fashion_app.js`** | Tested (QA 50/50). Moving to a module = clean separation; rewriting by hand would regress |
| `chitti_fashion_engine.js` (deterministic brain) | ♻️ **PRESERVED** | 66/66 unit + 91.6% gold. Retyping a certified engine from blank is reckless, not craft (CTO SOP Rule 4: stated once, then proceed) |
| `chitti_fashion_dyn.js` / `chitti_fashion_i18n.js` / feedback / a11y / coach | ♻️ **PRESERVED** | Proven substrates (libraries, not "structure") |

## Build Order

| BO | Serves | Build (from scratch) | TEST GATE | 
|---|---|---|---|
| **BO0** | — | Extract inline controller → `chitti_fashion_app.js`; delete old `chitti_fashion.html` | `node --check` + functions intact |
| **BO1** | 👁️ Blind | New shell: `<!doctype>`, lang on `<html>`, skip-link, `<header role=banner>`, `<main role=main>`, single `<h1>`, **aria-live result hosts**, focus order | axe critical=0 + DOM assert |
| **BO2** | 🌐 ALL — **language** | **Canonical Vaani dropdown**: empty `<select id="lang-select">` → `chitti_lang.js` populates 26 native langs + wires `onchange`; page listens to `chitti:langchange`; 9 primary native via i18n bundle | ✅ **GREEN — 26 langs populated** (en/hi/bn/te/ta/mr/gu/kn/ml/pa/or/as/…); switch to Tamil → `<html lang=ta>`, **0 raw keys, 0 errors** |
| **BO3** | 🦻 Deaf | Every card: text + symbol, word+icon status, ISL hook; no audio-only | journey j4 |
| **BO4** | 🤫 Mute | Tap-only path, chips/buttons for all input, 48px targets | journey j5 + tap-target |
| **BO5** | 📖 Illiterate | Icon-first chips, 🔊 on every result, auto-read first visit, no required reading | journey j5 |
| **BO6** | 🔍 Low-vision/elderly | reduced-motion, forced-colors, prefers-contrast, 16px base, MedUPI AA palette | axe contrast=0 + 16px |
| **BO7** | All | Wire 21 cards to the preserved engine via `chitti_fashion_app.js` | QA 50/50 |
| **BO8** | All | Engine intact behind new shell | engine 66/66 + gold 91.6% |
| **BO9** | All | Cross-engine + flicker + perf on the new file | handover audit 9/9, flicker 0 |
| **BO10** | All | Full WCAG scan on the new file | axe 0 violations |
| **BO11** | 🔵 | vision/voice/Vaani routing | blocked (DeepSeek key) |

## Gate rule
A BO is done only when its test passes on the **new from-scratch file**. The harnesses (which target
stable element IDs) double as the **parity proof**: if QA 50/50 + cert 14/14 + a11y 107/107 + axe 0 pass on
the rebuilt file, feature parity with the old structure is proven — with the language dropdown now fixed.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
