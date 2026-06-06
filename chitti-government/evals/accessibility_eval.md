# EVAL — Accessibility (gate: 100%)

**Claim:** all four users + eight disability profiles can complete every core task.

## Method (Playwright + axe-core, mirrors tools/qa_full_vaani.mjs)
- 5 frontend gates on the page (feedback-widget + data-chitti-response, chitti_a11y.js,
  Disability Profile prompt, language auto-detect, ISL plugin).
- axe-core: 0 serious violations; 0 sub-44px tap targets.
- **Language dropdown functional** across the 26 `chitti_lang.js` languages (langAttr
  changes, no raw-key leak, no English leak in a non-en page).
- Per-archetype task: blind (voice eligibility), deaf (visual+ISL verdict), mute
  (tap-only flow), illiterate (icon+voice flow).
- @375px responsive = 100%.

## Pass
100% — any fail blocks the ship (Accessibility Agent veto). Blind + illiterate task
success ≥ 95% on the per-archetype runs.
