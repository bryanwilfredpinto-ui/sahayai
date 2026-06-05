🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# evals/accessibility_eval.md

> **Target: 100%.** All four users complete *scan → route → understand* without knowing a
> Chitti name.

## Cases (per archetype × per category)

| User | Must verify |
|---|---|
| 👁️ Blind | Route + reason spoken automatically; voice-guided capture; every error spoken; no visual-only step. |
| 🦻 Deaf | Caption + symbol + ISL panel on every route card; never audio-only. |
| 🤫 Mute | Full flow by tap/camera; voice never required; category pick by tap. |
| 📖 Illiterate | Picture-menu category pick; every label spoken; emoji glyphs. |

## Substrate gates (G1–G5, must all pass — [QUALITY_STATUS.md §1a](../../QUALITY_STATUS.md))

G1 feedback-widget + `data-chitti-response` on the route card · G2 `chitti_a11y.js` ·
G3 Disability Profile on first visit · G4 language auto-detect · G5 ISL plugin.

## Method

Playwright at 375/768/1280 (mirrors `tools/cert_fashion.mjs`): assert the route card carries
`data-chitti-response`, an `aria-live` region announces the route, ISL panel renders, every
control has an `aria-label`, tap targets ≥ 48×48px.

## Honest status

🟡 Route card built; cert run pending the next deploy (the page itself is already certified
GREEN 18/18 on the 5 base gates per 2026-05-27). Results → [RESULTS.md](RESULTS.md).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
