🎖️ World Class Chitti Legal OS — Commando Discipline. Zero Excuses.

# BUILD ORDER — BO1 → BOn, each TEST-gated, four-users-first

> The process: **research → build order → execute, with a test after every increment.**
> Sequenced so the four users (👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate) are the
> **foundation (BO1–BO5), built first** — not a final audit. Derived from
> [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md). Each BO lists: who it serves · what it
> builds · its **TEST GATE** · status. Date: 2026-06-07.

## Rule: no BO is "done" until its test passes. A failed test blocks the next BO.

| BO | Serves | Build | TEST GATE | Status |
|---|---|---|---|---|
| **BO1** | 👁️ Blind / keyboard | Skip-to-content · `<main role=main>` · single `<h1>` · `role=tab`+`aria-selected` tabs · **`aria-live` on every result host** · visible `:focus-visible` ring | DOM assert + axe-core 0 critical | 🟢 GREEN — built into `chitti_legal_os.html` |
| **BO2** | 🦻 Deaf | Every result is **text + symbol + WORD** (never audio/colour-only); ISL panel hook (`data-chitti-response`) on every box | result boxes carry text + `.res-status` word + symbol | 🟢 GREEN |
| **BO3** | 🤫 Mute | **Full tap-only path** — every action reachable without voice; chips/buttons/selects for all input; ≥44px targets | tap-only journey + tap-target assert | 🟢 GREEN |
| **BO4** | 📖 Illiterate | **Icon-first** chips & tabs · 🔊 voice label on every result · auto-read first result for blind · no required reading | icon tabs + auto-read + chitti_lang native labels | 🟢 GREEN |
| **BO5** | 🔍 Low-vision / elderly | `prefers-reduced-motion` · `prefers-contrast` · `forced-colors` · base font ≥17px · AA contrast | axe contrast 0 · media queries present | 🟢 GREEN |
| **BO6** | All | **Deterministic engine** — rightsCoach · limitationCheck · chequeTimeline · decodeNotice · contractRisk · consumerRouter · caseCompanion · docChecklist · legalAid · govtLegalLayer · scamShield · twin. Works LLM-down, 2G. | `node tools/legal_os_engine_test.mjs` ALL PASS | 🟢 GREEN — **60/60** |
| **BO7** | All | **Feature surface** wired to the engine — 8 tabs / 12 cards, each rendering a `data-chitti-response` box | every module button renders a result box (cert) | 🟢 GREEN — 12 boxes |
| **BO8** | All / 26 languages | Language dropdown (`#lang-select`) wired to Vaani-canonical `chitti_lang.js`; native script switch; never a raw key | dropdown present + switch translates static text + persists | 🟢 GREEN — **en→hi, 33 nodes, persisted, stable** |
| **BO9** | All | **Free Legal Aid + entitlement (the moat)** + Limitation deadline math + Scam Shield + Legal Twin persistence | legalAid returns eligibility; limitation gives exact deadline; twin survives reload | 🟢 GREEN |
| **BO10** | All | **Full WCAG scan as a permanent gate** | axe-core 0 serious/critical on the page | 🟢 GREEN — `node tools/cert_legal_os.mjs` **27/27** (axe clean) |
| **BO11** | 🔵 Future | Document **vision** (notice/contract/property-paper OCR) · conversational **voice** · **Vaani** routing · live legal-aid/portal APIs · DeepSeek plain-language drafting | blocked — DeepSeek vision key + Vaani allowlist; honest stub in place | 🔵 BLOCKED on Sire's key |

## Test commands

```
BO6  node tools/legal_os_engine_test.mjs   # deterministic engine — 60/60 assertions
BO7  node tools/cert_legal_os.mjs          # every module renders a result box (live)
BO8  node tools/cert_legal_os.mjs          # #lang-select → html[lang]=hi + nodes translate (live)
BO9  node tools/legal_os_engine_test.mjs   # legal-aid + limitation + scam + twin assertions
BO10 node tools/cert_legal_os.mjs          # axe-core 0 serious/critical + tap targets + journeys
```

## Honest status

- BO1–BO10 are **built, engine-tested AND live-Playwright-certified in this pass**
  (`node tools/legal_os_engine_test.mjs` 60/60 + `node tools/cert_legal_os.mjs` 27/27).
  The language dropdown is **proven** switching live (en→hi, 33 text nodes translated, persisted, stable).
- BO11 (notice/contract OCR · DeepSeek plain-language drafting · live legal-aid/portal APIs ·
  Vaani routing) is honest 🔵 — needs Sire's DeepSeek/vision key + the Vaani relevance-rail
  allowlist, per the standing fleet blockers in [QUALITY_STATUS.md](../../QUALITY_STATUS.md).
- Real iPhone/Android device pass = Sire.

---
> **World Class Chitti Legal OS — Commando Discipline. Zero Excuses.**
