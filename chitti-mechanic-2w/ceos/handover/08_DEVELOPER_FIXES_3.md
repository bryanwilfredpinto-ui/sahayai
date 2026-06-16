# 08 — Developer Fixes (competition build — 9 items) — Chitti Mechanic 2 Wheeler

**Date:** 2026-06-16 · **Developer Agent:** Claude Opus 4.8 · **Branch:** `feat/mech2w-competition-9` (isolated worktree off origin/main; NOT merged).
Scope: only this product's files (engine, html, i18n, tests). Built in an isolated worktree because the shared checkout is contended by parallel agents.

| # | Item | What shipped | Engine fn / UI |
|---|---|---|---|
| 1 | Free-text symptom + crisis | Type/speak the problem → keyword-maps to triage; `accident/crash/injured/fire` → Emergency (108/112, **never auto-dials**). Closes prior QA SOP8 gap. | `coachFromText()` + Doctor `#dr-text`/`🎙️ Speak` |
| 2 | Chain wear prediction | Chain+sprocket SET wears ~15,000 km (vs 500 km lube). Health-dashboard chain row + reminder. | `chainStatus()` + `reminders()` + `mechHealth` |
| 3 | Unused-bike reminder | From `lastRideDate`: not ridden ≥60 days → check battery/tyres/stale fuel. | `reminders()` + `#bk-lastride` |
| 4 | Home savings + health number | Hero shows "₹X saved / ₹10,000" + Ownership Health /100. | `mechHomeStats()` + `#home-stats` |
| 5 | Compliance + genuine-parts deep-links | One-tap **official** mParivahan / e-Challan / DigiLocker / FASTag + NGK/Bosch verify. Honest "opens official app"; auto-pull stays infra. | `links().compliance/verify` + PUC card |
| 6 | EV intelligence (universal) | Battery health % + real range (degradation by age) + charging-station Maps link — any EV brand. | `evIntel()` + `nearestQuery('charging')` + Battery card |
| 7 | Spare-parts price + genuine check | Fair price bands + genuine-vs-fake red flags + boodmo compare link. | `partsPrice()` + Service card |
| 8 | Service cost estimator | Fair cost band per service item to compare any quote. | `serviceCosts()` + Service card |
| 9 | Vehicle Twin visual timeline | `twin()` rendered as a visual vertical timeline (vehicle/odo/service/tyre/battery/chain/docs/savings). | `mechTwin()` + `.vt-line` CSS |

**Verification (isolated worktree, local serve = identical to GitHub Pages):**
- Engine gold **110/110** (`tools/test_mechanic_2w.mjs`, +16 new assertions).
- Live cert **38/38** (axe-core 0 serious, 0 console errors, **23 `data-chitti-response` cards**).
- Audit **115/115**.
- New-9 smoke **13/13**, 0 page errors (`tools/qa_verify9_2w.mjs`).
- New UI strings registered in `chitti_mechanic_2w_i18n.js` (hi/kn) so the 26-lang switch covers them.
- 2 wiring bugs caught + fixed during my own verification: `nearestQuery('charging')` host mapping; twin timeline minimal-data robustness.

**Not in scope (Sire — infra/partnership):** live VAHAN/insurer/DigiLocker auto-pull APIs, conversational DeepSeek NL assistant, OCR vision, SMS/WhatsApp gateway, OEM connected-2W ingest. Each has the honest deterministic equivalent shipped above.

Live-URL confirmation requires merging the PR to `main` (release decision).
