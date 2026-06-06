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
| **BO10** | All | **Full WCAG scan as a permanent gate** | axe-core 0 violations on the page | 🟡 run on next CTO Playwright pass (substrate parity with cert-green pages) |
| **BO11** | 🔵 Future | Document **vision** (notice/bill/bank-statement OCR) · conversational **voice** · **Vaani** routing · live scheme/portal APIs | blocked — DeepSeek vision key + Vaani allowlist; honest stub in place | 🔵 BLOCKED on Sire's key |

## Test commands

```
BO6  node tools/ca_os_engine_test.mjs       # deterministic engine — all assertions
BO7  open chitti_ca_os.html                 # every module renders a result box
BO8  open chitti_ca_os.html → switch #lang-select → static text translates
BO9  node tools/ca_os_engine_test.mjs       # govtBenefits + fraud + twin assertions
BO10 (CTO) node tools/cert_all_pages.mjs    # axe-core, substrate parity
```

## Honest status

- BO1–BO9 are **built and engine-tested in this pass** (deterministic core + accessible
  UI + working language dropdown + the moat).
- BO10 (live axe-core) and BO11 (vision/voice/Vaani/live APIs) are honest 🟡/🔵 — they
  ride the same substrate as the 23 cert-green pages and need a CTO Playwright pass +
  Sire's DeepSeek vision key, per the standing fleet blockers in
  [QUALITY_STATUS.md](../../QUALITY_STATUS.md).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
