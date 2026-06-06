🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# BUILD ORDER — BO1 → BOn, each TEST-gated, four-users-first

> The process: **research → build order → execute, with a test after every increment.**
> Sequenced so the four users (👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate) are the **foundation
> (BO1–BO5), built first** — not a final audit. Derived from [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md).
> Each BO lists: the user it serves · what it builds · its **TEST GATE** · status.
> Date: 2026-06-06. Reproduce any gate with the command shown.

## Rule: no BO is "done" until its test passes. A failed test blocks the next BO.

| BO | Serves | Build | TEST GATE | Status |
|---|---|---|---|---|
| **BO1** | 👁️ Blind / keyboard | Skip-to-content link · `<main role=main>` landmark · single `<h1>` · `role=tab`+`aria-selected` tabs · **`aria-live` on every result host** (screen reader announces results) · visible `:focus-visible` ring | DOM assert (skip/landmark/h1/tabs/live present) **+ axe-core 0 critical** | ✅ **GREEN** — skip✓ main✓ h1✓ tabs role=tab✓ aria-live 18/18✓ focus-ring✓ |
| **BO2** | 🦻 Deaf | Every result is **text + symbol** (never audio-only); word+icon status (not colour-only); ISL panel hook on every response | Deaf visual-only journey (`cert_fashion_journeys.mjs` j4) — `islTag && hasText && wordStatus` | ✅ **GREEN** — j4 pass |
| **BO3** | 🤫 Mute | **Full tap-only path** — every action reachable without voice; chips/buttons for all input; 48px targets | Tap-only journey (j5) + tap-target assert (≥44×40 across tabs/btns/chips) | ✅ **GREEN** — j5 pass, tap targets ok |
| **BO4** | 📖 Illiterate | **Icon-first** chips & menus · voice label on every control (🔊) · auto-read for first-time users · no required reading | Illiterate voice/tap journey (j5: tap chips, no typing) + 9-lang labels native | ✅ **GREEN** — j5 pass |
| **BO5** | 🔍 Low-vision / elderly / vestibular | `prefers-reduced-motion` (kills logo float + transitions) · `prefers-contrast: more` · `forced-colors` (Windows HC) · **base font ≥16px** · AA contrast | axe-core contrast 0 · base-font ≥16px (a11y case A040) · media queries present | ✅ **GREEN** — axe contrast 0, 16px, reduced-motion/forced-colors CSS shipped |
| **BO6** | All | **Deterministic engine** (occasion/colour-science/fabric/fit/judge/buildOutfits/recommend + v2.1 doctor/wedding/week/family/impact/size) — works LLM-down, 2G | `fashion_engine_test.mjs` **66/66** + `fashion_gold_eval.mjs` **≥90% exact** | ✅ **GREEN** — 66/66, 91.6% |
| **BO7** | All | **Feature surface** wired to the engine — Dress-Me · Review (9-agent swarm) · Occasion · Weather · Budget · Learn · Simulator · ROI · Audit · Travel · Emergency · Doctor · Wedding · Office-Week · Senior/Kids · Family · Impact · Size · Career | `fashion_qa.mjs` **50/50** (all buttons render) | ✅ **GREEN** — 50/50 |
| **BO8** | All / 9 languages | 9 primary native UI (en/hi/ta/te/bn/mr/gu/kn/ml) + dynamic engine output, **zero flicker**, never a raw key | flicker harness (raw keys @150ms+1550ms = 0 across 9) + QA raw-key=0 | ✅ **GREEN** — 9/9 stable, 0 raw keys |
| **BO9** | All | **Cross-engine + performance** — Chromium/Firefox/WebKit(Safari) × 375/768/1440, offline, edge cases | `fashion_handover_audit.mjs` — 9/9 clean, 20/20 journeys, edge 0-fatal | ✅ **GREEN** (3G load 6.8s is KI-01, documented) |
| **BO10** | All | **Full WCAG scan as a permanent gate** | `fashion_axe_scan.mjs` axe-core **0 violations** | ✅ **GREEN** — 0/0/0/0 |
| **BO11** | 🔵 Future | Garment **vision** · conversational **voice** · **Vaani** routing | (blocked — DeepSeek key; Vaani allowlist) | 🔵 **BLOCKED** on Sire's key (honest stub in place) |

## What changed in THIS redo (vs. the earlier retrofit)

The earlier build **passed gates but had no accessibility-first foundation** — it was sighted-first with a11y
checked at the end. This redo built BO1–BO5 as real foundations and **found + fixed genuine defects the prior
structure hid**:

- **No `aria-live` anywhere** → blind screen-reader users were **never announced** when a result appeared
  (only TTS fired). **Fixed:** 18/18 result hosts are now polite live regions.
- **No skip-link / `<main>` landmark / single `<h1>`** → keyboard + screen-reader navigation was poor. **Fixed.**
- **Tabs had `role=tablist` but children weren't `role=tab`** (axe critical) → **Fixed** (caught by BO10/axe).
- **No `prefers-reduced-motion`** → the floating logo ran for vestibular users. **Fixed.**
- **No high-contrast / `forced-colors`** support → low-vision on Windows HC got a broken palette. **Fixed.**
- **3 WCAG contrast/structure violations** the selector suite couldn't see → **Fixed** (real axe-core scan added as BO10).

## Test commands (one per gate)
```
BO1  node tools/fashion_axe_scan.mjs                 # + DOM skip/live assert in handover audit
BO2  node tools/cert_fashion_journeys.mjs            # j4 deaf
BO3  node tools/cert_fashion_journeys.mjs            # j5 mute/tap + QA tap targets
BO4  node tools/cert_fashion_journeys.mjs            # j5 illiterate
BO5  node tools/fashion_eval_harness.mjs             # A040 16px + axe contrast
BO6  node tools/fashion_engine_test.mjs && node tools/fashion_gold_eval.mjs
BO7  node tools/fashion_qa.mjs
BO8  node tools/fashion_handover_audit.mjs           # flicker[] all stable
BO9  node tools/fashion_handover_audit.mjs           # crossEngine 9/9
BO10 node tools/fashion_axe_scan.mjs                 # 0 violations
```

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
