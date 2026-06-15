# 06 — Developer Fixes (QA round 1) — Chitti Mechanic 2 Wheeler

**Date:** 2026-06-15 · **Developer Agent:** Claude Opus 4.8 · **Branch:** `feat/mech2w-qa-fixes` (NOT merged to main).
Scope: only this product's files + the public `Chitti.lang.extend()` API. No shared substrate (`chitti_lang.js`/`chitti_a11y.js`) or other product touched.

| QA item | Fix | Verified (local serve of branch) |
|---|---|---|
| **BUG-2 (P0) language** | New `chitti_mechanic_2w_i18n.js` registers page strings via `Chitti.lang.extend()` — hi/kn full chrome, ta/te/mr/bn/gu nav+titles+buttons+hero | hi/kn **7%→32%** (123/389), others ~15% (`qa_local_lang_2w.mjs`) |
| **Real health dashboard** | New "Vehicle health at a glance" card — 5 systems (engine/battery/tyre/brakes/chain) with SVG pictograms + green/amber/red zone pills (colour + word + dot, never colour-only) | 5 systems + 5 SVGs + word labels (`qa_local_newfeatures_2w.mjs`) |
| **15 flat tabs** | Added a 5-bucket home grid (My Bike & Health · Fix & Maintain · Buy & Sell · Money & Papers · Help & Learn); all 15 tabs retained | 5 cards, switches tab |
| **Pictograms** | Inline SVG icons for the 5 health systems (render consistently vs emoji) | present |
| **BUG-3 ISL** | NOT a defect — substrate keeps ISL panels default-OFF (locked §7); attaches to every `[data-chitti-response]` when ISL enabled. Verified, no code change. | OFF by default; **≥10 panels attach when enabled** |
| **BUG-4 tap jank** | Page-local: mark dynamic result hosts `data-chitti-no-translate` so the `chitti_lang` observer skips re-scanning them (cheaper re-translate). Full debounce = substrate-owned. | 0 page errors; taps responsive locally |
| **BUG-5 page error** | Added a page-local `window.error` recorder; my code adds 0 errors across all harnesses. Original 1 error was unattributed live substrate timing. | `__mech2wErrors` = 0 |
| **BUG-1 heading** | Added visible "📖 How to use Chitti" heading (id `how-to-use`); tour heading → "How to use Chitti" | heading present |
| Doc thumbnail gallery | `mechShowDocs` now renders image thumbnails (84px) + per-doc remove | image thumb shown |
| Dark mode | `🌗 Dark` toggle in a11y bar, `data-theme="dark"` CSS, persisted | toggles + restores |
| Result iconography + loading | status symbol+word + subtle render fade (deterministic = instant, so no fake spinners) | render fade applied |
| Visual onboarding | Tour rendered as numbered step cards under "How to use Chitti" | renders |

Regression gate (branch): engine **92/92** · cert **38/38** (axe 0 serious, 0 console errors) · audit **115/115**.
Honest note: dynamic engine-result sentences stay English until DeepSeek narration (standing fleet blocker). Live-URL confirmation needs the PR merged to `main` (release decision; not done per the no-direct-push rule).
