# SOP-001 — Add a new indicator

1. Add the pure function to `chitti_technical_engine.js` (returns `null` during warm-up — abstain, never 0).
2. Register its name in `INDICATOR_NAMES` and wire it into `indicatorSet()` with a BUY/SELL/WAIT signal.
3. Add a node test in `tools/test_technical.mjs` with a known-fixture expected value (exact for SMA/EMA/RSI-style).
4. Run `node tools/test_technical.mjs` → must stay 0 FAIL; the no-phantom test must show every dropdown name computed.
5. If user-facing, add its label to `chitti_technical_i18n.js` in all 9 languages (indicator proper-nouns stay English).
6. Re-run `node tools/cert_technical.mjs` → 0 page errors, axe 0 serious.
7. Commit via worktree off `origin/main`.
