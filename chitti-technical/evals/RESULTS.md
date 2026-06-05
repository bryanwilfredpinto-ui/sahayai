🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# EVAL RESULTS — Chitti Technical

**Honest status as of 2026-06-06 (CEOS doc-set authored).**

> No number below is fabricated. Where a harness has not run, the cell says
> **NOT YET MEASURED** — per the platform rule *honest stubs over fake demos*.

| Eval | Target | Status | Number |
|---|---|---|---|
| Signal accuracy ([signal_accuracy.md](signal_accuracy.md)) | ≥ 70% | ⏳ NOT YET MEASURED | needs live signals to elapse + backtest harness |
| Risk accuracy ([risk_accuracy.md](risk_accuracy.md)) | ≥ 90% | ⏳ NOT YET MEASURED | static analyser to be wired on engine output |
| Hallucination ([hallucination_eval.md](hallucination_eval.md)) | < 1% | ⏳ NOT YET MEASURED | needs DeepSeek-funded Explain path + harness |
| Explainability ([explainability_eval.md](explainability_eval.md)) | = 100% | ⏳ NOT YET MEASURED | structural + judge harness to author |
| Accessibility ([accessibility_eval.md](accessibility_eval.md)) | = 100% | ⏳ 0/0 — page not built | inherits substrate gates once `chitti_technical.html` ships |
| Performance | < 2 s/scan | ⏳ NOT YET MEASURED | deterministic engine already fast on 50–500 candles |
| Mobile 375px | = 100% | ⏳ page not built | |

## What IS true today (verifiable, not claimed)
- The **indicator engine exists and runs** — 38 indicators incl. the Roshan
  Indicator, pure-Python, in `chitti-shares/backend/services/technical.py`
  ([../indicators/INDICATORS.md](../indicators/INDICATORS.md)).
- The **Roshan logic is defined and live** (RSI14 vs SMA20-of-RSI14).
- The **CEOS doc set is authored** (this folder tree).

## Path to first GREEN numbers
1. Build `chitti_technical.html` per [../ui/UI.md](../ui/UI.md) + extract the engine
   into the new product surface.
2. Author `tools/cert_technical.mjs` (Playwright) → accessibility + mobile numbers.
3. Wire the risk-accuracy static analyser + hallucination Trust-gate → those numbers.
4. Start logging live signals → signal-accuracy after the first timeframes elapse.
5. Update this file with **measured** numbers, with proof links.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
