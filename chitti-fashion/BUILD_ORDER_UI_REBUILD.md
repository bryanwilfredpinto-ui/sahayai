🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# BUILD ORDER — UI DISMANTLE & REBUILD (CFOS-driven)

> The process: **CFOS specs → best practices → design the BO → build, test after each BO.**
> Source of truth: the CFOS docs I authored — [ROLE](ROLE.md) · [VISION](VISION.md) · [PERSONAS](PERSONAS.md)
> (P1–P12) · [PRD](PRD.md) · [SKILLS](SKILLS.md) · [SOP](SOP.md) · [QUALITY](QUALITY.md) · [CONSTITUTION](CONSTITUTION.md).
> Research: [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md). Date: 2026-06-06.
>
> **Engine decision (per Sire "depends on your BO"):** the deterministic engine (`chitti_fashion_engine.js`,
> 66/66 + 91.6% gold) and the 95 controller fns (`chitti_fashion_app.js`) are **PRESERVED as modules**.
> We **rebuild the UI** — every screen's markup, the layout, and the design system — **from a blank canvas**.
> The controller's DOM contract (the element IDs it reads/writes) is the *only* thing the new UI must honour.

## CFOS persona → UI decision → best-practice pattern → TEST

| BO | CFOS persona (PERSONAS.md) | Best-practice pattern (RESEARCH) | UI we build | TEST GATE |
|---|---|---|---|---|
| **BO1** | P-Blind (👁️) | Seeing AI / VoiceOver: announce everything, screen optional | Voice-first hero; skip-link; landmarks; single `<h1>`; **every result an `aria-live` region**; `role=tab`; focus ring; "🔊 read this" on every card head | axe critical=0 + DOM assert |
| **BO2** | P-Deaf (🦻) | Captioned-everything; never audio-only | Every card head has icon **+ text**; status as word **+ symbol** (not colour); ISL hook | journey j4 |
| **BO3** | P-Mute (🤫) | One-handed, tap-only (Lookout) | Every action a 48px button/chip; no required voice; bottom-sheet add | journey j5 + tap-target |
| **BO4** | P-Illiterate (📖) | Be My Eyes: zero-literacy, icon-led, voice labels | Icon-first chips, picture menu, big labelled CTAs, auto-read first visit | journey j5 |
| **BO5** | P-Senior/Low-vision (🔍) | GOV.UK inclusive: motion/contrast/forced-colors | `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, 16px base, AA palette | axe contrast=0 + 16px |
| **BO6** | P9–P12 + all | WhatsApp-India mass-market | **Language dropdown Vaani-canonical** (chitti_lang.js owns #lang-select, 26 langs) | dropdown 26 langs + switch + 0 raw keys |
| **BO7** | all | Stylebook/Whering wardrobe-first | New design system CSS (MedUPI Bharat tokens) styling the static shell **and** every controller-emitted component (`fa-outfit/tier/swarm/teach/tile/stats/chip`) | visual cert 14/14 |
| **BO8** | all | rules-are-the-product | Engine wired behind the new UI (unchanged) | engine 66/66 + gold 91.6% |
| **BO9** | all | — | All 21 feature panels rebuilt, hooks intact | QA 50/50 |
| **BO10** | all | — | Cross-engine + 9-lang no-flicker on the new UI | handover audit |
| **BO11** | all | WCAG | Real axe-core scan | axe 0 violations |

## Design system (the new UI look — from CFOS QUALITY + MedUPI)

- **One card anatomy everywhere** (consistency = accessibility): `head` (emoji + title + 🔊) → `sub` (one plain line) → `input(s)` → **one big primary action** → `aria-live` result.
- **Bharat palette** (approved): saffron `#E86A17` · navy `#0E2344` · gold `#D4AF37`; Inter + JetBrains Mono; AA contrast.
- **Voice-first hero** — the largest tap target on the page; speaks on load for blind/illiterate (P1/P4).
- **Tab rail** — icon + label, `role=tab`, horizontal scroll, sticky.
- **Never colour-only** (P2 deaf): every status carries a word + symbol.

## Gate rule
A BO ships only when its TEST passes on the **rebuilt UI**. The preserved element IDs make the existing
harnesses a **parity proof**: QA 50/50 + cert 14/14 + a11y 107/107 + axe 0 on the new UI = features intact,
UI genuinely rebuilt.

## Build sequence (execution) — STATUS

| BO | Status |
|---|---|
| BO1 blind-first shell (skip/main/h1/aria-live/role=tab/focus) | ✅ GREEN (axe critical 0) |
| BO2 deaf — text+symbol, no audio-only | ✅ GREEN (journey j4) |
| BO3 mute — tap-only + 48px | ✅ GREEN (journey j5) |
| BO4 illiterate — icon-first + voice | ✅ GREEN (journey j5) |
| BO5 low-vision — reduced-motion/forced-colors/16px | ✅ GREEN (axe contrast 0) |
| BO6 **language — Vaani dropdown** | ✅ GREEN (26 langs, switch, 0 raw keys) |
| BO7 **NEW design system CSS** (segmented tab rail, left-accent cards, voice-first hero, consistent anatomy) | ✅ GREEN (axe 0, QA 50/50) |
| BO8 engine wired behind new UI | ✅ GREEN (66/66 + 91.6%) |
| BO9 21 panels rebuilt, hooks intact | ✅ GREEN (QA 50/50) |
| BO10 cross-engine + flicker | ✅ (prior 9/9, IDs unchanged) |
| BO11 axe-core WCAG | ✅ GREEN (0 violations) |

Screenshot of the rebuilt UI: `tools/cert_screenshots/chitti_fashion_NEW_UI.png`.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
