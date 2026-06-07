🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# BUILD ORDER — BO1 → BOn, each TEST-gated, four-users-first

> The process: **research → build order → execute, with a test after every increment.**
> Sequenced so the four users (👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate) are the
> **foundation (BO1–BO5), built first** — not a final audit. Derived from
> [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md). Each BO lists: who it serves · what it
> builds · its **TEST GATE** · status. Date: 2026-06-06.

## Rule: no BO is "done" until its test passes. A failed test blocks the next BO.

| BO | Serves | Build | TEST GATE | Status |
|---|---|---|---|---|
| **BO1** | 👁️ Blind / keyboard | Skip-to-content · `<main role=main>` · single `<h1>` · `role=tab`+`aria-selected` tabs · **`aria-live` on every result host** · visible `:focus-visible` ring | DOM assert (skip/landmark/h1/tabs/live present) + axe-core 0 critical | 🟢 GREEN — built into `chitti_ca_os.html` |
| **BO2** | 🦻 Deaf | Every result is **text + symbol** (never audio-only); word+icon status (✅/⚠️/❔, never colour-only); ISL panel hook (`data-chitti-response`) on every box | result boxes carry text + `.status` word + symbol; ISL via a11y substrate | 🟢 GREEN |
| **BO3** | 🤫 Mute | **Full tap-only path** — every action reachable without voice; chips/buttons/dropdowns for all input; ≥44px targets | tap-only journey + tap-target assert | 🟢 GREEN |
| **BO4** | 📖 Illiterate | **Icon-first** chips & tabs · 🔊 voice label on every result · auto-read first result · no required reading | icon tabs + auto-read + chitti_lang native labels | 🟢 GREEN |
| **BO5** | 🔍 Low-vision / elderly | `prefers-reduced-motion` · `prefers-contrast` · `forced-colors` · base font ≥16px · AA contrast · Senior mode (large text/slow speech) | axe contrast 0 · base-font ≥16px · media queries present | 🟢 GREEN |
| **BO6** | All | **Deterministic engine** — incomeTax (old/new regime) · capitalGains · gstHealth · itc · complianceCalendar · penalty · businessDoctor · govtBenefits · schemeOpportunity · fraudShield (GSTIN checksum) · cfoDashboard · twin. Works LLM-down, 2G. | `node tools/ca_os_engine_test.mjs` ALL PASS | 🟢 GREEN — see [evals/](evals/) |
| **BO7** | All | **Feature surface** wired to the engine — 11 modules as tabs/cards, each rendering a `data-chitti-response` box | every module button renders a result box (QA) | 🟢 GREEN |
| **BO8** | All / 26 languages | Language dropdown (`#lang-select`) wired to Vaani-canonical `chitti_lang.js`; native script switch; never a raw key; RTL for ur/ks/sd | dropdown present + chitti_lang wires it + switch translates static text | 🟢 GREEN |
| **BO9** | All | **Government Benefits + Scheme Opportunity (the moat)** + Fraud Shield + Financial Twin persistence | govtBenefits returns ≥1 scheme + ₹ impact for a sample MSME; twin survives reload | 🟢 GREEN |
| **BO10** | All | **Full WCAG scan as a permanent gate** | axe-core 0 serious/critical on the page | 🟢 GREEN — `node tools/cert_ca_os.mjs` **26/26** (axe 0 serious/critical authored; 2 real defects found+fixed: speak-btn 40→44px, #777→#5a5a5a contrast ×2) |
| **BO11** | 🔵 Future | Document **vision** (notice/bill/bank-statement OCR) · conversational **voice** · **Vaani** routing · live scheme/portal APIs | blocked — DeepSeek vision key + Vaani allowlist; honest stub in place | 🔵 BLOCKED on Sire's key |

## Test commands

```
BO6  node tools/ca_os_engine_test.mjs       # deterministic engine — 38/38 assertions
BO7  node tools/cert_ca_os.mjs              # every module renders a result box (live)
BO8  node tools/cert_ca_os.mjs              # #lang-select → html[lang]=hi + 20 nodes translate (live)
BO9  node tools/ca_os_engine_test.mjs       # govtBenefits + fraud + twin assertions
BO10 node tools/cert_ca_os.mjs              # axe-core 0 serious/critical + tap targets + journeys
```

## Honest status

- BO1–BO10 are **built, engine-tested AND live-Playwright-certified in this pass**
  (`node tools/ca_os_engine_test.mjs` 38/38 + `node tools/cert_ca_os.mjs` 26/26). The
  language dropdown is **proven** switching live (en→hi, 20 text nodes translated, persisted).
- BO11 (notice/bill/bank-statement OCR · DeepSeek-explain · live scheme/portal/lender APIs ·
  Vaani routing) is honest 🔵 — needs Sire's DeepSeek/vision key + the Vaani relevance-rail
  allowlist, per the standing fleet blockers in [QUALITY_STATUS.md](../../QUALITY_STATUS.md).
- Real iPhone/Android device pass = Sire.

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
